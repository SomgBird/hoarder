# backend/app/routers/books.py
import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlmodel import Session

from app.config import (
    ALLOWED_IMAGE_TYPES,
    COVERS_DIR,
    COVERS_URL_PREFIX,
    MAX_UPLOAD_BYTES,
)
from app.database import get_session
from app.schemas import BookCreate, BookRead, BookUpdate
from app import crud

router = APIRouter(prefix="/books", tags=["books"])


# ---------- cover file helpers ----------
def _delete_cover_file(stored_url_path: str) -> None:
    """Delete a stored cover given its URL path like '/media/covers/<uuid>.jpg'.

    Sandboxed: refuses to touch anything outside COVERS_DIR.
    """
    if not stored_url_path:
        return
    # Strip the URL prefix to get the bare filename.
    filename = stored_url_path.removeprefix(f"{COVERS_URL_PREFIX}/")
    target = (COVERS_DIR / filename).resolve()
    try:
        target.relative_to(COVERS_DIR.resolve())
    except ValueError:
        return   # outside the sandbox — ignore
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
    if book.cover_image_path:
        _delete_cover_file(book.cover_image_path)
    crud.delete_book(session, book)


# ---------- cover ----------
@router.post("/{book_id}/cover", response_model=BookRead)
async def upload_cover(
    book_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    book = crud.get_book(session, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported type {file.content_type}. "
                f"Allowed: {list(ALLOWED_IMAGE_TYPES)}"
            ),
        )

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large")

    ext = ALLOWED_IMAGE_TYPES[file.content_type]
    filename = f"{uuid.uuid4().hex}{ext}"
    (COVERS_DIR / filename).write_bytes(contents)

    # remove previous cover if any
    if book.cover_image_path:
        _delete_cover_file(book.cover_image_path)

    book.cover_image_path = f"{COVERS_URL_PREFIX}/{filename}"
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