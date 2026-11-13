"""Item subtype tables, each sharing its primary key with an item."""
from typing import Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from .items import Item

if TYPE_CHECKING:
    from .reference import GamePlatform, Journal, Scale


class Film(SQLModel, table=True):
    id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)
    length: int | None = Field(default=None, ge=1)  # minutes

    item: Item = Relationship()


class BoardGame(SQLModel, table=True):
    __tablename__ = "board_game"

    id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)

    item: Item = Relationship()


class VideoGame(SQLModel, table=True):
    __tablename__ = "video_game"

    id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)

    item: Item = Relationship()
    game_platform_id: int | None = Field(default=None, foreign_key="game_platform.id")
    game_platform: Optional["GamePlatform"] = Relationship(back_populates="video_games")


class Book(SQLModel, table=True):
    id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)
    page_count: int | None = Field(default=None, ge=1)

    item: Item = Relationship()


class JournalIssue(SQLModel, table=True):
    __tablename__ = "journal_issue"

    id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)
    page_count: int | None = Field(default=None, ge=1)
    issue: str | None = None

    item: Item = Relationship()

    journal_id: int | None = Field(default=None, foreign_key="journal.id")
    journal: Optional["Journal"] = Relationship(back_populates="journal_issues")


class Figurine(SQLModel, table=True):
    id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)

    scale_id: int | None = Field(default=None, foreign_key="scale.id")
    scale: Optional["Scale"] = Relationship(back_populates="figurines")

    item: Item = Relationship()


class Miniature(SQLModel, table=True):
    id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)
    height: float | None = Field(default=None, ge=0)
    width: float | None = Field(default=None, ge=0)

    scale_id: int | None = Field(default=None, foreign_key="scale.id")
    scale: Optional["Scale"] = Relationship(back_populates="miniatures")

    item: Item = Relationship()


class LegoSet(SQLModel, table=True):
    __tablename__ = "lego_set"

    id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)
    number_of_pieces: int | None = Field(default=None, ge=1)

    item: Item = Relationship()
