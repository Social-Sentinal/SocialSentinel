import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"

# In serverless environments (like Vercel), the project root filesystem is read-only.
# We ensure fallback SQLite uses /tmp if no external DATABASE_URL is configured.
IS_VERCEL = bool(os.getenv("VERCEL"))

if IS_VERCEL:
    DEFAULT_DB_PATH = Path("/tmp") / "socialsentinel_v4.db"
else:
    try:
        DATA_DIR.mkdir(exist_ok=True)
    except OSError:
        pass
    DEFAULT_DB_PATH = DATA_DIR / "socialsentinel_v4.db"

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-change-me-production-secret-key-32chars")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("SECRET_KEY", "dev-only-change-me-production-secret-key-32chars"))
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_ACCESS_MINUTES", "30")) * 60
    JWT_REFRESH_TOKEN_EXPIRES = int(os.getenv("JWT_REFRESH_DAYS", "30")) * 86400
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}").replace("postgres://", "postgresql://")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    DATA_DIR = DATA_DIR
    MODELS_DIR = MODELS_DIR
    REDIS_URL = os.getenv("REDIS_URL", "")
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
    CORS_ORIGINS = [x.strip() for x in os.getenv("CORS_ORIGINS", "*").split(",") if x.strip()]
