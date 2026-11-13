"""Authors, companies, roles, and their credits on items."""
from datetime import date

from sqlmodel import Field, Relationship, SQLModel

from .items import Item


class Author(SQLModel, table=True):
    __tablename__ = "author"
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    bio: str | None = None
    birth_date: date | None = None
    death_date: date | None = None

    credits: list["AuthorRoleItemLink"] = Relationship(back_populates="author")


class AuthorRole(SQLModel, table=True):
    __tablename__ = "author_role"
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    description: str | None = None

    credits: list["AuthorRoleItemLink"] = Relationship(back_populates="role")


class AuthorRoleItemLink(SQLModel, table=True):
    __tablename__ = "author_role_item_link"
    author_id: int = Field(foreign_key="author.id", primary_key=True)
    item_id: int = Field(foreign_key="item.id", primary_key=True, index=True)
    role_id: int = Field(foreign_key="author_role.id", primary_key=True, index=True)
    involvement_date: date | None = None
    comments: str | None = None

    author: Author = Relationship(back_populates="credits")
    item: Item = Relationship(back_populates="author_credits")
    role: AuthorRole = Relationship(back_populates="credits")


class Company(SQLModel, table=True):
    __tablename__ = "company"
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: str | None = None
    country: str | None = None
    founded_date: date | None = None
    dissolved_date: date | None = None

    credits: list["CompanyRoleItemLink"] = Relationship(back_populates="company")


class CompanyRole(SQLModel, table=True):
    __tablename__ = "company_role"
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    description: str | None = None

    credits: list["CompanyRoleItemLink"] = Relationship(back_populates="role")


class CompanyRoleItemLink(SQLModel, table=True):
    __tablename__ = "company_role_item_link"
    company_id: int = Field(foreign_key="company.id", primary_key=True)
    item_id: int = Field(foreign_key="item.id", primary_key=True, index=True)
    role_id: int = Field(foreign_key="company_role.id", primary_key=True, index=True)
    involvement_date: date | None = None
    comments: str | None = None

    company: Company = Relationship(back_populates="credits")
    item: "Item" = Relationship(back_populates="company_credits")
    role: CompanyRole = Relationship(back_populates="credits")
