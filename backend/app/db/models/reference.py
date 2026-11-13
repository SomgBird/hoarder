"""Reference data shared by collection items and their subtype details."""
from typing import List, Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from .links import (
    ItemFranchiseLink,
    ItemGenreLink,
    ItemLanguageLink,
    ItemTagLink,
    ItemTypeFormatLink,
    ItemTypeGenreLink,
)

if TYPE_CHECKING:
    from .details import Figurine, JournalIssue, Miniature, VideoGame
    from .items import Item, Title


class ItemType(SQLModel, table=True):
    __tablename__ = "item_type"  # default would be "itemtype", which the FKs don't match

    id: int | None = Field(default=None, primary_key=True)

    name: str = Field(unique=True, index=True)
    description: str | None = None

    items: list["Item"] = Relationship(back_populates="item_type")
    formats: list["Format"] = Relationship(back_populates="item_types", link_model=ItemTypeFormatLink)
    genres: list["Genre"] = Relationship(back_populates="item_types", link_model=ItemTypeGenreLink)


class Format(SQLModel, table=True):
    """Format of an item: Hardcover, Paperback, DVD, Blu-ray, Digital, etc.
    Which item types it applies to is stored in ItemTypeFormatLink."""
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    short_name: str | None = None
    description: str | None = None

    item_types: list["ItemType"] = Relationship(back_populates="formats", link_model=ItemTypeFormatLink)


class Language(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    code: str = Field(unique=True, index=True)  # en, ru, etc
    name: str  # English, Russian, etc

    selected_by_items: list["Item"] = Relationship(back_populates="selected_language")
    item_links: list["ItemLanguageLink"] = Relationship(back_populates="language")
    items: List["Item"] = Relationship(
        link_model=ItemLanguageLink,
        sa_relationship_kwargs={"viewonly": True},
    )
    titles: list["Title"] = Relationship(back_populates="language")


class Franchise(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    name: str
    description: str | None = None

    parent_franchise_id: int | None = Field(default=None, foreign_key="franchise.id")

    parent: Optional["Franchise"] = Relationship(
        back_populates="children",
        sa_relationship_kwargs={"remote_side": "Franchise.id"},  # class.attr, not table.column
    )
    children: list["Franchise"] = Relationship(back_populates="parent")
    items: list["Item"] = Relationship(back_populates="franchises", link_model=ItemFranchiseLink)


class Genre(SQLModel, table=True):
    """One genre table for every item type; applicability is stored in ItemTypeGenreLink."""
    id: int | None = Field(default=None, primary_key=True)

    name: str = Field(unique=True, index=True)
    description: str | None = None

    parent_genre_id: int | None = Field(default=None, foreign_key="genre.id")

    parent: Optional["Genre"] = Relationship(
        back_populates="children",
        sa_relationship_kwargs={"remote_side": "Genre.id"},
    )
    children: list["Genre"] = Relationship(back_populates="parent")
    items: list["Item"] = Relationship(back_populates="genres", link_model=ItemGenreLink)
    item_types: list["ItemType"] = Relationship(back_populates="genres", link_model=ItemTypeGenreLink)


class ItemTag(SQLModel, table=True):
    __tablename__ = "item_tag"  # ItemTagLink's FK points at "item_tag.id"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    description: str | None = None

    items: list["Item"] = Relationship(back_populates="tags", link_model=ItemTagLink)


class Scale(SQLModel, table=True):
    """Scale for figurines and miniatures, e.g. 1:6, 1:12, 28 mm."""
    id: int | None = Field(default=None, primary_key=True)
    scale: str = Field(unique=True)

    figurines: list["Figurine"] = Relationship(back_populates="scale")
    miniatures: list["Miniature"] = Relationship(back_populates="scale")


class Journal(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    description: str | None = None

    journal_issues: list["JournalIssue"] = Relationship(back_populates="journal")


class GamePlatform(SQLModel, table=True):
    """Platform for video games, e.g. PC, PlayStation 3, Nintendo Switch."""
    __tablename__ = "game_platform"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    short_name: str | None = None
    description: str | None = None

    video_games: list["VideoGame"] = Relationship(back_populates="game_platform")
