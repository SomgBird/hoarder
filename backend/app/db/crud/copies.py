"""Writes for the editable fields of an individual owned copy."""
from hashlib import sha256

from sqlalchemy import func
from sqlalchemy.dialects.sqlite import insert
from sqlmodel import Session, select

from app.db.models import Condition, ConditionType, Item, OwnedCopy
from app.db.models.ownership import CopySubmission
from app.db.schemas.parts import OwnedCopyCreate, OwnedCopyWrite
from app.errors import ConflictError, NotFoundError

from .lookups import _require


def _apply(session: Session, copy: OwnedCopy, payload: OwnedCopyWrite) -> None:
    if payload.condition_type_id is not None:
        _require(session, ConditionType, payload.condition_type_id, "condition_type")
    copy.notes = payload.notes
    if payload.condition_type_id is None and payload.condition_notes is None:
        copy.condition = None
    else:
        if copy.condition is None:
            copy.condition = Condition()
        copy.condition.condition_type_id = payload.condition_type_id
        copy.condition.notes = payload.condition_notes


def create_copy(session: Session, item_id: int, payload: OwnedCopyCreate) -> None:
    if session.get(Item, item_id) is None:
        raise NotFoundError("item", item_id)
    content = payload.model_dump_json(exclude={"request_id"}).encode()
    fingerprint = sha256(content).hexdigest()
    # Allocate in one SQLite write. Include legacy copies and retired numbers
    # so a delayed edit or removal can never address a replacement on this item.
    last_copy = select(func.coalesce(func.max(OwnedCopy.id), 0)).scalar_subquery()
    last_reserved = select(func.coalesce(func.max(CopySubmission.copy_id), 0)).scalar_subquery()
    reserve = insert(CopySubmission).values(
        copy_id=func.max(last_copy, last_reserved) + 1, item_id=item_id,
        request_id=payload.request_id, payload_hash=fingerprint,
    ).on_conflict_do_nothing(index_elements=[CopySubmission.request_id]).returning(CopySubmission.copy_id)
    copy_id = session.execute(reserve).scalar_one_or_none()
    if copy_id is not None:
        try:
            copy = OwnedCopy(id=copy_id, item_id=item_id)
            _apply(session, copy, payload)
            session.add(copy)
            session.commit()
        except Exception:
            session.rollback()
            raise
        return
    # ON CONFLICT did no work. Release SQLite's write lock before replaying.
    session.rollback()
    receipt = session.exec(select(CopySubmission).where(CopySubmission.request_id == payload.request_id)).one()
    if receipt.item_id != item_id or receipt.payload_hash != fingerprint:
        raise ConflictError("This submission was already saved. Refresh Explorer to edit the saved copy.")
    if session.get(OwnedCopy, receipt.copy_id) is None:
        raise ConflictError("The saved copy has since been removed. Start a new copy to add another.")


def _get_copy(session: Session, item_id: int, copy_id: int) -> OwnedCopy:
    copy = session.get(OwnedCopy, copy_id)
    if copy is None or copy.item_id != item_id:
        raise NotFoundError("owned_copy", copy_id)
    return copy


def update_copy(session: Session, item_id: int, copy_id: int, payload: OwnedCopyWrite) -> None:
    copy = _get_copy(session, item_id, copy_id)
    _apply(session, copy, payload)
    session.commit()


def delete_copy(session: Session, item_id: int, copy_id: int) -> set[str]:
    receipt = session.get(CopySubmission, copy_id)
    if receipt and receipt.item_id == item_id and session.get(OwnedCopy, copy_id) is None:
        return set()  # A retry after a successful removal.
    copy = _get_copy(session, item_id, copy_id)
    if receipt is None:
        session.add(CopySubmission(copy_id=copy_id, item_id=item_id))
    paths = {photo.file_path for photo in copy.photos}
    session.delete(copy)
    session.commit()
    return paths
