from datetime import date

from sqlmodel import SQLModel


class ItemBase(SQLModel):
    release_date: date | None = None
    cover_image_path: str | None = None
    icon_image_path: str | None = None
    is_owned: bool | None = None