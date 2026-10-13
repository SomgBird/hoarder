from fastapi import APIRouter, Depends, File, HTTPException, Query, status
from sqlmodel import Session

from app.db import crud
from app.database import get_session
from app.db.schemas import ItemCreate, ItemRead, ItemListEntryRead, Page


router = APIRouter(prefix="/items", tags=["items"])


@router.get("/items/itemlist", response_model=Page[ItemListEntryRead])
def get_itemlist(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    session: Session = Depends(get_session),
):
    items = crud.list_items(session, offset=offset, limit=limit)
    total = crud.count_items(session)
    return Page(items=items, total=total, offset=offset, limit=limit)


@router.get("/items/{item_id}", response_model=ItemRead)
def get_item(item_id: int, session: Session = Depends(get_session)):
    item = crud.get_item(session, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("/items/", response_model=ItemRead, status_code=status.HTTP_201_CREATED)
def create_item(payload: ItemCreate, session: Session = Depends(get_session)):
    # TODO: check if already exists
    return crud.create_item(session, payload)