# backend/app/seed.py
"""Seed the DB. Run from backend/:  python -m app.seed  [--reset]"""
import argparse

from sqlmodel import Session

from app.config import DB_PATH
from app.database import create_db_and_tables, engine
from app.schemas import BookCreate
from app import crud


SAMPLE_BOOKS = [
    BookCreate(
        title="The Hobbit",
        release_date="1937-09-21",
        isbn="9780261102217",
        pages=310,
        description="A fantasy adventure novel.",
        authors=["J.R.R. Tolkien"],
        language_code="en",
        language_name="English",
        publisher_name="George Allen & Unwin",
    ),
    BookCreate(
        title="Dune",
        release_date="1965-08-01",
        isbn="9780441172719",
        pages=412,
        description="A science fiction novel about a desert planet.",
        authors=["Frank Herbert"],
        language_code="en",
        language_name="English",
        publisher_name="Chilton Books",
    ),
    BookCreate(
        title="Norwegian Wood",
        release_date="1987-09-04",
        isbn="9780375704024",
        pages=296,
        description="A nostalgic story of loss and sexuality.",
        authors=["Haruki Murakami"],
        language_code="ja",
        language_name="Japanese",
        publisher_name="Kodansha",
    ),
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
        for data in SAMPLE_BOOKS:
            book = crud.create_book(session, data)
            print(f"inserted #{book.id}: {book.title}")


if __name__ == "__main__":
    main()