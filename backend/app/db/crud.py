
from typing import Optional, Sequence

from sqlalchemy import func
from sqlalchemy.orm import load_only, selectinload
from sqlmodel import Session, select

from backend.app.db.models import Item

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