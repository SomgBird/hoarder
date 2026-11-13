"""Discriminated input and response schemas for item subtype details."""
from typing import Annotated, Literal, Optional, Union

from pydantic import Field as PField

from .base import _Read, _Strict
from .reference import GamePlatformRead, JournalRead, ScaleRead


class BookDetailsCreate(_Strict):
    type_name: Literal["book"]
    page_count: int | None = PField(default=None, ge=1)


class GameDetailsCreate(_Strict):
    type_name: Literal["game"]
    game_platform_id: int | None = None


class FilmDetailsCreate(_Strict):
    type_name: Literal["film"]
    length: int | None = PField(default=None, ge=1, description="minutes")


class BoardGameDetailsCreate(_Strict):
    type_name: Literal["board_game"]


class JournalIssueDetailsCreate(_Strict):
    type_name: Literal["journal_issue"]
    journal_id: int | None = None
    issue: str | None = None
    page_count: int | None = PField(default=None, ge=1)


class FigurineDetailsCreate(_Strict):
    type_name: Literal["figurine"]
    scale_id: int | None = None


class MiniatureDetailsCreate(_Strict):
    type_name: Literal["miniature"]
    height: float | None = PField(default=None, ge=0)
    width: float | None = PField(default=None, ge=0)
    scale_id: int | None = None


class LegoSetDetailsCreate(_Strict):
    type_name: Literal["lego_set"]
    number_of_pieces: int | None = PField(default=None, ge=1)


ItemDetailsCreate = Annotated[
    Union[
        BookDetailsCreate,
        GameDetailsCreate,
        FilmDetailsCreate,
        BoardGameDetailsCreate,
        JournalIssueDetailsCreate,
        FigurineDetailsCreate,
        MiniatureDetailsCreate,
        LegoSetDetailsCreate,
    ],
    PField(discriminator="type_name"),
]


class BookDetailsRead(_Read):
    type_name: Literal["book"] = "book"
    page_count: int | None = None


class GameDetailsRead(_Read):
    type_name: Literal["game"] = "game"
    game_platform: Optional[GamePlatformRead] = None


class FilmDetailsRead(_Read):
    type_name: Literal["film"] = "film"
    length: int | None = None


class BoardGameDetailsRead(_Read):
    type_name: Literal["board_game"] = "board_game"


class JournalIssueDetailsRead(_Read):
    type_name: Literal["journal_issue"] = "journal_issue"
    journal: Optional[JournalRead] = None
    issue: str | None = None
    page_count: int | None = None


class FigurineDetailsRead(_Read):
    type_name: Literal["figurine"] = "figurine"
    scale: Optional[ScaleRead] = None


class MiniatureDetailsRead(_Read):
    type_name: Literal["miniature"] = "miniature"
    height: float | None = None
    width: float | None = None
    scale: Optional[ScaleRead] = None


class LegoSetDetailsRead(_Read):
    type_name: Literal["lego_set"] = "lego_set"
    number_of_pieces: int | None = None


ItemDetailsRead = Annotated[
    Union[
        BookDetailsRead,
        GameDetailsRead,
        FilmDetailsRead,
        BoardGameDetailsRead,
        JournalIssueDetailsRead,
        FigurineDetailsRead,
        MiniatureDetailsRead,
        LegoSetDetailsRead,
    ],
    PField(discriminator="type_name"),
]
