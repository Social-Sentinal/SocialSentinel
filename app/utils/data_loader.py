import os
import joblib
import pickle
import pandas as pd
from typing import Any, Optional
from app.config import DATA_DIR, MODELS_DIR

# Curated High-Resolution Social Photography Assets
UNSPLASH_POST_IMAGES = [
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80"
]

AVATARS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=150&auto=format&fit=crop&q=80"
]

USERNAMES = ["humansofny", "travel_journal", "urban_vibes", "street_snaps", "life_moments", "wanderer_pro"]
LOCATIONS = ["New York, NY", "London, UK", "Paris, France", "Tokyo, Japan", "Los Angeles, CA", "San Francisco, CA"]


def load_model(filename: str) -> Optional[Any]:
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
    csv_path = DATA_DIR / filename
    if not csv_path.exists():
        print(f"[Warning] Dataset file not found: {csv_path}")
        return pd.DataFrame()

    try:
        return pd.read_csv(csv_path)
    except Exception as e:
        print(f"[Error] Failed to load dataset {filename}: {e}")
        return pd.DataFrame()


def parse_real_instagram_posts() -> list[dict]:
    """Parse real Instagram dataset items from instagram_results.csv."""
    df = load_dataset("instagram_results.csv")
    posts = []

    if not df.empty and "caption" in df.columns:
        for idx, row in df.iterrows():
            caption = str(row.get("caption", ""))
            if not caption or caption == "nan" or len(caption) < 15:
                continue

            username = str(row.get("ownerUsername", USERNAMES[idx % len(USERNAMES)]))
            if username == "nan" or not username:
                username = USERNAMES[idx % len(USERNAMES)]

            likes = int(row.get("likesCount", 1240)) if str(row.get("likesCount", "")).isdigit() else 1240
            comments = int(row.get("commentsCount", 42)) if str(row.get("commentsCount", "")).isdigit() else 42

            image_url = UNSPLASH_POST_IMAGES[idx % len(UNSPLASH_POST_IMAGES)]
            avatar_url = AVATARS[idx % len(AVATARS)]
            location = LOCATIONS[idx % len(LOCATIONS)]

            # Extract hashtags
            words = caption.split()
            hashtags_list = [w for w in words if w.startswith("#")]
            hashtags = " ".join(hashtags_list[:5]) if hashtags_list else "#life #story #instagram"

            posts.append({
                "username": username,
                "user_avatar": avatar_url,
                "location": location,
                "caption": caption[:350],
                "hashtags": hashtags,
                "image_url": image_url,
                "likes_count": likes,
                "comments_count": comments,
                "views_count": likes * 3,
                "timestamp": str(row.get("timestamp", "2024-09-15 14:30:00"))[:10],
                "sentiment": "Positive" if any(w in caption.lower() for w in ["love", "happy", "beautiful", "blessed", "wonderful"]) else "Neutral",
                "score": 0.88 if any(w in caption.lower() for w in ["love", "happy", "beautiful", "blessed"]) else 0.5
            })

            if len(posts) >= 20:
                break

    return posts
