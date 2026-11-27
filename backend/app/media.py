"""Validate and store item images under generated, server-owned filenames."""
from collections.abc import Iterable
from io import BytesIO
import logging
from os import listdir
from pathlib import Path
import re
from urllib.parse import quote, unquote
from uuid import uuid4
import warnings

from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, TimeoutError as PoolTimeoutError
from sqlmodel import Session, select

from app.config import (
    ALLOWED_IMAGE_TYPES, COVERS_DIR, COVERS_URL_PREFIX, COPY_PHOTOS_DIR, COPY_PHOTOS_URL_PREFIX,
    ICONS_DIR, ICONS_URL_PREFIX, MAX_COVER_PIXELS, MEDIA_DIR, MEDIA_URL_PREFIX,
)
from app.db.models import ArticleGalleryEntry, CopyPhoto, Item
from app.errors import AppError

logger = logging.getLogger(__name__)
IMAGE_FILENAME = r"\d+-[0-9a-f]{32}\.(jpg|png|webp|ico)"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".ico", ".gif", ".bmp", ".svg", ".avif"}
ICON_SIZES = [(16, 16), (32, 32), (64, 64)]


def collection_image(root: Path, relative: str) -> Path | None:
    parts = relative.split("/")
    if "\\" in relative or any(not part or part.startswith(".") for part in parts):
        return None
    source = root.joinpath(*parts)
    if not source.is_relative_to(root) or source.suffix.lower() not in IMAGE_EXTENSIONS:
        return None
    try:
        if source.is_file() and source.resolve() == root.resolve().joinpath(*parts):
            return source
    except (OSError, ValueError):
        pass
    return None


def is_collection_image(path: str) -> bool:
    prefix = f"{MEDIA_URL_PREFIX}/"
    if not path.isascii() or not path.startswith(prefix):
        return False
    encoded = path.removeprefix(prefix)
    relative = unquote(encoded)
    if encoded != quote(relative):
        return False
    source = collection_image(MEDIA_DIR, relative)
    if source is None:
        return False
    if path == path.lower() or _image_location(path.lower()) is None:
        return True
    # An imported file may resemble an upload. Store the spelling the media
    # listing returns so cleanup can distinguish it from a generated file.
    try:
        return source.parent.name in listdir(MEDIA_DIR) and source.name in listdir(source.parent)
    except OSError:
        return False


def store_cover(item_id: int, content: bytes, content_type: str | None) -> str:
    return _store_uploaded_image(item_id, content, content_type, COVERS_DIR, COVERS_URL_PREFIX)


def store_icon(item_id: int, content: bytes, content_type: str | None) -> str:
    return _store_uploaded_image(item_id, content, content_type, ICONS_DIR, ICONS_URL_PREFIX)


def store_copy_photo(item_id: int, content: bytes, content_type: str | None) -> str:
    return _store_uploaded_image(item_id, content, content_type, COPY_PHOTOS_DIR, COPY_PHOTOS_URL_PREFIX)


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
    for prefix, directory in ((COVERS_URL_PREFIX, COVERS_DIR), (ICONS_URL_PREFIX, ICONS_DIR),
                              (COPY_PHOTOS_URL_PREFIX, COPY_PHOTOS_DIR)):
        if path and path.startswith(f"{prefix}/"):
            filename = path.removeprefix(f"{prefix}/")
            if re.fullmatch(IMAGE_FILENAME, filename):
                return directory / filename
    return None


def _generated_image(path: str | None) -> tuple[str, Path] | None:
    if not path:
        return None
    if not path.startswith("/"):
        path = f"{MEDIA_URL_PREFIX}/{path}"
    if not path.startswith(f"{MEDIA_URL_PREFIX}/"):
        return None
    canonical = path.lower()
    source = _image_location(canonical)
    if source is None:
        return None
    if canonical != path:
        # A legacy case variant can address the upload on a case-insensitive
        # volume, or a different imported file on a case-sensitive one.
        relative = path.removeprefix(f"{MEDIA_URL_PREFIX}/")
        try:
            if not source.samefile(source.parent.parent / relative):
                return None
        except FileNotFoundError:
            return None
    return canonical, source


def _image_in_use(session: Session, path: str, source: Path) -> bool:
    gallery = select(ArticleGalleryEntry.id).where(ArticleGalleryEntry.path == path).limit(1)
    if session.exec(gallery).first() is not None:
        return True
    aliases = (path, path.removeprefix(f"{MEDIA_URL_PREFIX}/"))
    for column in (Item.cover_image_path, Item.icon_image_path, CopyPhoto.file_path):
        query = select(column).where(column.collate("NOCASE").in_(aliases)).distinct()
        if any(stored in aliases or _generated_image(stored) == (path, source) for stored in session.exec(query)):
            return True
    return False


def remove_unused_images(session: Session, paths: Iterable[str | None]) -> None:
    """After commit or rollback, remove generated files that have no remaining references."""
    candidates: dict[Path, dict[str, str]] = {}
    try:
        for path in paths:
            generated = _generated_image(path)
            if generated is not None:
                canonical, source = generated
                candidates.setdefault(source.parent, {})[source.name] = canonical
        if not candidates:
            return
        with session.begin():
            # Keep gallery saves from adding a reference between the check and unlink.
            session.execute(text("BEGIN IMMEDIATE"))
            for directory, by_name in candidates.items():
                unused = {name for name, path in by_name.items() if not _image_in_use(session, path, directory / name)}
                # Unlink only exact generated names. A case-insensitive lookup
                # could otherwise remove a manually imported mixed-case file.
                if not unused or directory.name not in listdir(directory.parent):
                    continue
                for name in unused.intersection(listdir(directory)):
                    try:
                        (directory / name).unlink(missing_ok=True)
                    except OSError:
                        logger.warning("Could not remove unused image %s", name, exc_info=True)
    except (OSError, OperationalError, PoolTimeoutError):
        logger.warning("Could not check unused images", exc_info=True)


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
        remove_unused_images(session, migrated.values())
        raise
    remove_unused_images(session, migrated)
