from sqlalchemy import func, literal
from sqlalchemy.dialects.sqlite import insert
from sqlmodel import Session, select

from app.db.models import Franchise, FranchisePage, Item, ItemFranchiseLink, ItemType
from app.db.schemas.franchise_pages import FranchiseMemberRead, FranchisePageRead, FranchisePageSummary
from app.errors import NotFoundError

from .reads import display_title_column


def list_franchise_pages(session: Session) -> list[FranchisePageSummary]:
    rows = session.exec(
        select(Franchise.id, Franchise.name)
        .join(FranchisePage, FranchisePage.franchise_id == Franchise.id)
        .order_by(func.hoarder_name_key(Franchise.name), Franchise.id)
    )
    return [FranchisePageSummary(id=id_, title=name) for id_, name in rows]


def get_franchise_page(session: Session, franchise_id: int) -> FranchisePageRead:
    page = session.exec(
        select(Franchise.name, FranchisePage.introduction)
        .outerjoin(FranchisePage, FranchisePage.franchise_id == Franchise.id)
        .where(Franchise.id == franchise_id)
    ).first()
    if page is None:
        raise NotFoundError("franchise", franchise_id)
    title = display_title_column()
    members = session.exec(
        select(Item.id, title, ItemType.name.label("item_type"))
        .select_from(Item)
        .join(ItemFranchiseLink, ItemFranchiseLink.item_id == Item.id)
        .join(ItemType, ItemType.id == Item.item_type_id)
        .where(ItemFranchiseLink.franchise_id == franchise_id)
        .order_by(func.hoarder_name_key(title), Item.id)
    )
    return FranchisePageRead(
        id=franchise_id,
        title=page.name,
        introduction=page.introduction,
        members=[FranchiseMemberRead(**row._mapping) for row in members],
    )


def save_franchise_page(session: Session, franchise_id: int, introduction: str) -> FranchisePageRead:
    with session.begin():
        statement = insert(FranchisePage).from_select(
            [FranchisePage.franchise_id, FranchisePage.introduction],
            select(Franchise.id, literal(introduction)).where(Franchise.id == franchise_id),
        ).on_conflict_do_update(
            index_elements=[FranchisePage.franchise_id],
            set_={"introduction": introduction},
        ).returning(FranchisePage.franchise_id)
        if session.execute(statement).scalar_one_or_none() is None:
            raise NotFoundError("franchise", franchise_id)
        return get_franchise_page(session, franchise_id)
