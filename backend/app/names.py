"""Unicode name keys shared by lookups and SQLite connections."""
import unicodedata


def clean_name(value: str | None) -> str:
    return " ".join(unicodedata.normalize("NFKC", value or "").split())


def name_key(value: str | None) -> str:
    return clean_name(value).casefold()
