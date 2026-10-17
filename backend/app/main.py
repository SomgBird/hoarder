from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.database import create_db_and_tables, engine
from app.db.seed import seed_builtin
from app.errors import register_exception_handlers
from app.routers import items, reference


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()          # 1. tables first
    with Session(engine) as session:
        seed_builtin(session)       # 2. builtin reference data (idempotent, every startup)
    yield


app = FastAPI(lifespan=lifespan)
# The browser blocks cross-origin fetches (Vite dev server -> API) unless the API allows
# the origin. Swagger works without this because it is served from the API itself.
# Add your own origin here if you open the frontend from another host/port (e.g. home server).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
register_exception_handlers(app)
app.include_router(items.router)
app.include_router(reference.router)