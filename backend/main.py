from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select
from db import create_db_and_tables, get_session
from models import Item
from schemas import ItemCreate
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional




@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield
    # anything after yield runs on shutdown — nothing needed here yet

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/items")
def list_items(search: Optional[str] = None, session: Session = Depends(get_session)):
    query = select(Item)
    if search:
        query = query.where(Item.title.contains(search))
    return session.exec(query).all()


@app.post("/items", response_model=Item, status_code=201)
def create_item(payload: ItemCreate, session: Session = Depends(get_session)):
    item = Item(**payload.model_dump())
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@app.get("/items/{item_id}")
def get_item(item_id: int, session: Session = Depends(get_session)):
    item = session.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
