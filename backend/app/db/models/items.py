"""Core collection items and their translated titles."""
from datetime import date, datetime, timezone
from typing import List, Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from app.db.base import ItemBase

from .links import ItemFranchiseLink, ItemGenreLink, ItemLanguageLink, ItemTagLink

if TYPE_CHECKING:
    from .barcodes import Barcode
    from .credits import AuthorRoleItemLink, CompanyRoleItemLink
    from .ownership import OwnedCopy
    from .reference import Format, Franchise, Genre, ItemTag, ItemType, Language


class Item(ItemBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    # Older collections have no recorded creation date; keep that unknown.
    date_added: date | None = Field(default_factory=lambda: datetime.now(timezone.utc).date())

    item_type_id: int | None = Field(
        default=None, foreign_key="item_type.id", nullable=False, index=True
    )
    item_type: Optional["ItemType"] = Relationship(back_populates="items")

    format_id: int | None = Field(default=None, foreign_key="format.id")
    format: Optional["Format"] = Relationship()

    tags: list["ItemTag"] = Relationship(back_populates="items", link_model=ItemTagLink)

    selected_language_id: int | None = Field(default=None, foreign_key="language.id")
    selected_language: Optional["Language"] = Relationship(back_populates="selected_by_items")
    language_links: List[ItemLanguageLink] = Relationship(
        back_populates="item",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    languages: List["Language"] = Relationship(
        link_model=ItemLanguageLink,
        sa_relationship_kwargs={"viewonly": True},
    )
    barcodes: List["Barcode"] = Relationship(
        back_populates="item",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    owned_copies: List["OwnedCopy"] = Relationship(
        back_populates="item",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )

    franchises: List["Franchise"] = Relationship(back_populates="items", link_model=ItemFranchiseLink)
    genres: List["Genre"] = Relationship(back_populates="items", link_model=ItemGenreLink)
    titles: List["Title"] = Relationship(
        back_populates="item",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    author_credits: list["AuthorRoleItemLink"] = Relationship(
        back_populates="item",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    company_credits: list["CompanyRoleItemLink"] = Relationship(
        back_populates="item",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class Title(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    title_text: str
    short_text: str | None = None

    language_id: int | None = Field(default=None, foreign_key="language.id")
    item_id: int | None = Field(default=None, foreign_key="item.id", index=True)

    language: Optional["Language"] = Relationship(back_populates="titles")
    item: Item | None = Relationship(back_populates="titles")
