# backend/app/seed.py
"""Seed the DB. Run from backend/:  python -m app.seed  [--reset]"""
import argparse
import pycountry
from datetime import date

from sqlmodel import Session, select

from app.config import DB_PATH
from app.database import create_db_and_tables, engine
from app.db.schemas import ItemCreate
from app.db import crud
from backend.app.db.models import Language


SAMPLE_ITEMS = [
    ItemCreate(
        release_date=date(2011, 10, 2),
        is_owned=True,
        titles=["Dune"],
        language_codes=["en"],
        selected_language_code=["en"]
    )
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
        seed_languages()

        for data in SAMPLE_ITEMS:
            item = crud.create_item(session, data)
            print(f"inserted #{item.id}")


if __name__ == "__main__":
    main()