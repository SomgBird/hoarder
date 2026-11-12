from fastapi import APIRouter, Depends, File, Query, Response, UploadFile, status
from sqlmodel import Session

from app.database import get_session
from app.config import MAX_UPLOAD_BYTES
from app.db import crud
from app.db.models import Item
from app.db.schemas import ItemCreate, ItemListEntryRead, ItemRead, ItemUpdate, Page
from app.errors import NotFoundError, PayloadTooLargeError
from app.media import remove_unused_image, store_cover, store_icon, store_icon_from_cover

router = APIRouter(prefix="/items", tags=["items"])

# Errors (404 item_not_found, 422 invalid_reference, 409 ...) are raised by crud as
# AppError subclasses and turned into JSON by app.errors, so routes stay thin.


# Declared before "/{item_id}" so "itemlist" is not parsed as an id.
@router.get("/itemlist", response_model=Page[ItemListEntryRead])
def item_list(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
):
    return crud.get_item_list(session, offset, limit)


@router.get("/{item_id}", response_model=ItemRead)
def get_item(item_id: int, session: Session = Depends(get_session)):
    return crud.get_item(session, item_id)


@router.post("/", response_model=ItemRead, status_code=status.HTTP_201_CREATED)
def create_item(payload: ItemCreate, session: Session = Depends(get_session)):
    # TODO: check if already exists
    return crud.create_item(session, payload)


@router.patch("/{item_id}", response_model=ItemRead)
def update_item(item_id: int, payload: ItemUpdate, session: Session = Depends(get_session)):
    return crud.update_item(session, item_id, payload)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, session: Session = Depends(get_session)):
    item = session.get(Item, item_id)
    previous_images = (item.cover_image_path, item.icon_image_path) if item else ()
    crud.delete_item(session, item_id)
    for path in set(previous_images):
        remove_unused_image(session, path)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{item_id}/cover", response_model=ItemRead)
def upload_cover(item_id: int, file: UploadFile = File(...), session: Session = Depends(get_session)):
    return _upload_image(item_id, file, session, "cover")


@router.post("/{item_id}/icon", response_model=ItemRead)
def upload_icon(item_id: int, file: UploadFile = File(...), session: Session = Depends(get_session)):
    return _upload_image(item_id, file, session, "icon")


@router.post("/{item_id}/icon/from-cover", response_model=ItemRead)
def generate_icon_from_cover(item_id: int, session: Session = Depends(get_session)):
    item = session.get(Item, item_id)
    if item is None:
        raise NotFoundError("item", item_id)
    previous_icon = item.icon_image_path
    path = store_icon_from_cover(item_id, item.cover_image_path)
    return _replace_image(item_id, path, previous_icon, session, "icon")


def _upload_image(item_id: int, file: UploadFile, session: Session, kind: str):
    item = session.get(Item, item_id)
    if item is None:
        raise NotFoundError("item", item_id)
    field = f"{kind}_image_path"
    previous_cover = getattr(item, field)
    content = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise PayloadTooLargeError("Image must be no larger than 5 MB.")
    path = (store_cover if kind == "cover" else store_icon)(item_id, content, file.content_type)
    return _replace_image(item_id, path, previous_cover, session, kind)


def _replace_image(item_id: int, path: str, previous_path: str | None, session: Session, kind: str):
    field = f"{kind}_image_path"
    try:
        updated = crud.update_item(session, item_id, ItemUpdate(**{field: path}))
    except Exception:
        session.rollback()
        remove_unused_image(session, path)
        raise
    remove_unused_image(session, previous_path)
    return updated
