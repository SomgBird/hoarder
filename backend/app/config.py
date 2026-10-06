# backend/app/config.py
"""Central config: paths, CORS, upload limits.

Every other module imports from here — nothing else computes paths.
"""
from pathlib import Path

# ---------- Paths ----------
# config.py lives at backend/app/config.py
#   .parent      -> backend/app/
#   .parent.parent -> backend/
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

MEDIA_DIR = DATA_DIR / "media"
COVERS_DIR = MEDIA_DIR / "covers"
DB_PATH = DATA_DIR / "books.db"

# Ensure directories exist at import time.
# Doing this here means main.py / routers / seed.py never need to.
MEDIA_DIR.mkdir(parents=True, exist_ok=True)
COVERS_DIR.mkdir(parents=True, exist_ok=True)

# ---------- Database ----------
DATABASE_URL = f"sqlite:///{DB_PATH}"

# ---------- CORS ----------
# Dev: Vite (:5173) and CRA/Next (:3000).
# In production, put your real domain(s) here.
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# ---------- Cover uploads ----------
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024   # 5 MB

# URL prefix under which MEDIA_DIR is served by StaticFiles in main.py
MEDIA_URL_PREFIX = "/media"
COVERS_URL_PREFIX = f"{MEDIA_URL_PREFIX}/covers"