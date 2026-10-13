
from typing import Optional, Sequence

from sqlalchemy import func
from sqlalchemy.orm import load_only, selectinload
from sqlmodel import Session, select

from app.db.models import Item, ItemLanguageLink, ItemType, Language, Title
from app.db.schemas import ItemCreate

# TODO: rework to items
# Eager-load options shared by every query that returns a full Item,
# so callers never trip the "N+1 lazy load after session closed" trap.
_ITEM_RELATIONS = (
    # selectinload(Book.authors),
    # selectinload(Book.language),
    # selectinload(Book.publisher),
)



def get_item(session: Session, item_id: int) -> Optional[Item]:
    return session.exec(
        select(Item).where(Item.id == item_id).options(*_ITEM_RELATIONS)
    ).first()


def create_item(session: Session, data: ItemCreate) -> Item:
    selected_lang = get_language(session, data.selected_language_code)
    lang_links = []
    for code in data.language_codes:
        l = get_language(session, code)
        if code:
            lang_links.append(ItemLanguageLink(language=l))
    item_t = get_item_type(session, data.item_type_name)

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
        item_type=item_t,
        language_links=lang_links,
        selected_language=selected_lang,
        titles=titles,
    )

    session.add(item)
    session.commit()
    session.refresh(item)

    return item


def get_item_type(session: Session, type_name: str) -> ItemType:
    if not type_name:
        return None
    
    r = select(ItemType).where(ItemType.name == type_name)
    item_t = session.exec(r).first()
    return item_t


def get_language(session: Session, code: str = None, name: str = None) -> Language:
    if not code and not name:
        return None

    r = select(Language)
    if code:
        r.where(Language.code == code)
    else:
        r.where(Language.name == name)
    lang = session.exec(r).first()
    return lang


def count_items(session: Session) -> int:
    return session.exec(select(func.count()).select_from(Item)).one()


def all_items(session: Session, offset: int = 0, limit: int = 20) -> Sequence[Item]:
    return session.exec(
        select(Item).options(*_ITEM_RELATIONS).offset(offset).limit(limit)
    ).all()


# TODO: extract correct title
# def list_items(session: Session, offset: int = 0, limit: int = 20) -> Sequence[Item]:
#     return session.exec(
#         select(Item)
#         .options(load_only(Item.id, Item.title), selectinload(Item.authors))
#         .order_by(Item.id)
#         .offset(offset)
#         .limit(limit)
#     ).all()