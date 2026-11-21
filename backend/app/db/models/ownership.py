"""Owned copies, condition grades, and copy photos."""
from typing import Optional
from uuid import UUID

from sqlmodel import Field, Relationship, SQLModel

from .items import Item


class ConditionType(SQLModel, table=True):
    """Condition grade for an owned copy: Sealed, Like New, Good, Poor, etc."""
    __tablename__ = "condition_type"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    description: str | None = None


class OwnedCopy(SQLModel, table=True):
    __tablename__ = "owned_copy"

    id: int | None = Field(default=None, primary_key=True)
    item_id: int | None = Field(default=None, foreign_key="item.id", index=True)
    notes: str | None = None

    item: Optional[Item] = Relationship(back_populates="owned_copies")
    condition: Optional["Condition"] = Relationship(
        back_populates="owned_copy",
        sa_relationship_kwargs={"uselist": False, "cascade": "all, delete-orphan"},
    )
    photos: list["CopyPhoto"] = Relationship(
        back_populates="owned_copy",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "order_by": "CopyPhoto.id"},
    )


class Condition(SQLModel, table=True):
    """Condition of one owned copy: a grade (type) plus optional notes."""
    id: int | None = Field(default=None, primary_key=True, foreign_key="owned_copy.id")
    condition_type_id: int | None = Field(default=None, foreign_key="condition_type.id")
    notes: str | None = None

    owned_copy: Optional[OwnedCopy] = Relationship(back_populates="condition")
    condition_type: Optional[ConditionType] = Relationship()


class CopySubmission(SQLModel, table=True):
    """Reserve a copy number for its item's lifetime, including after removal."""
    __tablename__ = "copy_submission"

    copy_id: int = Field(primary_key=True)
    item_id: int = Field(foreign_key="item.id", ondelete="CASCADE")
    # Older copies also reserve their number on removal, without a submission.
    request_id: UUID | None = Field(default=None, unique=True)
    payload_hash: str | None = None


class CopyPhoto(SQLModel, table=True):
    __tablename__ = "copy_photo"

    id: int | None = Field(default=None, primary_key=True)
    owned_copy_id: int | None = Field(default=None, foreign_key="owned_copy.id", index=True)
    file_path: str
    name: str | None = None
    description: str | None = None

    owned_copy: Optional[OwnedCopy] = Relationship(back_populates="photos")


class CopyPhotoEditSubmission(SQLModel, table=True):
    """Replay a multipart edit without adding the uploaded files twice."""
    __tablename__ = "copy_photo_edit_submission"

    request_id: UUID = Field(primary_key=True)
    copy_id: int = Field(foreign_key="owned_copy.id", ondelete="CASCADE")
    payload_hash: str
