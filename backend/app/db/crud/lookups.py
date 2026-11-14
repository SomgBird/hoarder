"""Reference resolution and scope validation; helpers flush but never commit."""
from sqlalchemy import func
from sqlmodel import SQLModel, Session, select

from app.db.models import (
    Author,
    AuthorRole,
    Company,
    CompanyRole,
    Format,
    Genre,
    ItemType,
    ItemTypeFormatLink,
    ItemTypeGenreLink,
    Language,
)
from app.errors import InvalidReferenceError
from app.names import clean_name, name_key


def _require(session: Session, model: type[SQLModel], pk: int, label: str):
    """Fetch a referenced row by id or raise InvalidReferenceError (-> 422)."""
    obj = session.get(model, pk)
    if obj is None:
        raise InvalidReferenceError(label, pk)
    return obj


def _require_many(session: Session, model, ids: list[int], label: str) -> list:
    ids = list(dict.fromkeys(ids))
    if not ids:
        return []
    objs = session.exec(select(model).where(model.id.in_(ids))).all()
    missing = sorted(set(ids) - {o.id for o in objs})
    if missing:
        raise InvalidReferenceError(label, missing, f"Unknown {label.replace('_', ' ')} id(s): {missing}")
    return objs


def get_language(session: Session, code: str) -> Language:
    language = session.exec(select(Language).where(Language.code == code)).first()
    if language is None:
        raise InvalidReferenceError("language", code)
    return language


def get_item_type(session: Session, name: str) -> ItemType:
    # Item types are reference data created by the builtin seed, so a miss is an error.
    item_type = session.exec(select(ItemType).where(ItemType.name == name)).first()
    if item_type is None:
        raise InvalidReferenceError(
            "item_type", name, f"Item type '{name}' not found (has the builtin seed been run?)"
        )
    return item_type


def get_or_create_named(session: Session, model, name: str | None):
    """Case-insensitive get-or-create for any table with a `name` column."""
    clean = clean_name(name)
    if not clean:
        raise InvalidReferenceError(model.__name__.lower(), name, f"{model.__name__} name is empty")
    obj = session.exec(
        select(model).where(func.hoarder_name_key(model.name) == name_key(clean)).order_by(model.id)
    ).first()
    if obj is None:
        obj = model(name=clean)
        session.add(obj)
        session.flush()
    return obj


def get_or_create_author_role(session: Session, name: str) -> AuthorRole:
    return get_or_create_named(session, AuthorRole, name)


def get_or_create_company_role(session: Session, name: str) -> CompanyRole:
    return get_or_create_named(session, CompanyRole, name)


def resolve_author(
    session: Session, *, author_id: int | None = None, name: str | None = None
) -> Author:
    if author_id is not None:
        return _require(session, Author, author_id, "author")
    author = Author(name=_required_name(name, "author"))
    session.add(author)
    session.flush()
    return author


def resolve_company(
    session: Session, *, company_id: int | None = None, name: str | None = None
) -> Company:
    if company_id is not None:
        return _require(session, Company, company_id, "company")
    company = Company(name=_required_name(name, "company"))
    session.add(company)
    session.flush()
    return company


def _required_name(name: str | None, entity: str) -> str:
    clean = clean_name(name)
    if not clean:
        raise InvalidReferenceError(entity, name, f"{entity.capitalize()} name is empty")
    return clean


def _language_or_none(session: Session, code: str | None) -> Language | None:
    return get_language(session, code) if code else None


def _resolve_format(session: Session, item_type: ItemType, format_id: int | None) -> Format | None:
    if format_id is None:
        return None
    fmt = _require(session, Format, format_id, "format")
    if session.get(ItemTypeFormatLink, (item_type.id, fmt.id)) is None:
        raise InvalidReferenceError(
            "format", format_id, f"Format '{fmt.name}' does not apply to item type '{item_type.name}'"
        )
    return fmt


def _resolve_genres(session: Session, item_type: ItemType, genre_ids: list[int]) -> list[Genre]:
    genres = _require_many(session, Genre, genre_ids, "genre")
    allowed = set(
        session.exec(
            select(ItemTypeGenreLink.genre_id).where(
                ItemTypeGenreLink.item_type_id == item_type.id,
                ItemTypeGenreLink.genre_id.in_([g.id for g in genres]),
            )
        ).all()
    )
    bad = [g for g in genres if g.id not in allowed]
    if bad:
        names = ", ".join(g.name for g in bad)
        raise InvalidReferenceError(
            "genre", [g.id for g in bad], f"Genre(s) {names} do not apply to item type '{item_type.name}'"
        )
    return genres
