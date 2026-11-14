from datetime import datetime, timezone
import json
from backend.extensions import db
import bcrypt

def utcnow():
    return datetime.now(timezone.utc)

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(40), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    display_name = db.Column(db.String(120), nullable=False)
    bio = db.Column(db.Text, default="")
    avatar_url = db.Column(db.String(1000), default="")
    is_private = db.Column(db.Boolean, default=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    preferences = db.relationship("UserPreference", backref="user", uselist=False, cascade="all,delete-orphan")
    topic_preferences = db.relationship("UserTopicPreference", backref="user", cascade="all,delete-orphan", lazy="dynamic")

    def set_password(self, p):
        self.password_hash = bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

    def check_password(self, p):
        return bcrypt.checkpw(p.encode(), self.password_hash.encode())

    def to_dict(self, private=False):
        d = {
            "id": self.id,
            "username": self.username,
            "email": self.email if private else None,
            "display_name": self.display_name,
            "bio": self.bio or "",
            "avatar_url": self.avatar_url or "",
            "is_private": self.is_private,
            "is_admin": self.is_admin,
            "created_at": self.created_at.isoformat()
        }
        d["followers_count"] = Follow.query.filter_by(following_id=self.id).count()
        d["following_count"] = Follow.query.filter_by(follower_id=self.id).count()
        d["posts_count"] = Post.query.filter_by(author_id=self.id).count()
        return d

class UserPreference(db.Model):
    __tablename__ = "user_preferences"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    preferred_topics = db.Column(db.Text, default="AI & Tech,Web Engineering,Cybersecurity & Privacy,Creative Tech & Design,Digital Wellbeing")
    exploration_rate = db.Column(db.Float, default=0.20)
    sentiment_weight = db.Column(db.Float, default=0.20)
    theme = db.Column(db.String(20), default="dark")
    auto_moderate = db.Column(db.Boolean, default=True)

    def topics(self):
        return [x.strip() for x in (self.preferred_topics or "").split(",") if x.strip()]

    def to_dict(self):
        return {
            "preferred_topics": self.topics(),
            "exploration_rate": self.exploration_rate,
            "sentiment_weight": self.sentiment_weight,
            "theme": self.theme,
            "auto_moderate": self.auto_moderate
        }

class UserTopicPreference(db.Model):
    __tablename__ = "user_topic_preferences"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic = db.Column(db.String(80), nullable=False, index=True)
    positive_count = db.Column(db.Integer, default=0)
    neutral_count = db.Column(db.Integer, default=0)
    negative_count = db.Column(db.Integer, default=0)
    sentiment_score = db.Column(db.Float, default=0.5)  # 0.0 (negative) to 1.0 (positive)
    interaction_count = db.Column(db.Integer, default=0)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)
    __table_args__ = (db.UniqueConstraint("user_id", "topic", name="uq_user_topic_pref"),)

    def to_dict(self):
        return {
            "topic": self.topic,
            "positive_count": self.positive_count,
            "neutral_count": self.neutral_count,
            "negative_count": self.negative_count,
            "sentiment_score": round(self.sentiment_score, 3),
            "interaction_count": self.interaction_count,
            "updated_at": self.updated_at.isoformat()
        }

class Post(db.Model):
    __tablename__ = "posts"
    id = db.Column(db.Integer, primary_key=True)
    author_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    caption = db.Column(db.Text, nullable=False)
    hashtags = db.Column(db.String(1000), default="")
    media_url = db.Column(db.String(1000), default="")
    video_url = db.Column(db.String(1000), default="")
    media_type = db.Column(db.String(32), default="image")
    topic_category = db.Column(db.String(80), default="AI & Tech", index=True)
    sentiment = db.Column(db.String(32), default="Positive", index=True)
    sentiment_confidence = db.Column(db.Float, default=0.85)
    emotion = db.Column(db.String(32), default="inspiration", index=True)
    emotion_confidence = db.Column(db.Float, default=0.80)
    embedding = db.Column(db.Text, nullable=True)  # JSON serialized list of floats
    view_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    author = db.relationship("User", backref=db.backref("posts", lazy=True))
    comments = db.relationship("Comment", backref="post", cascade="all,delete-orphan", lazy="dynamic")

    def counts(self):
        return {
            "likes": Like.query.filter_by(post_id=self.id).count(),
            "comments": Comment.query.filter_by(post_id=self.id).count(),
            "saves": Save.query.filter_by(post_id=self.id).count(),
            "shares": Share.query.filter_by(post_id=self.id).count(),
            "views": self.view_count or Interaction.query.filter_by(post_id=self.id, event_type="view").count()
        }

    def to_dict(self, viewer=None):
        c = self.counts()
        return {
            "id": self.id,
            "author": self.author.to_dict() if self.author else None,
            "caption": self.caption,
            "hashtags": self.hashtags or "",
            "media_url": self.media_url or "",
            "video_url": self.video_url or "",
            "media_type": self.media_type or ("video" if self.video_url else "image"),
            "topic": self.topic_category,
            "sentiment": self.sentiment,
            "sentiment_confidence": self.sentiment_confidence,
            "emotion": self.emotion,
            "emotion_confidence": self.emotion_confidence,
            "created_at": self.created_at.isoformat(),
            "counts": c,
            "liked": bool(viewer and Like.query.filter_by(post_id=self.id, user_id=viewer).first()),
            "saved": bool(viewer and Save.query.filter_by(post_id=self.id, user_id=viewer).first())
        }

