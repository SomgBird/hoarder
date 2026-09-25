from datetime import datetime
from typing import Optional, Sequence
from sqlmodel import Session, select

from .models import Book, Author, Language, Publisher
from .schemas import BookCreate, BookUpdate


# ---- get-or-create helpers (keeps lookup tables clean) ----
def get_or_create_language(
    session: Session, code: Optional[str], name: Optional[str]
) -> Optional[Language]:
    if not code and not name:
        return None
    stmt = select(Language)
    if code:
        stmt = stmt.where(Language.code == code)
    else:
        stmt = stmt.where(Language.name == name)
    lang = session.exec(stmt).first()
    if lang:
        return lang
    lang = Language(code=(code or name.lower()[:10]), name=(name or code))
    session.add(lang)
    session.flush()      # gives us lang.id without committing
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


# ---- Book operations ----
def create_book(session: Session, data: BookCreate) -> Book:
    # Resolve language
    if data.language_id:
        language = session.get(Language, data.language_id)
    else:
        language = get_or_create_language(session, data.language_code, data.language_name)

    # Resolve publisher
    if data.publisher_id:
        publisher = session.get(Publisher, data.publisher_id)
    else:
        publisher = get_or_create_publisher(session, data.publisher_name)

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


def get_book(session: Session, book_id: int) -> Optional[Book]:
    return session.get(Book, book_id)


def list_books(session: Session, offset: int = 0, limit: int = 20) -> Sequence[Book]:
    return session.exec(select(Book).offset(offset).limit(limit)).all()


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

    book.updated_at = datetime.utcnow()
    session.add(book)
    session.commit()
    session.refresh(book)
    return book


def delete_book(session: Session, book: Book) -> None:
    # Cleanup cover file first (see router for helper)
    session.delete(book)
    session.commit()