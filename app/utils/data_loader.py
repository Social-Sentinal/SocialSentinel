import os
import joblib
import pickle
import pandas as pd
from typing import Any, Optional
from app.config import DATA_DIR, MODELS_DIR


def load_model(filename: str) -> Optional[Any]:
    """Load a model or vectorizer file safely using joblib or pickle."""
    model_path = MODELS_DIR / filename
    if not model_path.exists():
        print(f"[Warning] Model file not found: {model_path}")
        return None

    try:
        return joblib.load(model_path)
    except Exception:
        try:
            with open(model_path, "rb") as f:
                return pickle.load(f)
        except Exception as e:
            print(f"[Error] Failed to load model {filename}: {e}")
            return None


def load_dataset(filename: str) -> pd.DataFrame:
    """Load a CSV dataset safely from the data directory."""
    csv_path = DATA_DIR / filename
    if not csv_path.exists():
        print(f"[Warning] Dataset file not found: {csv_path}")
        return pd.DataFrame()

    try:
        return pd.read_csv(csv_path)
    except Exception as e:
        print(f"[Error] Failed to load dataset {filename}: {e}")
        return pd.DataFrame()
