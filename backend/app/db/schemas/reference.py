"""Reference creation payloads and reference data responses."""
from typing import List

from .base import NonBlank, _Read, _Strict


class ReferenceCreate(_Strict):
    name: NonBlank
    item_type: str | None = None


class LanguageRead(_Read):
    id: int
    code: str
    name: str


class FormatRead(_Read):
    id: int
    name: str
    short_name: str | None = None
    description: str | None = None


class GenreRead(_Read):
    id: int
    name: str
    description: str | None = None
    parent_genre_id: int | None = None


class ItemTypeRead(_Read):
    id: int
    name: str
    description: str | None = None


class ItemTypeScopeRead(ItemTypeRead):
    """Item type with the formats and genres that apply to it (for form dropdowns)."""
    formats: List[FormatRead]
    genres: List[GenreRead]


class FranchiseRead(_Read):
    id: int
    name: str
    description: str | None = None
    parent_franchise_id: int | None = None


class TagRead(_Read):
    id: int
    name: str
    description: str | None = None


class ScaleRead(_Read):
    id: int
    scale: str


class JournalRead(_Read):
    id: int
    name: str
    description: str | None = None


class GamePlatformRead(_Read):
    id: int
    name: str
    short_name: str | None = None
    description: str | None = None


class BarcodeTypeRead(_Read):
    id: int
    name: str
    description: str | None = None


class ConditionTypeRead(_Read):
    id: int
    name: str
    description: str | None = None


class AuthorRead(_Read):
    id: int
    name: str


class AuthorRoleRead(_Read):
    id: int
    name: str
    description: str | None = None


class CompanyRead(_Read):
    id: int
    name: str


class CompanyRoleRead(_Read):
    id: int
    name: str
    description: str | None = None
