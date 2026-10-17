"""Example entries with full info (every item type, every relation) for frontend testing.

Needs the builtin seed first. Not run at app startup: use the CLI
(python -m app.db.seed --examples). Skips itself if any item already exists.
Barcodes and page counts are sample values, not guaranteed accurate.
"""
from datetime import date

from sqlmodel import Session, SQLModel, select

from app.db import crud
from app.db.models import (
    BarcodeType, Condition, ConditionType, CopyPhoto, Format, Franchise, GamePlatform,
    Genre, Item, ItemTag, Journal, OwnedCopy, Scale,
)
from app.db.schemas import (
    AuthorCreditCreate, BarcodeCreate, BoardGameDetailsCreate, BookDetailsCreate,
    CompanyCreditCreate, FigurineDetailsCreate, FilmDetailsCreate, GameDetailsCreate,
    ItemCreate, ItemLanguageCreate, JournalIssueDetailsCreate, LegoSetDetailsCreate,
    MiniatureDetailsCreate, TitleCreate,
)


def _id(session: Session, model: type[SQLModel], value: str, key: str = "name") -> int:
    obj = session.exec(select(model).where(getattr(model, key) == value)).first()
    if obj is None:
        raise LookupError(f"{model.__name__} '{value}' missing: run the builtin seed first")
    return obj.id


def _ids(session, model, values: list[str]) -> list[int]:
    return [_id(session, model, v) for v in values]


def _named(session, model, name: str) -> int:
    """Get-or-create a user-level (non-builtin) row: franchise, journal."""
    return crud._get_or_create_named(session, model, name).id


def _add_copy(session: Session, item_id: int, condition: str, notes: str,
              condition_notes: str | None = None, photos: tuple[str, ...] = ()) -> None:
    copy = OwnedCopy(item_id=item_id, notes=notes)
    copy.condition = Condition(
        condition_type_id=_id(session, ConditionType, condition), notes=condition_notes
    )
    copy.photos = [CopyPhoto(file_path=p, name=p.rsplit("/", 1)[-1]) for p in photos]
    session.add(copy)


