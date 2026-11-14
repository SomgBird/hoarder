"""Database tables and metadata registration."""

# Import every table so SQLModel metadata and string relationships are registered.
from .links import (
    ItemLanguageLink,
    ItemFranchiseLink,
    ItemGenreLink,
    ItemTagLink,
    ItemTypeFormatLink,
    ItemTypeGenreLink,
)
from .items import (
    Item,
    Title,
)
from .reference import (
    ItemType,
    Format,
    Language,
    Franchise,
    Genre,
    ItemTag,
    Scale,
    Journal,
    GamePlatform,
)
from .credits import (
    Author,
    AuthorRole,
    AuthorRoleItemLink,
    Company,
    CompanyRole,
    CompanyRoleItemLink,
)
from .details import (
    Film,
    BoardGame,
    VideoGame,
    Book,
    JournalIssue,
    Figurine,
    Miniature,
    LegoSet,
)
from .barcodes import (
    BarcodeType,
    Barcode,
)
from .ownership import (
    ConditionType,
    OwnedCopy,
    Condition,
    CopyPhoto,
)

__all__ = [
    "Author",
    "AuthorRole",
    "AuthorRoleItemLink",
    "Barcode",
    "BarcodeType",
    "BoardGame",
    "Book",
    "Company",
    "CompanyRole",
    "CompanyRoleItemLink",
    "Condition",
    "ConditionType",
    "CopyPhoto",
    "Figurine",
    "Film",
    "Format",
    "Franchise",
    "GamePlatform",
    "Genre",
    "Item",
    "ItemFranchiseLink",
    "ItemGenreLink",
    "ItemLanguageLink",
    "ItemTag",
    "ItemTagLink",
    "ItemType",
    "ItemTypeFormatLink",
    "ItemTypeGenreLink",
    "Journal",
    "JournalIssue",
    "Language",
    "LegoSet",
    "Miniature",
    "OwnedCopy",
    "Scale",
    "Title",
    "VideoGame",
]
