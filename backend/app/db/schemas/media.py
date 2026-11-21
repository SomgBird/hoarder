"""Media file listing responses."""
from .base import _Read


class MediaCopyPhotoRead(_Read):
    copy_id: int
    name: str | None
    description: str | None


class MediaFileRead(_Read):
    name: str
    relative_path: str
    path: str
    size_bytes: int
    copy_photos: list[MediaCopyPhotoRead]
