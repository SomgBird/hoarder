"""Titles, languages, credits, barcodes, and owned copy schemas."""
from datetime import date
from typing import List, Optional

from pydantic import ConfigDict, Field as PField, model_validator

from .base import NonBlank, _Read, _Strict
from .reference import (
    AuthorRead,
    AuthorRoleRead,
    BarcodeTypeRead,
    CompanyRead,
    CompanyRoleRead,
    ConditionTypeRead,
    LanguageRead,
)


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
