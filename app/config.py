import os
from pathlib import Path

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Application Directory Paths
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "social-sentinel-secret-key")
    DEBUG = True
    DATA_DIR = DATA_DIR
    MODELS_DIR = MODELS_DIR
