from datetime import date
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel

from app.db.base import ItemBase


# ─────────────────────────────────────────────────────────────
# LINK TABLES
# Defined first: link_model must be a class, not a string.
# ─────────────────────────────────────────────────────────────
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


# "Scope" tables: which formats / genres are applicable to which item type.
class ItemTypeFormatLink(SQLModel, table=True):
    __tablename__ = "item_type_format_link"

    item_type_id: int = Field(foreign_key="item_type.id", primary_key=True)
    format_id: int = Field(foreign_key="format.id", primary_key=True)


class ItemTypeGenreLink(SQLModel, table=True):
    __tablename__ = "item_type_genre_link"

    item_type_id: int = Field(foreign_key="item_type.id", primary_key=True)
    genre_id: int = Field(foreign_key="genre.id", primary_key=True)


# ─────────────────────────────────────────────────────────────
# Item related tables
# ─────────────────────────────────────────────────────────────
class Item(ItemBase, table=True):
    id: int | None = Field(default=None, primary_key=True)

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


class Title(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    title_text: str
    short_text: str | None = None

    language_id: int | None = Field(default=None, foreign_key="language.id")
    item_id: int | None = Field(default=None, foreign_key="item.id", index=True)

    language: Optional["Language"] = Relationship(back_populates="titles")
    item: Item | None = Relationship(back_populates="titles")


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


# ─────────────────────────────────────────────────────────────
# Authors and companies
# ─────────────────────────────────────────────────────────────
class Author(SQLModel, table=True):
    __tablename__ = "author"
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    bio: str | None = None
    birth_date: date | None = None
    death_date: date | None = None

    credits: list["AuthorRoleItemLink"] = Relationship(back_populates="author")


class AuthorRole(SQLModel, table=True):
    __tablename__ = "author_role"
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    description: str | None = None

    credits: list["AuthorRoleItemLink"] = Relationship(back_populates="role")


class AuthorRoleItemLink(SQLModel, table=True):
    __tablename__ = "author_role_item_link"
    author_id: int = Field(foreign_key="author.id", primary_key=True)
    item_id: int = Field(foreign_key="item.id", primary_key=True, index=True)
    role_id: int = Field(foreign_key="author_role.id", primary_key=True, index=True)
    involvement_date: date | None = None
    comments: str | None = None

    author: Author = Relationship(back_populates="credits")
    item: Item = Relationship(back_populates="author_credits")
    role: AuthorRole = Relationship(back_populates="credits")


class Company(SQLModel, table=True):
    __tablename__ = "company"
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: str | None = None
    country: str | None = None
    founded_date: date | None = None
    dissolved_date: date | None = None

    credits: list["CompanyRoleItemLink"] = Relationship(back_populates="company")


class CompanyRole(SQLModel, table=True):
    __tablename__ = "company_role"
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    description: str | None = None

    credits: list["CompanyRoleItemLink"] = Relationship(back_populates="role")


class CompanyRoleItemLink(SQLModel, table=True):
    __tablename__ = "company_role_item_link"
    company_id: int = Field(foreign_key="company.id", primary_key=True)
    item_id: int = Field(foreign_key="item.id", primary_key=True, index=True)
    role_id: int = Field(foreign_key="company_role.id", primary_key=True, index=True)
    involvement_date: date | None = None
    comments: str | None = None

    company: Company = Relationship(back_populates="credits")
    item: "Item" = Relationship(back_populates="company_credits")
    role: CompanyRole = Relationship(back_populates="credits")


# ─────────────────────────────────────────────────────────────
# Item subtypes (1:1 with Item, primary key = item id)
# ─────────────────────────────────────────────────────────────
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


# ─────────────────────────────────────────────────────────────
# Item subtypes related tables
# ─────────────────────────────────────────────────────────────
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


# ─────────────────────────────────────────────────────────────
# Barcodes
# ─────────────────────────────────────────────────────────────
class BarcodeType(SQLModel, table=True):
    """Type of barcode printed on the item, e.g. ISBN-13, UPC-A."""
    __tablename__ = "barcode_type"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    description: str | None = None

    barcodes: list["Barcode"] = Relationship(back_populates="barcode_type")


class Barcode(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    code: str = Field(index=True)
    barcode_type_id: int | None = Field(default=None, foreign_key="barcode_type.id")
    item_id: int | None = Field(default=None, foreign_key="item.id", index=True)

    barcode_type: Optional[BarcodeType] = Relationship(back_populates="barcodes")
    item: Optional[Item] = Relationship(back_populates="barcodes")


# ─────────────────────────────────────────────────────────────
# Owned copy and condition register
# ─────────────────────────────────────────────────────────────
class ConditionType(SQLModel, table=True):
    """Condition grade for an owned copy: Sealed, Like New, Good, Poor, etc."""
    __tablename__ = "condition_type"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    description: str | None = None


class OwnedCopy(SQLModel, table=True):
    __tablename__ = "owned_copy"

    id: int | None = Field(default=None, primary_key=True)
    item_id: int | None = Field(default=None, foreign_key="item.id", index=True)
    notes: str | None = None

    item: Optional[Item] = Relationship(back_populates="owned_copies")
    condition: Optional["Condition"] = Relationship(
        back_populates="owned_copy",
        sa_relationship_kwargs={"uselist": False, "cascade": "all, delete-orphan"},
    )
    photos: list["CopyPhoto"] = Relationship(
        back_populates="owned_copy",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class Condition(SQLModel, table=True):
    """Condition of one owned copy: a grade (type) plus optional notes."""
    id: int | None = Field(default=None, primary_key=True, foreign_key="owned_copy.id")
    condition_type_id: int | None = Field(default=None, foreign_key="condition_type.id")
    notes: str | None = None

    owned_copy: Optional[OwnedCopy] = Relationship(back_populates="condition")
    condition_type: Optional[ConditionType] = Relationship()


class CopyPhoto(SQLModel, table=True):
    __tablename__ = "copy_photo"

    id: int | None = Field(default=None, primary_key=True)
    owned_copy_id: int | None = Field(default=None, foreign_key="owned_copy.id", index=True)
    file_path: str
    name: str | None = None
    description: str | None = None

    owned_copy: Optional[OwnedCopy] = Relationship(back_populates="photos")

# ─────────────────────────────────────────────────────────────
# Pages tables
# ─────────────────────────────────────────────────────────────