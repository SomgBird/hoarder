from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field, Column, JSON

class ItemCategory(str, Enum):
    game = "game"
    comic = "comic"

class Item(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    category: ItemCategory
    status: str = "owned"
    condition: str = ""
    cover_url: str = ""
    notes: str = ""
    attributes: dict = Field(sa_column=Column(JSON), default={})