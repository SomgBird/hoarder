"""Transactional item creation, updates, and deletion."""
from sqlalchemy import delete as sa_delete
from sqlmodel import Session

from app.db.models import Franchise, Item
from app.db.schemas import ItemCreate, ItemRead, ItemUpdate
from app.errors import ConflictError, NotFoundError

from .details import _SUBTYPES, _detail_values
from .lookups import (
    _language_or_none,
    _require_many,
    _resolve_format,
    _resolve_genres,
    get_item_type,
)
from .reads import _load_item, get_item
from .relations import (
    _build_author_credits,
    _build_barcodes,
    _build_company_credits,
    _build_language_links,
    _build_tags,
    _build_titles,
)


def create_item(session: Session, data: ItemCreate) -> ItemRead:
    try:
        type_name = data.details.type_name
        item_type = get_item_type(session, type_name)
        spec = _SUBTYPES[type_name]
        # Run every lookup/validation BEFORE building the Item: queries autoflush, and a
        # half-built Item already linked to persistent rows triggers SAWarnings.
        detail_values = _detail_values(session, spec, data.details)
        item = Item(
            release_date=data.release_date,
            cover_image_path=data.cover_image_path,
            icon_image_path=data.icon_image_path,
            is_owned=data.is_owned,
            description=data.description,
            item_type=item_type,
            format=_resolve_format(session, item_type, data.format_id),
            selected_language=_language_or_none(session, data.selected_language_code),
            language_links=_build_language_links(session, data.languages),
            titles=_build_titles(session, data.titles),
            genres=_resolve_genres(session, item_type, data.genre_ids),
            franchises=_require_many(session, Franchise, data.franchise_ids, "franchise"),
            tags=_build_tags(session, data.tags),
            barcodes=_build_barcodes(session, data.barcodes),
            author_credits=_build_author_credits(session, data.author_credits),
            company_credits=_build_company_credits(session, data.company_credits),
        )
        # Use the relationship (item=item), not id=item.id: the item has no id yet.
        detail = spec.model(item=item, **detail_values)
        session.add(item)
        session.add(detail)
        session.commit()
        item_id = item.id
    except Exception:
        session.rollback()
        raise
    return get_item(session, item_id)


def update_item(session: Session, item_id: int, data: ItemUpdate) -> ItemRead:
    """Partial update. Omitted fields are untouched; a list replaces the whole collection."""
    item = _load_item(session, item_id)
    item_type = item.item_type
    sent = data.model_fields_set  # tells "omitted" apart from "explicit null"
    try:
        for name in ("release_date", "cover_image_path", "icon_image_path", "is_owned", "description"):
            if name in sent:
                setattr(item, name, getattr(data, name))
        if "format_id" in sent:
            item.format = _resolve_format(session, item_type, data.format_id)
        if "selected_language_code" in sent:
            item.selected_language = _language_or_none(session, data.selected_language_code)
        if data.languages is not None:
            item.language_links = _build_language_links(session, data.languages)
        if data.titles is not None:
            item.titles = _build_titles(session, data.titles)
        if data.genre_ids is not None:
            item.genres = _resolve_genres(session, item_type, data.genre_ids)
        if data.franchise_ids is not None:
            item.franchises = _require_many(session, Franchise, data.franchise_ids, "franchise")
        if data.tags is not None:
            item.tags = _build_tags(session, data.tags)
        if data.barcodes is not None:
            item.barcodes = _build_barcodes(session, data.barcodes)
        if data.author_credits is not None:
            item.author_credits = _build_author_credits(session, data.author_credits)
        if data.company_credits is not None:
            item.company_credits = _build_company_credits(session, data.company_credits)

        if data.details is not None:
            if data.details.type_name != item_type.name:
                raise ConflictError(
                    f"Item {item_id} is a '{item_type.name}'; cannot apply '{data.details.type_name}' details",
                    code="item_type_mismatch",
                )
            spec = _SUBTYPES[item_type.name]
            detail = session.get(spec.model, item_id)
            values = _detail_values(session, spec, data.details, only_set=True)
            if detail is None:  # item without a subtype row (shouldn't happen, but heal it)
                session.add(spec.model(item=item, **values))
            else:
                for column, value in values.items():
                    setattr(detail, column, value)
        session.commit()
    except Exception:
        session.rollback()
        raise
    return get_item(session, item_id)


def delete_item(session: Session, item_id: int) -> None:
    """Raises NotFoundError (-> 404) if the item doesn't exist."""
    item = session.get(Item, item_id)
    if item is None:
        raise NotFoundError("item", item_id)
    try:
        # Subtype rows have no ORM link back to the item, so clear them explicitly.
        for spec in _SUBTYPES.values():
            session.exec(sa_delete(spec.model).where(spec.model.id == item_id))
        # Titles, credits, barcodes, owned copies, language links cascade through the
        # relationships; genre/franchise/tag link rows are removed by SQLAlchemy.
        session.delete(item)
        session.commit()
    except Exception:
        session.rollback()
        raise
