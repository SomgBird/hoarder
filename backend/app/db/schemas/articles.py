from typing import Literal
from uuid import UUID, uuid4

from pydantic import Field, PositiveInt, field_validator
from pydantic.json_schema import SkipJsonSchema

from .base import NonBlank, _Read, _Strict


class TextBlockCreate(_Strict):
    kind: Literal["text"]
    text: str


class ItemLinkCreate(_Strict):
    kind: Literal["item-link"]
    item_id: PositiveInt


class ArticleCreate(_Strict):
    request_id: UUID = Field(default_factory=uuid4)
    title: NonBlank
    blocks: list[TextBlockCreate | ItemLinkCreate] = Field(min_length=1, max_length=2)

    @field_validator("blocks")
    @classmethod
    def validate_order(cls, blocks):
        if blocks[0].kind != "text" or (len(blocks) == 2 and blocks[1].kind != "item-link"):
            raise ValueError("Use one text block followed by an optional item link.")
        return blocks


class ArticleUpdate(_Strict):
    title: NonBlank | SkipJsonSchema[None] = None
    text: str | SkipJsonSchema[None] = None
    item_id: PositiveInt | None = Field(default=None, description="Omit to keep the link, null to remove it.")

    @field_validator("title", "text")
    @classmethod
    def reject_null(cls, value):
        if value is None:
            raise ValueError("Omit this field to keep its saved value.")
        return value


class TextBlockRead(_Read):
    id: int
    kind: Literal["text"]
    text: str


class ItemLinkRead(_Read):
    id: int
    kind: Literal["item-link"]
    item_id: int
    item_title: str | None


class ArticleRead(_Read):
    id: int
    title: str
    blocks: list[TextBlockRead | ItemLinkRead]
