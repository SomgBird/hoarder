"""Reference lists, name searches, and transactional inline creation."""
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from app.db.models import Format, Genre, ItemType, ItemTypeFormatLink, ItemTypeGenreLink, Scale
from app.db.schemas import ReferenceCreate
from app.errors import InvalidReferenceError, NotFoundError
from app.names import clean_name, name_key


def list_references(session: Session, model) -> list:
    return session.exec(select(model).order_by(model.id)).all()


def create_reference(session: Session, model, payload: ReferenceCreate, label: str):
    scoped = model in (Format, Genre)
    if scoped and not payload.item_type:
        raise InvalidReferenceError("item_type", None, "Choose an item type first.")
    if not scoped and payload.item_type is not None:
        raise InvalidReferenceError("item_type", payload.item_type, "This reference is shared by all item types.")
    item_type = _type_or_404(session, payload.item_type) if scoped else None
    field = "scale" if model is Scale else "name"
    name = clean_name(payload.name)
    if not name:
        raise InvalidReferenceError(label, payload.name, "Name is required.")
    try:
        entity = session.exec(select(model).where(
            func.hoarder_name_key(getattr(model, field)) == name_key(name)
        ).order_by(model.id)).first()
        if entity is None:
            entity = model(**{field: name})
            session.add(entity)
            session.flush()
        if item_type is not None:
            link_model = ItemTypeFormatLink if model is Format else ItemTypeGenreLink
            key = "format_id" if model is Format else "genre_id"
            if session.get(link_model, (item_type.id, entity.id)) is None:
                session.add(link_model(item_type_id=item_type.id, **{key: entity.id}))
        session.commit()
        session.refresh(entity)
        return entity
    except Exception:
        session.rollback()
        raise


def _type_or_404(session: Session, name: str) -> ItemType:
    item_type = session.exec(select(ItemType).where(ItemType.name == name)).first()
    if item_type is None:
        raise NotFoundError("item_type", name)
    return item_type


def get_item_types(session: Session) -> list[ItemType]:
    return session.exec(
        select(ItemType)
        .options(selectinload(ItemType.formats), selectinload(ItemType.genres))
        .order_by(ItemType.id)
    ).all()


def get_formats(session: Session, item_type: str | None = None) -> list[Format]:
    query = select(Format).order_by(Format.id)
    if item_type:
        t = _type_or_404(session, item_type)
        query = query.join(ItemTypeFormatLink, ItemTypeFormatLink.format_id == Format.id).where(
            ItemTypeFormatLink.item_type_id == t.id
        )
    return session.exec(query).all()


def get_genres(session: Session, item_type: str | None = None) -> list[Genre]:
    query = select(Genre).order_by(Genre.id)
    if item_type:
        t = _type_or_404(session, item_type)
        query = query.join(ItemTypeGenreLink, ItemTypeGenreLink.genre_id == Genre.id).where(
            ItemTypeGenreLink.item_type_id == t.id
        )
    return session.exec(query).all()


def search_named_references(session: Session, model, q: str = "", limit: int = 20) -> list:
    return session.exec(
        select(model).where(func.instr(func.hoarder_name_key(model.name), name_key(q)) > 0)
        .order_by(model.name, model.id).limit(limit)
    ).all()
