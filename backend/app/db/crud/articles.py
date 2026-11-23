from sqlalchemy import text
from sqlalchemy.dialects.sqlite import insert
from sqlmodel import Session, select

from app.db.models import Article, ArticleBlock, Item
from app.db.schemas.articles import ArticleCreate, ArticleRead, ArticleUpdate, ItemLinkRead, TextBlockRead
from app.errors import ConflictError, InvalidReferenceError, NotFoundError

from .reads import display_title_column


def _load(session: Session, article_id: int) -> Article:
    article = session.get(Article, article_id)
    if article is None:
        raise NotFoundError("article", article_id)
    return article


def get_article(session: Session, article_id: int) -> ArticleRead:
    article = _load(session, article_id)
    blocks = []
    for block in article.blocks:
        if block.kind == "item-link":
            title = session.exec(select(display_title_column()).select_from(Item).where(Item.id == block.item_id)).first()
            blocks.append(ItemLinkRead(id=block.id, kind="item-link", item_id=block.item_id, item_title=title))
        else:
            blocks.append(TextBlockRead.model_validate(block))
    return ArticleRead(id=article.id, title=article.title, blocks=blocks)


def _require_item(session: Session, item_id: int) -> None:
    if session.get(Item, item_id) is None:
        raise InvalidReferenceError("item", item_id, f"Item #{item_id} is no longer available. Choose another item.")


def create_article(session: Session, payload: ArticleCreate) -> ArticleRead:
    with session.begin():
        statement = insert(Article).values(title=payload.title, request_id=payload.request_id)
        article_id = session.execute(statement.on_conflict_do_nothing(
            index_elements=[Article.request_id]
        ).returning(Article.id)).scalar_one_or_none()
        if article_id is None:
            saved_id = session.exec(select(Article.id).where(Article.request_id == payload.request_id)).one()
            saved = get_article(session, saved_id)
            previous = [block.model_dump(include={"kind", "text", "item_id"}, exclude_none=True)
                        for block in saved.blocks]
            if saved.title != payload.title or previous != [block.model_dump() for block in payload.blocks]:
                raise ConflictError(f"This draft was already saved at collection://article/{saved.id}.")
            return saved
        for position, block in enumerate(payload.blocks):
            if block.kind == "item-link":
                _require_item(session, block.item_id)
            session.add(ArticleBlock(article_id=article_id, position=position, **block.model_dump()))
    return get_article(session, article_id)


def update_article(session: Session, article_id: int, payload: ArticleUpdate) -> ArticleRead:
    with session.begin():
        # Serialize the read/modify/write of the optional second block, including concurrent adds.
        session.execute(text("BEGIN IMMEDIATE"))
        article = _load(session, article_id)
        if payload.title is not None:
            article.title = payload.title
        if payload.text is not None:
            article.blocks[0].text = payload.text
        if "item_id" in payload.model_fields_set:
            link = next((block for block in article.blocks if block.kind == "item-link"), None)
            if payload.item_id is None:
                if link is not None:
                    article.blocks.remove(link)
            else:
                _require_item(session, payload.item_id)
                if link is None:
                    article.blocks.append(ArticleBlock(position=1, kind="item-link", item_id=payload.item_id))
                else:
                    link.item_id = payload.item_id
    return get_article(session, article_id)
