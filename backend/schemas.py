from pydantic import BaseModel, Field
from models import ItemCategory 


class ItemCreate(BaseModel):
    title: str
    category: ItemCategory
    status: str = "owned"
    condition: str = ""
    cover_url: str = ""
    notes: str = ""
    attributes: dict = Field(default_factory=dict)