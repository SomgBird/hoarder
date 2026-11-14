"""Subtype registry and subtype reference validation. Add new item types here."""
from dataclasses import dataclass, field

from sqlmodel import SQLModel, Session

from app.db.models import (
    BoardGame,
    Book,
    Figurine,
    Film,
    GamePlatform,
    Journal,
    JournalIssue,
    LegoSet,
    Miniature,
    Scale,
    VideoGame,
)
from app.db.schemas import (
    BoardGameDetailsRead,
    BookDetailsRead,
    FigurineDetailsRead,
    FilmDetailsRead,
    GameDetailsRead,
    ItemDetailsCreate,
    JournalIssueDetailsRead,
    LegoSetDetailsRead,
    MiniatureDetailsRead,
)

from .lookups import _require


@dataclass(frozen=True)
class _Subtype:
    model: type[SQLModel]
    read_schema: type[SQLModel]
    # detail field -> model it must reference (validated -> 422 instead of an FK error)
    refs: dict[str, type[SQLModel]] = field(default_factory=dict)


_SUBTYPES: dict[str, _Subtype] = {
    "book": _Subtype(Book, BookDetailsRead),
    "game": _Subtype(VideoGame, GameDetailsRead, {"game_platform_id": GamePlatform}),
    "film": _Subtype(Film, FilmDetailsRead),
    "board_game": _Subtype(BoardGame, BoardGameDetailsRead),
    "journal_issue": _Subtype(JournalIssue, JournalIssueDetailsRead, {"journal_id": Journal}),
    "figurine": _Subtype(Figurine, FigurineDetailsRead, {"scale_id": Scale}),
    "miniature": _Subtype(Miniature, MiniatureDetailsRead, {"scale_id": Scale}),
    "lego_set": _Subtype(LegoSet, LegoSetDetailsRead),
}


def _detail_values(
    session: Session, spec: _Subtype, details: ItemDetailsCreate, *, only_set: bool = False
) -> dict:
    """Column values for the subtype row. only_set=True is for partial updates."""
    values = details.model_dump(exclude={"type_name"}, exclude_unset=only_set)
    for column, ref_model in spec.refs.items():
        if values.get(column) is not None:
            _require(session, ref_model, values[column], column.removesuffix("_id"))
    return values
