from contextlib import redirect_stdout
from datetime import date, datetime, timezone
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

from app.database import create_db_and_tables, get_session
from app.db.models import (
    Author, AuthorRoleItemLink, Book, Company, CompanyRoleItemLink, Condition,
    CopyPhoto, Item, ItemLanguageLink, ItemTag, ItemTagLink, ItemType, Language,
    OwnedCopy, Title,
)
from app.errors import AppError, register_exception_handlers
from app.media import migrate_icons
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
        self.icons = media_dir / "icons"
        self.icons.mkdir()
        self.cover_patch = patch("app.media.COVERS_DIR", self.covers)
        self.cover_patch.start()
        self.icon_patch = patch("app.media.ICONS_DIR", self.icons)
        self.icon_patch.start()
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
        self.icon_patch.stop()
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

    def test_list_combines_filters_before_sorting_counting_and_pagination(self):
        records = [self.create(
            titles=[{"title_text": title, "language_code": "en"}],
            is_owned=owned, release_date=released,
            details={"type_name": category},
        ) for title, owned, released, category in (
            ("Match B", True, "2001-02-03", "book"),
            ("Match A", True, "2001-02-04", "book"),
            ("Match unowned", False, "2001-02-03", "book"),
            ("Match unknown ownership", None, "2001-02-03", "book"),
            ("Match unknown date", True, None, "book"),
            ("Match game", True, "2001-02-03", "game"),
            ("Other", True, "2001-02-03", "book"),
            ("Match early", True, "2001-02-02", "book"),
            ("Match late", True, "2001-02-05", "book"),
        )]
        with Session(self.engine) as session:
            for index, record in enumerate(records):
                item = session.get(Item, record["id"])
                item.date_added = date(2026, 11, 1 + index)
                session.add(item)
            session.commit()
        params = {"item_type": "book", "q": "match", "is_owned": "true",
                  "release_date_from": "2001-02-03", "release_date_to": "2001-02-04",
                  "date_added_from": "2026-11-01", "date_added_to": "2026-11-02",
                  "sort_by": "title", "sort_direction": "asc", "limit": 1}
        for offset, index in enumerate((1, 0)):
            response = self.client.get("/items/itemlist", params={**params, "offset": offset})
            self.assertEqual(response.status_code, 200, response.text)
            page = response.json()
            self.assertEqual(page["total"], 2)
            self.assertEqual([item["id"] for item in page["items"]], [records[index]["id"]])
        self.assertEqual(self.client.get("/items/itemlist").json()["total"], len(records))

    def test_list_filter_ownership_false_includes_unset_and_dates_allow_open_ranges(self):
        owned = self.create(is_owned=True, release_date="2001-02-03")
        unowned = self.create(is_owned=False, release_date="2002-02-03")
        unknown = self.create()
        with Session(self.engine) as session:
            item = session.get(Item, unknown["id"])
            item.date_added = None
            session.add(item)
            session.commit()
        for params, expected in (
            ({"is_owned": "false"}, [unowned["id"], unknown["id"]]),
            ({"release_date_from": "2002-02-03"}, [unowned["id"]]),
            ({"release_date_to": "2001-02-03"}, [owned["id"]]),
            ({"date_added_from": "2000-01-01"}, [owned["id"], unowned["id"]]),
            ({"date_added_to": "2000-01-01"}, []),
        ):
            with self.subTest(params=params):
                response = self.client.get("/items/itemlist", params=params)
                self.assertEqual(response.status_code, 200, response.text)
                page = response.json()
                self.assertEqual([item["id"] for item in page["items"]], expected)
                self.assertEqual(page["total"], len(expected))

    def test_list_rejects_invalid_filter_values_and_reversed_ranges(self):
        for params in (
            {"is_owned": "maybe"}, {"release_date_from": "bad-date"},
            {"date_added_to": "2026-02-30"},
            {"release_date_from": "2002-01-01", "release_date_to": "2001-01-01"},
            {"date_added_from": "2026-11-02", "date_added_to": "2026-11-01"},
        ):
            with self.subTest(params=params):
                response = self.client.get("/items/itemlist", params=params)
                self.assertEqual(response.status_code, 422, response.text)
                self.assertEqual(response.json()["code"], "validation_error")

    def test_list_records_date_added_and_preserves_it_on_edit(self):
        item = self.create()
        listed = self.client.get("/items/itemlist").json()["items"][0]
        self.assertEqual(listed["date_added"], datetime.now(timezone.utc).date().isoformat())
        self.client.patch(f"/items/{item['id']}", json={"description": "Updated"})
        self.assertEqual(self.client.get("/items/itemlist").json()["items"][0]["date_added"], listed["date_added"])

    def test_list_orders_before_pagination_with_stable_ties_and_unknown_dates_last(self):
        records = [
            self.create(titles=[{"title_text": "zulu", "language_code": "en"}], release_date="2003-01-01"),
            self.create(titles=[{"title_text": "alpha", "language_code": "en"}], release_date="2001-01-01"),
            self.create(titles=[{"title_text": "Alpha", "language_code": "en"}], release_date="2001-01-01"),
            self.create(selected_language_code="ru", titles=[
                {"title_text": "English title", "language_code": "en"},
                {"title_text": "Бета", "language_code": "ru"},
            ]),
        ]
        with Session(self.engine) as session:
            for record, added in zip(records, ["2026-11-03", None, "2026-11-01", "2026-11-02"]):
                item = session.get(Item, record["id"])
                item.date_added = date.fromisoformat(added) if added else None
                session.add(item)
            session.commit()

        cases = [
            ("title", "asc", [1, 2, 0, 3]),
            ("title", "desc", [3, 0, 1, 2]),
            ("release_date", "asc", [1, 2, 0, 3]),
            ("release_date", "desc", [0, 1, 2, 3]),
            ("date_added", "asc", [2, 3, 0, 1]),
            ("date_added", "desc", [0, 3, 2, 1]),
        ]
        for field, direction, indices in cases:
            with self.subTest(field=field, direction=direction):
                listed = []
                for offset in (0, 2):
                    response = self.client.get("/items/itemlist", params={
                        "sort_by": field, "sort_direction": direction, "offset": offset, "limit": 2,
                    })
                    self.assertEqual(response.status_code, 200, response.text)
                    page = response.json()
                    self.assertEqual((page["total"], page["offset"], page["limit"]), (4, offset, 2))
                    listed.extend(item["id"] for item in page["items"])
                self.assertEqual(listed, [records[index]["id"] for index in indices])

    def test_list_rejects_unknown_ordering(self):
        for params in ({"sort_by": "unknown"}, {"sort_direction": "sideways"}):
            self.assertEqual(self.client.get("/items/itemlist", params=params).status_code, 422)

    def test_list_filters_category_before_ordering_and_pagination(self):
        records = []
        for name in ("zulu", "Alpha", "Middle"):
            self.create(details={"type_name": "game"}, titles=[{"title_text": name, "language_code": "en"}])
            records.append(self.create(titles=[{"title_text": name, "language_code": "en"}]))
        for direction, indices in (("asc", [1, 2, 0]), ("desc", [0, 2, 1])):
            with self.subTest(direction=direction):
                listed = []
                for offset in (0, 2):
                    response = self.client.get("/items/itemlist", params={
                        "item_type": "book", "sort_by": "title", "sort_direction": direction,
                        "offset": offset, "limit": 2,
                    })
                    self.assertEqual(response.status_code, 200, response.text)
                    page = response.json()
                    self.assertEqual((page["total"], page["offset"], page["limit"]), (3, offset, 2))
                    self.assertTrue(all(item["item_type"] == "book" for item in page["items"]))
                    listed.extend(item["id"] for item in page["items"])
                self.assertEqual(listed, [records[index]["id"] for index in indices])
        games = self.client.get("/items/itemlist", params={"item_type": "game"}).json()
        self.assertEqual(games["total"], 3)
        self.assertTrue(all(item["item_type"] == "game" for item in games["items"]))
        self.assertEqual(self.client.get("/items/itemlist").json()["total"], 6)
        empty = self.client.get("/items/itemlist", params={"item_type": "film"}).json()
        self.assertEqual((empty["items"], empty["total"]), ([], 0))

    def test_list_includes_current_description_and_allows_no_description(self):
        first = self.create(description="A description for the mini page.")
        second = self.create()
        listed = self.client.get("/items/itemlist").json()["items"]
        self.assertEqual(listed[0]["description"], first["description"])
        self.assertIsNone(listed[1]["description"])
        self.client.patch(f"/items/{second['id']}", json={"description": "Updated description"})
        self.assertEqual(self.client.get("/items/itemlist").json()["items"][1]["description"], "Updated description")

    def test_list_searches_all_titles_and_short_titles_with_unicode_normalization(self):
        item = self.create(selected_language_code="en", titles=[
            {"title_text": "English title", "short_text": "Ｆｏｏ", "language_code": "en"},
            {"title_text": "Пушкин: Сказки", "short_text": "Сказки", "language_code": "ru"},
        ])
        self.create(titles=[{"title_text": "Other item", "language_code": "en"}])
        for query in ("ENGLISH", "  ПУШКИН  ", "foo", "сказки"):
            with self.subTest(query=query):
                response = self.client.get("/items/itemlist", params={"q": query})
                self.assertEqual(response.status_code, 200, response.text)
                page = response.json()
                self.assertEqual(page["total"], 1)
                self.assertEqual([entry["id"] for entry in page["items"]], [item["id"]])
                self.assertEqual(page["items"][0]["title"], "English title")
        self.assertEqual(self.client.get("/items/itemlist", params={"q": " \t "}).json()["total"], 2)
        empty = self.client.get("/items/itemlist", params={"q": "missing"}).json()
        self.assertEqual((empty["items"], empty["total"]), ([], 0))

    def test_list_search_treats_special_characters_as_literal_text(self):
        literal = self.create(titles=[{"title_text": "100% A_B & C?", "language_code": "en"}])
        self.create(titles=[{"title_text": "1000 ACB and C", "language_code": "en"}])
        for query in ("%", "_", "&", "?", "A_B"):
            with self.subTest(query=query):
                page = self.client.get("/items/itemlist", params={"q": query}).json()
                self.assertEqual(page["total"], 1)
                self.assertEqual([entry["id"] for entry in page["items"]], [literal["id"]])

    def test_list_search_combines_category_sorting_and_pagination_without_duplicates(self):
        records = []
        for name in ("Zulu", "Alpha", "Middle"):
            titles = [{"title_text": f"{name} match", "language_code": "en"},
                      {"title_text": f"Совпадение match {name}", "language_code": "ru"}]
            records.append(self.create(titles=titles))
            self.create(details={"type_name": "game"}, titles=titles)
        self.create(titles=[{"title_text": "A distraction", "language_code": "en"}])
        for direction, expected in (("asc", [1, 2, 0]), ("desc", [0, 2, 1])):
            with self.subTest(direction=direction):
                ids = []
                for offset in (0, 2):
                    response = self.client.get("/items/itemlist", params={
                        "q": "MATCH", "item_type": "book", "sort_by": "title", "sort_direction": direction,
                        "offset": offset, "limit": 2,
                    })
                    self.assertEqual(response.status_code, 200, response.text)
                    page = response.json()
                    self.assertEqual((page["total"], page["offset"], page["limit"]), (3, offset, 2))
                    ids.extend(entry["id"] for entry in page["items"])
                self.assertEqual(ids, [records[index]["id"] for index in expected])

    def test_existing_database_adds_nullable_date_without_losing_items(self):
        legacy = create_engine("sqlite://", poolclass=StaticPool)
        try:
            with legacy.begin() as connection:
                connection.exec_driver_sql("CREATE TABLE item (id INTEGER PRIMARY KEY)")
                connection.exec_driver_sql("INSERT INTO item (id) VALUES (42)")
            with patch("app.database.engine", legacy):
                create_db_and_tables()
                create_db_and_tables()
            with legacy.connect() as connection:
                self.assertEqual(connection.exec_driver_sql("SELECT id, date_added FROM item").all(), [(42, None)])
        finally:
            legacy.dispose()

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

    def test_patch_replaces_and_clears_images_without_leaving_files(self):
        for kind in ("cover", "icon"):
            with self.subTest(kind=kind):
                item = self.create()
                replacement = self.create()
                def upload(item_id):
                    return self.client.post(f"/items/{item_id}/{kind}",
                                            files={"file": ("image.png", self.image(), "image/png")})
                field = f"{kind}_image_path"
                previous = upload(item["id"]).json()[field]
                path = upload(replacement["id"]).json()[field]
                response = self.client.patch(f"/items/{item['id']}", json={field: path})
                self.assertEqual(response.status_code, 200, response.text)
                self.assertEqual(response.json()[field], path)
                self.assertEqual(self.client.get(previous).status_code, 404)
                self.assertEqual(self.client.get(path).status_code, 200)
                self.client.delete(f"/items/{replacement['id']}")
                self.assertEqual(self.client.get(path).status_code, 200)
                response = self.client.patch(f"/items/{item['id']}", json={field: None})
                self.assertEqual(response.status_code, 200, response.text)
                self.assertIsNone(response.json()[field])
                self.assertEqual(self.client.get(path).status_code, 404)
                self.client.delete(f"/items/{item['id']}")
        self.assertEqual(list(self.covers.iterdir()), [])
        self.assertEqual(list(self.icons.iterdir()), [])

    def test_patch_keeps_images_referenced_by_unchanged_fields(self):
        item = self.create()
        path = self.upload(item["id"]).json()["cover_image_path"]
        for payload in ({"cover_image_path": path}, {"icon_image_path": path}, {"cover_image_path": None}):
            response = self.client.patch(f"/items/{item['id']}", json=payload)
            self.assertEqual(response.status_code, 200, response.text)
            self.assertEqual(self.client.get(path).status_code, 200)
        response = self.client.patch(f"/items/{item['id']}", json={"icon_image_path": None})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(self.client.get(path).status_code, 404)

    def test_failed_patch_preserves_image_files_and_paths(self):
        item = self.create()
        path = self.upload(item["id"]).json()["cover_image_path"]
        response = self.client.patch(f"/items/{item['id']}",
                                     json={"cover_image_path": None, "format_id": 99999})
        self.assertEqual(response.status_code, 422, response.text)
        self.assertEqual(self.client.get(f"/items/{item['id']}").json()["cover_image_path"], path)
        self.assertEqual(self.client.get(path).status_code, 200)

    def test_images_used_by_copy_photos_survive_replacement_and_deletion(self):
        for kind in ("cover", "icon"):
            for action in ("replace", "clear", "delete"):
                with self.subTest(kind=kind, action=action):
                    item = self.create()
                    photo_item = self.create()
                    def upload():
                        return self.client.post(f"/items/{item['id']}/{kind}",
                                                files={"file": ("image.png", self.image(), "image/png")})
                    path = upload().json()[f"{kind}_image_path"]
                    with Session(self.engine) as session:
                        session.add(OwnedCopy(item_id=photo_item["id"], photos=[CopyPhoto(file_path=path)]))
                        session.commit()
                    if action == "replace":
                        response = upload()
                    elif action == "clear":
                        response = self.client.patch(f"/items/{item['id']}", json={f"{kind}_image_path": None})
                    else:
                        response = self.client.delete(f"/items/{item['id']}")
                    self.assertIn(response.status_code, (200, 204), response.text)
                    self.assertEqual(self.client.get(path).status_code, 200)
                    self.assertEqual(self.client.delete(f"/items/{photo_item['id']}").status_code, 204)
                    self.assertEqual(self.client.get(path).status_code, 404)

    def test_patch_never_removes_unmanaged_files(self):
        unmanaged = self.covers / "custom.png"
        unmanaged.write_bytes(self.image())
        item = self.create(cover_image_path="/media/covers/custom.png")
        response = self.client.patch(f"/items/{item['id']}", json={"cover_image_path": None})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertTrue(unmanaged.is_file())

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

    def test_inline_reference_creation_reuses_names_and_languages_stay_predefined(self):
        for path in ("franchises", "journals", "game-platforms", "scales", "barcode-types",
                     "tags", "author-roles", "company-roles"):
            with self.subTest(path=path):
                response = self.client.post(f"/reference/{path}", json={"name": "  Новое имя  "})
                self.assertEqual(response.status_code, 200, response.text)
                entity = response.json()
                self.assertEqual(entity["scale" if path == "scales" else "name"], "Новое имя")
                repeated = self.client.post(f"/reference/{path}", json={"name": "НОВОЕ ИМЯ"})
                self.assertEqual(repeated.json()["id"], entity["id"])
                listed = self.client.get(f"/reference/{path}").json()
                self.assertEqual([entry["id"] for entry in listed], [entity["id"]])
                for invalid in ({"name": " \t"}, {"name": "Other", "unknown": True}):
                    self.assertEqual(self.client.post(f"/reference/{path}", json=invalid).status_code, 422)
        before = self.client.get("/reference/languages").json()
        self.assertEqual(self.client.post("/reference/languages", json={"name": "Custom", "code": "xx"}).status_code, 405)
        self.assertEqual(self.client.get("/reference/languages").json(), before)

    def test_inline_formats_and_genres_keep_item_type_scope(self):
        for resource in ("formats", "genres"):
            self.assertEqual(self.client.post(f"/reference/{resource}", json={"name": "New"}).status_code, 422)
            created = self.client.post(f"/reference/{resource}", json={"name": "New", "item_type": "book"})
            self.assertEqual(created.status_code, 200, created.text)
            entity = created.json()
            self.assertEqual(self.client.get(f"/reference/{resource}?item_type=game").json(), [])
            reused = self.client.post(f"/reference/{resource}", json={"name": "new", "item_type": "game"})
            self.assertEqual(reused.json()["id"], entity["id"])
            for item_type in ("book", "game"):
                self.assertEqual(self.client.get(f"/reference/{resource}?item_type={item_type}").json()[0]["id"], entity["id"])
            invalid = self.client.post(f"/reference/{resource}", json={"name": "Must not persist", "item_type": "missing"})
            self.assertEqual(invalid.status_code, 404)
            self.assertEqual(len(self.client.get(f"/reference/{resource}").json()), 1)

    def test_item_can_use_new_references_selected_in_the_editor(self):
        def add(resource, name, **fields):
            response = self.client.post(f"/reference/{resource}", json={"name": name, **fields})
            self.assertEqual(response.status_code, 200, response.text)
            return response.json()

        franchise = add("franchises", "A franchise")
        genre = add("genres", "A genre", item_type="game")
        fmt = add("formats", "A format", item_type="game")
        platform = add("game-platforms", "A platform")
        barcode_type = add("barcode-types", "A barcode type")
        tag = add("tags", "A tag, with punctuation")
        item = self.create(details={"type_name": "game", "game_platform_id": platform["id"]},
                           format_id=fmt["id"], genre_ids=[genre["id"]], franchise_ids=[franchise["id"]],
                           tags=[tag["name"]], selected_language_code="ru", languages=[{"language_code": "ru", "text": True}],
                           barcodes=[{"code": "123", "barcode_type_id": barcode_type["id"]}])
        self.assertEqual(item["franchises"][0]["name"], franchise["name"])
        self.assertEqual(item["genres"][0]["name"], genre["name"])
        self.assertEqual(item["format"]["name"], fmt["name"])
        self.assertEqual(item["details"]["game_platform"]["name"], platform["name"])
        self.assertEqual(item["tags"][0]["name"], tag["name"])
        self.assertEqual(item["languages"][0]["language"]["code"], "ru")
        self.assertEqual(item["barcodes"][0]["barcode_type"]["name"], barcode_type["name"])

    def test_icon_upload_replace_and_delete_preserves_cover(self):
        item = self.create()
        cover = self.upload(item["id"]).json()["cover_image_path"]
        def icon(content=None, mime="image/png"):
            return self.client.post(f"/items/{item['id']}/icon", files={"file": ("../../icon.png", content or self.image(), mime)})
        first = icon()
        self.assertEqual(first.status_code, 200, first.text)
        path = first.json()["icon_image_path"]
        self.assertTrue(path.startswith(f"/media/icons/{item['id']}-"))
        self.assertTrue((self.icons / Path(path).name).is_file())
        self.assertFalse((self.covers / Path(path).name).exists())
        self.assertEqual(first.json()["cover_image_path"], cover)
        self.assertEqual(self.client.get(path).status_code, 200)
        self.assertEqual(icon(b"invalid").status_code, 400)
        with patch("app.routers.items.MAX_UPLOAD_BYTES", 8):
            self.assertEqual(icon().status_code, 413)
        self.assertEqual(self.client.get(f"/items/{item['id']}").json()["icon_image_path"], path)
        replacement = icon().json()["icon_image_path"]
        self.assertNotEqual(path, replacement)
        self.assertEqual(self.client.get(path).status_code, 404)
        self.assertEqual(self.client.get(cover).status_code, 200)
        self.assertEqual(self.client.delete(f"/items/{item['id']}").status_code, 204)
        self.assertEqual(list(self.covers.iterdir()), [])
        self.assertEqual(list(self.icons.iterdir()), [])

    def test_generate_icon_from_cover_contains_all_sizes_and_preserves_aspect_ratio(self):
        item = self.create()
        cover = self.upload(item["id"], content=self.image(size=(20, 40))).json()["cover_image_path"]
        response = self.client.post(f"/items/{item['id']}/icon/from-cover")
        self.assertEqual(response.status_code, 200, response.text)
        path = response.json()["icon_image_path"]
        self.assertTrue(path.startswith(f"/media/icons/{item['id']}-"))
        self.assertTrue(path.endswith(".ico"))
        self.assertEqual(len(list(self.icons.iterdir())), 1)
        self.assertEqual(len(list(self.covers.iterdir())), 1)
        self.assertEqual(response.json()["cover_image_path"], cover)
        media = self.client.get(path)
        self.assertEqual(media.status_code, 200)
        with Image.open(BytesIO(media.content)) as icon:
            self.assertEqual(icon.ico.sizes(), {(16, 16), (32, 32), (64, 64)})
            for size in icon.ico.sizes():
                frame = icon.ico.getimage(size)
                self.assertEqual(frame.size, size)
                self.assertEqual(frame.getpixel((0, 0))[3], 0)
                self.assertEqual(frame.getpixel((size[0] // 2, size[1] // 2)), (255, 0, 0, 255))
        listed = self.client.get("/items/itemlist").json()["items"][0]
        self.assertEqual(listed["icon_image_path"], path)

    def test_generate_replaces_manual_and_generated_icons_and_cleans_up_files(self):
        item = self.create()
        cover = self.upload(item["id"]).json()["cover_image_path"]
        manual = self.client.post(f"/items/{item['id']}/icon", files={"file": ("icon.png", self.image(), "image/png")}).json()["icon_image_path"]
        first = self.client.post(f"/items/{item['id']}/icon/from-cover").json()["icon_image_path"]
        second = self.client.post(f"/items/{item['id']}/icon/from-cover").json()["icon_image_path"]
        self.assertNotEqual(first, second)
        for path in (manual, first):
            self.assertEqual(self.client.get(path).status_code, 404)
        self.assertEqual(self.client.get(cover).status_code, 200)
        self.assertEqual(self.client.get(second).status_code, 200)
        # A manual upload also removes a previously generated icon.
        self.client.post(f"/items/{item['id']}/icon", files={"file": ("icon.png", self.image(), "image/png")})
        self.assertEqual(self.client.get(second).status_code, 404)
        final = self.client.post(f"/items/{item['id']}/icon/from-cover").json()["icon_image_path"]
        self.client.delete(f"/items/{item['id']}")
        self.assertEqual(self.client.get(final).status_code, 404)
        self.assertEqual(list(self.covers.iterdir()), [])
        self.assertEqual(list(self.icons.iterdir()), [])

    def test_generate_requires_an_existing_item_and_a_managed_cover(self):
        self.assertEqual(self.client.post("/items/99999/icon/from-cover").status_code, 404)
        item = self.create()
        manual = self.client.post(f"/items/{item['id']}/icon", files={"file": ("icon.png", self.image(), "image/png")}).json()["icon_image_path"]
        for path in (None, "/media/covers/../../outside.png", "https://example.com/cover.png", "/media/covers/1-" + "a" * 32 + ".png"):
            with self.subTest(path=path):
                self.client.patch(f"/items/{item['id']}", json={"cover_image_path": path})
                response = self.client.post(f"/items/{item['id']}/icon/from-cover")
                self.assertEqual(response.status_code, 400, response.text)
                self.assertEqual(response.json()["code"], "cover_required")
                self.assertEqual(self.client.get(f"/items/{item['id']}").json()["icon_image_path"], manual)
                self.assertEqual(self.client.get(manual).status_code, 200)

    def test_generation_failure_preserves_existing_icon_and_removes_uncommitted_file(self):
        item = self.create()
        cover = self.upload(item["id"]).json()["cover_image_path"]
        icon = self.client.post(f"/items/{item['id']}/icon/from-cover").json()["icon_image_path"]
        original_files = set(self.covers.iterdir()) | set(self.icons.iterdir())
        with patch("app.routers.items.crud.update_item", side_effect=AppError("Save failed", code="save_failed")):
            response = self.client.post(f"/items/{item['id']}/icon/from-cover")
        self.assertEqual(response.status_code, 400, response.text)
        self.assertEqual(set(self.covers.iterdir()) | set(self.icons.iterdir()), original_files)
        self.assertEqual(self.client.get(f"/items/{item['id']}").json()["icon_image_path"], icon)
        (self.covers / Path(cover).name).write_bytes(b"invalid image")
        response = self.client.post(f"/items/{item['id']}/icon/from-cover")
        self.assertEqual(response.status_code, 400, response.text)
        self.assertEqual(response.json()["code"], "invalid_image")
        self.assertEqual(set(self.covers.iterdir()) | set(self.icons.iterdir()), original_files)

    def test_legacy_icons_migrate_to_icons_folder_and_keep_all_embedded_sizes(self):
        item = self.create()
        cover = self.upload(item["id"]).json()["cover_image_path"]
        generated = self.client.post(f"/items/{item['id']}/icon/from-cover").json()["icon_image_path"]
        filename = Path(generated).name
        original = (self.icons / filename).read_bytes()
        (self.icons / filename).replace(self.covers / filename)
        legacy = f"/media/covers/{filename}"
        self.client.patch(f"/items/{item['id']}", json={"icon_image_path": legacy})
        shared = self.create(icon_image_path=legacy)
        with Session(self.engine) as session:
            migrate_icons(session)
            migrate_icons(session)
        updated = self.client.get(f"/items/{item['id']}").json()
        path = updated["icon_image_path"]
        self.assertTrue(path.startswith("/media/icons/"))
        self.assertEqual(updated["cover_image_path"], cover)
        self.assertEqual(self.client.get(path).content, original)
        self.assertEqual(self.client.get(legacy).status_code, 404)
        self.assertEqual(self.client.get(f"/items/{shared['id']}").json()["icon_image_path"], path)
        self.assertEqual(len(list(self.icons.iterdir())), 1)
        with Image.open(BytesIO(self.client.get(path).content)) as icon:
            self.assertEqual(icon.ico.sizes(), {(16, 16), (32, 32), (64, 64)})
        self.client.delete(f"/items/{item['id']}")
        self.assertEqual(self.client.get(path).status_code, 200)
        self.client.delete(f"/items/{shared['id']}")
        self.assertEqual(list(self.icons.iterdir()), [])

    def test_legacy_icon_migration_keeps_shared_cover_and_skips_missing_and_unmanaged_files(self):
        item = self.create()
        cover = self.upload(item["id"]).json()["cover_image_path"]
        self.client.patch(f"/items/{item['id']}", json={"icon_image_path": cover})
        missing = self.create(icon_image_path="/media/covers/1-" + "a" * 32 + ".png")
        unmanaged = self.create(icon_image_path="/media/covers/../../outside.png")
        with Session(self.engine) as session, self.assertLogs("app.media", level="WARNING"):
            migrate_icons(session)
        path = self.client.get(f"/items/{item['id']}").json()["icon_image_path"]
        self.assertTrue(path.startswith("/media/icons/"))
        self.assertEqual(self.client.get(path).content, self.client.get(cover).content)
        self.assertEqual(self.client.get(cover).status_code, 200)
        for unchanged in (missing, unmanaged):
            self.assertEqual(self.client.get(f"/items/{unchanged['id']}").json()["icon_image_path"], unchanged["icon_image_path"])

    def test_icon_migration_failure_retains_legacy_paths_and_cleans_new_copies(self):
        item = self.create()
        cover = self.upload(item["id"]).json()["cover_image_path"]
        self.client.patch(f"/items/{item['id']}", json={"icon_image_path": cover})
        with Session(self.engine) as session, patch.object(session, "commit", side_effect=RuntimeError("Commit failed")):
            with self.assertRaisesRegex(RuntimeError, "Commit failed"):
                migrate_icons(session)
        self.assertEqual(self.client.get(f"/items/{item['id']}").json()["icon_image_path"], cover)
        self.assertEqual(self.client.get(cover).status_code, 200)
        self.assertEqual(list(self.icons.iterdir()), [])


if __name__ == "__main__":
    unittest.main()
