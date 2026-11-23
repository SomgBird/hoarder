import unittest
from contextlib import contextmanager
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
