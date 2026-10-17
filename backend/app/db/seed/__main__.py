"""CLI. Run from backend/:

    python -m app.db.seed                    # builtin reference data only (same as app startup)
    python -m app.db.seed --examples         # builtin + example items
    python -m app.db.seed --reset --examples # wipe the DB file first
"""
import argparse

from sqlmodel import Session

from app.config import DB_PATH
from app.database import create_db_and_tables, engine
from app.db.seed import seed_builtin, seed_examples


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="delete the DB file first")
    parser.add_argument("--examples", action="store_true", help="also insert example items")
    args = parser.parse_args()

    if args.reset and DB_PATH.exists():
        engine.dispose()
        DB_PATH.unlink()
        print(f"removed {DB_PATH}")

    create_db_and_tables()
    with Session(engine) as session:
        seed_builtin(session)
        print("builtin data ready")
        if args.examples:
            seed_examples(session)


if __name__ == "__main__":
    main()