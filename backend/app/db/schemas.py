from datetime import date
from typing import Annotated, Generic, List, Literal, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, model_validator
from pydantic import Field as PField
from sqlmodel import SQLModel

from app.db.base import ItemBase


# Input schemas reject unknown fields. Without this, a misspelled or renamed key
# (e.g. the old `credits=`) is silently dropped and the data just never arrives.
class _Strict(SQLModel):
    model_config = ConfigDict(extra="forbid")


# ---------- item subtype details ----------
class BookDetails(SQLModel):
    type_name: Literal["book"]
    page_count: int | None = None


class GameDetails(SQLModel):
    type_name: Literal["game"]


ItemDetails = Annotated[BookDetails | GameDetails, PField(discriminator="type_name")]


# ---------- languages / titles ----------
class LanguageRead(SQLModel):
    id: int
    code: str
    name: str


class TitleRead(SQLModel):
    id: int
    title_text: str
    short_text: str | None = None
    language: Optional[LanguageRead]


class TitleCreate(_Strict):
    title_text: str
    short_text: str | None = None
    language_code: str


# ---------- author credits ----------
class AuthorRead(SQLModel):
    id: int
    name: str


class AuthorRoleRead(SQLModel):
    id: int
    name: str


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


# ---------- company credits ----------
class CompanyRead(SQLModel):
    id: int
    name: str


class CompanyRoleRead(SQLModel):
    id: int
    name: str


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


# ---------- items ----------
class ItemRead(ItemBase):
    id: int
    titles: List[TitleRead]
    languages: List[LanguageRead]
    selected_language: LanguageRead
    # No defaults on purpose: if the ORM attribute is missing or misnamed this should
    # fail loudly instead of quietly returning an empty list.
    author_credits: List[AuthorCreditRead]
    company_credits: List[CompanyCreditRead]


class ItemCreate(ItemBase, _Strict):
    titles: List[TitleCreate] = []
    language_codes: List[str] = []
    selected_language_code: str | None = None
    author_credits: List[AuthorCreditCreate] = []
    company_credits: List[CompanyCreditCreate] = []

    details: ItemDetails


class ItemUpdate(_Strict):
    """Partial update. Omitted = leave alone; a list = replace the whole collection."""

    release_date: date | None = None
    cover_image_path: str | None = None
    icon_image_path: str | None = None
    is_owned: bool | None = None

    selected_language_code: str | None = None
    language_codes: List[str] | None = None
    titles: List[TitleCreate] | None = None
    author_credits: List[AuthorCreditCreate] | None = None
    company_credits: List[CompanyCreditCreate] | None = None


# ---------- list ----------
class ItemListEntryRead(SQLModel):
    id: int
    title: str
    release_date: date | None = None
    is_owned: bool
    icon_image_path: str | None = None


# ---------- pagination envelope ----------
T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: List[T]
    total: int
    offset: int
    limit: int