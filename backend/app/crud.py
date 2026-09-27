from typing import Optional, Sequence

from sqlalchemy import func
from sqlalchemy.orm import load_only, selectinload
from sqlmodel import Session, select

from app.models import Author, Book, Language, Publisher, utcnow
from app.schemas import BookCreate, BookUpdate

# Eager-load options shared by every query that returns a full Book,
# so callers never trip the "N+1 lazy load after session closed" trap.
_BOOK_RELATIONS = (
    selectinload(Book.authors),
    selectinload(Book.language),
    selectinload(Book.publisher),
)


# ---------- Lookups (get-or-create) ----------
def get_or_create_language(
    session: Session, code: Optional[str], name: Optional[str]
) -> Optional[Language]:
    if not code and not name:
        return None
    stmt = select(Language)
    stmt = stmt.where(Language.code == code) if code else stmt.where(Language.name == name)
    lang = session.exec(stmt).first()
    if lang:
        return lang
    lang = Language(code=(code or name.lower()[:10]), name=(name or code))
    session.add(lang)
    session.flush()
    return lang


def get_or_create_publisher(session: Session, name: Optional[str]) -> Optional[Publisher]:
    if not name:
        return None
    pub = session.exec(select(Publisher).where(Publisher.name == name)).first()
    if pub:
        return pub
    pub = Publisher(name=name)
    session.add(pub)
    session.flush()
    return pub


def get_or_create_authors(session: Session, names: list[str]) -> list[Author]:
    authors: list[Author] = []
    for name in names:
        a = session.exec(select(Author).where(Author.name == name)).first()
        if not a:
            a = Author(name=name)
            session.add(a)
            session.flush()
        authors.append(a)
    return authors


# ---------- Books ----------
def create_book(session: Session, data: BookCreate) -> Book:
    language = (
        session.get(Language, data.language_id)
        if data.language_id
        else get_or_create_language(session, data.language_code, data.language_name)
    )
    publisher = (
        session.get(Publisher, data.publisher_id)
        if data.publisher_id
        else get_or_create_publisher(session, data.publisher_name)
    )
    authors = get_or_create_authors(session, data.authors)

    book = Book(
        title=data.title,
        release_date=data.release_date,
        isbn=data.isbn,
        pages=data.pages,
        description=data.description,
        language=language,
        publisher=publisher,
        authors=authors,
    )
    session.add(book)
    session.commit()
    session.refresh(book)
    return book


def get_book_by_isbn(session: Session, isbn: str) -> Optional[Book]:
    return session.exec(select(Book).where(Book.isbn == isbn)).first()


def get_book(session: Session, book_id: int) -> Optional[Book]:
    return session.exec(
        select(Book).where(Book.id == book_id).options(*_BOOK_RELATIONS)
    ).first()


def count_books(session: Session) -> int:
    return session.exec(select(func.count()).select_from(Book)).one()


def all_books(session: Session, offset: int = 0, limit: int = 20) -> Sequence[Book]:
    return session.exec(
        select(Book).options(*_BOOK_RELATIONS).offset(offset).limit(limit)
    ).all()


def list_books(session: Session, offset: int = 0, limit: int = 20) -> Sequence[Book]:
    """Lightweight listing: only the columns BookListItem actually needs,
    with authors batch-loaded in one extra query (no N+1)."""
    return session.exec(
        select(Book)
        .options(load_only(Book.id, Book.title), selectinload(Book.authors))
        .order_by(Book.id)
        .offset(offset)
        .limit(limit)
    ).all()


def update_book(session: Session, book: Book, data: BookUpdate) -> Book:
    payload = data.model_dump(exclude_unset=True)

    if "authors" in payload:
        book.authors = get_or_create_authors(session, payload.pop("authors"))
    if "language_id" in payload:
        book.language = session.get(Language, payload.pop("language_id"))
    if "publisher_id" in payload:
        book.publisher = session.get(Publisher, payload.pop("publisher_id"))

    for key, value in payload.items():
        setattr(book, key, value)

    book.updated_at = utcnow()
    session.add(book)
    session.commit()
    session.refresh(book)
    return book


def delete_book(session: Session, book: Book) -> None:
    session.delete(book)
    session.commit()


# ---------- Simple lookups for dropdowns / reference lists ----------
def list_authors(session: Session) -> Sequence[Author]:
    return session.exec(select(Author).order_by(Author.name)).all()


def list_publishers(session: Session) -> Sequence[Publisher]:
    return session.exec(select(Publisher).order_by(Publisher.name)).all()


def list_languages(session: Session) -> Sequence[Language]:
    return session.exec(select(Language).order_by(Language.name)).all()