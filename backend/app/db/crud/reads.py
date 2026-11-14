"""Item loading, response assembly, search, sorting, and pagination."""
from datetime import date

from sqlalchemy import func, or_
from sqlalchemy.orm import joinedload, selectinload
from sqlmodel import Session, select

from app.db.models import (
    AuthorRoleItemLink,
    Barcode,
    CompanyRoleItemLink,
    Item,
    ItemLanguageLink,
    ItemType,
    OwnedCopy,
    Title,
)
from app.db.schemas import ItemListEntryRead, ItemRead, ItemSortDirection, ItemSortField, Page
from app.errors import NotFoundError
from app.names import name_key

from .details import _SUBTYPES


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
        .where(Title.item_id == Item.id, Title.language_id == Item.selected_language_id, func.hoarder_name_key(Title.title_text) != "")
        .order_by(Title.id)
        .limit(1)
        .scalar_subquery()
    )
    any_language = (
        select(Title.title_text)
        .where(Title.item_id == Item.id, func.hoarder_name_key(Title.title_text) != "")
        .order_by(Title.id)
        .limit(1)
        .scalar_subquery()
    )
    type_name = (
        select(ItemType.name).where(ItemType.id == Item.item_type_id).scalar_subquery()
    )
    return select(
        Item.id,
        func.coalesce(in_selected_language, any_language, "Untitled").label("title"),
        type_name.label("item_type"),
        Item.release_date,
        Item.date_added,
        func.coalesce(Item.is_owned, False).label("is_owned"),
        Item.icon_image_path,
        Item.description,
    )


def get_item_list_entry(session: Session, item_id: int) -> ItemListEntryRead:
    row = session.exec(_list_query().where(Item.id == item_id)).first()
    if row is None:
        raise NotFoundError("item", item_id)
    return ItemListEntryRead(**row._mapping)


def get_item_list(
    session: Session, offset: int = 0, limit: int = 20,
    sort_by: ItemSortField | None = None, sort_direction: ItemSortDirection = "asc",
    item_type: str | None = None,
    q: str = "",
    *,
    is_owned: bool | None = None,
    release_date_from: date | None = None,
    release_date_to: date | None = None,
    date_added_from: date | None = None,
    date_added_to: date | None = None,
) -> Page[ItemListEntryRead]:
    query = _list_query()
    count_query = select(func.count()).select_from(Item)
    filters = []
    if item_type is not None:
        type_id = select(ItemType.id).where(ItemType.name == item_type).scalar_subquery()
        filters.append(Item.item_type_id == type_id)
    if is_owned is not None:
        # The list represents an unset ownership value as not owned, too.
        filters.append(func.coalesce(Item.is_owned, False) == is_owned)
    for column, lower, upper in (
        (Item.release_date, release_date_from, release_date_to),
        (Item.date_added, date_added_from, date_added_to),
    ):
        if lower is not None:
            filters.append(column >= lower)
        if upper is not None:
            filters.append(column <= upper)
    search = name_key(q)
    if search:
        # EXISTS keeps one row per item even when several translated titles match.
        matches_title = select(Title.id).where(
            Title.item_id == Item.id,
            or_(
                func.instr(func.hoarder_name_key(Title.title_text), search) > 0,
                func.instr(func.hoarder_name_key(Title.short_text), search) > 0,
            ),
        ).exists()
        filters.append(matches_title)
    if filters:
        query = query.where(*filters)
        count_query = count_query.where(*filters)
    if sort_by is not None:
        column = query.selected_columns[sort_by]
        if sort_by == "title":
            column = func.hoarder_name_key(column)
        order = column.desc() if sort_direction == "desc" else column.asc()
        query = query.order_by(order.nulls_last())
    # Stable ties keep items from moving between pages. Unknown dates go last.
    rows = session.exec(query.order_by(Item.id).offset(offset).limit(limit)).all()
    total = session.exec(count_query).one()
    return Page(
        items=[ItemListEntryRead(**r._mapping) for r in rows],
        total=total,
        offset=offset,
        limit=limit,
    )
