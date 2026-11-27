from io import BytesIO
import json
import sqlite3
import unittest
from contextlib import closing, contextmanager
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient
from PIL import Image
from sqlmodel import Session, SQLModel, create_engine
from starlette.routing import Mount

from app.db.models import ArticleGalleryEntry, Item, ItemType, OwnedCopy, Title
from app.main import app


@contextmanager
def open_collection(path):
    engine = create_engine(f"sqlite:///{path}")
    try:
        with patch("app.database.engine", engine), patch("app.main.engine", engine), TestClient(app) as client:
            yield client
    finally:
        engine.dispose()


class ArticleTests(unittest.TestCase):
    def setUp(self):
        self.path = Path(self.enterContext(TemporaryDirectory())) / "collection.db"
        self.media = self.path.parent / "media"
        photos = self.media / "copies"
        photos.mkdir(parents=True)
        self.enterContext(patch("app.media.MEDIA_DIR", self.media))
        self.enterContext(patch("app.media.COPY_PHOTOS_DIR", photos))
        self.enterContext(patch("app.routers.media.MEDIA_DIR", self.media))
        static_files = next(route.app for route in app.routes if isinstance(route, Mount) and route.name == "media")
        self.enterContext(patch.object(static_files, "all_directories", [self.media]))
        self.body = "  First paragraph.\n\nSecond paragraph with <markup>.  "
        self.payload = {"title": " Field notes ", "blocks": [{"kind": "text", "text": self.body}],
                        "request_id": str(uuid4())}

    def check_round_trip(self):
        with open_collection(self.path) as client:
            response = client.post("/articles/", json=self.payload)
            self.assertEqual(response.status_code, 201, response.text)
            saved = response.json()
            self.assertEqual(saved["title"], "Field notes")
            block, = saved["blocks"]
            self.assertGreater(block["id"], 0)
            self.assertEqual((block["kind"], block["text"]), ("text", self.body))
        with open_collection(self.path) as client:
            self.assertEqual(client.get(f"/articles/{saved['id']}").json(), saved)
            self.assertEqual(client.post("/articles/", json=self.payload).json(), saved)
            self.assertEqual(client.post("/articles/", json={**self.payload, "title": "Changed"}).status_code, 409)

    def test_new_collection_reopens_article_and_replays_save(self):
        self.check_round_trip()

    def test_list_reopens_titles_in_catalog_order_with_stable_ids(self):
        with open_collection(self.path) as client:
            self.assertEqual(client.get("/articles/").json(), [])
            saved = []
            for title in ("Zebra", "alpha", "Alpha"):
                article = client.post("/articles/", json={"title": title, "blocks": self.payload["blocks"]}).json()
                saved.append({"id": article["id"], "title": title})
            self.assertEqual(client.get("/articles/").json(), [saved[1], saved[2], saved[0]])
            client.patch(f"/articles/{saved[0]['id']}", json={"title": "Aardvark"})
        with open_collection(self.path) as client:
            self.assertEqual(client.get("/articles/").json(), [{**saved[0], "title": "Aardvark"}, *saved[1:]])

    def test_collection_with_item_and_copy_gains_articles_on_startup(self):
        engine = create_engine(f"sqlite:///{self.path}")
        tables = [table for table in SQLModel.metadata.sorted_tables if not table.name.startswith("article")]
        SQLModel.metadata.create_all(engine, tables=tables)
        with Session(engine) as session:
            item = Item(item_type=ItemType(name="book"), titles=[Title(title_text="Existing book")],
                        owned_copies=[OwnedCopy(notes="Original copy")])
            session.add(item)
            session.commit()
            item_id = item.id
        engine.dispose()
        self.check_round_trip()
        with open_collection(self.path) as client:
            item = client.get(f"/items/{item_id}").json()
            self.assertEqual(item["display_title"], "Existing book")
            self.assertEqual([copy["notes"] for copy in item["owned_copies"]], ["Original copy"])

    def test_invalid_title_blocks_and_missing_article(self):
        with open_collection(self.path) as client:
            for change in ({"title": " \t "}, {"blocks": []}, {"blocks": self.payload["blocks"] * 2},
                           {"blocks": [{"kind": "html", "text": "hello"}]}):
                with self.subTest(change=change):
                    self.assertEqual(client.post("/articles/", json={**self.payload, **change}).status_code, 422)
            response = client.get("/articles/1")
            self.assertEqual(response.status_code, 404)
            self.assertEqual(response.json()["code"], "article_not_found")

    def create_game(self, client, title):
        response = client.post("/items/", json={"details": {"type_name": "game"},
                               "titles": [{"title_text": title, "language_code": "en"}]})
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()["id"]

    def test_link_follows_item_identity_and_edits_preserve_both_block_ids(self):
        with open_collection(self.path) as client:
            first = self.create_game(client, "First game")
            second = self.create_game(client, "Second game")
            self.payload["blocks"].append({"kind": "item-link", "item_id": first})
            saved = client.post("/articles/", json=self.payload).json()
            address = f"/articles/{saved['id']}"
            text, link = saved["blocks"]
            self.assertEqual(link, {"id": link["id"], "kind": "item-link", "item_id": first, "item_title": "First game"})
            client.patch(f"/items/{first}", json={"titles": [{"title_text": "Renamed", "language_code": "en"}]})
            read = client.get(address).json()
            self.assertEqual(read["blocks"], [text, {**link, "item_title": "Renamed"}])
            self.assertEqual(client.post("/articles/", json=self.payload).json(), read)
            # A missing target must roll back title and text changes as well.
            self.assertEqual(client.patch(address, json={"title": "Invalid", "text": "", "item_id": 999}).status_code, 422)
            self.assertEqual(client.get(address).json(), read)
            changes = {"title": "Revised", "text": "New\n\ntext", "item_id": second}
            revised = client.patch(address, json=changes).json()
            self.assertEqual(revised, {**saved, "title": "Revised", "blocks": [
                {**text, "text": changes["text"]}, {**link, "item_id": second, "item_title": "Second game"}]})
            self.assertEqual(client.patch(address, json=changes).json(), revised)
        with open_collection(self.path) as client:
            self.assertEqual(client.get(address).json(), revised)
            self.assertEqual(client.delete(f"/items/{second}").status_code, 204)
            remaining = client.patch(address, json={"title": "After deletion"}).json()
            self.assertEqual(remaining["blocks"], [revised["blocks"][0], {**revised["blocks"][1], "item_title": None}])
            self.assertEqual(client.patch(address, json={"item_id": None}).json()["blocks"], revised["blocks"][:1])

    def test_text_only_article_from_previous_schema_can_gain_a_link(self):
        with closing(sqlite3.connect(self.path)) as db, db:
            db.executescript("""
                CREATE TABLE article (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, request_id CHAR(32) UNIQUE);
                CREATE TABLE article_block (id INTEGER PRIMARY KEY, article_id INTEGER REFERENCES article(id),
                    position INTEGER NOT NULL, kind TEXT NOT NULL, text TEXT NOT NULL, UNIQUE(article_id, position));
                INSERT INTO article VALUES (5, 'Old article', '0123456789abcdef0123456789abcdef');
                INSERT INTO article_block VALUES (8, 5, 0, 'text', 'Old text');
            """)
        with open_collection(self.path) as client:
            old = client.get("/articles/5").json()
            game = self.create_game(client, "Linked game")
            updated = client.patch("/articles/5", json={"item_id": game}).json()
            self.assertEqual(old["blocks"], [{"id": 8, "kind": "text", "text": "Old text"}])
            self.assertEqual(updated["blocks"][0], old["blocks"][0])
            self.assertEqual(updated["blocks"][1]["item_id"], game)
            for invalid in ({"title": " "}, {"title": None}, {"text": None}, {"item_id": 0}):
                self.assertEqual(client.patch("/articles/5", json=invalid).status_code, 422)

    def test_gallery_creation_reopens_and_replays_in_a_fresh_collection(self):
        Image.new("RGB", (2, 2), "red").save(self.media / "Front #1.png")
        Image.new("RGB", (2, 2), "blue").save(self.media / "Back.png")
        with open_collection(self.path) as client:
            back, front = client.get("/media/").json()
            entries = [{"path": front["path"], "caption": "Front\nBox wear"}, {"path": back["path"]}]
            self.payload["blocks"].append({"kind": "gallery", "entries": entries})
            response = client.post("/articles/", json=self.payload)
            self.assertEqual(response.status_code, 201, response.text)
            saved = response.json()
            text, gallery = saved["blocks"]
            self.assertEqual(gallery["entries"], [entries[0], {**entries[1], "caption": ""}])
        with open_collection(self.path) as client:
            address = f"/articles/{saved['id']}"
            self.assertEqual(client.get(address).json(), saved)
            self.assertEqual(client.post("/articles/", json=self.payload).json(), saved)
            entries.reverse()
            self.assertEqual(client.post("/articles/", json=self.payload).status_code, 409)
            game = self.create_game(client, "Game")
            edited = client.patch(address, json={"item_id": game, "gallery": entries}).json()
            self.assertEqual([block["kind"] for block in edited["blocks"]], ["text", "item-link", "gallery"])
            self.assertEqual(edited["blocks"][0], text)
            self.assertEqual(edited["blocks"][2], {**gallery, "entries": gallery["entries"][::-1]})
            for invalid_path in ("/media/missing.png", "/media/%2E%2E/Back.png", "https://example.com/Back.png"):
                with self.subTest(path=invalid_path):
                    invalid = {"title": "Invalid edit", "gallery": [{"path": invalid_path}]}
                    response = client.patch(address, json=invalid)
                    self.assertEqual(response.status_code, 422)
                    self.assertEqual(response.json()["code"], "invalid_reference")
                    self.assertEqual(client.get(address).json(), edited)
            self.assertEqual(client.get(front["path"]).content, (self.media / "Front #1.png").read_bytes())

    def test_upgrade_existing_article_with_link_and_keep_each_photo_until_its_last_reference(self):
        with open_collection(self.path) as client:
            game = self.create_game(client, "Game")
            self.payload["blocks"].append({"kind": "item-link", "item_id": game})
            saved = client.post("/articles/", json=self.payload).json()
            photo_files = []
            for name, color in (("front.png", "red"), ("back.png", "blue")):
                image = BytesIO()
                Image.new("RGB", (2, 2), color).save(image, format="PNG")
                photo_files.append(("files", (name, image.getvalue(), "image/png")))
            photos_address = f"/items/{game}/copies/with-photos"
            draft = {"request_id": str(uuid4()), "descriptions": ["Copy front", "Copy back"]}
            response = client.post(photos_address, data={"draft": json.dumps(draft)}, files=photo_files)
            self.assertEqual(response.status_code, 200, response.text)
            copy, = response.json()["owned_copies"]
            front, back = copy["photos"]
            entries = [{"path": photo["file_path"], "caption": caption}
                       for photo, caption in [(back, "Gallery back"), (front, "Gallery front")]]
            originals = [client.get(entry["path"]) for entry in entries]
            for original in originals:
                self.assertEqual(original.status_code, 200)

        # Reproduce the 0.6 schema, which has the same article and copy tables.
        with closing(sqlite3.connect(self.path)) as db, db:
            db.execute(f"DROP TABLE {ArticleGalleryEntry.__tablename__}")
        address = f"/articles/{saved['id']}"
        with open_collection(self.path) as client:
            self.assertEqual(client.get(address).json(), saved)
            response = client.patch(address, json={"gallery": entries})
            self.assertEqual(response.status_code, 200, response.text)
            edited = response.json()
            self.assertEqual(edited["id"], saved["id"])
            self.assertEqual(edited["blocks"][:2], saved["blocks"])
            self.assertEqual(edited["blocks"][2]["entries"], entries)

        with open_collection(self.path) as client:
            self.assertEqual(client.get(address).json(), edited)
            self.assertEqual(client.patch(address, json={"gallery": entries}).json(), edited)
            remaining = client.patch(address, json={"gallery": entries[:1]}).json()
            self.assertEqual(remaining["blocks"], [*saved["blocks"], {**edited["blocks"][2], "entries": entries[:1]}])
            remove_back = {"copy_id": copy["id"], "request_id": str(uuid4()),
                           "changes": [{"id": back["id"], "file_path": back["file_path"], "remove": True}]}
            response = client.post(photos_address, data={"draft": json.dumps(remove_back)})
            self.assertEqual(response.status_code, 200, response.text)
            self.assertEqual(response.json()["owned_copies"][0]["photos"], [front])
            self.assertEqual(client.get(front["file_path"]).content, originals[1].content)
            self.assertEqual(client.get(back["file_path"]).content, originals[0].content)
            self.assertEqual(client.patch(address, json={"gallery": []}).json(), saved)
            self.assertEqual(client.get(back["file_path"]).status_code, 404)
            self.assertEqual(client.get(front["file_path"]).content, originals[1].content)
