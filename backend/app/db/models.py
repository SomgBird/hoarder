from datetime import date
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel

from backend.app.db.base import ItemBase


# ─────────────────────────────────────────────────────────────
# LINK TABLES
# ─────────────────────────────────────────────────────────────
class ItemLanguageLink(SQLModel, table=True):
    item_id: int = Field(foreign_key="item.id", primary_key=True)
    language_id: int = Field(foreign_key="language.id", primary_key=True)

    ui: bool | None = None
    text: bool | None = None
    voice: bool | None = None

    item: "Item" = Relationship(back_populates="language_links")
    language: "Language" = Relationship(back_populates="item_links")


class ItemFranchiseLink(SQLModel, table=True):
    item_id: int = Field(foreign_key="item.id", primary_key=True)
    franchise_id: int = Field(foreign_key="franchise.id", primary_key=True)


class ItemGenreLink(SQLModel, table=True):
    item_id: int = Field(foreign_key="item.id", primary_key=True)
    genre_id: int = Field(foreign_key="genre.id", primary_key=True)


class ItemTypeFormatLink(SQLModel, table=True):
    item_type_id: int = Field(foreign_key="item_type.id", primary_key=True)
    format_id: int = Field(foreign_key="format.id", primary_key=True)


class ItemTypeGenreLink(SQLModel, table=True):
    item_type_id: int = Field(foreign_key="item_type.id", primary_key=True)
    genre_id: int = Field(foreign_key="genre.id", primary_key=True)


# ─────────────────────────────────────────────────────────────
# Item related tables
# ─────────────────────────────────────────────────────────────

class Item(ItemBase, table=True):
    id: int | None = Field(default=None, primary_key=True)

    item_type_id: int | None = Field(default=None, foreign_key="item_type.id")
    selected_language_id : int | None = Field(default=None, foreign_key="language.id")

    item_type: Optional["ItemType"] = Relationship(back_populates="items")
    selected_language: Optional["Language"] = Relationship(back_populates="items")

    language_links: list["ItemLanguageLink"] = Relationship(back_populates="item")
    franchises: list["Franchise"] = Relationship(back_populates="items", link_model=ItemFranchiseLink)
    genres: list["Genre"] = Relationship(back_populates="items", link_model=ItemGenreLink)
    titles: list["Title"] = Relationship(back_populates="item")


class ItemType(SQLModel, table=True):
    __tablename__ = "item_type"  # default would be "itemtype", which the FKs don't match

    id: int | None = Field(default=None, primary_key=True)

    name: str
    description: str | None = None

    items: list["Item"] = Relationship(back_populates="item_type")
    formats: list["Format"] = Relationship(back_populates="item_types", link_model=ItemTypeFormatLink)
    genres: list["Genre"] = Relationship(back_populates="item_types", link_model=ItemTypeGenreLink)


class Format(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    short_name: str | None = None
    description: str | None = None

    item_types: list["ItemType"] = Relationship(back_populates="formats", link_model=ItemTypeFormatLink)


class Title(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    title_text: str
    short_text: str | None = None

    language_id: int | None = Field(default=None, foreign_key="language.id")
    item_id: int | None = Field(default=None, foreign_key="item.id")

    language: Optional["Language"] = Relationship(back_populates="titles")
    item: Item | None = Relationship(back_populates="titles")


class Language(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    code: str  # en, ru, etc
    name: str  # English, Russian, etc

    item_links: list["ItemLanguageLink"] = Relationship(back_populates="language")
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
    id: int | None = Field(default=None, primary_key=True)

    name: str
    description: str | None = None

    parent_genre_id: int | None = Field(default=None, foreign_key="genre.id")

    parent: Optional["Genre"] = Relationship(
        back_populates="children",
        sa_relationship_kwargs={"remote_side": "Genre.id"},
    )
    children: list["Genre"] = Relationship(back_populates="parent")
    items: list["Item"] = Relationship(back_populates="genres", link_model=ItemGenreLink)
    item_types: list["ItemType"] = Relationship(back_populates="genres", link_model=ItemTypeGenreLink)


# ─────────────────────────────────────────────────────────────
# Authors and companies
# ─────────────────────────────────────────────────────────────




# ─────────────────────────────────────────────────────────────
# Item subtypes
# ─────────────────────────────────────────────────────────────
class Film(SQLModel, table=True):
    id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)
    length: int | None = None


class BoardGame(SQLModel, table=True):
    id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)


class VideoGame(SQLModel, table=True):
    id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)

    game_platform_id: int | None = Field(default=None, foreign_key="game_platform.id")

    game_platform: Optional["GamePlatform"] = Relationship(back_populates="video_games")


class Book(SQLModel, table=True):
    id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)
    number_of_pages: int | None = Field(default=None, ge=1)


class JournalIssue(SQLModel, table=True):
    id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)
    number_of_pages: int | None = Field(default=None, ge=1)
    issue: str | None = None

    journal_id: int | None = Field(default=None, foreign_key="journal.id")

    journal: Optional["Journal"] = Relationship(back_populates="issues")


class Figurine(SQLModel, table=True):
    id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)

    scale_id: int | None = Field(default=None, foreign_key="scale.id")

    scale: Optional["Scale"] = Relationship(back_populates="figurines")


class Miniature(SQLModel, table=True):
    id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)
    height: float | None = Field(default=None, ge=0)
    width: float | None = Field(default=None, ge=0)

    scale_id: int | None = Field(default=None, foreign_key="scale.id")

    scale: Optional["Scale"] = Relationship(back_populates="miniatures")


class LegoSet(SQLModel, table=True):
    id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)
    number_of_pieces: int | None = Field(default=None, ge=1)



# ─────────────────────────────────────────────────────────────
# Item subtypes related tables
# ─────────────────────────────────────────────────────────────
class Scale(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    scale: str

    figurines: list["Figurine"] = Relationship(back_populates="scale")
    miniatures: list["Miniature"] = Relationship(back_populates="scale")


class Journal(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    description: str | None = None

    issues: list["JournalIssue"] = Relationship(back_populates="journal")


class GamePlatform(SQLModel, table=True):
    __tablename__ = "game_platform"  # default would be "gameplatform"

    id: int | None = Field(default=None, primary_key=True)
    name: str
    short_name: str | None = None
    description: str | None = None

    video_games: list["VideoGame"] = Relationship(back_populates="game_platform")



# ─────────────────────────────────────────────────────────────
# Pages tables
# ─────────────────────────────────────────────────────────────