"""Item list entries, sort options, and paginated responses."""
from datetime import date
from typing import Generic, List, Literal, TypeVar

from pydantic import BaseModel

from .base import _Read


ItemSortField = Literal["title", "release_date", "date_added"]


ItemSortDirection = Literal["asc", "desc"]


class ItemListEntryRead(_Read):
    id: int
    title: str
    item_type: str
    release_date: date | None = None
    date_added: date | None = None
    is_owned: bool
    icon_image_path: str | None = None
    description: str | None = None


T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: List[T]
    total: int
    offset: int
    limit: int
