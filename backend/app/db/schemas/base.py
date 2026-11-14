"""Shared input validation and response serialization settings."""
from typing import Annotated

from pydantic import ConfigDict, StringConstraints
from sqlmodel import SQLModel


NonBlank = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class _Strict(SQLModel):
    # Reject misspelled or renamed keys instead of silently dropping input.
    model_config = ConfigDict(extra="forbid")


class _Read(SQLModel):
    # Responses include defaulted fields (including nulls). Publish them as
    # required in OpenAPI so generated clients match the serialized JSON.
    model_config = ConfigDict(json_schema_serialization_defaults_required=True)
