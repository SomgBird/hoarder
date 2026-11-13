"""Item barcodes and barcode types."""
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel

from .items import Item


class BarcodeType(SQLModel, table=True):
    """Type of barcode printed on the item, e.g. ISBN-13, UPC-A."""
    __tablename__ = "barcode_type"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    description: str | None = None

    barcodes: list["Barcode"] = Relationship(back_populates="barcode_type")


class Barcode(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    code: str = Field(index=True)
    barcode_type_id: int | None = Field(default=None, foreign_key="barcode_type.id")
    item_id: int | None = Field(default=None, foreign_key="item.id", index=True)

    barcode_type: Optional[BarcodeType] = Relationship(back_populates="barcodes")
    item: Optional[Item] = Relationship(back_populates="barcodes")
