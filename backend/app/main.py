from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import COVERS_DIR
from app.database import create_db_and_tables
from app.routers import books, reference


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="Book Library API", lifespan=lifespan)

# Adjust to your actual frontend origin(s) in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books.router)
app.include_router(reference.router)

# Serves uploaded cover images at /media/covers/<filename>.
app.mount("/media/covers", StaticFiles(directory=COVERS_DIR), name="covers")


@app.get("/health")
def health():
    return {"status": "ok"}