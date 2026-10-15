
from collections.abc import Callable
from typing import Optional, Sequence

from sqlalchemy import func
from sqlalchemy.orm import load_only, selectinload
from sqlmodel import SQLModel, Session, select

from app.db.models import Author, AuthorRole, AuthorRoleItemLink, Book, Item, ItemLanguageLink, ItemType, Language, Title, VideoGame
from app.db.schemas import BookDetails, GameDetails, ItemCreate, ItemListEntryRead


_ITEM_RELATIONS = (
    selectinload(Item.titles),
    selectinload(Item.selected_language),
    selectinload(Item.item_type),
    selectinload(Item.languages),
    selectinload(Item.credits).joinedload(AuthorRoleItemLink.author),
    selectinload(Item.credits).joinedload(AuthorRoleItemLink.role),
)

 
class UnknownCode(ValueError):
    """Raised when a client-supplied code doesn't match any row (map to HTTP 422)."""
 

def build_book(session: Session, item: Item, data: BookDetails) -> Book:
    return Book(item=item, **data.model_dump(exclude={"type_name"}))


def build_game(session: Session, item: Item, data: GameDetails) -> VideoGame:
    return VideoGame(item=item, **data.model_dump(exclude={"type_name"}))


DETAIL_BUILDERS: dict[str, Callable[[Session, Item, "BookDetails | GameDetails"], SQLModel]] = {
    "book": build_book,
    "game": build_game,
}



def get_item(session: Session, item_id: int) -> Optional[Item]:
    return session.exec(
        select(Item).where(Item.id == item_id).options(*_ITEM_RELATIONS)
    ).first()


def create_item(session: Session, data: ItemCreate) -> Item:
    try:
        selected_lang = (
            get_language(session, data.selected_language_code)
            if data.selected_language_code else None
        )

        lang_links = [
            ItemLanguageLink(language=get_language(session, code))
            for code in data.language_codes if code
        ]

        item_type = get_item_type(session, data.details.type_name)

        titles = [
            Title(
                title_text=t.title_text,
                short_text=t.short_text,
                language=get_language(session, t.language_code),
            )
            for t in data.titles
        ]

        credits: list[AuthorRoleItemLink] = []
        seen: set[tuple[int, int]] = set()
        for c in data.credits:
            author = get_or_create_author(
                session, author_id=c.author_id, name=c.author_name
            )
            role = get_or_create_role(session, c.role_name)
            if (author.id, role.id) in seen:      # composite PK would reject a repeat
                continue
            seen.add((author.id, role.id))
            credits.append(AuthorRoleItemLink(
                author=author, role=role,
                involvement_date=c.involvement_date, comments=c.comments,
            ))

        item = Item(
            release_date=data.release_date,
            cover_image_path=data.cover_image_path,
            icon_image_path=data.icon_image_path,
            is_owned=data.is_owned,
            item_type=item_type,
            language_links=lang_links,
            selected_language=selected_lang,
            titles=titles,
            credits=credits,
        )

        detail = DETAIL_BUILDERS[data.details.type_name](session, item, data.details)

        session.add(item)
        session.add(detail)
        session.commit()
    except Exception:
        session.rollback()
        raise

    return get_item(session, item.id)   # eager-loaded, instead of session.refresh(item)


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
        .where(Title.language_id == item.selected_language_id, Title.item_id == item.id)
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


def get_or_create_role(session: Session, name: str) -> AuthorRole:
    name = " ".join(name.split())
    if not name:
        raise ValueError("role name is empty")
    role = session.exec(
        select(AuthorRole).where(func.lower(AuthorRole.name) == name.lower())
    ).first()
    if role is None:
        role = AuthorRole(name=name)
        session.add(role)
        session.flush()
    return role


def get_or_create_author(
    session: Session, *, author_id: int | None = None, name: str | None = None
) -> Author:
    if author_id is not None:
        author = session.get(Author, author_id)
        if author is None:
            raise LookupError(f"author {author_id} not found")
        return author

    name = " ".join((name or "").split())
    if not name:
        raise ValueError("author name is empty")
    author = session.exec(
        select(Author).where(func.lower(Author.name) == name.lower())
    ).first()
    if author is None:
        author = Author(name=name)
        session.add(author)
        session.flush()
    return author


def count_items(session: Session) -> int:
    return session.exec(select(func.count()).select_from(Item)).one()


def all_items(session: Session, offset: int = 0, limit: int = 20) -> Sequence[Item]:
    return session.exec(
        select(Item).options(*_ITEM_RELATIONS).offset(offset).limit(limit)
    ).all()
