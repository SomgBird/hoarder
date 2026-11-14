"""Media file listing responses."""
from .base import _Read


class MediaFileRead(_Read):
    name: str
    relative_path: str
    path: str
    size_bytes: int
