from fastapi import APIRouter, Depends
from sqlmodel import Session

from app import crud
from app.database import get_session
from app.schemas import AuthorRead, LanguageRead, PublisherRead

router = APIRouter(tags=["reference data"])


@router.get("/authors", response_model=list[AuthorRead])
def read_authors(session: Session = Depends(get_session)):
    return crud.list_authors(session)


@router.get("/publishers", response_model=list[PublisherRead])
def read_publishers(session: Session = Depends(get_session)):
    return crud.list_publishers(session)


@router.get("/languages", response_model=list[LanguageRead])
def read_languages(session: Session = Depends(get_session)):
    return crud.list_languages(session)