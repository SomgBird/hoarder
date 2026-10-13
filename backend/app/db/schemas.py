from datetime import date
from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel
from sqlmodel import SQLModel

from app.db.base import ItemBase


class ItemRead(ItemBase):
    id: int 

    titles: Optional[List["TitleRead"]]
    languages: Optional[List["LanguageRead"]]


class ItemCreate(ItemBase):
    titles: List["TitleCreate"] = []
    language_codes: List[str] = []
    selected_language_code: str = None
    item_type_name: str = ""


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