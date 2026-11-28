import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from sqlmodel import Session, SQLModel, create_engine

from app.db.models import Franchise, FranchisePage, Item, ItemType, Language, Title
from test_articles import open_collection


class FranchisePageTests(unittest.TestCase):
    def setUp(self):
        self.path = Path(self.enterContext(TemporaryDirectory())) / "collection.db"

    def test_empty_collection_can_save_one_page_for_an_existing_franchise(self):
        with open_collection(self.path) as client:
            self.assertEqual(client.get("/franchise-pages/").json(), [])
            self.assertEqual(client.get("/franchise-pages/1").json()["code"], "franchise_not_found")
            self.assertEqual(client.put("/franchise-pages/1", json={"introduction": "Unknown"}).status_code, 404)
            reference = client.post("/reference/franchises", json={"name": "Harbor Routes"}).json()
            franchise_id = reference["id"]
            url = f"/franchise-pages/{franchise_id}"
            self.assertEqual(client.get(url).json(), {
                "id": franchise_id, "title": "Harbor Routes", "introduction": None, "members": [],
            })
            self.assertEqual(client.get("/franchise-pages/").json(), [])
            for invalid in ({}, {"introduction": None}, {"introduction": "Draft", "title": "Different"}):
                self.assertEqual(client.put(url, json=invalid).status_code, 422)
            intro = "First paragraph.\n\nSecond paragraph."
            for _ in range(2):
                saved = client.put(url, json={"introduction": intro})
                self.assertEqual(saved.status_code, 200, saved.text)
                self.assertEqual(saved.json()["introduction"], intro)

        with open_collection(self.path) as client:
            self.assertEqual(client.get(url).json(), saved.json())
            self.assertEqual(client.get("/franchise-pages/").json(), [{"id": franchise_id, "title": "Harbor Routes"}])

    def test_upgrade_keeps_reference_and_reads_current_members(self):
        engine = create_engine(f"sqlite:///{self.path}")
        try:
            old_tables = [table for table in SQLModel.metadata.sorted_tables if table is not FranchisePage.__table__]
            SQLModel.metadata.create_all(engine, tables=old_tables)
            with Session(engine) as session:
                franchise = Franchise(name="Harbor Routes", description="Reference description")
                english = Language(code="en", name="English")
                game = Item(item_type=ItemType(name="game"), franchises=[franchise],
                            selected_language=english, titles=[Title(title_text="Alternate title"),
                                                               Title(title_text="Zebra Game", language=english)])
                book = Item(item_type=ItemType(name="book"), franchises=[franchise],
                            titles=[Title(title_text="alpha Book")])
                session.add_all([game, book])
                session.commit()
                game_id, book_id, franchise_id = game.id, book.id, franchise.id
        finally:
            engine.dispose()

        url = f"/franchise-pages/{franchise_id}"
        game_entry = {"id": game_id, "title": "Zebra Game", "item_type": "game"}
        book_entry = {"id": book_id, "title": "alpha Book", "item_type": "book"}
        with open_collection(self.path) as client:
            self.assertEqual(client.get(url).json()["members"], [book_entry, game_entry])
            saved = client.put(url, json={"introduction": "New introduction"}).json()
            self.assertEqual(saved["members"], [book_entry, game_entry])
            self.assertEqual(client.get(f"/items/{game_id}").json()["franchises"][0]["description"], "Reference description")
            updated = client.put(url, json={"introduction": "Revised introduction"}).json()
            self.assertEqual(updated, {**saved, "introduction": "Revised introduction"})

        with open_collection(self.path) as client:
            self.assertEqual(client.get(url).json(), updated)
            game_patch = client.patch(f"/items/{game_id}", json={"titles": [{"title_text": "Renamed game", "language_code": "en"}]})
            self.assertEqual(game_patch.status_code, 200, game_patch.text)
            book_patch = client.patch(f"/items/{book_id}", json={"franchise_ids": []})
            self.assertEqual(book_patch.status_code, 200, book_patch.text)
            self.assertEqual(book_patch.json()["display_title"], book_entry["title"])
            game_entry["title"] = "Renamed game"
            self.assertEqual(client.get(url).json(), {**updated, "members": [game_entry]})
            self.assertEqual(client.patch(f"/items/{game_id}", json={"franchise_ids": []}).status_code, 200)
            self.assertEqual(client.get(url).json(), {**updated, "members": []})
            self.assertEqual(client.get("/franchise-pages/").json(), [{"id": franchise_id, "title": "Harbor Routes"}])
            self.assertEqual(client.patch(f"/items/{book_id}", json={"franchise_ids": [franchise_id]}).status_code, 200)
            self.assertEqual(client.get(url).json(), {**updated, "members": [book_entry]})
