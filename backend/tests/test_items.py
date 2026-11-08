from contextlib import redirect_stdout
from io import BytesIO, StringIO
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy.exc import IntegrityError
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from app.database import get_session
from app.db.models import (
    Author, AuthorRoleItemLink, Book, Company, CompanyRoleItemLink, Condition,
    CopyPhoto, Item, ItemLanguageLink, ItemTag, ItemTagLink, ItemType, Language,
    OwnedCopy, Title,
)
from app.errors import register_exception_handlers
from app.db.seed import seed_builtin, seed_examples
from app.routers import items, reference


class ItemApiTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        SQLModel.metadata.create_all(self.engine)
        with Session(self.engine) as session:
            session.add_all([Language(code="en", name="English"), Language(code="ru", name="Russian"),
                             ItemType(name="book"), ItemType(name="game")])
            session.commit()

        def session_override():
            with Session(self.engine) as session:
                yield session

        self.directory = TemporaryDirectory()
        media_dir = Path(self.directory.name)
        self.covers = media_dir / "covers"
        self.covers.mkdir()
        self.cover_patch = patch("app.media.COVERS_DIR", self.covers)
        self.cover_patch.start()
        app = FastAPI()
        app.dependency_overrides[get_session] = session_override
        register_exception_handlers(app)
        app.include_router(items.router)
        app.include_router(reference.router)
        app.mount("/media", StaticFiles(directory=media_dir))
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        self.cover_patch.stop()
        self.engine.dispose()
        self.directory.cleanup()

    def payload(self, **changes):
        return {"details": {"type_name": "book"},
                "titles": [{"title_text": "Example", "language_code": "en"}], **changes}

    def create(self, **changes):
        response = self.client.post("/items/", json=self.payload(**changes))
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def image(self, format="PNG", size=(2, 2)):
        content = BytesIO()
        Image.new("RGB", size, "red").save(content, format=format)
        return content.getvalue()

    def upload(self, item_id, content=None, mime="image/png", filename="cover.png"):
        return self.client.post(f"/items/{item_id}/cover", files={"file": (filename, self.image() if content is None else content, mime)})

    def test_unicode_names_reuse_tags_and_roles(self):
        first = self.create(tags=["  Любимое  ", "Ｆｏｏ"], author_credits=[{"author_name": "Пушкин", "role_name": "Автор"}])
        second = self.create(tags=["ЛЮБИМОЕ", "foo"], author_credits=[{"author_id": first["author_credits"][0]["author"]["id"], "role_name": "АВТОР"}])
        self.assertEqual([t["id"] for t in first["tags"]], [t["id"] for t in second["tags"]])
        self.assertEqual(first["author_credits"][0]["role"]["id"], second["author_credits"][0]["role"]["id"])

    def test_same_names_create_distinct_authors_and_companies(self):
        data = {"author_credits": [{"author_name": "Иван Иванов", "role_name": "Автор"}],
                "company_credits": [{"company_name": "Мир", "role_name": "Издатель"}]}
        first = self.create(**data)
        second = self.create(**data)
        author_id = first["author_credits"][0]["author"]["id"]
        company_id = first["company_credits"][0]["company"]["id"]
        self.assertNotEqual(author_id, second["author_credits"][0]["author"]["id"])
        self.assertNotEqual(company_id, second["company_credits"][0]["company"]["id"])
        selected = self.create(author_credits=[{"author_id": author_id, "role_name": "Автор"}],
                               company_credits=[{"company_id": company_id, "role_name": "Издатель"}])
        self.assertEqual(author_id, selected["author_credits"][0]["author"]["id"])
        self.assertEqual(company_id, selected["company_credits"][0]["company"]["id"])

    def test_unicode_search_and_literal_wildcards(self):
        self.create(author_credits=[{"author_name": "Пушкин", "role_name": "Автор"}],
                    company_credits=[{"company_name": "Мир", "role_name": "Издатель"}])
        self.assertEqual(len(self.client.get("/reference/authors", params={"q": "ПУШ"}).json()), 1)
        self.assertEqual(len(self.client.get("/reference/companies", params={"q": "МИР"}).json()), 1)
        self.assertEqual(self.client.get("/reference/authors", params={"q": "%"}).json(), [])

    def test_title_is_required_and_trimmed(self):
        for titles in (None, [], [{"title_text": " \t\u2003", "language_code": "en"}]):
            with self.subTest(titles=titles):
                response = self.client.post("/items/", json=self.payload(titles=titles))
                self.assertEqual(response.status_code, 422, response.text)
                self.assertEqual(response.json()["code"], "validation_error")
        self.assertEqual(self.client.post("/items/", json={"details": {"type_name": "book"}}).status_code, 422)
        created = self.create(titles=[{"title_text": "  Trim me  ", "language_code": "en"}])
        self.assertEqual(created["display_title"], "Trim me")

    def test_patch_cannot_remove_last_title(self):
        item = self.create()
        for titles in (None, [], [{"title_text": " ", "language_code": "en"}]):
            response = self.client.patch(f"/items/{item['id']}", json={"titles": titles})
            self.assertEqual(response.status_code, 422, response.text)
        updated = self.client.patch(f"/items/{item['id']}", json={"description": "Updated"}).json()
        self.assertEqual(updated["display_title"], "Example")

    def test_list_has_all_pages(self):
        ids = [self.create()["id"] for _ in range(23)]
        first = self.client.get("/items/itemlist").json()
        second = self.client.get("/items/itemlist", params={"offset": 20, "limit": 20}).json()
        self.assertEqual((len(first["items"]), len(second["items"]), second["total"]), (20, 3, 23))
        self.assertEqual([item["id"] for item in first["items"] + second["items"]], ids)
        self.assertEqual(self.client.get("/items/itemlist?limit=101").status_code, 422)

    def test_display_title_matches_list_and_falls_back(self):
        item = self.create(selected_language_code="ru", titles=[
            {"title_text": "English", "language_code": "en"},
            {"title_text": "Русское", "language_code": "ru"}])
        listed = self.client.get("/items/itemlist").json()["items"][0]
        self.assertEqual(item["display_title"], listed["title"])
        self.assertEqual(item["display_title"], "Русское")
        changed = self.client.patch(f"/items/{item['id']}", json={"selected_language_code": None}).json()
        self.assertEqual(changed["display_title"], "English")
        self.assertEqual(changed["display_title"], self.client.get("/items/itemlist").json()["items"][0]["title"])

    def test_foreign_keys_are_enforced(self):
        with self.engine.connect() as connection:
            self.assertEqual(connection.exec_driver_sql("PRAGMA foreign_keys").scalar(), 1)
        with Session(self.engine) as session:
            session.add(Title(item_id=99999, title_text="Orphan"))
            with self.assertRaises(IntegrityError):
                session.commit()
            session.rollback()

    def test_replacing_links_and_rollback_with_foreign_keys(self):
        item = self.create(languages=[{"language_code": "en", "text": True}],
                           author_credits=[{"author_name": "Writer", "role_name": "Writer"}])
        author_id = item["author_credits"][0]["author"]["id"]
        response = self.client.patch(f"/items/{item['id']}", json={
            "languages": [{"language_code": "en", "text": False}],
            "author_credits": [{"author_id": author_id, "role_name": "Writer", "comments": "Changed"}]})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertFalse(response.json()["languages"][0]["text"])
        self.assertEqual(response.json()["author_credits"][0]["comments"], "Changed")
        failed = self.client.patch(f"/items/{item['id']}", json={"description": "Must roll back", "format_id": 99999})
        self.assertEqual(failed.status_code, 422)
        self.assertIsNone(self.client.get(f"/items/{item['id']}").json()["description"])

    def test_delete_cascades_to_item_children(self):
        item = self.create(tags=["tag"], languages=[{"language_code": "en"}],
                           author_credits=[{"author_name": "Writer", "role_name": "Writer"}],
                           company_credits=[{"company_name": "Publisher", "role_name": "Publisher"}])
        with Session(self.engine) as session:
            copy = OwnedCopy(item_id=item["id"])
            copy.condition = Condition(notes="Good")
            copy.photos = [CopyPhoto(file_path="sample.jpg")]
            session.add(copy)
            session.commit()
        response = self.client.delete(f"/items/{item['id']}")
        self.assertEqual(response.status_code, 204, response.text)
        with Session(self.engine) as session:
            for model in (Item, Book, Title, ItemLanguageLink, ItemTagLink, AuthorRoleItemLink,
                          CompanyRoleItemLink, OwnedCopy, Condition, CopyPhoto):
                with self.subTest(model=model.__name__):
                    self.assertEqual(session.exec(select(model)).all(), [])
            for model in (Author, Company, ItemTag):
                self.assertEqual(len(session.exec(select(model)).all()), 1)

    def test_covers_upload_serve_replace_and_delete(self):
        item = self.create()
        first = self.upload(item["id"], filename="../../outside.png")
        self.assertEqual(first.status_code, 200, first.text)
        first_path = first.json()["cover_image_path"]
        self.assertTrue(first_path.startswith(f"/media/covers/{item['id']}-"))
        self.assertEqual(self.client.get(first_path).status_code, 200)
        second = self.upload(item["id"], content=self.image("JPEG"), mime="image/jpeg")
        self.assertEqual(second.status_code, 200, second.text)
        second_path = second.json()["cover_image_path"]
        self.assertNotEqual(first_path, second_path)
        self.assertEqual(self.client.get(first_path).status_code, 404)
        self.assertEqual(self.client.get(second_path).headers["content-type"], "image/jpeg")
        self.assertEqual(self.client.delete(f"/items/{item['id']}").status_code, 204)
        self.assertEqual(self.client.get(second_path).status_code, 404)
        self.assertEqual(list(self.covers.iterdir()), [])

    def test_invalid_covers_leave_existing_cover_unchanged(self):
        item = self.create()
        path = self.upload(item["id"]).json()["cover_image_path"]
        for content, mime in ((b"not an image", "image/png"), (self.image(), "image/jpeg"), (b"svg", "image/svg+xml")):
            response = self.upload(item["id"], content=content, mime=mime)
            self.assertEqual(response.status_code, 400, response.text)
        with patch("app.routers.items.MAX_UPLOAD_BYTES", 8):
            self.assertEqual(self.upload(item["id"]).status_code, 413)
        with patch("app.media.MAX_COVER_PIXELS", 3):
            self.assertEqual(self.upload(item["id"]).status_code, 400)
        self.assertEqual(self.client.get(f"/items/{item['id']}").json()["cover_image_path"], path)
        self.assertEqual(len(list(self.covers.iterdir())), 1)
        self.assertEqual(self.upload(99999).status_code, 404)

    def test_shared_cover_is_not_deleted_while_referenced(self):
        first = self.create()
        path = self.upload(first["id"]).json()["cover_image_path"]
        second = self.create(cover_image_path=path)
        self.assertEqual(self.client.delete(f"/items/{first['id']}").status_code, 204)
        self.assertEqual(self.client.get(path).status_code, 200)
        self.assertEqual(self.client.delete(f"/items/{second['id']}").status_code, 204)
        self.assertEqual(self.client.get(path).status_code, 404)

    def test_builtin_and_example_seeds_with_foreign_keys(self):
        with Session(self.engine) as session, redirect_stdout(StringIO()):
            seed_builtin(session)
            seed_builtin(session)
            seed_examples(session)
            self.assertEqual(len(session.exec(select(Author).where(Author.name == "Frank Herbert")).all()), 1)
            self.assertEqual(len(session.exec(select(Company).where(Company.name == "Nintendo")).all()), 1)
        listed = self.client.get("/items/itemlist").json()
        self.assertEqual({item["item_type"] for item in listed["items"]},
                         {"book", "game", "film", "board_game", "journal_issue", "figurine", "miniature", "lego_set"})
        for entry in listed["items"]:
            response = self.client.get(f"/items/{entry['id']}")
            self.assertEqual(response.status_code, 200, response.text)
            self.assertEqual(response.json()["display_title"], entry["title"])


if __name__ == "__main__":
    unittest.main()
