
from collections.abc import Callable
from typing import Optional, Sequence

from sqlalchemy import func
from sqlalchemy.orm import load_only, selectinload
from sqlmodel import SQLModel, Session, select

from app.db.models import Book, Item, ItemLanguageLink, ItemType, Language, Title
from app.db.schemas import BookDetails, GameDetails, ItemCreate, ItemListEntryRead


_ITEM_RELATIONS = (
    selectinload(Item.titles),
    selectinload(Item.selected_language),
    selectinload(Item.item_type),
    selectinload(Item.languages)
)

 
class UnknownCode(ValueError):
    """Raised when a client-supplied code doesn't match any row (map to HTTP 422)."""
 

def build_book(session: Session, item: Item, data: BookDetails) -> Book:
    return Book(item=item, **data.model_dump(exclude={"type_name"}))



DETAIL_BUILDERS: dict[str, Callable[[Session, Item, "BookDetails | GameDetails"], SQLModel]] = {
    "book": build_book,
}



def get_item(session: Session, item_id: int) -> Optional[Item]:
    return session.exec(
        select(Item).where(Item.id == item_id).options(*_ITEM_RELATIONS)
    ).first()


def create_item(session: Session, data: ItemCreate) -> Item:
    try:
        selected_lang = get_language(session, data.selected_language_code)
        lang_links = []
        for code in data.language_codes:
            l = get_language(session, code)
            if code:
                lang_links.append(ItemLanguageLink(language=l))

        item_type = get_item_type(session, data.details.type_name)

        titles = []
        for title_data in data.titles:
            title_lang = get_language(session, title_data.language_code)
            title = Title(
                title_text=title_data.title_text,
                short_text=title_data.short_text,
                language=title_lang,
            )
            titles.append(title)

        item = Item(
            release_date=data.release_date,
            cover_image_path=data.cover_image_path,
            icon_image_path=data.icon_image_path,
            is_owned=data.is_owned,
            item_type=item_type,
            language_links=lang_links,
            selected_language=selected_lang,
            titles=titles,
        )

        detail = DETAIL_BUILDERS[data.details.type_name](session, item, data.details)
    
        session.add(item)
        session.add(detail)
        session.commit()
    except Exception:
        session.rollback()
        raise

    session.refresh(item)
    return item


def get_item_list_entry(session: Session, item_id: int) -> Optional[ItemListEntryRead]:
    item = session.exec(
        select(Item)
        .where(Item.id == item_id)
        .options(load_only(Item.id, Item.release_date, Item.is_owned, Item.icon_image_path, Item.selected_language_id))
    ).first()

    if not item:
        return None

    title = session.exec(
        select(Title.title_text)
        .where(Title.language_id == item.selected_language_id and Title.item_id == item.id)
    ).first()

    return ItemListEntryRead(
        id=item.id,
        title=title,
        release_date=item.release_date,
        is_owned=item.is_owned,
        icon_image_path=item.icon_image_path,
    )


def get_item_list(session: Session, offset: int = 0, limit: int = 20) -> list[ItemListEntryRead]:
    item_ids = session.exec(select(Item.id).offset(offset).limit(limit)).all()
    item_list = []
    for item_id in item_ids:
        entry = get_item_list_entry(session, item_id)
        if entry:
            item_list.append(entry)

    return item_list


def get_item_type(session: Session, type_name: str) -> ItemType:
    item_t = session.exec(
        select(ItemType).where(ItemType.name == type_name)
    ).first()

    if item_t is None:
        raise UnknownCode(f"Unknown item type: {type_name!r}")
    return item_t

def get_language(session: Session, code: str | None = None, name: str | None = None) -> Language:
    if not code and not name:
        return None

    r = select(Language)
    if code:
        r = r.where(Language.code == code)
    else:
        r = r.where(Language.name == name)
    lang = session.exec(r).first()

    if lang is None:
        raise UnknownCode(f"Unknown language code: {code!r}")
    return lang


def count_items(session: Session) -> int:
    return session.exec(select(func.count()).select_from(Item)).one()


def all_items(session: Session, offset: int = 0, limit: int = 20) -> Sequence[Item]:
    return session.exec(
        select(Item).options(*_ITEM_RELATIONS).offset(offset).limit(limit)
    ).all()
