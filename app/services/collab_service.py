import random
import pandas as pd

from app.config import DATA_DIR
from app.utils.data_loader import load_model

_caption_model = None
_hashtag_model = None
_tfidf_vectorizer2 = None


def load_collab_models():
    global _caption_model, _hashtag_model, _tfidf_vectorizer2
    if any(m is None for m in (_caption_model, _hashtag_model, _tfidf_vectorizer2)):
        _caption_model = load_model("caption.pkl")
        _hashtag_model = load_model("hashtag.pkl")
        _tfidf_vectorizer2 = load_model("tfidf_vectorizer2.pkl")
    return _caption_model, _hashtag_model, _tfidf_vectorizer2


def analyze_csv_data(input_csv_name: str = "saved_posts.csv", output_csv_name: str = "predictions.csv") -> pd.DataFrame:
    caption_model, hashtag_model, tfidf_vectorizer = load_collab_models()

    input_path = DATA_DIR / input_csv_name
    output_path = DATA_DIR / output_csv_name

    if not input_path.exists():
        print(f"[Warning] Input CSV file for collaborative analysis does not exist: {input_path}")
        # Create default predictions DataFrame
        return pd.DataFrame([
            {"predicted_caption": "Exploring beautiful places!", "predicted_hashtags": "#travel #adventure"},
            {"predicted_caption": "Enjoying delicious coffee", "predicted_hashtags": "#coffee #morning"}
        ])

    try:
        df = pd.read_csv(input_path)
        if "caption" not in df.columns or "hashtags" not in df.columns:
            # Handle headers if missing
            df.columns = ["caption", "hashtags", "timestamp", "duration"][:len(df.columns)]

        df["text"] = df["caption"].astype(str) + " " + df["hashtags"].astype(str)

        if caption_model and hashtag_model and tfidf_vectorizer:
            input_tfidf = tfidf_vectorizer.transform(df["text"])
            df["predicted_caption"] = caption_model.predict(input_tfidf)
            df["predicted_hashtags"] = hashtag_model.predict(input_tfidf)
        else:
            df["predicted_caption"] = df["caption"]
            df["predicted_hashtags"] = df["hashtags"]

        df.to_csv(output_path, index=False)
        return df
    except Exception as e:
        print(f"[Error] Error during collaborative analysis: {e}")
        return pd.DataFrame([
            {"predicted_caption": "Discover amazing vibes", "predicted_hashtags": "#lifestyle #explore"}
        ])


def get_random_images(image_urls: list[str], num_images: int = 3) -> list[str]:
    if not image_urls:
        return ["https://picsum.photos/200/300"]
    return random.sample(image_urls, min(num_images, len(image_urls)))
