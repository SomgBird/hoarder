"""Seed the DB. Run from backend/:  python -m app.db.seed  [--reset]"""
import argparse
import pycountry
from datetime import date

from sqlmodel import Session, select

from app.config import DB_PATH
from app.database import create_db_and_tables, engine
from app.db.schemas import CreditCreate, ItemCreate, TitleCreate
from app.db import crud
from app.db.models import Language


SAMPLE_ITEMS = [
    ItemCreate(
        release_date="2011-10-02",
        is_owned=True,
        titles=[TitleCreate(title_text="Dune", language_code="en")],
        language_codes=["en"],
        selected_language_code="en",
        details={"type_name": "book", "page_count": 412},
        credits=[
            CreditCreate(author_name="Frank Herbert", role_name="Writer"),
        ],
    ),
    # same author again: exercises get-or-create reuse instead of a duplicate row
    ItemCreate(
        release_date="2012-03-15",
        is_owned=False,
        titles=[TitleCreate(title_text="Dune Messiah", language_code="en")],
        language_codes=["en"],
        selected_language_code="en",
        details={"type_name": "book", "page_count": 256},
        credits=[
            CreditCreate(author_name="frank herbert", role_name="writer"),
        ],
    ),
    # game: different details type, multiple credits with different roles
    ItemCreate(
        release_date="2017-03-03",
        is_owned=True,
        titles=[TitleCreate(title_text="The Legend of Zelda: Breath of the Wild", language_code="en")],
        language_codes=["en"],
        selected_language_code="en",
        details={"type_name": "game"},
        credits=[
            CreditCreate(author_name="Hidemaro Fujibayashi", role_name="Director"),
            CreditCreate(author_name="Eiji Aonuma", role_name="Producer"),
        ],
    ),
]

ITEM_TYPES = [
    {"name": "book", "description": "A book"},
    {"name": "game", "description": "A game"},
]

def seed_languages(session: Session) -> None:
    existing = set(session.exec(select(Language.code)).all())

    new_langs = [
        Language(code=lang.alpha_2, name=getattr(lang, "common_name", lang.name))
        for lang in pycountry.languages
        if hasattr(lang, "alpha_2") and lang.alpha_2 not in existing
    ]

    session.add_all(new_langs)
    session.commit()


def seed_item_types(session: Session) -> None:
    existing = set(session.exec(select(crud.ItemType.name)).all())

    new_types = [
        crud.ItemType(name=it["name"], description=it.get("description"))
        for it in ITEM_TYPES
        if it["name"] not in existing
    ]

    session.add_all(new_types)
    session.commit()


def reset_db() -> None:
    if DB_PATH.exists():
        DB_PATH.unlink()
        print(f"removed {DB_PATH}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="delete the DB first")
    args = parser.parse_args()

    if args.reset:
        reset_db()

    create_db_and_tables()
    with Session(engine) as session:
        seed_languages(session)
        seed_item_types(session)

        for data in SAMPLE_ITEMS:
            item = crud.create_item(session, data)
            print(f"inserted #{item.id}")


if __name__ == "__main__":
    main()