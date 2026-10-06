from datetime import date

from sqlmodel import Field, Relationship, SQLModel


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


# ─────────────────────────────────────────────────────────────
# Item related tables
# ─────────────────────────────────────────────────────────────

class Item(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    release_date: date | None = None
    cover_image_path: str | None = None
    icon_image_path: str | None = None
    is_owned: bool | None = None

    item_type_id: int | None = Field(default=None, foreign_key="item_type.id")

    item_type: "ItemType" | None = Relationship(back_populates="items")
    language_links: list["ItemLanguageLink"] = Relationship(back_populates="item", link_model=ItemLanguageLink)
    franchises: list["Franchise"] = Relationship(back_populates="items", link_model=ItemFranchiseLink)
    genres: list["Genre"] = Relationship(back_populates="items", link_model=ItemGenreLink)
    titles: list["Title"] = Relationship(back_populates="item")


class ItemType(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    name: str
    description: str | None = None

    items: list["Item"] = Relationship(back_populates="item_type")


class Title(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    title_text: str
    short_text: str | None = None

    language_id: int | None = Field(default=None, foreign_key="language.id")
    item_id: int | None = Field(default=None, foreign_key="item.id")

    language: "Language" | None = Relationship(back_populates="titles")
    item: "Item" | None = Relationship(back_populates="titles")


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

    parent: "Franchise" | None = Relationship(
        back_populates="children", 
        sa_relationship_kwargs={"remote_side": "Franchise.id"})
    children: list["Franchise"] = Relationship(back_populates="parent")
    items: list["Item"] = Relationship(back_populates="franchises", link_model=ItemFranchiseLink)


class Genre(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    
    name: str
    description: str | None = None

    parent_genre_id: int | None = Field(default=None, foreign_key="genre.id")

    parent: "Genre" | None = Relationship(
        back_populates="children",
        sa_relationship_kwargs={"remote_side": "Genre.id"},
    )
    children: list["Genre"] = Relationship(back_populates="parent")
    items: list["Item"] = Relationship(back_populates="genres", link_model=ItemGenreLink)


