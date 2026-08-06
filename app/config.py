import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
STATIC_DIR = BASE_DIR / "static"
FRONTEND_DIST_DIR = BASE_DIR / "frontend" / "dist"

DB_PATH = DATA_DIR / "app.db"


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "social-sentinel-secret-key-2026")
    DEBUG = False
    DATA_DIR = DATA_DIR
    MODELS_DIR = MODELS_DIR
    FRONTEND_DIST_DIR = FRONTEND_DIST_DIR
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
