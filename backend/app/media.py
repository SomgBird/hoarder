"""Validate and store item images under generated, server-owned filenames."""
from io import BytesIO
import logging
import re
from uuid import uuid4
import warnings

from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy import or_
from sqlmodel import Session, select

from app.config import ALLOWED_IMAGE_TYPES, COVERS_DIR, COVERS_URL_PREFIX, MAX_COVER_PIXELS
from app.db.models import Item
from app.errors import AppError

logger = logging.getLogger(__name__)


def store_cover(item_id: int, content: bytes, content_type: str | None) -> str:
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

    filename = f"{item_id}-{uuid4().hex}{extension}"
    destination = COVERS_DIR / filename
    temporary = destination.with_suffix(".tmp")
    try:
        temporary.write_bytes(output.getvalue())
        temporary.replace(destination)
    finally:
        temporary.unlink(missing_ok=True)
    return f"{COVERS_URL_PREFIX}/{filename}"


def remove_unused_cover(session: Session, path: str | None) -> None:
    """Never delete arbitrary user paths or a cover referenced by another item."""
    if not path or not path.startswith(f"{COVERS_URL_PREFIX}/"):
        return
    filename = path.removeprefix(f"{COVERS_URL_PREFIX}/")
    if not re.fullmatch(r"\d+-[0-9a-f]{32}\.(jpg|png|webp)", filename):
        return
    if session.exec(select(Item.id).where(or_(Item.cover_image_path == path, Item.icon_image_path == path)).limit(1)).first() is not None:
        return
    try:
        (COVERS_DIR / filename).unlink(missing_ok=True)
    except OSError:
        # A cleanup failure must not turn a committed upload into a failed request.
        logger.warning("Could not remove unused cover %s", filename, exc_info=True)
