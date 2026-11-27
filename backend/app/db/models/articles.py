from uuid import UUID

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel


class Article(SQLModel, table=True):
    __table_args__ = {"sqlite_autoincrement": True}

    id: int | None = Field(default=None, primary_key=True)
    request_id: UUID = Field(unique=True)
    title: str
    blocks: list["ArticleBlock"] = Relationship(
        sa_relationship_kwargs={"order_by": "ArticleBlock.position", "cascade": "all, delete-orphan"}
    )


class ArticleBlock(SQLModel, table=True):
    __tablename__ = "article_block"
    __table_args__ = (UniqueConstraint("article_id", "position"),)

    id: int | None = Field(default=None, primary_key=True)
    article_id: int = Field(foreign_key="article.id", ondelete="CASCADE")
    position: int
    kind: str
    text: str = ""
    # Item numbers are never reassigned. Keep the address when its item is deleted.
    item_id: int | None = None
    entries: list["ArticleGalleryEntry"] = Relationship(
        sa_relationship_kwargs={
            "order_by": "ArticleGalleryEntry.position",
            "cascade": "all, delete-orphan",
        },
    )


class ArticleGalleryEntry(SQLModel, table=True):
    __tablename__ = "article_gallery_entry"
    __table_args__ = (UniqueConstraint("block_id", "position"),)

    id: int | None = Field(default=None, primary_key=True)
    block_id: int = Field(foreign_key="article_block.id", ondelete="CASCADE")
    position: int
    path: str = Field(index=True)
    caption: str = ""
