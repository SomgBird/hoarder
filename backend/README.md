# Backend

Run commands from this directory with the backend's Python environment active:

```sh
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
python -m unittest discover -s tests
python export_openapi.py
```

## Structure

```text
app/
  main.py              FastAPI setup and application lifespan
  config.py            Environment settings and media paths
  database.py          Engine, sessions, SQLite setup, table initialization
  errors.py            Application errors and HTTP exception handlers
  names.py             Shared Unicode name normalization
  media.py             Image storage, icon generation, cleanup, legacy migration
  routers/             HTTP endpoints and request handling
  db/
    base.py            Shared item fields
    models/            SQLModel database tables
      items.py         Items and translated titles
      links.py         Language, classification, and type scope associations
      reference.py     Shared reference data
      credits.py       Authors, companies, roles, and item credits
      details.py       Item subtype tables
      barcodes.py       Barcodes and barcode types
      ownership.py     Owned copies, conditions, and photos
    schemas/           API validation and response schemas
      base.py          Common validation and serialization settings
      reference.py     Reference payloads and responses
      details.py       Subtype schemas and discriminated unions
      parts.py         Titles, languages, credits, barcodes, and copies
      items.py         Full item requests and responses
      pagination.py    List entries, sorting, and page envelopes
      media.py         Media listing responses
    crud/              Database operations
      lookups.py       Reference resolution and item type scope checks
      details.py       Subtype registry and detail validation
      relations.py     Related collection builders
      reads.py         Item loading, search, sorting, and pagination
      items.py         Create, update, and delete transactions
      reference.py     Reference lists, searches, and creation
    seed/              Builtin reference data and optional example items
```

The `models`, `schemas`, and `crud` packages re-export existing public entry points, so imports
such as `from app.db.models import Item` and `from app.db import crud` remain valid.
Within each package, import helpers from their owning modules. Importing `models`
registers every table and relationship with SQLModel metadata.

Routers handle HTTP concerns; CRUD modules own database queries and transactions.
Lookup and relation builders only flush, leaving commits and rollbacks to the
calling operation.

To add an item subtype, add its table to `models/details.py`, its create/read
schemas and discriminated union entries to `schemas/details.py`, and its registry
entry to `crud/details.py`. Export the new table and schemas from their packages
and add the item type to `seed/builtin.py`.
