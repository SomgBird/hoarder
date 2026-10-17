"""Read-only reference data the frontend needs to build forms and dropdowns."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from app.database import get_session
from app.db.models import (
    Author, AuthorRole, BarcodeType, Company, CompanyRole, ConditionType, Format,
    Franchise, GamePlatform, Genre, ItemTag, ItemType, ItemTypeFormatLink,
    ItemTypeGenreLink, Journal, Language, Scale,
)
from app.db.schemas import (
    AuthorRead, AuthorRoleRead, BarcodeTypeRead, CompanyRead, CompanyRoleRead,
    ConditionTypeRead, FormatRead, FranchiseRead, GamePlatformRead, GenreRead,
    ItemTypeScopeRead, JournalRead, LanguageRead, ScaleRead, TagRead,
)
from app.errors import NotFoundError

router = APIRouter(prefix="/reference", tags=["reference"])

_SIMPLE = {
    "languages": (Language, LanguageRead),
    "condition-types": (ConditionType, ConditionTypeRead),
    "barcode-types": (BarcodeType, BarcodeTypeRead),
    "scales": (Scale, ScaleRead),
    "game-platforms": (GamePlatform, GamePlatformRead),
    "journals": (Journal, JournalRead),
    "franchises": (Franchise, FranchiseRead),
    "tags": (ItemTag, TagRead),
    "author-roles": (AuthorRole, AuthorRoleRead),
    "company-roles": (CompanyRole, CompanyRoleRead),
}


def _register(path, model, schema):
    def handler(session: Session = Depends(get_session)):
        return session.exec(select(model).order_by(model.id)).all()

    router.add_api_route(f"/{path}", handler, methods=["GET"], response_model=list[schema])


for _path, (_model, _schema) in _SIMPLE.items():
    _register(_path, _model, _schema)


def _type_or_404(session: Session, name: str) -> ItemType:
    item_type = session.exec(select(ItemType).where(ItemType.name == name)).first()
    if item_type is None:
        raise NotFoundError("item_type", name)
    return item_type


@router.get("/item-types", response_model=list[ItemTypeScopeRead])
def item_types(session: Session = Depends(get_session)):
    """Item types with the formats and genres that apply to each."""
    return session.exec(
        select(ItemType)
        .options(selectinload(ItemType.formats), selectinload(ItemType.genres))
        .order_by(ItemType.id)
    ).all()


@router.get("/formats", response_model=list[FormatRead])
def formats(item_type: str | None = Query(None, description="item type name"),
            session: Session = Depends(get_session)):
    query = select(Format).order_by(Format.id)
    if item_type:
        t = _type_or_404(session, item_type)
        query = query.join(ItemTypeFormatLink, ItemTypeFormatLink.format_id == Format.id).where(
            ItemTypeFormatLink.item_type_id == t.id
        )
    return session.exec(query).all()


@router.get("/genres", response_model=list[GenreRead])
def genres(item_type: str | None = Query(None, description="item type name"),
           session: Session = Depends(get_session)):
    query = select(Genre).order_by(Genre.id)
    if item_type:
        t = _type_or_404(session, item_type)
        query = query.join(ItemTypeGenreLink, ItemTypeGenreLink.genre_id == Genre.id).where(
            ItemTypeGenreLink.item_type_id == t.id
        )
    return session.exec(query).all()


@router.get("/authors", response_model=list[AuthorRead])
def authors(q: str = Query("", description="name contains"), limit: int = Query(20, ge=1, le=100),
            session: Session = Depends(get_session)):
    return session.exec(select(Author).where(Author.name.ilike(f"%{q}%")).order_by(Author.name).limit(limit)).all()


@router.get("/companies", response_model=list[CompanyRead])
def companies(q: str = Query("", description="name contains"), limit: int = Query(20, ge=1, le=100),
              session: Session = Depends(get_session)):
    return session.exec(select(Company).where(Company.name.ilike(f"%{q}%")).order_by(Company.name).limit(limit)).all()