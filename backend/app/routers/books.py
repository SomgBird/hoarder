# backend/routers/books.py
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlmodel import Session

from app.database import get_session
from app.schemas import BookCreate, BookRead, BookUpdate
from app import crud

router = APIRouter(prefix="/books", tags=["books"])

# ---------- Cover image storage ----------
MEDIA_ROOT = Path(__file__).resolve().parent.parent / "media" / "covers"
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB


def _delete_cover_file(stored_path: str) -> None:
    if not stored_path:
        return
    relative = stored_path.removeprefix("/media/covers/")
    target = (MEDIA_ROOT / relative).resolve()
    try:
        target.relative_to(MEDIA_ROOT)
    except ValueError:
        return
    target.unlink(missing_ok=True)


# ---------- CRUD ----------
@router.post("/", response_model=BookRead, status_code=status.HTTP_201_CREATED)
def create_book(payload: BookCreate, session: Session = Depends(get_session)):
    return crud.create_book(session, payload)


@router.get("/", response_model=List[BookRead])
def list_books(
    offset: int = 0,
    limit: int = Query(default=20, le=100),
    session: Session = Depends(get_session),
):
    return crud.list_books(session, offset, limit)


@router.get("/{book_id}", response_model=BookRead)
def get_book(book_id: int, session: Session = Depends(get_session)):
    book = crud.get_book(session, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.patch("/{book_id}", response_model=BookRead)
def update_book(
    book_id: int,
    payload: BookUpdate,
    session: Session = Depends(get_session),
):
    book = crud.get_book(session, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return crud.update_book(session, book, payload)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: int, session: Session = Depends(get_session)):
    book = crud.get_book(session, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    crud.delete_book(session, book)


# ---------- Cover ----------
@router.post("/{book_id}/cover", response_model=BookRead)
async def upload_cover(
    book_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    book = crud.get_book(session, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported type {file.content_type}. Allowed: {list(ALLOWED_TYPES)}",
        )

    contents = await file.read()
    if len(contents) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Max 5 MB")

    ext = ALLOWED_TYPES[file.content_type]
    filename = f"{uuid.uuid4().hex}{ext}"
    (MEDIA_ROOT / filename).write_bytes(contents)

    if book.cover_image_path:
        _delete_cover_file(book.cover_image_path)

    book.cover_image_path = f"/media/covers/{filename}"
    book.updated_at = datetime.utcnow()
    session.add(book)
    session.commit()
    session.refresh(book)
    return book


@router.delete("/{book_id}/cover", response_model=BookRead)
def delete_cover(book_id: int, session: Session = Depends(get_session)):
    book = crud.get_book(session, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.cover_image_path:
        _delete_cover_file(book.cover_image_path)
        book.cover_image_path = None
        book.updated_at = datetime.utcnow()
        session.add(book)
        session.commit()
        session.refresh(book)
    return book