# backend/app/seed.py
"""Seed the DB. Run from backend/:  python -m app.seed  [--reset]"""
import argparse
from datetime import date

from sqlmodel import Session

from app.config import DB_PATH
from app.database import create_db_and_tables, engine
from app.db.schemas import ItemCreate
from app.db import crud


SAMPLE_ITEMS = [
    ItemCreate(
        release_date=date(2011, 10, 2),
        is_owned=True
    )
]


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
        for data in SAMPLE_ITEMS:
            item = crud.create_item(session, data)
            print(f"inserted #{item.id}")


if __name__ == "__main__":
    main()