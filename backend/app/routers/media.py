from urllib.parse import quote

from fastapi import APIRouter

from app.config import MEDIA_DIR, MEDIA_URL_PREFIX
from app.db.schemas import MediaFileRead

router = APIRouter(prefix=MEDIA_URL_PREFIX, tags=["media"])
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".ico", ".gif", ".bmp", ".svg", ".avif"}


@router.get("/", response_model=list[MediaFileRead])
def list_media():
    files = []
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
        files.append(MediaFileRead(
            name=source.name,
            relative_path=relative.as_posix(),
            path=f"{MEDIA_URL_PREFIX}/{quote(relative.as_posix(), safe='/')}",
            size_bytes=size,
        ))
    return sorted(files, key=lambda file: file.relative_path.casefold())