class PostMedia(db.Model):
    __tablename__ = "post_media"
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    media_url = db.Column(db.String(1000), nullable=False)
    media_type = db.Column(db.String(32), default="image")  # image / video
    order_index = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=utcnow)

class Like(db.Model):
    __tablename__ = "likes"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=utcnow)
    __table_args__ = (db.UniqueConstraint("user_id", "post_id", name="uq_like"),)

class Save(db.Model):
    __tablename__ = "saves"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=utcnow)
    __table_args__ = (db.UniqueConstraint("user_id", "post_id", name="uq_save"),)

# Bookmark alias pointing to Save model
Bookmark = Save

class Share(db.Model):
    __tablename__ = "shares"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)

class Follow(db.Model):
    __tablename__ = "follows"
    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    following_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=utcnow)
    __table_args__ = (
        db.UniqueConstraint("follower_id", "following_id", name="uq_follow"),
        db.CheckConstraint("follower_id <> following_id", name="ck_no_self_follow")
    )

class Comment(db.Model):
    __tablename__ = "comments"
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = db.Column(db.Integer, db.ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    text = db.Column(db.Text, nullable=False)
    sentiment = db.Column(db.String(32), default="Neutral", index=True)
    sentiment_confidence = db.Column(db.Float, default=0.70)
    emotion = db.Column(db.String(32), default="curiosity")
    emotion_confidence = db.Column(db.Float, default=0.65)
    created_at = db.Column(db.DateTime, default=utcnow, index=True)

    user = db.relationship("User", backref="user_comments")
    replies = db.relationship("Comment", backref=db.backref("parent", remote_side=[id]), cascade="all,delete-orphan")

    def to_dict(self):
        user_dict = self.user.to_dict() if self.user else (User.query.get(self.user_id).to_dict() if self.user_id else None)
        return {
            "id": self.id,
            "post_id": self.post_id,
            "parent_id": self.parent_id,
            "user": user_dict,
            "text": self.text,
            "sentiment": self.sentiment,
            "sentiment_confidence": self.sentiment_confidence,
            "emotion": self.emotion,
            "emotion_confidence": self.emotion_confidence,
            "created_at": self.created_at.isoformat()
        }

class SentimentAnalysis(db.Model):
    __tablename__ = "sentiment_analysis"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id", ondelete="CASCADE"), nullable=True, index=True)
    comment_id = db.Column(db.Integer, db.ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True)
    sentiment_label = db.Column(db.String(32), nullable=False)
    confidence_score = db.Column(db.Float, nullable=False)
    model_name = db.Column(db.String(80), default="multilingual-sentiment-local")
    model_version = db.Column(db.String(32), default="v3")
    created_at = db.Column(db.DateTime, default=utcnow, index=True)

class PostEmbedding(db.Model):
    __tablename__ = "post_embeddings"
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    embedding_json = db.Column(db.Text, nullable=False)
    model_name = db.Column(db.String(80), default="all-MiniLM-L6-v2")
    created_at = db.Column(db.DateTime, default=utcnow)

class Hashtag(db.Model):
    __tablename__ = "hashtags"
    id = db.Column(db.Integer, primary_key=True)
    tag = db.Column(db.String(100), unique=True, nullable=False, index=True)
    post_count = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=utcnow)

class PostHashtag(db.Model):
    __tablename__ = "post_hashtags"
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    hashtag_id = db.Column(db.Integer, db.ForeignKey("hashtags.id", ondelete="CASCADE"), nullable=False, index=True)
    __table_args__ = (db.UniqueConstraint("post_id", "hashtag_id", name="uq_post_hashtag"),)

class Interaction(db.Model):
    __tablename__ = "interactions"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = db.Column(db.String(32), nullable=False, index=True)  # like, save, comment, share, view, skip
    duration_seconds = db.Column(db.Float, default=0)
    session_id = db.Column(db.String(128), nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow, index=True)

class Recommendation(db.Model):
    __tablename__ = "recommendations"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    score = db.Column(db.Float, nullable=False)
    reason = db.Column(db.String(500))
    model_version = db.Column(db.String(64), default="v4-hybrid-sentiment")
    created_at = db.Column(db.DateTime, default=utcnow, index=True)

