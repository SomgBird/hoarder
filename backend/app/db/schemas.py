from datetime import date
from typing import Annotated, Generic, List, Literal, Optional, TypeVar, Union

from pydantic import AliasChoices, BaseModel, ConfigDict, StringConstraints, computed_field, field_validator, model_validator
from pydantic import Field as PField
from pydantic.json_schema import SkipJsonSchema
from sqlmodel import SQLModel

from app.db.base import ItemBase

NonBlank = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


# Input schemas reject unknown fields. Without this, a misspelled or renamed key
# is silently dropped and the data just never arrives.
class _Strict(SQLModel):
    model_config = ConfigDict(extra="forbid")


class _Read(SQLModel):
    # Responses include defaulted fields (including nulls). Publish them as
    # required in OpenAPI so generated clients match the serialized JSON.
    model_config = ConfigDict(json_schema_serialization_defaults_required=True)


# ============================================================
# Reference data (read only)
# ============================================================
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


# ============================================================
# Item subtype details
# Create: references are ids. Read: references are expanded objects.
# ============================================================
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


# ============================================================
# Item parts: titles, languages, credits, barcodes, copies
# ============================================================
class TitleRead(_Read):
    id: int
    title_text: str
    short_text: str | None = None
    language: Optional[LanguageRead] = None


class TitleCreate(_Strict):
    title_text: NonBlank
    short_text: str | None = None
    language_code: str


class ItemLanguageRead(_Read):
    language: LanguageRead
    ui: bool | None = None
    text: bool | None = None
    voice: bool | None = None


class ItemLanguageCreate(_Strict):
    language_code: str
    ui: bool | None = None
    text: bool | None = None
    voice: bool | None = None


class AuthorCreditRead(_Read):
    author: AuthorRead
    role: AuthorRoleRead
    involvement_date: date | None = None
    comments: str | None = None


class AuthorCreditCreate(_Strict):
    # Publish the same exclusive choice enforced by the validator below so
    # generated clients can reject missing or conflicting references too.
    model_config = ConfigDict(json_schema_extra={
        "oneOf": [
            {"required": ["author_id"], "properties": {
                "author_id": {"type": "integer"}, "author_name": {"type": "null"},
            }},
            {"required": ["author_name"], "properties": {
                "author_name": {"type": "string"}, "author_id": {"type": "null"},
            }},
        ],
    })

    # An id selects an existing person; a name explicitly creates a new one.
    author_id: int | None = PField(default=None, ge=1)
    author_name: NonBlank | None = None
    role_name: NonBlank
    involvement_date: date | None = None
    comments: str | None = None

    @model_validator(mode="after")
    def _exactly_one_author_ref(self):
        if (self.author_id is None) == (self.author_name is None):
            raise ValueError("provide exactly one of author_id or author_name")
        return self


class CompanyCreditRead(_Read):
    company: CompanyRead
    role: CompanyRoleRead
    involvement_date: date | None = None
    comments: str | None = None


class CompanyCreditCreate(_Strict):
    model_config = ConfigDict(json_schema_extra={
        "oneOf": [
            {"required": ["company_id"], "properties": {
                "company_id": {"type": "integer"}, "company_name": {"type": "null"},
            }},
            {"required": ["company_name"], "properties": {
                "company_name": {"type": "string"}, "company_id": {"type": "null"},
            }},
        ],
    })

    company_id: int | None = PField(default=None, ge=1)
    company_name: NonBlank | None = None
    role_name: NonBlank
    involvement_date: date | None = None
    comments: str | None = None

    @model_validator(mode="after")
    def _exactly_one_company_ref(self):
        if (self.company_id is None) == (self.company_name is None):
            raise ValueError("provide exactly one of company_id or company_name")
        return self


class BarcodeRead(_Read):
    id: int
    code: str
    barcode_type: Optional[BarcodeTypeRead] = None


class BarcodeCreate(_Strict):
    code: str
    barcode_type_id: int | None = None


class ConditionRead(_Read):
    condition_type: Optional[ConditionTypeRead] = None
    notes: str | None = None


class CopyPhotoRead(_Read):
    id: int
    file_path: str
    name: str | None = None
    description: str | None = None


class OwnedCopyRead(_Read):
    id: int
    notes: str | None = None
    condition: Optional[ConditionRead] = None
    photos: List[CopyPhotoRead]


# ============================================================
# Items
# ============================================================
class ItemRead(ItemBase, _Read):
    id: int
    item_type: ItemTypeRead
    format: Optional[FormatRead] = None
    selected_language: Optional[LanguageRead] = None

    # No defaults on purpose: if the ORM attribute is missing or misnamed this should
    # fail loudly instead of quietly returning an empty list.
    titles: List[TitleRead]
    # ORM attribute is `language_links` (carries the ui/text/voice flags); API name is `languages`.
    languages: List[ItemLanguageRead] = PField(
        validation_alias=AliasChoices("language_links", "languages")
    )
    genres: List[GenreRead]
    franchises: List[FranchiseRead]
    tags: List[TagRead]
    barcodes: List[BarcodeRead]
    owned_copies: List[OwnedCopyRead]
    author_credits: List[AuthorCreditRead]
    company_credits: List[CompanyCreditRead]

    details: ItemDetailsRead | None = None

    @computed_field
    @property
    def display_title(self) -> str:
        ordered = sorted(self.titles, key=lambda title: title.id)
        if self.selected_language is not None:
            for title in ordered:
                if title.language and title.language.id == self.selected_language.id and title.title_text.strip():
                    return title.title_text
        return next((title.title_text for title in ordered if title.title_text.strip()), "Untitled")


class ItemCreate(ItemBase, _Strict):
    format_id: int | None = None
    selected_language_code: str | None = None
    languages: List[ItemLanguageCreate] = []
    titles: List[TitleCreate] = PField(min_length=1)
    genre_ids: List[int] = []
    franchise_ids: List[int] = []
    tags: List[str] = PField(default=[], description="tag names; created if missing")
    barcodes: List[BarcodeCreate] = []
    author_credits: List[AuthorCreditCreate] = []
    company_credits: List[CompanyCreditCreate] = []

    details: ItemDetailsCreate


class ItemUpdate(_Strict):
    """Partial update. Omitted = leave alone; a list = replace the whole collection.
    `details` is partial too, and its type_name must match the item's current type."""

    release_date: date | None = None
    cover_image_path: str | None = None
    icon_image_path: str | None = None
    is_owned: bool | None = None
    description: str | None = None

    format_id: int | None = None
    selected_language_code: str | None = None
    languages: List[ItemLanguageCreate] | None = None
    # Omission keeps existing titles; explicit null is rejected by the validator.
    titles: Annotated[List[TitleCreate], PField(min_length=1)] | SkipJsonSchema[None] = None
    genre_ids: List[int] | None = None
    franchise_ids: List[int] | None = None
    tags: List[str] | None = None
    barcodes: List[BarcodeCreate] | None = None
    author_credits: List[AuthorCreditCreate] | None = None
    company_credits: List[CompanyCreditCreate] | None = None

    details: ItemDetailsCreate | None = None

    @field_validator("titles")
    @classmethod
    def _titles_cannot_be_null(cls, value):
        if value is None:
            raise ValueError("titles cannot be null; omit the field to keep existing titles")
        return value


# ============================================================
# List + pagination
# ============================================================
class ItemListEntryRead(_Read):
    id: int
    title: str
    item_type: str
    release_date: date | None = None
    is_owned: bool
    icon_image_path: str | None = None


T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: List[T]
    total: int
    offset: int
    limit: int
