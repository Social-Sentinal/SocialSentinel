import csv
import pandas as pd
from textblob import TextBlob
from app.config import DATA_DIR
from app.utils.data_loader import load_dataset


def analyze_textblob_sentiment(text: str) -> tuple[str, float]:
    """Analyze sentiment polarity using TextBlob."""
    if not isinstance(text, str) or not text.strip():
        return "Neutral", 0.0

    analysis = TextBlob(text)
    polarity = analysis.sentiment.polarity

    if polarity > 0:
        return "Positive", polarity
    elif polarity < 0:
        return "Negative", polarity
    else:
        return "Neutral", polarity


def generate_api_posts(df: pd.DataFrame = None) -> list[dict]:
    """Generate analyzed post data for the API page."""
    if df is None or df.empty:
        df = load_dataset("recommended_content.csv")

    if df.empty:
        # Provide clean fallback dataset if CSV is empty or missing
        return [
            {
                "id": 1,
                "caption": "Exploring nature and mountain trails",
                "sentiment": "Positive",
                "score": 0.85,
                "prediction": "Likely to engage",
                "url": "https://instagram.com/p/sample1",
                "timestamp": "2024-10-15 12:00:00"
            }
        ]

    posts = []
    for index, row in df.iterrows():
        caption = str(row.get("caption", row.get("Caption", "Sample Caption")))
        sentiment, score = analyze_textblob_sentiment(caption)

        post = {
            "id": index,
            "caption": caption,
            "sentiment": sentiment,
            "score": round(score, 2),
            "prediction": "Likely to engage" if sentiment == "Positive" else "Less likely to engage",
            "url": str(row.get("url", row.get("URL", "#"))),
            "timestamp": str(row.get("timestamp", row.get("Timestamp", "2024-10-15 14:00:00")))
        }
        posts.append(post)
    return posts


def save_api_post(post_data: dict) -> None:
    """Save recommended post metadata to recommended_posts.csv in data directory."""
    recommendation_data = [
        post_data.get("caption", ""),
        post_data.get("hashtags", ""),
        post_data.get("timestamp", ""),
        post_data.get("duration", "")
    ]

    output_path = DATA_DIR / "recommended_posts.csv"
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    with open(output_path, mode="a", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(recommendation_data)