class Notification(db.Model):
    __tablename__ = "notifications"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    type = db.Column(db.String(40), nullable=False)  # like, comment, follow, message
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id", ondelete="CASCADE"), nullable=True)
    message_id = db.Column(db.Integer, nullable=True)
    read = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=utcnow, index=True)

    actor = db.relationship("User", foreign_keys=[actor_id])

    def to_dict(self):
        actor_dict = self.actor.to_dict() if self.actor else None
        return {
            "id": self.id,
            "type": self.type,
            "actor": actor_dict,
            "post_id": self.post_id,
            "read": self.read,
            "created_at": self.created_at.isoformat()
        }

class Conversation(db.Model):
    __tablename__ = "conversations"
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)
    members = db.relationship("ConversationMember", backref="conversation", cascade="all,delete-orphan")
    messages = db.relationship("Message", backref="conversation", cascade="all,delete-orphan", order_by="Message.created_at.asc()")

class ConversationMember(db.Model):
    __tablename__ = "conversation_members"
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at = db.Column(db.DateTime, default=utcnow)
    __table_args__ = (db.UniqueConstraint("conversation_id", "user_id", name="uq_member"),)

    user = db.relationship("User")

# ConversationParticipant alias
ConversationParticipant = ConversationMember

class Message(db.Model):
    __tablename__ = "messages"
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    body = db.Column(db.Text, nullable=False)
    shared_post_id = db.Column(db.Integer, db.ForeignKey("posts.id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow, index=True)
    edited_at = db.Column(db.DateTime, nullable=True)
    deleted_at = db.Column(db.DateTime, nullable=True)

    sender = db.relationship("User", foreign_keys=[sender_id])

    def to_dict(self):
        post = Post.query.get(self.shared_post_id) if self.shared_post_id else None
        return {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "sender": self.sender.to_dict() if self.sender else None,
            "body": self.body,
            "shared_post_id": self.shared_post_id,
            "shared_post": post.to_dict() if post else None,
            "created_at": self.created_at.isoformat()
        }

class MessageRead(db.Model):
    __tablename__ = "message_reads"
    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.Integer, db.ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    read_at = db.Column(db.DateTime, default=utcnow)
    __table_args__ = (db.UniqueConstraint("message_id", "user_id", name="uq_msg_read"),)

class Block(db.Model):
    __tablename__ = "blocks"
    id = db.Column(db.Integer, primary_key=True)
    blocker_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    blocked_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=utcnow)
    __table_args__ = (
        db.UniqueConstraint("blocker_id", "blocked_id", name="uq_block"),
        db.CheckConstraint("blocker_id <> blocked_id", name="ck_no_self_block")
    )

class Community(db.Model):
    __tablename__ = "communities"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    slug = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.Text, default="")
    icon = db.Column(db.String(40), default="🪐")
    banner_gradient = db.Column(db.String(120), default="linear-gradient(135deg, #6366f1, #a855f7)")
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self, viewer=None):
        m_count = CommunityMember.query.filter_by(community_id=self.id).count()
        p_count = Post.query.filter_by(topic_category=self.name).count()
        is_member = bool(viewer and CommunityMember.query.filter_by(community_id=self.id, user_id=viewer).first())
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "icon": self.icon,
            "banner_gradient": self.banner_gradient,
            "members_count": m_count,
            "posts_count": p_count,
            "is_member": is_member
        }

class CommunityMember(db.Model):
    __tablename__ = "community_members"
    id = db.Column(db.Integer, primary_key=True)
    community_id = db.Column(db.Integer, db.ForeignKey("communities.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at = db.Column(db.DateTime, default=utcnow)
    __table_args__ = (db.UniqueConstraint("community_id", "user_id", name="uq_comm_member"),)

class AIInsight(db.Model):
    __tablename__ = "ai_insights"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    prompt = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    source = db.Column(db.String(40), default="sentinel-grounded")
    created_at = db.Column(db.DateTime, default=utcnow)

class ModelVersion(db.Model):
    __tablename__ = "model_versions"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    version = db.Column(db.String(50), nullable=False)
    algorithm = db.Column(db.String(120), nullable=False)
    status = db.Column(db.String(32), default="active")
    metrics_json = db.Column(db.Text, default="{}")
    created_at = db.Column(db.DateTime, default=utcnow)

class Report(db.Model):
    __tablename__ = "reports"
    id = db.Column(db.Integer, primary_key=True)
    reporter_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id", ondelete="CASCADE"), nullable=True)
    reason = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text, default="")
    status = db.Column(db.String(30), default="open")
    created_at = db.Column(db.DateTime, default=utcnow)

class SearchHistory(db.Model):
    __tablename__ = "search_history"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    query = db.Column(db.String(300), nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)
