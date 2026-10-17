"""Built-in reference data every install ships with.

Idempotent: safe to run on every startup. It only ADDS what is missing (matched by
unique name) and never overwrites or deletes rows, so the user's edits survive.
Does not create any items; see examples.py for that.
"""
import pycountry
from sqlmodel import Session, SQLModel, select

from app.db.models import (
    AuthorRole, BarcodeType, CompanyRole, ConditionType, Format, GamePlatform, Genre,
    ItemType, ItemTypeFormatLink, ItemTypeGenreLink, Language, Scale,
)

# ------------------------------------------------------------
# DATA
# ------------------------------------------------------------
# name must match the registry key in crud._SUBTYPES
ITEM_TYPES = [
    ("book", "Book"),
    ("game", "Video game"),
    ("film", "Film"),
    ("board_game", "Board game"),
    ("journal_issue", "Journal or magazine issue"),
    ("figurine", "Figurine"),
    ("miniature", "Miniature"),
    ("lego_set", "LEGO set"),
]

ALL_MEDIA = ["book", "game", "film", "board_game", "journal_issue"]

# (name, short_name, description, applicable item types)
FORMATS = [
    ("Hardcover", "HC", "Hardbound book", ["book"]),
    ("Paperback", "PB", "Softcover book", ["book"]),
    ("Mass Market Paperback", "MMPB", "Small, cheaply printed paperback", ["book"]),
    ("Boxed Set", "Box", "Several volumes sold together", ["book"]),
    ("Audiobook", "Audio", "Recorded reading", ["book"]),
    ("Cartridge", "Cart", "Cartridge-based game", ["game"]),
    ("Optical Disc", "Disc", "CD, DVD, Blu-ray or proprietary game disc", ["game"]),
    ("DVD", "DVD", None, ["film"]),
    ("Blu-ray", "BD", None, ["film"]),
    ("4K UHD Blu-ray", "UHD", None, ["film"]),
    ("VHS", "VHS", None, ["film"]),
    ("LaserDisc", "LD", None, ["film"]),
    ("Boxed", "Box", "Retail boxed edition", ["board_game"]),
    ("Print & Play", "PnP", "Printable files", ["board_game"]),
    ("Print", "Print", "Printed issue", ["journal_issue"]),
    ("Digital", "Dig", "Ebook, download, stream, PDF", ["book", "game", "film", "board_game", "journal_issue"]),
]

# (name, parent name | None, applicable item types)
GENRES = [
    # shared across media
    ("Fantasy", None, ["book", "game", "film", "board_game"]),
    ("Science Fiction", None, ["book", "game", "film", "board_game", "journal_issue"]),
    ("Horror", None, ["book", "game", "film", "board_game"]),
    ("Adventure", None, ["book", "game", "film", "board_game"]),
    ("Mystery", None, ["book", "film", "board_game"]),
    ("Thriller", None, ["book", "film"]),
    ("Historical", None, ["book", "film", "board_game"]),
    ("Comedy", None, ["book", "film"]),
    ("Drama", None, ["book", "film"]),
    ("Romance", None, ["book", "film"]),
    ("Strategy", None, ["game", "board_game"]),
    # books and journals
    ("Non-fiction", None, ["book", "journal_issue"]),
    ("Biography", "Non-fiction", ["book"]),
    ("Science", "Non-fiction", ["book", "journal_issue"]),
    ("Comics", None, ["book", "journal_issue"]),
    ("Manga", "Comics", ["book", "journal_issue"]),
    ("Graphic Novel", "Comics", ["book"]),
    ("Poetry", None, ["book", "journal_issue"]),
    ("Literary Fiction", None, ["book", "journal_issue"]),
    ("Gaming Magazine", None, ["journal_issue"]),
    ("Art & Design", None, ["book", "journal_issue"]),
    # video games
    ("Action", None, ["game", "film"]),
    ("Platformer", None, ["game"]),
    ("Metroidvania", "Platformer", ["game"]),
    ("Role-playing", None, ["game"]),
    ("Action RPG", "Role-playing", ["game"]),
    ("JRPG", "Role-playing", ["game"]),
    ("Shooter", None, ["game"]),
    ("Puzzle", None, ["game", "board_game"]),
    ("Simulation", None, ["game"]),
    ("Sports", None, ["game"]),
    ("Racing", None, ["game"]),
    ("Fighting", None, ["game"]),
    ("Survival", None, ["game"]),
    ("Roguelike", None, ["game"]),
    ("Open World", None, ["game"]),
    ("Visual Novel", None, ["game"]),
    # film
    ("Animation", None, ["film"]),
    ("Documentary", None, ["film"]),
    ("Musical", None, ["film"]),
    ("Western", None, ["film"]),
    ("War", None, ["film", "board_game"]),
    # board games
    ("Party", None, ["board_game"]),
    ("Cooperative", None, ["board_game"]),
    ("Deck-building", None, ["board_game"]),
    ("Eurogame", None, ["board_game"]),
    ("Wargame", None, ["board_game"]),
    ("Abstract", None, ["board_game"]),
]

CONDITION_TYPES = [
    ("Sealed", "Factory sealed, never opened"),
    ("Like New", "Opened but no visible wear"),
    ("Very Good", "Minor wear"),
    ("Good", "Normal signs of use"),
    ("Acceptable", "Heavy wear, complete and functional"),
    ("Poor", "Badly worn or damaged but still usable"),
    ("Incomplete", "Missing parts, manual, box or insert"),
    ("For Parts", "Not functional; kept for parts or completeness"),
]

