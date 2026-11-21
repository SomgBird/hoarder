from urllib.parse import quote

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.config import MEDIA_DIR, MEDIA_URL_PREFIX
from app.database import get_session
from app.db.models import CopyPhoto
from app.db.schemas import MediaFileRead
from app.db.schemas.media import MediaCopyPhotoRead

router = APIRouter(prefix=MEDIA_URL_PREFIX, tags=["media"])
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".ico", ".gif", ".bmp", ".svg", ".avif"}


@router.get("/", response_model=list[MediaFileRead])
def list_media(session: Session = Depends(get_session)):
    files = []
    copies_by_path = {}
    for photo in session.exec(select(CopyPhoto).where(CopyPhoto.owned_copy_id.is_not(None)).order_by(CopyPhoto.id)):
        path = photo.file_path
        if not path.startswith(f"{MEDIA_URL_PREFIX}/"):
            path = f"{MEDIA_URL_PREFIX}/{quote(path)}"
        copies_by_path.setdefault(path, []).append(MediaCopyPhotoRead(
            copy_id=photo.owned_copy_id, name=photo.name, description=photo.description,
        ))
    root = MEDIA_DIR.resolve()
    for source in MEDIA_DIR.rglob("*"):
        if source.suffix.lower() not in IMAGE_EXTENSIONS or source.is_symlink() or not source.is_file():
            continue
        if not source.resolve().is_relative_to(root):
            continue
        relative = source.relative_to(MEDIA_DIR)
        if any(part.startswith(".") for part in relative.parts):
            continue
        try:
            size = source.stat().st_size
        except FileNotFoundError:
            # An upload may replace or delete an image during the scan.
            continue
        path = f"{MEDIA_URL_PREFIX}/{quote(relative.as_posix(), safe='/')}"
        files.append(MediaFileRead(
            name=source.name,
            relative_path=relative.as_posix(),
            path=path,
            size_bytes=size,
            copy_photos=copies_by_path.get(path, []),
        ))
    return sorted(files, key=lambda file: file.relative_path.casefold())
