"""Item creation, partial updates, and full item responses."""
from datetime import date
from typing import Annotated, List, Optional

from pydantic import AliasChoices, Field as PField, computed_field, field_validator
from pydantic.json_schema import SkipJsonSchema

from app.db.base import ItemBase

from .base import _Read, _Strict
from .details import ItemDetailsCreate, ItemDetailsRead
from .parts import (
    AuthorCreditCreate,
    AuthorCreditRead,
    BarcodeCreate,
    BarcodeRead,
    CompanyCreditCreate,
    CompanyCreditRead,
    ItemLanguageCreate,
    ItemLanguageRead,
    OwnedCopyRead,
    TitleCreate,
    TitleRead,
)
from .reference import FormatRead, FranchiseRead, GenreRead, ItemTypeRead, LanguageRead, TagRead


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
