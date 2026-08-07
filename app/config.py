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
    DEBUG = os.getenv("FLASK_ENV") == "development"
    DATA_DIR = DATA_DIR
    MODELS_DIR = MODELS_DIR
    FRONTEND_DIST_DIR = FRONTEND_DIST_DIR
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Instagram API Credentials
    RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")
    INSTAGRAM_API_KEY = os.getenv("INSTAGRAM_API_KEY", "")
    APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN", "")
    INSTAGRAM_API_HOST = os.getenv("INSTAGRAM_API_HOST", "instagram-scraper-2022.p.rapidapi.com")

