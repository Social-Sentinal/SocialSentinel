from textblob import TextBlob
from app.extensions import db
from app.models import Post, UserInteraction


def analyze_textblob_sentiment(text: str) -> tuple[str, float]:
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


def generate_api_posts() -> list[dict]:
    posts = Post.query.all()
    if not posts:
        return [
            {
                "id": 1,
                "caption": "Exploring nature and mountain trails",
                "sentiment": "Positive",
                "score": 0.85,
                "prediction": "Likely to engage",
                "url": "https://instagram.com/p/post_1",
                "timestamp": "2024-10-15 12:00:00"
            }
        ]

    return [p.to_dict() for p in posts]


def save_api_post(post_data: dict) -> None:
    try:
        interaction = UserInteraction(
            post_id=post_data.get("id"),
            caption=post_data.get("caption", ""),
            hashtags=post_data.get("hashtags", ""),
            view_duration=float(post_data.get("duration", 5.0)),
            liked=bool(post_data.get("liked", False)),
            shared=bool(post_data.get("shared", False)),
            comment_text=post_data.get("comment", "")
        )
        db.session.add(interaction)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"[Database Error] Saving API post interaction failed: {e}")
