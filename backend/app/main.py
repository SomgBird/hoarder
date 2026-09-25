from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .database import create_db_and_tables
from .routers import books

MEDIA_DIR = Path("media")
MEDIA_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="Book API", lifespan=lifespan)

app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")
app.include_router(books.router)