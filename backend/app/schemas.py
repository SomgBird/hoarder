from datetime import date, datetime
from typing import List, Optional
from sqlmodel import SQLModel


# ---------- Read / nested ----------
class LanguageRead(SQLModel):
    id: int
    code: str
    name: str


class PublisherRead(SQLModel):
    id: int
    name: str
    country: Optional[str] = None


class AuthorRead(SQLModel):
    id: int
    name: str


# ---------- Create ----------
class BookCreate(SQLModel):
    title: str
    release_date: Optional[date] = None
    isbn: Optional[str] = None
    pages: Optional[int] = None
    description: Optional[str] = None

    # Authors may be supplied by name — the API will get-or-create them.
    authors: List[str] = []

    # Lookups can be supplied by name/code (get-or-create) …
    language_code: Optional[str] = None     # e.g. "en"
    language_name: Optional[str] = None     # used if code not given
    publisher_name: Optional[str] = None

    # … or by existing ID (overrides name fields).
    language_id: Optional[int] = None
    publisher_id: Optional[int] = None


# ---------- Update ----------
class BookUpdate(SQLModel):
    title: Optional[str] = None
    release_date: Optional[date] = None
    isbn: Optional[str] = None
    pages: Optional[int] = None
    description: Optional[str] = None
    language_id: Optional[int] = None
    publisher_id: Optional[int] = None
    authors: Optional[List[str]] = None       # replace whole author list


# ---------- Response ----------
class BookRead(SQLModel):
    id: int
    title: str
    release_date: Optional[date]
    isbn: Optional[str]
    pages: Optional[int]
    description: Optional[str]
    cover_image_path: Optional[str]

    language: Optional[LanguageRead]
    publisher: Optional[PublisherRead]
    authors: List[AuthorRead]

    created_at: datetime
    updated_at: datetime