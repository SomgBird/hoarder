import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlmodel import Session

from ..database import get_session
from ..models import Book
from ..schemas import BookRead
from .. import crud

router = APIRouter(prefix="/books", tags=["books"])

MEDIA_ROOT = Path("media/covers").resolve()
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_BYTES = 5 * 1024 * 1024   # 5 MB


def _delete_cover_file(stored_path: str) -> None:
    """Delete a cover safely — only if it lives inside MEDIA_ROOT."""
    if not stored_path:
        return
    # stored_path looks like "/media/covers/<uuid>.jpg"
    relative = stored_path.removeprefix("/media/covers/")
    target = (MEDIA_ROOT / relative).resolve()
    try:
        target.relative_to(MEDIA_ROOT)   # will raise if outside
    except ValueError:
        return
    target.unlink(missing_ok=True)


@router.post("/{book_id}/cover", response_model=BookRead)
async def upload_cover(
    book_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    book = crud.get_book(session, book_id)
    if not book:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Book not found")

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Unsupported type {file.content_type}. Allowed: {list(ALLOWED_TYPES)}",
        )

    contents = await file.read()
    if len(contents) > MAX_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Max 5 MB")

    ext = ALLOWED_TYPES[file.content_type]
    filename = f"{uuid.uuid4().hex}{ext}"
    (MEDIA_ROOT / filename).write_bytes(contents)

    # Remove the previous cover file (if any)
    if book.cover_image_path:
        _delete_cover_file(book.cover_image_path)

    # Save relative URL path — not an absolute path, not the file itself
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
        raise HTTPException(404, "Book not found")
    if book.cover_image_path:
        _delete_cover_file(book.cover_image_path)
        book.cover_image_path = None
        book.updated_at = datetime.utcnow()
        session.add(book)
        session.commit()
        session.refresh(book)
    return book