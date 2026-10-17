"""Domain errors + FastAPI handlers.

Every error response has the same shape, so the frontend can branch on `code`:

    {"detail": "Item 42 not found", "code": "item_not_found", "entity": "item", "id": 42}

404  <entity>_not_found     the thing the URL points at does not exist  -> show the error page
422  invalid_reference       the payload points at something missing/not applicable -> show on the form
422  validation_error        payload has wrong shape/types (FastAPI/pydantic)
409  conflict / integrity_error
"""
from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError


class AppError(Exception):
    status_code = 400
    code = "app_error"

    def __init__(self, message: str, *, code: str | None = None, **extra):
        super().__init__(message)
        self.message = message
        if code:
            self.code = code
        self.extra = extra

    def to_dict(self) -> dict:
        return {"detail": self.message, "code": self.code, **self.extra}


class NotFoundError(AppError):
    """The resource addressed by the request does not exist."""
    status_code = 404

    def __init__(self, entity: str, entity_id: int | str):
        super().__init__(
            f"{entity.replace('_', ' ').capitalize()} {entity_id} not found",
            code=f"{entity}_not_found",
            entity=entity,
            id=entity_id,
        )


class InvalidReferenceError(AppError):
    """The request body references something that doesn't exist / doesn't apply."""
    status_code = 422
    code = "invalid_reference"

    def __init__(self, entity: str, value, message: str | None = None):
        super().__init__(
            message or f"Unknown {entity.replace('_', ' ')}: {value}",
            entity=entity,
            value=value,
        )


class ConflictError(AppError):
    status_code = 409
    code = "conflict"


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError):
        return JSONResponse(status_code=exc.status_code, content=jsonable_encoder(exc.to_dict()))

    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "detail": "Validation failed",
                "code": "validation_error",
                "errors": jsonable_encoder(exc.errors()),
            },
        )

    @app.exception_handler(IntegrityError)
    async def _integrity(_: Request, exc: IntegrityError):
        return JSONResponse(
            status_code=409,
            content={"detail": "Operation violates a database constraint", "code": "integrity_error"},
        )