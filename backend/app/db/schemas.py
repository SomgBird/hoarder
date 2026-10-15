from datetime import date
from typing import Annotated, Generic, List, Literal, Optional, TypeVar

from pydantic import BaseModel, model_validator
from sqlmodel import SQLModel
from pydantic import Field as PField 

from app.db.base import ItemBase


# item subtypes details

class BookDetails(SQLModel):
    page_count: int | None = None
    type_name: Literal["book"]

class GameDetails(SQLModel):
    type_name: Literal["game"]

ItemDetails = Annotated[BookDetails | GameDetails, PField(discriminator="type_name")]


class ItemRead(ItemBase):
    id: int 

    titles: Optional[List["TitleRead"]]
    languages: Optional[List["LanguageRead"]]


class ItemCreate(ItemBase):
    titles: List["TitleCreate"] = []
    language_codes: List[str] = []
    selected_language_code: str = None
    credits: list["CreditCreate"] = []

    details: ItemDetails


class AuthorRead(SQLModel):
    id: int
    name: str

class AuthorRoleRead(SQLModel):
    id: int
    name: str

class CreditRead(SQLModel):
    author: AuthorRead
    role: AuthorRoleRead
    involvement_date: date | None = None
    comments: str | None = None


class TitleRead(SQLModel):
    id: int

    title_text: str
    short_text: str | None = None
    language: Optional["LanguageRead"]
    credits: list[CreditRead] = []


class TitleCreate(SQLModel):
    title_text: str
    short_text: str | None = None
    language_code: str


class LanguageRead(SQLModel):
    id: int
    code: str
    name: str


class ItemListEntryRead(SQLModel):
    id: int
    title: str
    release_date: date 
    is_owned: bool
    icon_image_path: str | None = None


class CreditCreate(SQLModel):
    author_id: int | None = None
    author_name: str | None = None
    role_name: str
    involvement_date: date | None = None
    comments: str | None = None

    @model_validator(mode="after")
    def _exactly_one_author_ref(self):
        if (self.author_id is None) == (self.author_name is None):
            raise ValueError("provide exactly one of author_id or author_name")
        return self




# ---------- Pagination envelope ----------
T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: List[T]
    total: int
    offset: int
    limit: int