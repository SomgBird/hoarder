from sqlalchemy.dialects.sqlite import insert
from sqlmodel import Session, select

from app.db.models import Article, ArticleBlock
from app.db.schemas.articles import ArticleCreate
from app.errors import ConflictError, NotFoundError


def get_article(session: Session, article_id: int) -> Article:
    article = session.get(Article, article_id)
    if article is None:
        raise NotFoundError("article", article_id)
    return article


def create_article(session: Session, payload: ArticleCreate) -> Article:
    with session.begin():
        statement = insert(Article).values(title=payload.title, request_id=payload.request_id)
        article_id = session.execute(statement.on_conflict_do_nothing(
            index_elements=[Article.request_id]
        ).returning(Article.id)).scalar_one_or_none()
        if article_id is None:
            saved = session.exec(select(Article).where(Article.request_id == payload.request_id)).one()
            if saved.title != payload.title or [(b.kind, b.text) for b in saved.blocks] != [
                (b.kind, b.text) for b in payload.blocks
            ]:
                raise ConflictError(f"This draft was already saved at collection://article/{saved.id}.")
            return saved
        for position, block in enumerate(payload.blocks):
            session.add(ArticleBlock(article_id=article_id, position=position, **block.model_dump()))
    return get_article(session, article_id)
