# backend/app/main.py
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import CORS_ORIGINS, MEDIA_DIR, MEDIA_URL_PREFIX
from app.database import create_db_and_tables
from app.routers import books


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="Book API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MEDIA_DIR is already created by config.py, and is absolute —
# so this works no matter where uvicorn is launched from.
app.mount(MEDIA_URL_PREFIX, StaticFiles(directory=MEDIA_DIR), name="media")

app.include_router(books.router)


@app.get("/")
def root():
    return {"status": "ok"}