BARCODE_TYPES = [
    ("ISBN-13", "Books since 2007 (978/979 prefix)"),
    ("ISBN-10", "Older books"),
    ("ISSN", "Magazines and journals"),
    ("EAN-13", "General retail barcode (JAN in Japan)"),
    ("EAN-8", "Short retail barcode"),
    ("UPC-A", "North American retail barcode"),
    ("UPC-E", "Compressed UPC"),
    ("Other", "Any other code printed on the item"),
]

SCALES = [
    "1:4", "1:6", "1:7", "1:8", "1:10", "1:12", "1:18", "1:24", "1:35", "1:48", "1:72", "1:144",
    "6 mm", "10 mm", "15 mm", "28 mm", "32 mm", "54 mm", "75 mm",
]

AUTHOR_ROLES = [
    "Writer", "Co-writer", "Illustrator", "Cover Artist", "Translator", "Editor", "Narrator",
    "Penciller", "Inker", "Colorist", "Letterer", "Foreword Author", "Photographer",
    "Director", "Producer", "Screenwriter", "Cinematographer", "Composer", "Actor", "Voice Actor",
    "Game Designer", "Game Director", "Programmer", "Artist", "Sculptor", "Designer",
]

COMPANY_ROLES = [
    "Developer", "Publisher", "Co-publisher", "Distributor", "Production Company",
    "Manufacturer", "Imprint", "Licensor", "Localization", "Porting", "Printer",
]

# (name, short_name)
GAME_PLATFORMS = [
    ("PC", "PC"), ("macOS", "Mac"), ("Linux", "Linux"),
    ("NES", "NES"), ("Super Nintendo", "SNES"), ("Nintendo 64", "N64"), ("GameCube", "GC"),
    ("Wii", "Wii"), ("Wii U", "WiiU"), ("Nintendo Switch", "NSW"),
    ("Game Boy", "GB"), ("Game Boy Advance", "GBA"), ("Nintendo DS", "NDS"), ("Nintendo 3DS", "3DS"),
    ("Sega Genesis", "GEN"), ("Sega Saturn", "SAT"), ("Sega Dreamcast", "DC"),
    ("PlayStation", "PS1"), ("PlayStation 2", "PS2"), ("PlayStation 3", "PS3"),
    ("PlayStation 4", "PS4"), ("PlayStation 5", "PS5"), ("PSP", "PSP"), ("PS Vita", "Vita"),
    ("Xbox", "XBOX"), ("Xbox 360", "X360"), ("Xbox One", "XONE"), ("Xbox Series X|S", "XSX"),
    ("iOS", "iOS"), ("Android", "Android"),
]


# ------------------------------------------------------------
# LOGIC
# ------------------------------------------------------------
def _ensure(session: Session, model: type[SQLModel], key: str, value, **fields):
    """Return the row where model.<key> == value, creating it with `fields` if missing."""
    obj = session.exec(select(model).where(getattr(model, key) == value)).first()
    if obj is None:
        obj = model(**{key: value}, **fields)
        session.add(obj)
        session.flush()
    return obj


def _ensure_link(session: Session, link_model, **ids) -> None:
    if session.get(link_model, tuple(ids.values())) is None:
        session.add(link_model(**ids))


def seed_languages(session: Session) -> None:
    existing = set(session.exec(select(Language.code)).all())
    session.add_all(
        Language(code=lang.alpha_2, name=getattr(lang, "common_name", lang.name))
        for lang in pycountry.languages
        if hasattr(lang, "alpha_2") and lang.alpha_2 not in existing
    )
    session.flush()


def seed_item_types(session: Session) -> dict[str, ItemType]:
    return {n: _ensure(session, ItemType, "name", n, description=d) for n, d in ITEM_TYPES}


def seed_formats(session: Session, types: dict[str, ItemType]) -> None:
    for name, short, desc, scope in FORMATS:
        fmt = _ensure(session, Format, "name", name, short_name=short, description=desc)
        for type_name in scope:
            _ensure_link(session, ItemTypeFormatLink, item_type_id=types[type_name].id, format_id=fmt.id)


def seed_genres(session: Session, types: dict[str, ItemType]) -> None:
    genres = {}
    for name, _parent, _scope in GENRES:
        genres[name] = _ensure(session, Genre, "name", name)
    for name, parent, scope in GENRES:
        genre = genres[name]
        if parent and genre.parent_genre_id is None:
            genre.parent_genre_id = genres[parent].id
        for type_name in scope:
            _ensure_link(session, ItemTypeGenreLink, item_type_id=types[type_name].id, genre_id=genre.id)


def seed_builtin(session: Session) -> None:
    """Everything the app needs to be usable on a fresh database. One transaction."""
    try:
        seed_languages(session)
        types = seed_item_types(session)
        seed_formats(session, types)
        seed_genres(session, types)
        for name, desc in CONDITION_TYPES:
            _ensure(session, ConditionType, "name", name, description=desc)
        for name, desc in BARCODE_TYPES:
            _ensure(session, BarcodeType, "name", name, description=desc)
        for scale in SCALES:
            _ensure(session, Scale, "scale", scale)
        for name in AUTHOR_ROLES:
            _ensure(session, AuthorRole, "name", name)
        for name in COMPANY_ROLES:
            _ensure(session, CompanyRole, "name", name)
        for name, short in GAME_PLATFORMS:
            _ensure(session, GamePlatform, "name", name, short_name=short)
        session.commit()
    except Exception:
        session.rollback()
        raise