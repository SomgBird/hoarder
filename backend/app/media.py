"""Validate and store item images under generated, server-owned filenames."""
from io import BytesIO
import logging
from pathlib import Path
import re
from uuid import uuid4
import warnings

from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy import or_
from sqlmodel import Session, select

from app.config import (
    ALLOWED_IMAGE_TYPES, COVERS_DIR, COVERS_URL_PREFIX,
    ICONS_DIR, ICONS_URL_PREFIX, MAX_COVER_PIXELS,
)
from app.db.models import CopyPhoto, Item
from app.errors import AppError

logger = logging.getLogger(__name__)
IMAGE_FILENAME = r"\d+-[0-9a-f]{32}\.(jpg|png|webp|ico)"
ICON_SIZES = [(16, 16), (32, 32), (64, 64)]


def store_cover(item_id: int, content: bytes, content_type: str | None) -> str:
    return _store_uploaded_image(item_id, content, content_type, COVERS_DIR, COVERS_URL_PREFIX)


def store_icon(item_id: int, content: bytes, content_type: str | None) -> str:
    return _store_uploaded_image(item_id, content, content_type, ICONS_DIR, ICONS_URL_PREFIX)


def _store_uploaded_image(item_id: int, content: bytes, content_type: str | None, directory: Path, url_prefix: str) -> str:
    extension = ALLOWED_IMAGE_TYPES.get(content_type or "")
    if extension is None:
        raise AppError("Choose a JPEG, PNG or WebP image.", code="invalid_image_type")
    formats = {"image/jpeg": "JPEG", "image/png": "PNG", "image/webp": "WEBP"}
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(content)) as image:
                if image.format != formats[content_type]:
                    raise AppError("Image content does not match its declared type.", code="invalid_image_type")
                if image.width * image.height > MAX_COVER_PIXELS:
                    raise AppError("Image dimensions are too large.", code="image_too_large")
                image.verify()
            # Decode and re-encode so only image data is served back to browsers.
            with Image.open(BytesIO(content)) as image:
                image.load()
                output = BytesIO()
                ImageOps.exif_transpose(image).save(output, format=formats[content_type])
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError,
            Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise AppError("The file is not a valid image.", code="invalid_image") from exc

    return _store_image(item_id, output.getvalue(), extension, directory, url_prefix)


def store_icon_from_cover(item_id: int, cover_path: str | None) -> str:
    """Keep all icon sizes in one ICO, fitting the whole cover into each square."""
    source = _image_location(cover_path)
    if source is None:
        raise AppError("Upload a cover before generating an icon.", code="cover_required")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(source) as image:
                if image.width * image.height > MAX_COVER_PIXELS:
                    raise AppError("Image dimensions are too large.", code="image_too_large")
                image.load()
                cover = ImageOps.exif_transpose(image).convert("RGBA")
                # Resize from the original at each size for crisp small icons.
                frames = []
                for size in ICON_SIZES:
                    fitted = ImageOps.contain(cover, size, Image.Resampling.LANCZOS)
                    frame = Image.new("RGBA", size)
                    frame.paste(fitted, ((size[0] - fitted.width) // 2, (size[1] - fitted.height) // 2))
                    frames.append(frame)
                output = BytesIO()
                frames[-1].save(output, format="ICO", sizes=ICON_SIZES, append_images=frames[:-1])
    except FileNotFoundError as exc:
        raise AppError("The saved cover is missing. Upload a cover and retry.", code="cover_required") from exc
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError,
            Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise AppError("The saved cover is not a valid image. Upload another cover and retry.", code="invalid_image") from exc
    return _store_image(item_id, output.getvalue(), ".ico", ICONS_DIR, ICONS_URL_PREFIX)


def _store_image(item_id: int, content: bytes, extension: str, directory: Path, url_prefix: str) -> str:
    filename = f"{item_id}-{uuid4().hex}{extension}"
    destination = directory / filename
    temporary = destination.with_suffix(".tmp")
    try:
        temporary.write_bytes(content)
        temporary.replace(destination)
    finally:
        temporary.unlink(missing_ok=True)
    return f"{url_prefix}/{filename}"


def _image_location(path: str | None) -> Path | None:
    for prefix, directory in ((COVERS_URL_PREFIX, COVERS_DIR), (ICONS_URL_PREFIX, ICONS_DIR)):
        if path and path.startswith(f"{prefix}/"):
            filename = path.removeprefix(f"{prefix}/")
            if re.fullmatch(IMAGE_FILENAME, filename):
                return directory / filename
    return None


def remove_unused_image(session: Session, path: str | None) -> None:
    """Never delete arbitrary user paths or an image still used by an item or photo."""
    source = _image_location(path)
    if source is None:
        return
    if session.exec(select(Item.id).where(or_(Item.cover_image_path == path, Item.icon_image_path == path)).limit(1)).first() is not None:
        return
    if session.exec(select(CopyPhoto.id).where(CopyPhoto.file_path == path).limit(1)).first() is not None:
        return
    try:
        source.unlink(missing_ok=True)
    except OSError:
        # A cleanup failure must not turn a committed upload into a failed request.
        logger.warning("Could not remove unused image %s", source.name, exc_info=True)


def migrate_icons(session: Session) -> None:
    """Move legacy icons out of covers without removing files used as covers."""
    migrated: dict[str, str] = {}
    try:
        for item in session.exec(select(Item).where(Item.icon_image_path.startswith(f"{COVERS_URL_PREFIX}/"))).all():
            previous = item.icon_image_path
            source = _image_location(previous)
            if source is None:
                continue
            if previous not in migrated:
                if not source.is_file():
                    logger.warning("Could not migrate missing icon %s", source.name)
                    continue
                migrated[previous] = _store_image(item.id, source.read_bytes(), source.suffix, ICONS_DIR, ICONS_URL_PREFIX)
            item.icon_image_path = migrated[previous]
            session.add(item)
        session.commit()
    except Exception:
        session.rollback()
        for path in migrated.values():
            remove_unused_image(session, path)
        raise
    for path in migrated:
        remove_unused_image(session, path)
