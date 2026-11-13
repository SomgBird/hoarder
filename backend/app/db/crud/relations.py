"""Collection builders shared by item creation and partial updates."""
from sqlmodel import Session

from app.db.models import (
    AuthorRoleItemLink,
    Barcode,
    BarcodeType,
    CompanyRoleItemLink,
    ItemLanguageLink,
    ItemTag,
    Title,
)
from app.db.schemas import (
    AuthorCreditCreate,
    BarcodeCreate,
    CompanyCreditCreate,
    ItemLanguageCreate,
    TitleCreate,
)
from app.errors import InvalidReferenceError

from .lookups import (
    _require,
    get_language,
    get_or_create_author_role,
    get_or_create_company_role,
    get_or_create_named,
    resolve_author,
    resolve_company,
)


def _build_language_links(
    session: Session, languages: list[ItemLanguageCreate]
) -> list[ItemLanguageLink]:
    out: dict[str, ItemLanguageLink] = {}
    for lang in languages:
        if lang.language_code in out:
            continue
        out[lang.language_code] = ItemLanguageLink(
            language_id=get_language(session, lang.language_code).id,
            ui=lang.ui,
            text=lang.text,
            voice=lang.voice,
        )
    return list(out.values())


def _build_titles(session: Session, titles: list[TitleCreate]) -> list[Title]:
    return [
        Title(
            title_text=t.title_text,
            short_text=t.short_text,
            language_id=get_language(session, t.language_code).id,
        )
        for t in titles
    ]


def _build_tags(session: Session, names: list[str]) -> list[ItemTag]:
    tags: dict[int, ItemTag] = {}
    for name in names:
        tag = get_or_create_named(session, ItemTag, name)
        tags[tag.id] = tag
    return list(tags.values())


def _build_barcodes(session: Session, barcodes: list[BarcodeCreate]) -> list[Barcode]:
    out: list[Barcode] = []
    for b in barcodes:
        if b.barcode_type_id is not None:
            _require(session, BarcodeType, b.barcode_type_id, "barcode_type")
        code = "".join(b.code.split())
        if not code:
            raise InvalidReferenceError("barcode", b.code, "Barcode is empty")
        out.append(Barcode(code=code, barcode_type_id=b.barcode_type_id))
    return out


def _build_author_credits(
    session: Session, credits: list[AuthorCreditCreate]
) -> list[AuthorRoleItemLink]:
    out: list[AuthorRoleItemLink] = []
    seen: set[tuple[int, int]] = set()
    for c in credits:
        author = resolve_author(session, author_id=c.author_id, name=c.author_name)
        role = get_or_create_author_role(session, c.role_name)
        if (author.id, role.id) in seen:
            continue
        seen.add((author.id, role.id))
        out.append(
            AuthorRoleItemLink(
                author_id=author.id,
                role_id=role.id,
                involvement_date=c.involvement_date,
                comments=c.comments,
            )
        )
    return out


def _build_company_credits(
    session: Session, credits: list[CompanyCreditCreate]
) -> list[CompanyRoleItemLink]:
    out: list[CompanyRoleItemLink] = []
    seen: set[tuple[int, int]] = set()
    for c in credits:
        company = resolve_company(
            session, company_id=c.company_id, name=c.company_name
        )
        role = get_or_create_company_role(session, c.role_name)
        if (company.id, role.id) in seen:
            continue
        seen.add((company.id, role.id))
        out.append(
            CompanyRoleItemLink(
                company_id=company.id,
                role_id=role.id,
                involvement_date=c.involvement_date,
                comments=c.comments,
            )
        )
    return out
