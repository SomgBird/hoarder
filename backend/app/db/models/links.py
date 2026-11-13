"""Association tables for item languages, classifications, and type scopes."""
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .items import Item
    from .reference import Language


class ItemLanguageLink(SQLModel, table=True):
    __tablename__ = "item_language_link"

    item_id: int | None = Field(default=None, foreign_key="item.id", primary_key=True)
    language_id: int | None = Field(default=None, foreign_key="language.id", primary_key=True)

    ui: bool | None = None
    text: bool | None = None
    voice: bool | None = None

    item: "Item" = Relationship(back_populates="language_links")
    language: "Language" = Relationship(back_populates="item_links")


class ItemFranchiseLink(SQLModel, table=True):
    __tablename__ = "item_franchise_link"

    item_id: int = Field(foreign_key="item.id", primary_key=True)
    franchise_id: int = Field(foreign_key="franchise.id", primary_key=True)


class ItemGenreLink(SQLModel, table=True):
    __tablename__ = "item_genre_link"

    item_id: int = Field(foreign_key="item.id", primary_key=True)
    genre_id: int = Field(foreign_key="genre.id", primary_key=True)


class ItemTagLink(SQLModel, table=True):
    __tablename__ = "item_tag_link"

    item_id: int = Field(foreign_key="item.id", primary_key=True)
    tag_id: int = Field(foreign_key="item_tag.id", primary_key=True)


class ItemTypeFormatLink(SQLModel, table=True):
    __tablename__ = "item_type_format_link"

    item_type_id: int = Field(foreign_key="item_type.id", primary_key=True)
    format_id: int = Field(foreign_key="format.id", primary_key=True)


class ItemTypeGenreLink(SQLModel, table=True):
    __tablename__ = "item_type_genre_link"

    item_type_id: int = Field(foreign_key="item_type.id", primary_key=True)
    genre_id: int = Field(foreign_key="genre.id", primary_key=True)
