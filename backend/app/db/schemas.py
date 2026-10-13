from datetime import date
from typing import Annotated, Generic, List, Literal, Optional, TypeVar

from pydantic import BaseModel
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

    details: ItemDetails


class TitleRead(SQLModel):
    id: int

    title_text: str
    short_text: str | None = None
    language: Optional["LanguageRead"]


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
    icon_image_path: str




# ---------- Pagination envelope ----------
T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: List[T]
    total: int
    offset: int
    limit: int