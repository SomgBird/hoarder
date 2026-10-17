from typing import Callable, Optional

from sqlalchemy import delete as sa_delete
from sqlalchemy import func
from sqlalchemy.orm import joinedload, selectinload
from sqlmodel import Session, select

from app.db.models import (
    Author,
    AuthorRole,
    AuthorRoleItemLink,
    BoardGame,
    Book,
    Company,
    CompanyRole,
    CompanyRoleItemLink,
    Figurine,
    Film,
    Item,
    ItemLanguageLink,
    ItemType,
    JournalIssue,
    Language,
    LegoSet,
    Miniature,
    Title,
    VideoGame,
)
from app.db.schemas import (
    AuthorCreditCreate,
    BookDetails,
    CompanyCreditCreate,
    GameDetails,
    ItemCreate,
    ItemListEntryRead,
    ItemRead,
    ItemUpdate,
    Page,
    TitleCreate,
)


# ============================================================
# Lookups and get-or-create helpers
# These only flush, never commit, so they stay inside the
# caller's transaction and roll back with it.
# ============================================================

def _normalize(name: str | None) -> str:
    return " ".join((name or "").split())


def get_language(session: Session, code: str) -> Language:
    language = session.exec(select(Language).where(Language.code == code)).first()
    if language is None:
        raise LookupError(f"language '{code}' not found")
    return language


def get_item_type(session: Session, name: str) -> ItemType:
    # Item types are reference data created by the seed, so a miss is an error.
    item_type = session.exec(select(ItemType).where(ItemType.name == name)).first()
    if item_type is None:
        raise LookupError(f"item type '{name}' not found (has the seed been run?)")
    return item_type


def _get_or_create_named(session: Session, model, name: str | None):
    """Case-insensitive get-or-create for any table with a `name` column."""
    clean = _normalize(name)
    if not clean:
        raise ValueError(f"{model.__name__} name is empty")
    obj = session.exec(
        select(model).where(func.lower(model.name) == clean.lower())
    ).first()
    if obj is None:
        obj = model(name=clean)
        session.add(obj)
        session.flush()
    return obj


def get_or_create_author_role(session: Session, name: str) -> AuthorRole:
    return _get_or_create_named(session, AuthorRole, name)


def get_or_create_company_role(session: Session, name: str) -> CompanyRole:
    return _get_or_create_named(session, CompanyRole, name)


def get_or_create_author(
    session: Session, *, author_id: int | None = None, name: str | None = None
) -> Author:
    if author_id is not None:
        author = session.get(Author, author_id)
        if author is None:
            raise LookupError(f"author {author_id} not found")
        return author
    return _get_or_create_named(session, Author, name)


def get_or_create_company(
    session: Session, *, company_id: int | None = None, name: str | None = None
) -> Company:
    if company_id is not None:
        company = session.get(Company, company_id)
        if company is None:
            raise LookupError(f"company {company_id} not found")
        return company
    return _get_or_create_named(session, Company, name)


def _language_or_none(session: Session, code: str | None) -> Language | None:
    return get_language(session, code) if code else None


# ============================================================
# Subtype detail builders (one per ItemDetails variant)
# Use the relationship (item=item), not id=item.id: the item has no id yet.
# ============================================================

def _build_book(session: Session, item: Item, details: BookDetails) -> Book:
    return Book(item=item, page_count=details.page_count)


def _build_game(session: Session, item: Item, details: GameDetails) -> VideoGame:
    return VideoGame(item=item)


DETAIL_BUILDERS: dict[str, Callable] = {
    "book": _build_book,
    "game": _build_game,
}

# Every table whose primary key is an item id. delete_item clears all of them.
# Add new subtype models here (and to DETAIL_BUILDERS if creatable via the API).
_SUBTYPE_MODELS = (
    Film, BoardGame, VideoGame, Book, JournalIssue, Figurine, Miniature, LegoSet,
)


# ============================================================
# Reads
# ============================================================

_ITEM_RELATIONS = (
    selectinload(Item.titles).joinedload(Title.language),
    selectinload(Item.selected_language),
    selectinload(Item.item_type),
    selectinload(Item.languages),
    selectinload(Item.author_credits).options(
        joinedload(AuthorRoleItemLink.author),
        joinedload(AuthorRoleItemLink.role),
    ),
    selectinload(Item.company_credits).options(
        joinedload(CompanyRoleItemLink.company),
        joinedload(CompanyRoleItemLink.role),
    ),
)


def get_item(session: Session, item_id: int) -> Optional[ItemRead]:
    item: Item = session.exec(
        select(Item)
        .where(Item.id == item_id)
        .options(*_ITEM_RELATIONS)
        # always reload, so collections replaced by an update are re-read from the DB
        .execution_options(populate_existing=True)
    ).first()

    item_read = ItemRead.model_validate(item)
    match item.item_type.name:
        case "book":
            details = session.exec(select(Book).where(Book.id == item_id)).first()
            item_read.details = DETAIL_BUILDERS[item.item_type.name](session, item, details)
        case "game":
            details = session.exec(select(VideoGame).where(VideoGame.id == item_id)).first()
            item_read.details = DETAIL_BUILDERS[item.item_type.name](session, item, details)
        case _:
            raise ValueError(f"unsupported item type: {item.item_type.name}")
    
    return item_read


