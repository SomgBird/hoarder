from dataclasses import dataclass, field

from sqlalchemy import func
from sqlalchemy.orm import joinedload, selectinload
from sqlmodel import Session, SQLModel, select

from app.db.models import (
    Author,
    AuthorRole,
    AuthorRoleItemLink,
    BoardGame,
    Book,
    Barcode,
    BarcodeType,
    Company,
    CompanyRole,
    CompanyRoleItemLink,
    Figurine,
    Film,
    Format,
    Franchise,
    GamePlatform,
    Genre,
    Item,
    ItemLanguageLink,
    ItemTag,
    ItemType,
    ItemTypeFormatLink,
    ItemTypeGenreLink,
    Journal,
    JournalIssue,
    Language,
    LegoSet,
    Miniature,
    OwnedCopy,
    Scale,
    Title,
    VideoGame,
)
from sqlalchemy import delete as sa_delete
from app.db.schemas import (
    AuthorCreditCreate,
    BarcodeCreate,
    CompanyCreditCreate,
    ItemCreate,
    ItemDetailsCreate,
    ItemLanguageCreate,
    ItemListEntryRead,
    ItemRead,
    ItemUpdate,
    Page,
    TitleCreate,
    BookDetailsRead,
    BoardGameDetailsRead,
    FigurineDetailsRead,
    FilmDetailsRead,
    GameDetailsRead,
    JournalIssueDetailsRead,
    LegoSetDetailsRead,
    MiniatureDetailsRead,
)
from app.errors import ConflictError, InvalidReferenceError, NotFoundError


# ============================================================
# Lookups and get-or-create helpers
# These only flush, never commit, so they stay inside the
# caller's transaction and roll back with it.
# ============================================================

def _normalize(name: str | None) -> str:
    return " ".join((name or "").split())


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


def _get_or_create_named(session: Session, model, name: str | None):
    """Case-insensitive get-or-create for any table with a `name` column."""
    clean = _normalize(name)
    if not clean:
        raise InvalidReferenceError(model.__name__.lower(), name, f"{model.__name__} name is empty")
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
        return _require(session, Author, author_id, "author")
    return _get_or_create_named(session, Author, name)


def get_or_create_company(
    session: Session, *, company_id: int | None = None, name: str | None = None
) -> Company:
    if company_id is not None:
        return _require(session, Company, company_id, "company")
    return _get_or_create_named(session, Company, name)


def _language_or_none(session: Session, code: str | None) -> Language | None:
    return get_language(session, code) if code else None


# ============================================================
# Subtype registry (one entry per item type)
# To add a type: model in models.py, Create + Read schemas, and one line here
# (plus the item type in the builtin seed). Nothing else changes.
# ============================================================

@dataclass(frozen=True)
class _Subtype:
    model: type[SQLModel]
    read_schema: type[SQLModel]
    # detail field -> model it must reference (validated -> 422 instead of an FK error)
    refs: dict[str, type[SQLModel]] = field(default_factory=dict)


_SUBTYPES: dict[str, _Subtype] = {
    "book": _Subtype(Book, BookDetailsRead),
    "game": _Subtype(VideoGame, GameDetailsRead, {"game_platform_id": GamePlatform}),
    "film": _Subtype(Film, FilmDetailsRead),
    "board_game": _Subtype(BoardGame, BoardGameDetailsRead),
    "journal_issue": _Subtype(JournalIssue, JournalIssueDetailsRead, {"journal_id": Journal}),
    "figurine": _Subtype(Figurine, FigurineDetailsRead, {"scale_id": Scale}),
    "miniature": _Subtype(Miniature, MiniatureDetailsRead, {"scale_id": Scale}),
    "lego_set": _Subtype(LegoSet, LegoSetDetailsRead),
}


def _detail_values(
    session: Session, spec: _Subtype, details: ItemDetailsCreate, *, only_set: bool = False
) -> dict:
    """Column values for the subtype row. only_set=True is for partial updates."""
    values = details.model_dump(exclude={"type_name"}, exclude_unset=only_set)
    for column, ref_model in spec.refs.items():
        if values.get(column) is not None:
            _require(session, ref_model, values[column], column.removesuffix("_id"))
    return values


