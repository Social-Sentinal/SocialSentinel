from datetime import datetime
from app.extensions import db


class UserProfile(db.Model):
    __tablename__ = "user_profiles"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    full_name = db.Column(db.String(128), nullable=True, default="")
    user_avatar = db.Column(db.String(512), nullable=True)
    followers_count = db.Column(db.Integer, default=0)
    following_count = db.Column(db.Integer, default=0)
    posts_count = db.Column(db.Integer, default=0)
    biography = db.Column(db.Text, nullable=True, default="")
    external_url = db.Column(db.String(255), nullable=True, default="")
    is_verified = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.String(64), default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "full_name": self.full_name or self.username,
            "user_avatar": self.user_avatar or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            "followers_count": self.followers_count,
            "following_count": self.following_count,
            "posts_count": self.posts_count,
            "biography": self.biography or "No bio provided.",
            "external_url": self.external_url or "",
            "is_verified": self.is_verified,
            "timestamp": self.timestamp
        }


class Post(db.Model):
    __tablename__ = "posts"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), default="humansofny", index=True)
    full_name = db.Column(db.String(128), default="Humans of New York")
    user_avatar = db.Column(db.String(512), default="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80")
    location = db.Column(db.String(128), default="New York, NY")
    caption = db.Column(db.Text, nullable=False)
    hashtags = db.Column(db.String(255), nullable=True)
    image_url = db.Column(db.String(512), nullable=True)
    likes_count = db.Column(db.Integer, default=1240)
    comments_count = db.Column(db.Integer, default=85)
    views_count = db.Column(db.Integer, default=3420)
    follower_count = db.Column(db.Integer, default=242500)
    biography = db.Column(db.Text, nullable=True, default="Stories from everyday people.")
    external_url = db.Column(db.String(255), nullable=True, default="https://instagram.com")
    timestamp = db.Column(db.String(64), nullable=True)
    sentiment = db.Column(db.String(32), default="Neutral", index=True)
    score = db.Column(db.Float, default=0.5)
    is_verified = db.Column(db.Boolean, default=True)

    topic_category = db.Column(db.String(64), default="General", index=True)
    comments = db.relationship("Comment", backref="post", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username or "humansofny",
            "full_name": self.full_name or self.username or "Humans of New York",
            "user_avatar": self.user_avatar or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            "location": self.location or "New York, NY",
            "caption": self.caption,
            "hashtags": self.hashtags or "#life #story",
            "image_url": self.image_url or "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80",
            "likes_count": self.likes_count,
            "comments_count": len(self.comments) if self.comments else self.comments_count,
            "views_count": self.views_count,
            "follower_count": self.follower_count or 10000,
            "biography": self.biography or "Instagram creator & storyteller",
            "external_url": self.external_url or "https://instagram.com",
            "timestamp": self.timestamp or datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "sentiment": self.sentiment,
            "score": round(self.score, 2),
            "topic_category": self.topic_category or "General",
            "is_verified": self.is_verified,
            "prediction": "Likely to engage" if self.sentiment == "Positive" else "Less likely to engage",
            "comments_list": [c.to_dict() for c in self.comments[-5:]] if self.comments else [],
            "url": f"https://instagram.com/p/post_{self.id}"
        }



class Comment(db.Model):
    __tablename__ = "comments"

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False)
    username = db.Column(db.String(64), default="user_visitor")
    user_avatar = db.Column(db.String(512), default="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80")
    text = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.String(64), default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    def to_dict(self):
        return {
            "id": self.id,
            "post_id": self.post_id,
            "username": self.username,
            "user_avatar": self.user_avatar,
            "text": self.text,
            "timestamp": self.timestamp
        }


class UserInteraction(db.Model):
    __tablename__ = "user_interactions"

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, nullable=True)
    caption = db.Column(db.Text, nullable=True)
    hashtags = db.Column(db.String(255), nullable=True)
    view_duration = db.Column(db.Float, default=0.0)
    liked = db.Column(db.Boolean, default=False)
    saved = db.Column(db.Boolean, default=False)
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
            "saved": self.saved,
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
    timestamp = db.Column(db.String(64), default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"), index=True)

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


class UserInterestProfile(db.Model):
    __tablename__ = "user_interest_profiles"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), default="user_visitor", unique=True, index=True)
    wellbeing_score = db.Column(db.Float, default=78.5) # 0-100 score
    preferred_topics = db.Column(db.String(255), default="Career,Self Growth,Technology,Travel")
    recent_sentiment_bias = db.Column(db.Float, default=0.1) # -1.0 (very negative) to +1.0 (very positive)
    uplift_mode_enabled = db.Column(db.Boolean, default=True)
    last_updated = db.Column(db.String(64), default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "wellbeing_score": round(self.wellbeing_score, 1),
            "preferred_topics": self.preferred_topics.split(",") if self.preferred_topics else [],
            "recent_sentiment_bias": round(self.recent_sentiment_bias, 2),
            "uplift_mode_enabled": self.uplift_mode_enabled,
            "last_updated": self.last_updated
        }


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), default="user_visitor", index=True)
    title = db.Column(db.String(128), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(32), default="wellbeing") # wellbeing, post, alert
    is_read = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.String(64), default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "title": self.title,
            "message": self.message,
            "type": self.notification_type,
            "is_read": self.is_read,
            "timestamp": self.timestamp
        }

