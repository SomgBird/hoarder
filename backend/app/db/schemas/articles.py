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


class GalleryEntryWrite(_Strict):
    path: str = Field(description="The path of an existing image returned by GET /media/.")
    caption: str = ""


class GalleryBlockCreate(_Strict):
    kind: Literal["gallery"]
    entries: list[GalleryEntryWrite] = Field(min_length=1)


class ArticleCreate(_Strict):
    request_id: UUID = Field(default_factory=uuid4)
    title: NonBlank
    blocks: list[TextBlockCreate | ItemLinkCreate | GalleryBlockCreate] = Field(min_length=1, max_length=3)

    @field_validator("blocks")
    @classmethod
    def validate_order(cls, blocks):
        kinds = [block.kind for block in blocks]
        if kinds[0] != "text" or kinds[1:] not in ([], ["item-link"], ["gallery"], ["item-link", "gallery"]):
            raise ValueError("Use one text block, then an optional item link, then an optional gallery.")
        return blocks


class ArticleUpdate(_Strict):
    title: NonBlank | SkipJsonSchema[None] = None
    text: str | SkipJsonSchema[None] = None
    item_id: PositiveInt | None = Field(default=None, description="Omit to keep the link, null to remove it.")
    gallery: list[GalleryEntryWrite] = Field(
        default_factory=list, description="Omit to keep the saved gallery, or send an empty list to remove it.",
    )

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


class GalleryEntryRead(_Read):
    path: str
    caption: str


class GalleryBlockRead(_Read):
    id: int
    kind: Literal["gallery"]
    entries: list[GalleryEntryRead]


class ArticleSummary(_Read):
    id: int
    title: str


class ArticleRead(ArticleSummary):
    blocks: list[TextBlockRead | ItemLinkRead | GalleryBlockRead]