def _list_query():
    """One row per item: title in the selected language, else any title."""
    in_selected_language = (
        select(Title.title_text)
        .where(Title.item_id == Item.id, Title.language_id == Item.selected_language_id)
        .order_by(Title.id)
        .limit(1)
        .scalar_subquery()
    )
    any_language = (
        select(Title.title_text)
        .where(Title.item_id == Item.id)
        .order_by(Title.id)
        .limit(1)
        .scalar_subquery()
    )
    return select(
        Item.id,
        func.coalesce(in_selected_language, any_language, "").label("title"),
        Item.release_date,
        func.coalesce(Item.is_owned, False).label("is_owned"),
        Item.icon_image_path,
    )


def get_item_list_entry(session: Session, item_id: int) -> Optional[ItemListEntryRead]:
    row = session.exec(_list_query().where(Item.id == item_id)).first()
    return ItemListEntryRead(**row._mapping) if row else None


def get_item_list(
    session: Session, offset: int = 0, limit: int = 20
) -> Page[ItemListEntryRead]:
    rows = session.exec(
        _list_query().order_by(Item.id).offset(offset).limit(limit)
    ).all()
    total = session.exec(select(func.count()).select_from(Item)).one()
    return Page(
        items=[ItemListEntryRead(**r._mapping) for r in rows],
        total=total,
        offset=offset,
        limit=limit,
    )


# ============================================================
# Builders shared by create and update
# ============================================================

def _build_language_links(session: Session, codes: list[str]) -> list[ItemLanguageLink]:
    return [ItemLanguageLink(language_id=get_language(session, c).id) for c in codes if c]


def _build_titles(session: Session, titles: list[TitleCreate]) -> list[Title]:
    return [
        Title(
            title_text=t.title_text,
            short_text=t.short_text,
            language_id=get_language(session, t.language_code).id,
        )
        for t in titles
    ]


def _build_author_credits(
    session: Session, credits: list[AuthorCreditCreate]
) -> list[AuthorRoleItemLink]:
    out: list[AuthorRoleItemLink] = []
    seen: set[tuple[int, int]] = set()
    for c in credits:
        author = get_or_create_author(session, author_id=c.author_id, name=c.author_name)
        role = get_or_create_author_role(session, c.role_name)
        if (author.id, role.id) in seen:
            continue
        seen.add((author.id, role.id))
        out.append(
            AuthorRoleItemLink(
                author_id=author.id,
                role_id=role.id,
                involvement_date=c.involvement_date,
                comments=c.comments,
            )
        )
    return out


def _build_company_credits(
    session: Session, credits: list[CompanyCreditCreate]
) -> list[CompanyRoleItemLink]:
    out: list[CompanyRoleItemLink] = []
    seen: set[tuple[int, int]] = set()
    for c in credits:
        company = get_or_create_company(
            session, company_id=c.company_id, name=c.company_name
        )
        role = get_or_create_company_role(session, c.role_name)
        if (company.id, role.id) in seen:
            continue
        seen.add((company.id, role.id))
        out.append(
            CompanyRoleItemLink(
                company_id=company.id,
                role_id=role.id,
                involvement_date=c.involvement_date,
                comments=c.comments,
            )
        )
    return out


# ============================================================
# Create / update / delete
# ============================================================

def create_item(session: Session, data: ItemCreate) -> Item:
    try:
        item = Item(
            release_date=data.release_date,
            cover_image_path=data.cover_image_path,
            icon_image_path=data.icon_image_path,
            is_owned=data.is_owned,
            item_type=get_item_type(session, data.details.type_name),
            selected_language=_language_or_none(session, data.selected_language_code),
            language_links=_build_language_links(session, data.language_codes),
            titles=_build_titles(session, data.titles),
            author_credits=_build_author_credits(session, data.author_credits),
            company_credits=_build_company_credits(session, data.company_credits),
        )
        detail = DETAIL_BUILDERS[data.details.type_name](session, item, data.details)
        session.add(item)
        session.add(detail)
        session.commit()
        item_id = item.id
    except Exception:
        session.rollback()
        raise
    return get_item(session, item_id)


def update_item(session: Session, item_id: int, data: ItemUpdate) -> Optional[Item]:
    """Partial update. Omitted fields are untouched; a list replaces the whole collection."""
    item = get_item(session, item_id)
    if item is None:
        return None
    sent = data.model_fields_set  # tells "omitted" apart from "explicit null"
    try:
        for field in ("release_date", "cover_image_path", "icon_image_path", "is_owned"):
            if field in sent:
                setattr(item, field, getattr(data, field))
        if "selected_language_code" in sent:
            item.selected_language = _language_or_none(session, data.selected_language_code)
        if data.language_codes is not None:
            item.language_links = _build_language_links(session, data.language_codes)
        if data.titles is not None:
            item.titles = _build_titles(session, data.titles)
        if data.author_credits is not None:
            item.author_credits = _build_author_credits(session, data.author_credits)
        if data.company_credits is not None:
            item.company_credits = _build_company_credits(session, data.company_credits)
        session.commit()
    except Exception:
        session.rollback()
        raise
    return get_item(session, item_id)


def delete_item(session: Session, item_id: int) -> bool:
    item = session.get(Item, item_id)
    if item is None:
        return False
    try:
        for model in _SUBTYPE_MODELS:
            session.exec(sa_delete(model).where(model.id == item_id))
        session.delete(item)
        session.commit()
    except Exception:
        session.rollback()
        raise
    return True