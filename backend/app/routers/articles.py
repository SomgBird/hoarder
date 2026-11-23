from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.database import get_session
from app.db.crud import articles
from app.db.schemas.articles import ArticleCreate, ArticleRead, ArticleUpdate

router = APIRouter(prefix="/articles", tags=["articles"])


@router.post("/", response_model=ArticleRead, status_code=status.HTTP_201_CREATED)
def create_article(payload: ArticleCreate, session: Session = Depends(get_session)):
    return articles.create_article(session, payload)


@router.get("/{article_id}", response_model=ArticleRead)
def get_article(article_id: int, session: Session = Depends(get_session)):
    return articles.get_article(session, article_id)


@router.patch("/{article_id}", response_model=ArticleRead)
def update_article(article_id: int, payload: ArticleUpdate, session: Session = Depends(get_session)):
    return articles.update_article(session, article_id, payload)
