from datetime import datetime
from app.extensions import db


class Post(db.Model):
    __tablename__ = "posts"

    id = db.Column(db.Integer, primary_key=True)
    caption = db.Column(db.Text, nullable=False)
    hashtags = db.Column(db.String(255), nullable=True)
    image_url = db.Column(db.String(512), nullable=True)
    likes_count = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    views_count = db.Column(db.Integer, default=0)
    timestamp = db.Column(db.String(64), nullable=True)
    sentiment = db.Column(db.String(32), default="Neutral")
    score = db.Column(db.Float, default=0.5)

    def to_dict(self):
        return {
            "id": self.id,
            "caption": self.caption,
            "hashtags": self.hashtags or "",
            "image_url": self.image_url or "https://picsum.photos/300/200",
            "likes_count": self.likes_count,
            "comments_count": self.comments_count,
            "views_count": self.views_count,
            "timestamp": self.timestamp or datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "sentiment": self.sentiment,
            "score": round(self.score, 2),
            "prediction": "Likely to engage" if self.sentiment == "Positive" else "Less likely to engage",
            "url": f"https://instagram.com/p/post_{self.id}"
        }


class UserInteraction(db.Model):
    __tablename__ = "user_interactions"

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, nullable=True)
    caption = db.Column(db.Text, nullable=True)
    hashtags = db.Column(db.String(255), nullable=True)
    view_duration = db.Column(db.Float, default=0.0)
    liked = db.Column(db.Boolean, default=False)
    shared = db.Column(db.Boolean, default=False)
    comment_text = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.String(64), default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    def to_dict(self):
        return {
            "id": self.id,
            "post_id": self.post_id,
            "caption": self.caption or "",
            "hashtags": self.hashtags or "",
            "view_duration": round(self.view_duration, 2),
            "liked": self.liked,
            "shared": self.shared,
            "comment_text": self.comment_text or "",
            "timestamp": self.timestamp
        }


class SentimentLog(db.Model):
    __tablename__ = "sentiment_logs"

    id = db.Column(db.Integer, primary_key=True)
    input_text = db.Column(db.Text, nullable=False)
    sentiment = db.Column(db.String(32), nullable=False)
    confidence = db.Column(db.Float, default=0.0)
    positive_score = db.Column(db.Float, default=0.0)
    neutral_score = db.Column(db.Float, default=0.0)
    negative_score = db.Column(db.Float, default=0.0)
    timestamp = db.Column(db.String(64), default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    def to_dict(self):
        return {
            "id": self.id,
            "input_text": self.input_text,
            "sentiment": self.sentiment,
            "confidence": round(self.confidence, 4),
            "distribution": {
                "positive": round(self.positive_score, 2),
                "neutral": round(self.neutral_score, 2),
                "negative": round(self.negative_score, 2)
            },
            "timestamp": self.timestamp
        }
