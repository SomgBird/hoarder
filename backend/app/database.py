# backend/app/database.py
import sqlite3

from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlmodel import SQLModel, Session, create_engine

from app.config import DATABASE_URL
from app.names import name_key


@event.listens_for(Engine, "connect")
def configure_sqlite(connection, _record) -> None:
    if isinstance(connection, sqlite3.Connection):
        # Also applies to test engines and every new pooled connection.
        connection.execute("PRAGMA foreign_keys=ON")
        connection.create_function("hoarder_name_key", 1, name_key, deterministic=True)

engine = create_engine(
    DATABASE_URL,
    echo=True,
    connect_args={"check_same_thread": False},
)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
