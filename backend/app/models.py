from datetime import date, datetime
from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship


class BookAuthorLink(SQLModel, table=True):
    book_id: Optional[int] = Field(
        default=None, foreign_key="book.id", primary_key=True
    )
    author_id: Optional[int] = Field(
        default=None, foreign_key="author.id", primary_key=True
    )


class Language(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True, index=True, max_length=10)   # ISO 639-1, e.g. "en"
    name: str = Field(unique=True, max_length=100)              # "English"

    books: List["Book"] = Relationship(back_populates="language")


class Publisher(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True, max_length=200)
    country: Optional[str] = Field(default=None, max_length=100)

    books: List["Book"] = Relationship(back_populates="publisher")


class Author(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True, max_length=200)
    bio: Optional[str] = None

    books: List["Book"] = Relationship(
        back_populates="authors", link_model=BookAuthorLink
    )


class Book(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    title: str = Field(index=True, max_length=500)
    release_date: Optional[date] = None
    isbn: Optional[str] = Field(default=None, index=True, max_length=20, unique=True)
    pages: Optional[int] = Field(default=None, ge=1)
    description: Optional[str] = None

    # Store a *relative URL path*, not the file itself.
    cover_image_path: Optional[str] = Field(default=None, max_length=500)

    # Foreign keys
    language_id: Optional[int] = Field(default=None, foreign_key="language.id")
    publisher_id: Optional[int] = Field(default=None, foreign_key="publisher.id")

    # Relationships
    language: Optional[Language] = Relationship(back_populates="books")
    publisher: Optional[Publisher] = Relationship(back_populates="books")
    authors: List[Author] = Relationship(
        back_populates="books", link_model=BookAuthorLink
    )

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)