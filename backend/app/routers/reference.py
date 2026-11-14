"""Reference lists and inline creation for the item editor."""
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.database import get_session
from app.db.crud import reference as crud
from app.db.models import (
    Author, AuthorRole, BarcodeType, Company, CompanyRole, ConditionType, Format,
    Franchise, GamePlatform, Genre, ItemTag, Journal, Language, Scale,
)
from app.db.schemas import (
    AuthorRead, AuthorRoleRead, BarcodeTypeRead, CompanyRead, CompanyRoleRead,
    ConditionTypeRead, FormatRead, FranchiseRead, GamePlatformRead, GenreRead,
    ItemTypeScopeRead, JournalRead, LanguageRead, ReferenceCreate, ScaleRead, TagRead,
)

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
        return crud.list_references(session, model)

    router.add_api_route(f"/{path}", handler, methods=["GET"], response_model=list[schema])


for _path, (_model, _schema) in _SIMPLE.items():
    _register(_path, _model, _schema)


def _register_create(path, model, schema):
    def handler(payload: ReferenceCreate, session: Session = Depends(get_session)):
        return crud.create_reference(session, model, payload, path)

    router.add_api_route(f"/{path}", handler, methods=["POST"], response_model=schema,
                         name=f"create_{path.replace('-', '_')}")


# Languages and item types are predefined; the editor cannot create them.
for _path, (_model, _schema) in {
    **{path: pair for path, pair in _SIMPLE.items() if path not in ("languages", "condition-types")},
    "formats": (Format, FormatRead),
    "genres": (Genre, GenreRead),
}.items():
    _register_create(_path, _model, _schema)


@router.get("/item-types", response_model=list[ItemTypeScopeRead])
def item_types(session: Session = Depends(get_session)):
    """Item types with the formats and genres that apply to each."""
    return crud.get_item_types(session)


@router.get("/formats", response_model=list[FormatRead])
def formats(item_type: str | None = Query(None, description="item type name"),
            session: Session = Depends(get_session)):
    return crud.get_formats(session, item_type)


@router.get("/genres", response_model=list[GenreRead])
def genres(item_type: str | None = Query(None, description="item type name"),
           session: Session = Depends(get_session)):
    return crud.get_genres(session, item_type)


@router.get("/authors", response_model=list[AuthorRead])
def authors(q: str = Query("", description="name contains"), limit: int = Query(20, ge=1, le=100),
            session: Session = Depends(get_session)):
    return crud.search_named_references(session, Author, q, limit)


@router.get("/companies", response_model=list[CompanyRead])
def companies(q: str = Query("", description="name contains"), limit: int = Query(20, ge=1, le=100),
              session: Session = Depends(get_session)):
    return crud.search_named_references(session, Company, q, limit)
