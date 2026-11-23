import sqlite3
import unittest
from contextlib import closing, contextmanager
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

from app.db.models import Item, ItemType, OwnedCopy, Title
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

    def test_collection_with_item_and_copy_gains_articles_on_startup(self):
        engine = create_engine(f"sqlite:///{self.path}")
        tables = [table for table in SQLModel.metadata.sorted_tables if table.name not in ("article", "article_block")]
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
