from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.db.crud import franchise_pages
from app.db.schemas.franchise_pages import FranchisePageRead, FranchisePageSummary, FranchisePageWrite

router = APIRouter(prefix="/franchise-pages", tags=["franchise pages"])


@router.get("/", response_model=list[FranchisePageSummary])
def list_franchise_pages(session: Session = Depends(get_session)):
    return franchise_pages.list_franchise_pages(session)


@router.get("/{franchise_id}", response_model=FranchisePageRead)
def get_franchise_page(franchise_id: int, session: Session = Depends(get_session)):
    return franchise_pages.get_franchise_page(session, franchise_id)


@router.put("/{franchise_id}", response_model=FranchisePageRead)
def save_franchise_page(franchise_id: int, payload: FranchisePageWrite, session: Session = Depends(get_session)):
    return franchise_pages.save_franchise_page(session, franchise_id, payload.introduction)