# ============================================================
# Scope checks: format / genres must be applicable to the item type
# ============================================================

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


# ============================================================
# Reads
# ============================================================

_ITEM_RELATIONS = (
    selectinload(Item.titles).joinedload(Title.language),
    selectinload(Item.selected_language),
    selectinload(Item.item_type),
    selectinload(Item.format),
    selectinload(Item.language_links).joinedload(ItemLanguageLink.language),
    selectinload(Item.genres),
    selectinload(Item.franchises),
    selectinload(Item.tags),
    selectinload(Item.barcodes).joinedload(Barcode.barcode_type),
    selectinload(Item.owned_copies).options(
        joinedload(OwnedCopy.condition),
        selectinload(OwnedCopy.photos),
    ),
    selectinload(Item.author_credits).options(
        joinedload(AuthorRoleItemLink.author),
        joinedload(AuthorRoleItemLink.role),
    ),
    selectinload(Item.company_credits).options(
        joinedload(CompanyRoleItemLink.company),
        joinedload(CompanyRoleItemLink.role),
    ),
)


def _load_item(session: Session, item_id: int) -> Item:
    item = session.exec(
        select(Item)
        .where(Item.id == item_id)
        .options(*_ITEM_RELATIONS)
        # always reload, so collections replaced by an update are re-read from the DB
        .execution_options(populate_existing=True)
    ).first()
    if item is None:
        raise NotFoundError("item", item_id)
    return item


def _to_read(session: Session, item: Item) -> ItemRead:
    read = ItemRead.model_validate(item)
    spec = _SUBTYPES.get(item.item_type.name)
    if spec is not None:
        detail = session.get(spec.model, item.id)
        if detail is not None:
            read.details = spec.read_schema.model_validate(detail)
    return read


def get_item(session: Session, item_id: int) -> ItemRead:
    """Raises NotFoundError (-> 404) if the item doesn't exist."""
    return _to_read(session, _load_item(session, item_id))


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
    type_name = (
        select(ItemType.name).where(ItemType.id == Item.item_type_id).scalar_subquery()
    )
    return select(
        Item.id,
        func.coalesce(in_selected_language, any_language, "").label("title"),
        type_name.label("item_type"),
        Item.release_date,
        func.coalesce(Item.is_owned, False).label("is_owned"),
        Item.icon_image_path,
    )


def get_item_list_entry(session: Session, item_id: int) -> ItemListEntryRead:
    row = session.exec(_list_query().where(Item.id == item_id)).first()
    if row is None:
        raise NotFoundError("item", item_id)
    return ItemListEntryRead(**row._mapping)


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

def _build_language_links(
    session: Session, languages: list[ItemLanguageCreate]
) -> list[ItemLanguageLink]:
    out: dict[str, ItemLanguageLink] = {}
    for lang in languages:
        if lang.language_code in out:
            continue
        out[lang.language_code] = ItemLanguageLink(
            language_id=get_language(session, lang.language_code).id,
            ui=lang.ui,
            text=lang.text,
            voice=lang.voice,
        )
    return list(out.values())


def _build_titles(session: Session, titles: list[TitleCreate]) -> list[Title]:
    return [
        Title(
            title_text=t.title_text,
            short_text=t.short_text,
            language_id=get_language(session, t.language_code).id,
        )
        for t in titles
    ]


def _build_tags(session: Session, names: list[str]) -> list[ItemTag]:
    tags: dict[int, ItemTag] = {}
    for name in names:
        tag = _get_or_create_named(session, ItemTag, name)
        tags[tag.id] = tag
    return list(tags.values())


def _build_barcodes(session: Session, barcodes: list[BarcodeCreate]) -> list[Barcode]:
    out: list[Barcode] = []
    for b in barcodes:
        if b.barcode_type_id is not None:
            _require(session, BarcodeType, b.barcode_type_id, "barcode_type")
        code = "".join(b.code.split())
        if not code:
            raise InvalidReferenceError("barcode", b.code, "Barcode is empty")
        out.append(Barcode(code=code, barcode_type_id=b.barcode_type_id))
    return out


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