def seed_examples(session: Session) -> None:
    if session.exec(select(Item.id).limit(1)).first() is not None:
        print("items already exist, skipping examples (use --reset to start over)")
        return

    en = lambda *flags: ItemLanguageCreate(language_code="en", ui=True, text=True, voice=("voice" in flags) or None)
    dune = _named(session, Franchise, "Dune")
    zelda = _named(session, Franchise, "The Legend of Zelda")

    items: list[tuple[ItemCreate, dict | None]] = [
        # ---- books
        (ItemCreate(
            release_date=date(2005, 8, 2), is_owned=True,
            description="Sample: a book with two titles, a barcode, tags, credits and an owned copy.",
            cover_image_path="samples/dune_cover.jpg",
            format_id=_id(session, Format, "Paperback"),
            titles=[TitleCreate(title_text="Dune", language_code="en"),
                    TitleCreate(title_text="Дюна", language_code="ru")],
            languages=[ItemLanguageCreate(language_code="en", text=True),
                       ItemLanguageCreate(language_code="ru", text=True)],
            selected_language_code="en",
            genre_ids=_ids(session, Genre, ["Science Fiction", "Adventure"]),
            franchise_ids=[dune],
            tags=["favorites", "reread"],
            barcodes=[BarcodeCreate(code="978-0-441-01359-3", barcode_type_id=_id(session, BarcodeType, "ISBN-13"))],
            author_credits=[AuthorCreditCreate(author_name="Frank Herbert", role_name="Writer")],
            company_credits=[CompanyCreditCreate(company_name="Ace Books", role_name="Publisher")],
            details=BookDetailsCreate(type_name="book", page_count=544),
        ), dict(condition="Good", notes="Bought second-hand", condition_notes="Spine slightly creased",
                photos=("samples/dune_front.jpg", "samples/dune_spine.jpg"))),
        # same author again: exercises get-or-create reuse instead of a duplicate row
        (ItemCreate(
            release_date=date(2008, 5, 1), is_owned=False,
            description="Sample: wishlist item (not owned) sharing author and franchise with Dune.",
            format_id=_id(session, Format, "Hardcover"),
            titles=[TitleCreate(title_text="Dune Messiah", language_code="en")],
            languages=[ItemLanguageCreate(language_code="en", text=True)],
            selected_language_code="en",
            genre_ids=_ids(session, Genre, ["Science Fiction"]),
            franchise_ids=[dune], tags=["wishlist"],
            author_credits=[AuthorCreditCreate(author_name="frank herbert", role_name="writer")],
            details=BookDetailsCreate(type_name="book", page_count=256),
        ), None),
        # ---- video games
        (ItemCreate(
            release_date=date(2017, 3, 3), is_owned=True,
            description="Sample: a game with platform, several credit kinds and one company in two roles.",
            format_id=_id(session, Format, "Cartridge"),
            titles=[TitleCreate(title_text="The Legend of Zelda: Breath of the Wild", short_text="BotW", language_code="en")],
            languages=[ItemLanguageCreate(language_code="en", ui=True, text=True, voice=True),
                       ItemLanguageCreate(language_code="ja", ui=True, text=True, voice=True)],
            selected_language_code="en",
            genre_ids=_ids(session, Genre, ["Action", "Adventure", "Open World"]),
            franchise_ids=[zelda], tags=["favorites"],
            barcodes=[BarcodeCreate(code="045496590420", barcode_type_id=_id(session, BarcodeType, "UPC-A"))],
            author_credits=[AuthorCreditCreate(author_name="Hidemaro Fujibayashi", role_name="Director"),
                            AuthorCreditCreate(author_name="Eiji Aonuma", role_name="Producer")],
            # one company in two roles is allowed: role_id is part of the link's PK
            company_credits=[CompanyCreditCreate(company_name="Nintendo", role_name="Developer"),
                             CompanyCreditCreate(company_name="Nintendo", role_name="Publisher")],
            details=GameDetailsCreate(type_name="game", game_platform_id=_id(session, GamePlatform, "Nintendo Switch")),
        ), dict(condition="Like New", notes="Launch copy", photos=("samples/botw_box.jpg",))),
        (ItemCreate(
            release_date=date(2017, 2, 24), is_owned=True,
            description="Sample: digital game, no physical copy.",
            format_id=_id(session, Format, "Digital"),
            titles=[TitleCreate(title_text="Hollow Knight", language_code="en")],
            languages=[en()], selected_language_code="en",
            genre_ids=_ids(session, Genre, ["Metroidvania", "Action"]),
            tags=["indie", "inspiration"],
            company_credits=[CompanyCreditCreate(company_name="Team Cherry", role_name="Developer")],
            details=GameDetailsCreate(type_name="game", game_platform_id=_id(session, GamePlatform, "PC")),
        ), None),
        # ---- film
        (ItemCreate(
            release_date=date(1982, 6, 25), is_owned=True,
            description="Sample: a film with runtime and crew credits.",
            format_id=_id(session, Format, "Blu-ray"),
            titles=[TitleCreate(title_text="Blade Runner", language_code="en")],
            languages=[en("voice")], selected_language_code="en",
            genre_ids=_ids(session, Genre, ["Science Fiction", "Thriller"]),
            tags=["rewatch"],
            author_credits=[AuthorCreditCreate(author_name="Ridley Scott", role_name="Director"),
                            AuthorCreditCreate(author_name="Hampton Fancher", role_name="Screenwriter"),
                            AuthorCreditCreate(author_name="Vangelis", role_name="Composer")],
            company_credits=[CompanyCreditCreate(company_name="The Ladd Company", role_name="Production Company")],
            details=FilmDetailsCreate(type_name="film", length=117),
        ), dict(condition="Very Good", notes="Steelbook")),
        # ---- board game
        (ItemCreate(
            release_date=date(1995, 1, 1), is_owned=True,
            description="Sample: board game, no subtype fields yet.",
            format_id=_id(session, Format, "Boxed"),
            titles=[TitleCreate(title_text="Catan", language_code="en")],
            languages=[en()], selected_language_code="en",
            genre_ids=_ids(session, Genre, ["Strategy", "Eurogame"]),
            author_credits=[AuthorCreditCreate(author_name="Klaus Teuber", role_name="Game Designer")],
            company_credits=[CompanyCreditCreate(company_name="Kosmos", role_name="Publisher")],
            details=BoardGameDetailsCreate(type_name="board_game"),
        ), dict(condition="Good", notes="Family copy")),
        # ---- journal issue
        (ItemCreate(
            release_date=date(1988, 7, 1), is_owned=True,
            description="Sample: a journal issue linked to its journal.",
            format_id=_id(session, Format, "Print"),
            titles=[TitleCreate(title_text="Nintendo Power, Issue 1", short_text="NP #1", language_code="en")],
            languages=[en()], selected_language_code="en",
            genre_ids=_ids(session, Genre, ["Gaming Magazine"]),
            company_credits=[CompanyCreditCreate(company_name="Nintendo of America", role_name="Publisher")],
            details=JournalIssueDetailsCreate(
                type_name="journal_issue", journal_id=_named(session, Journal, "Nintendo Power"),
                issue="Vol. 1, Jul/Aug 1988", page_count=96),
        ), dict(condition="Acceptable", notes="Yellowed pages")),
        # ---- figurine
        (ItemCreate(
            release_date=date(2022, 3, 1), is_owned=True,
            description="Sample: figurine with scale and franchise.",
            titles=[TitleCreate(title_text="Link (Breath of the Wild) 1/7 Scale Figure", language_code="en")],
            languages=[en()], selected_language_code="en",
            franchise_ids=[zelda], tags=["shelf"],
            company_credits=[CompanyCreditCreate(company_name="Good Smile Company", role_name="Manufacturer")],
            details=FigurineDetailsCreate(type_name="figurine", scale_id=_id(session, Scale, "1:7", key="scale")),
        ), dict(condition="Sealed", notes="Still in box")),
        # ---- miniature
        (ItemCreate(
            release_date=date(2019, 6, 1), is_owned=True,
            description="Sample: miniature with size and scale (height/width in mm).",
            titles=[TitleCreate(title_text="Ironclad Dwarf Warrior", language_code="en")],
            languages=[en()], selected_language_code="en",
            tags=["unpainted"],
            company_credits=[CompanyCreditCreate(company_name="Reaper Miniatures", role_name="Manufacturer")],
            details=MiniatureDetailsCreate(
                type_name="miniature", height=32.0, width=20.0, scale_id=_id(session, Scale, "28 mm", key="scale")),
        ), None),
        # ---- lego
        (ItemCreate(
            release_date=date(2021, 1, 1), is_owned=True,
            description="Sample: LEGO set with piece count.",
            titles=[TitleCreate(title_text="LEGO Icons Bonsai Tree (10281)", language_code="en")],
            languages=[en()], selected_language_code="en",
            tags=["shelf"],
            company_credits=[CompanyCreditCreate(company_name="The LEGO Group", role_name="Manufacturer")],
            details=LegoSetDetailsCreate(type_name="lego_set", number_of_pieces=878),
        ), dict(condition="Like New", notes="Built once")),
    ]

    for data, copy in items:
        created = crud.create_item(session, data)
        if copy:
            _add_copy(session, created.id, **copy)
            session.commit()
        print(f"inserted #{created.id} [{created.item_type.name}] {created.titles[0].title_text}")