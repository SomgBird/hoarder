from typing import Literal
from uuid import UUID, uuid4

from pydantic import Field

from .base import NonBlank, _Read, _Strict


class TextBlockCreate(_Strict):
    kind: Literal["text"]
    text: str


class ArticleCreate(_Strict):
    request_id: UUID = Field(default_factory=uuid4)
    title: NonBlank
    blocks: list[TextBlockCreate] = Field(min_length=1, max_length=1)


class TextBlockRead(_Read):
    id: int
    kind: Literal["text"]
    text: str


class ArticleRead(_Read):
    id: int
    title: str
    blocks: list[TextBlockRead]
