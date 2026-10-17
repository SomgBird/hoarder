from fastapi import APIRouter, Depends, File, HTTPException, Query, status
from sqlmodel import Session

from app.db import crud
from app.database import get_session
from app.db.schemas import ItemCreate, ItemRead, ItemListEntryRead, Page


router = APIRouter(prefix="/items", tags=["items"])


@router.get("/itemlist", response_model=Page[ItemListEntryRead])
def item_list(offset: int = 0, limit: int = 20, session: Session = Depends(get_session)):
    return crud.get_item_list(session, offset, limit)


@router.get("/{item_id}", response_model=ItemRead)
def get_item(item_id: int, session: Session = Depends(get_session)):
    item = crud.get_item(session, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("/", response_model=ItemRead, status_code=status.HTTP_201_CREATED)
def create_item(payload: ItemCreate, session: Session = Depends(get_session)):
    # TODO: check if already exists
    return crud.create_item(session, payload)