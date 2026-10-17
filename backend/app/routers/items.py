from fastapi import APIRouter, Depends, Query, Response, status
from sqlmodel import Session

from app.database import get_session
from app.db import crud
from app.db.schemas import ItemCreate, ItemListEntryRead, ItemRead, ItemUpdate, Page

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
    crud.delete_item(session, item_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)