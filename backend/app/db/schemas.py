from datetime import date
from typing import Annotated, Generic, List, Literal, Optional, TypeVar, Union

from pydantic import AliasChoices, BaseModel, ConfigDict, model_validator
from pydantic import Field as PField
from sqlmodel import SQLModel

from app.db.base import ItemBase


# Input schemas reject unknown fields. Without this, a misspelled or renamed key
# is silently dropped and the data just never arrives.
class _Strict(SQLModel):
    model_config = ConfigDict(extra="forbid")


# ============================================================
# Reference data (read only)
# ============================================================
class LanguageRead(SQLModel):
    id: int
    code: str
    name: str


class FormatRead(SQLModel):
    id: int
    name: str
    short_name: str | None = None
    description: str | None = None


class GenreRead(SQLModel):
    id: int
    name: str
    description: str | None = None
    parent_genre_id: int | None = None


class ItemTypeRead(SQLModel):
    id: int
    name: str
    description: str | None = None


class ItemTypeScopeRead(ItemTypeRead):
    """Item type with the formats and genres that apply to it (for form dropdowns)."""
    formats: List[FormatRead]
    genres: List[GenreRead]


class FranchiseRead(SQLModel):
    id: int
    name: str
    description: str | None = None
    parent_franchise_id: int | None = None


class TagRead(SQLModel):
    id: int
    name: str
    description: str | None = None


class ScaleRead(SQLModel):
    id: int
    scale: str


class JournalRead(SQLModel):
    id: int
    name: str
    description: str | None = None


class GamePlatformRead(SQLModel):
    id: int
    name: str
    short_name: str | None = None
    description: str | None = None


class BarcodeTypeRead(SQLModel):
    id: int
    name: str
    description: str | None = None


class ConditionTypeRead(SQLModel):
    id: int
    name: str
    description: str | None = None


class AuthorRead(SQLModel):
    id: int
    name: str


class AuthorRoleRead(SQLModel):
    id: int
    name: str
    description: str | None = None


class CompanyRead(SQLModel):
    id: int
    name: str


class CompanyRoleRead(SQLModel):
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


class BookDetailsRead(SQLModel):
    type_name: Literal["book"] = "book"
    page_count: int | None = None


class GameDetailsRead(SQLModel):
    type_name: Literal["game"] = "game"
    game_platform: Optional[GamePlatformRead] = None


class FilmDetailsRead(SQLModel):
    type_name: Literal["film"] = "film"
    length: int | None = None


class BoardGameDetailsRead(SQLModel):
    type_name: Literal["board_game"] = "board_game"


class JournalIssueDetailsRead(SQLModel):
    type_name: Literal["journal_issue"] = "journal_issue"
    journal: Optional[JournalRead] = None
    issue: str | None = None
    page_count: int | None = None


class FigurineDetailsRead(SQLModel):
    type_name: Literal["figurine"] = "figurine"
    scale: Optional[ScaleRead] = None


class MiniatureDetailsRead(SQLModel):
    type_name: Literal["miniature"] = "miniature"
    height: float | None = None
    width: float | None = None
    scale: Optional[ScaleRead] = None


class LegoSetDetailsRead(SQLModel):
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
class TitleRead(SQLModel):
    id: int
    title_text: str
    short_text: str | None = None
    language: Optional[LanguageRead] = None


class TitleCreate(_Strict):
    title_text: str
    short_text: str | None = None
    language_code: str


class ItemLanguageRead(SQLModel):
    language: LanguageRead
    ui: bool | None = None
    text: bool | None = None
    voice: bool | None = None


class ItemLanguageCreate(_Strict):
    language_code: str
    ui: bool | None = None
    text: bool | None = None
    voice: bool | None = None


class AuthorCreditRead(SQLModel):
    author: AuthorRead
    role: AuthorRoleRead
    involvement_date: date | None = None
    comments: str | None = None


class AuthorCreditCreate(_Strict):
    author_id: int | None = None
    author_name: str | None = None
    role_name: str
    involvement_date: date | None = None
    comments: str | None = None

    @model_validator(mode="after")
    def _exactly_one_author_ref(self):
        if (self.author_id is None) == (self.author_name is None):
            raise ValueError("provide exactly one of author_id or author_name")
        return self


class CompanyCreditRead(SQLModel):
    company: CompanyRead
    role: CompanyRoleRead
    involvement_date: date | None = None
    comments: str | None = None


class CompanyCreditCreate(_Strict):
    company_id: int | None = None
    company_name: str | None = None
    role_name: str
    involvement_date: date | None = None
    comments: str | None = None

    @model_validator(mode="after")
    def _exactly_one_company_ref(self):
        if (self.company_id is None) == (self.company_name is None):
            raise ValueError("provide exactly one of company_id or company_name")
        return self


class BarcodeRead(SQLModel):
    id: int
    code: str
    barcode_type: Optional[BarcodeTypeRead] = None


class BarcodeCreate(_Strict):
    code: str
    barcode_type_id: int | None = None


class ConditionRead(SQLModel):
    condition_type: Optional[ConditionTypeRead] = None
    notes: str | None = None


class CopyPhotoRead(SQLModel):
    id: int
    file_path: str
    name: str | None = None
    description: str | None = None


class OwnedCopyRead(SQLModel):
    id: int
    notes: str | None = None
    condition: Optional[ConditionRead] = None
    photos: List[CopyPhotoRead]


# ============================================================
# Items
# ============================================================
class ItemRead(ItemBase):
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


class ItemCreate(ItemBase, _Strict):
    format_id: int | None = None
    selected_language_code: str | None = None
    languages: List[ItemLanguageCreate] = []
    titles: List[TitleCreate] = []
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
    titles: List[TitleCreate] | None = None
    genre_ids: List[int] | None = None
    franchise_ids: List[int] | None = None
    tags: List[str] | None = None
    barcodes: List[BarcodeCreate] | None = None
    author_credits: List[AuthorCreditCreate] | None = None
    company_credits: List[CompanyCreditCreate] | None = None

    details: ItemDetailsCreate | None = None


# ============================================================
# List + pagination
# ============================================================
class ItemListEntryRead(SQLModel):
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