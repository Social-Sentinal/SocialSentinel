import os
import re
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, decode_token
from backend.extensions import db, limiter
from backend.models import *
from backend.services.recommendation_service import recommend, get_serendipity_feed, explain_recommendation
from backend.services.sentiment_service import predict_sentiment, emotion_detection, record_comment_sentiment_and_update_profile
from backend.services.embedding_service import get_or_create_post_embedding
from backend.services.ai_service import generate_ai_response

api_bp = Blueprint("api_v1", __name__, url_prefix="/api/v1")

def me_user():
    return User.query.get(int(get_jwt_identity()))

def optional_user_id():
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        try:
            token = auth.split(" ")[1]
            data = decode_token(token)
            return int(data["sub"])
        except Exception:
            return None
    return None

def page_args():
    return max(1, int(request.args.get("page", 1))), min(50, max(1, int(request.args.get("limit", 20))))

def auth_error(msg="Authentication required"):
    return jsonify({"status": "error", "message": msg}), 401

@api_bp.get("/health")
def api_health():
    return {"status": "ok", "service": "SocialSentinel", "version": "5.0.0"}

@api_bp.post("/auth/register")
@limiter.limit("10 per minute")
def register():
    d = request.get_json(silent=True) or {}
    email = str(d.get("email", "")).strip().lower()
    username = str(d.get("username", "")).strip().lower()
    password = str(d.get("password", ""))
    display = str(d.get("display_name") or username).strip()

    if not re.fullmatch(r"[a-z0-9_]{3,40}", username):
        return {"message": "Username must be 3-40 chars: letters, numbers, underscore"}, 400
    if "@" not in email or len(email) > 255:
        return {"message": "Valid email required"}, 400
    if len(password) < 6:
        return {"message": "Password must be at least 6 characters"}, 400
    if User.query.filter_by(username=username).first():
        return {"message": "Username already taken"}, 409
    if User.query.filter_by(email=email).first():
        return {"message": "Email already registered"}, 409

    user = User(username=username, email=email, display_name=display or username)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    db.session.add(UserPreference(user_id=user.id))
    db.session.commit()

    sub = str(user.id)
    return {
        "access_token": create_access_token(identity=sub),
        "refresh_token": create_refresh_token(identity=sub),
        "user": user.to_dict(private=True)
    }, 201

@api_bp.post("/auth/login")
@limiter.limit("20 per minute")
def login():
    d = request.get_json(silent=True) or {}
    ident = str(d.get("identifier") or d.get("username") or d.get("email") or "").strip().lower()
    password = str(d.get("password", ""))

    user = User.query.filter(db.or_(User.username == ident, User.email == ident)).first()
    if not user or not user.check_password(password):
        return {"message": "Invalid username or password"}, 401

    sub = str(user.id)
    return {
        "access_token": create_access_token(identity=sub),
        "refresh_token": create_refresh_token(identity=sub),
        "user": user.to_dict(private=True)
    }

@api_bp.post("/auth/demo")
def demo_login():
    demo = User.query.filter_by(username="demo").first()
    if not demo:
        demo = User(username="demo", email="demo@socialsentinel.io", display_name="Sentinel Explorer")
        demo.set_password("Demo1234!")
        db.session.add(demo)
        db.session.flush()
        db.session.add(UserPreference(user_id=demo.id))
        db.session.commit()

    sub = str(demo.id)
    return {
        "access_token": create_access_token(identity=sub),
        "refresh_token": create_refresh_token(identity=sub),
        "user": demo.to_dict(private=True)
    }

@api_bp.post("/auth/refresh")
@jwt_required(refresh=True)
def refresh_token():
    sub = get_jwt_identity()
    return {"access_token": create_access_token(identity=sub)}

@api_bp.get("/users/me")
@jwt_required()
def me():
    return {"user": me_user().to_dict(private=True)}

@api_bp.put("/users/me")
@jwt_required()
def update_me():
    u = me_user()
    d = request.get_json(silent=True) or {}
    if "display_name" in d:
        u.display_name = str(d["display_name"]).strip()[:120]
    if "bio" in d:
        u.bio = str(d["bio"]).strip()[:1000]
    if "avatar_url" in d:
        u.avatar_url = str(d["avatar_url"]).strip()[:1000]
    if "is_private" in d:
        u.is_private = bool(d["is_private"])
    db.session.commit()
    return {"user": u.to_dict(private=True)}

@api_bp.get("/users/<username>")
def get_user_profile(username):
    user = User.query.filter_by(username=username).first_or_404()
    viewer = optional_user_id()
    data = user.to_dict(private=(viewer == user.id))
    data["is_following"] = bool(viewer and Follow.query.filter_by(follower_id=viewer, following_id=user.id).first())
    return {"user": data}

@api_bp.put("/users/preferences")
@jwt_required()
def update_prefs():
    u = me_user()
    p = u.preferences
    if not p:
        p = UserPreference(user_id=u.id)
        db.session.add(p)
    d = request.get_json(silent=True) or {}
    if "preferred_topics" in d:
        if isinstance(d["preferred_topics"], list):
            p.preferred_topics = ",".join(d["preferred_topics"])
        else:
            p.preferred_topics = str(d["preferred_topics"])
    if "exploration_rate" in d:
        p.exploration_rate = max(0.05, min(0.80, float(d["exploration_rate"])))
    if "theme" in d:
        p.theme = str(d["theme"])
    if "auto_moderate" in d:
        p.auto_moderate = bool(d["auto_moderate"])
    db.session.commit()
    return {"preferences": p.to_dict()}

@api_bp.get("/users/topic-preferences")
@jwt_required()
def get_user_topic_preferences():
    u = me_user()
    rows = UserTopicPreference.query.filter_by(user_id=u.id).order_by(UserTopicPreference.interaction_count.desc()).all()
    return {"data": [r.to_dict() for r in rows]}

@api_bp.post("/users/topic-preferences/reset")
@jwt_required()
def reset_user_topic_preferences():
    u = me_user()
    UserTopicPreference.query.filter_by(user_id=u.id).delete()
    db.session.commit()
    return {"status": "ok", "message": "Topic sentiment preferences reset to baseline"}

@api_bp.post("/users/<int:user_id>/follow")
@jwt_required()
def toggle_follow(user_id):
    u = me_user()
    if u.id == user_id:
        return {"message": "Cannot follow yourself"}, 400
    target = User.query.get_or_404(user_id)
    f = Follow.query.filter_by(follower_id=u.id, following_id=target.id).first()
    if f:
        db.session.delete(f)
        following = False
    else:
        db.session.add(Follow(follower_id=u.id, following_id=target.id))
        db.session.add(Notification(user_id=target.id, actor_id=u.id, type="follow"))
        db.session.add(Interaction(user_id=u.id, post_id=1, event_type="follow"))
        following = True
    db.session.commit()
    return {"following": following, "followers_count": Follow.query.filter_by(following_id=target.id).count()}

@api_bp.post("/users/<int:user_id>/block")
@jwt_required()
def toggle_block(user_id):
    u = me_user()
    if u.id == user_id:
        return {"message": "Cannot block yourself"}, 400
    target = User.query.get_or_404(user_id)
    b = Block.query.filter_by(blocker_id=u.id, blocked_id=target.id).first()
    if b:
        db.session.delete(b)
        blocked = False
    else:
        db.session.add(Block(blocker_id=u.id, blocked_id=target.id))
        # Unfollow each other upon block
        Follow.query.filter(
            db.or_(
                db.and_(Follow.follower_id == u.id, Follow.following_id == target.id),
                db.and_(Follow.follower_id == target.id, Follow.following_id == u.id)
            )
        ).delete()
        blocked = True
    db.session.commit()
    return {"blocked": blocked}

# Posts & Feed
@api_bp.get("/posts")
def list_posts():
    viewer = optional_user_id()
    page, limit = page_args()
    q = request.args.get("q", "").strip()
    topic = request.args.get("topic", "").strip()
    sentiment_filter = request.args.get("sentiment", "").strip()
    author_name = request.args.get("author", "").strip()

    query = Post.query
    if author_name:
        author = User.query.filter_by(username=author_name).first()
        if author:
            query = query.filter_by(author_id=author.id)
    if topic and topic != "All":
        query = query.filter_by(topic_category=topic)
    if sentiment_filter and sentiment_filter != "All":
        query = query.filter_by(sentiment=sentiment_filter)
    if q:
        query = query.filter(db.or_(Post.caption.ilike(f"%{q}%"), Post.hashtags.ilike(f"%{q}%")))

    rows = query.order_by(Post.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {"data": [p.to_dict(viewer) for p in rows], "page": page}

@api_bp.post("/posts")
@jwt_required()
def create_post():
    u = me_user()
    d = request.get_json(silent=True) or {}
    text = str(d.get("caption", "")).strip()
    if not text or len(text) > 5000:
        return {"message": "Caption must be 1-5000 characters"}, 400

    topic = str(d.get("topic", "AI & Tech"))[:80]
    hashtags = str(d.get("hashtags", ""))[:1000]

    p = Post(
        author_id=u.id,
        caption=text,
        hashtags=hashtags,
        media_url=d.get("media_url", ""),
        video_url=d.get("video_url", ""),
        media_type=d.get("media_type", "video" if d.get("video_url") else ("image" if d.get("media_url") else "text")),
        topic_category=topic
    )

    try:
        s = predict_sentiment(text, u.id)
        e = emotion_detection(text)
        p.sentiment = s["sentiment"]
        p.sentiment_confidence = s["confidence"]
        p.emotion = e["emotion"]
        p.emotion_confidence = e["confidence"]
    except Exception:
        pass

    db.session.add(p)
    db.session.flush()

    # Pre-generate & cache embedding vector
    get_or_create_post_embedding(p)

    # Process hashtags
    tags = re.findall(r"#([a-zA-Z0-9_]+)", f"{text} {hashtags}")
    for tag_name in set(tags):
        tag_obj = Hashtag.query.filter_by(tag=tag_name.lower()).first()
        if not tag_obj:
            tag_obj = Hashtag(tag=tag_name.lower(), post_count=1)
            db.session.add(tag_obj)
            db.session.flush()
        else:
            tag_obj.post_count += 1
        db.session.add(PostHashtag(post_id=p.id, hashtag_id=tag_obj.id))

    db.session.commit()
    return {"post": p.to_dict(u.id)}, 201

@api_bp.get("/posts/<int:post_id>")
def get_post(post_id):
    p = Post.query.get_or_404(post_id)
    viewer = optional_user_id()
    # Log view interaction
    if viewer:
        db.session.add(Interaction(user_id=viewer, post_id=p.id, event_type="view"))
        p.view_count = (p.view_count or 0) + 1
        db.session.commit()
    return {"post": p.to_dict(viewer)}

@api_bp.delete("/posts/<int:post_id>")
@jwt_required()
def delete_post(post_id):
    p = Post.query.get_or_404(post_id)
    u = me_user()
    if p.author_id != u.id and not u.is_admin:
        return auth_error("Not authorized")
    db.session.delete(p)
    db.session.commit()
    return {"deleted": True}

@api_bp.post("/posts/<int:post_id>/<action>")
@jwt_required()
def post_action(post_id, action):
    u = me_user()
    p = Post.query.get_or_404(post_id)
    if action == "like":
        x = Like.query.filter_by(user_id=u.id, post_id=p.id).first()
        if x:
            db.session.delete(x)
            result = False
        else:
            db.session.add(Like(user_id=u.id, post_id=p.id))
            if p.author_id != u.id:
                db.session.add(Notification(user_id=p.author_id, actor_id=u.id, type="like", post_id=p.id))
            db.session.add(Interaction(user_id=u.id, post_id=p.id, event_type="like"))
            result = True
    elif action in ("save", "bookmark"):
        x = Save.query.filter_by(user_id=u.id, post_id=p.id).first()
        if x:
            db.session.delete(x)
            result = False
        else:
            db.session.add(Save(user_id=u.id, post_id=p.id))
            db.session.add(Interaction(user_id=u.id, post_id=p.id, event_type="save"))
            result = True
    elif action == "share":
        db.session.add(Share(user_id=u.id, post_id=p.id))
        if p.author_id != u.id:
            db.session.add(Notification(user_id=p.author_id, actor_id=u.id, type="share", post_id=p.id))
        db.session.add(Interaction(user_id=u.id, post_id=p.id, event_type="share"))
        result = True
    elif action == "view":
        db.session.add(Interaction(user_id=u.id, post_id=p.id, event_type="view"))
        p.view_count = (p.view_count or 0) + 1
        result = True
    else:
        return {"message": "Unsupported action"}, 400

    db.session.commit()
    return {"post": p.to_dict(u.id), "result": result}

@api_bp.post("/posts/<int:post_id>/report")
@jwt_required()
def report_post(post_id):
    u = me_user()
    p = Post.query.get_or_404(post_id)
    d = request.get_json(silent=True) or {}
    reason = str(d.get("reason", "Inappropriate content"))[:100]
    details = str(d.get("details", ""))[:1000]

    report = Report(reporter_id=u.id, post_id=p.id, reason=reason, details=details)
    db.session.add(report)
    db.session.commit()
    return {"status": "reported", "message": "Thank you for helping keep SocialSentinel safe."}

# Comments
@api_bp.get("/posts/<int:post_id>/comments")
def get_comments(post_id):
    rows = Comment.query.filter_by(post_id=post_id).order_by(Comment.created_at.asc()).all()
    return {"data": [c.to_dict() for c in rows]}

@api_bp.post("/posts/<int:post_id>/comments")
@jwt_required()
def add_comment(post_id):
    u = me_user()
    p = Post.query.get_or_404(post_id)
    d = request.get_json(silent=True) or {}
    text = str(d.get("text", "")).strip()
    if not text or len(text) > 2000:
        return {"message": "Comment must be 1-2000 characters"}, 400

    parent_id = d.get("parent_id")
    c = Comment(post_id=p.id, user_id=u.id, text=text, parent_id=parent_id)
    db.session.add(c)
    db.session.flush()

    # Trigger sentiment analysis & update user topic profile
    sent_res = record_comment_sentiment_and_update_profile(u.id, p.id, c.id, text, p.topic_category)
    c.sentiment = sent_res["sentiment"]
    c.sentiment_confidence = sent_res["confidence"]

    try:
        emo_res = emotion_detection(text)
        c.emotion = emo_res["emotion"]
        c.emotion_confidence = emo_res["confidence"]
    except Exception:
        pass

    if p.author_id != u.id:
        db.session.add(Notification(user_id=p.author_id, actor_id=u.id, type="comment", post_id=p.id))
    db.session.add(Interaction(user_id=u.id, post_id=p.id, event_type="comment"))

    db.session.commit()
    return {"comment": c.to_dict()}, 201

# Recommendations
@api_bp.get("/recommendations/feed")
@jwt_required(optional=True)
def feed():
    uid = int(get_jwt_identity()) if get_jwt_identity() else (optional_user_id() or 1)
    u = User.query.get(uid)
    page, limit = page_args()
    expl = u.preferences.exploration_rate if (u and u.preferences) else 0.20
    q = request.args.get("query", "")
    items = recommend(uid, q, limit, expl)
    viewer = optional_user_id()
    formatted = [
        {
            "post": item["post"].to_dict(viewer) if hasattr(item["post"], "to_dict") else item["post"],
            "score": item["score"],
            "reason": item["reason"],
            "breakdown": item.get("breakdown", {})
        }
        for item in items
    ]
    return {"data": formatted, "page": page}

@api_bp.get("/recommendations/serendipity")
@jwt_required(optional=True)
def serendipity():
    uid = int(get_jwt_identity()) if get_jwt_identity() else (optional_user_id() or 1)
    page, limit = page_args()
    items = get_serendipity_feed(uid, limit)
    viewer = optional_user_id()
    formatted = [
        {
            "post": item["post"].to_dict(viewer) if hasattr(item["post"], "to_dict") else item["post"],
            "score": item["score"],
            "reason": item["reason"],
            "breakdown": item.get("breakdown", {})
        }
        for item in items
    ]
    return {"data": formatted, "page": page}

@api_bp.get("/recommendations/explain/<int:post_id>")
@jwt_required(optional=True)
def explain_post_recommendation(post_id):
    uid = int(get_jwt_identity()) if get_jwt_identity() else (optional_user_id() or 1)
    return explain_recommendation(uid, post_id)

# Sentiment & Emotion
@api_bp.post("/sentiment/predict")
def predict_sentiment_endpoint():
    d = request.get_json(silent=True) or {}
    text = str(d.get("text", "")).strip()
    if not text:
        return {"message": "Text is required"}, 400
    uid = optional_user_id()
    return predict_sentiment(text, uid)

@api_bp.post("/sentiment/emotion")
def predict_emotion_endpoint():
    d = request.get_json(silent=True) or {}
    text = str(d.get("text", "")).strip()
    if not text:
        return {"message": "Text is required"}, 400
    return emotion_detection(text)

@api_bp.get("/sentiment/history")
@jwt_required()
def sentiment_history():
    u = me_user()
    records = SentimentAnalysis.query.filter_by(user_id=u.id).order_by(SentimentAnalysis.created_at.desc()).limit(50).all()
    return {
        "data": [
            {
                "id": r.id,
                "post_id": r.post_id,
                "sentiment": r.sentiment_label,
                "confidence": r.confidence_score,
                "created_at": r.created_at.isoformat()
            }
            for r in records
        ]
    }

# Search & Explore
@api_bp.get("/search")
def search():
    q = (request.args.get("q") or "").strip()
    page, limit = page_args()
    if not q:
        return {"users": [], "posts": [], "hashtags": []}
    users = User.query.filter(db.or_(User.username.ilike(f"%{q}%"), User.display_name.ilike(f"%{q}%"))).limit(limit).all()
    posts = Post.query.filter(db.or_(Post.caption.ilike(f"%{q}%"), Post.hashtags.ilike(f"%{q}%"))).order_by(Post.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    hashtags = Hashtag.query.filter(Hashtag.tag.ilike(f"%{q.replace('#', '')}%")).order_by(Hashtag.post_count.desc()).limit(10).all()
    viewer = optional_user_id()
    return {
        "users": [x.to_dict() for x in users],
        "posts": [x.to_dict(viewer) for x in posts],
        "hashtags": [{"tag": f"#{h.tag}", "count": h.post_count} for h in hashtags]
    }

@api_bp.get("/search/trending")
def trending():
    tags = Hashtag.query.order_by(Hashtag.post_count.desc()).limit(8).all()
    comms = Community.query.order_by(Community.name.asc()).limit(6).all()
    return {
        "hashtags": [{"tag": f"#{h.tag}", "count": h.post_count} for h in tags],
        "topics": [c.name for c in comms]
    }

# Analytics & AI Studio
@api_bp.get("/analytics/overview")
@jwt_required()
def analytics():
    u = me_user()
    interactions_count = Interaction.query.filter_by(user_id=u.id).count()
    posts_created = Post.query.filter_by(author_id=u.id).count()
    followers = Follow.query.filter_by(following_id=u.id).count()
    following = Follow.query.filter_by(follower_id=u.id).count()

    # Calculate real topic interactions
    rows = Interaction.query.filter_by(user_id=u.id).all()
    topics = {}
    for r in rows:
        p = Post.query.get(r.post_id)
        if p and p.topic_category:
            topics[p.topic_category] = topics.get(p.topic_category, 0) + 1

    # Real sentiment distribution for this user
    sent_records = SentimentAnalysis.query.filter_by(user_id=u.id).all()
    sent_dist = {"Positive": 0, "Neutral": 0, "Negative": 0}
    for sr in sent_records:
        sent_dist[sr.sentiment_label] = sent_dist.get(sr.sentiment_label, 0) + 1

    return {
        "data": {
            "interactions": interactions_count,
            "posts_created": posts_created,
            "followers_count": followers,
            "following_count": following,
            "topics": topics,
            "sentiment_distribution": sent_dist
        }
    }

@api_bp.post("/ai/ask")
@jwt_required()
def ai_ask():
    u = me_user()
    prompt = str((request.get_json(silent=True) or {}).get("prompt", "")).strip()
    rows = Interaction.query.filter_by(user_id=u.id).order_by(Interaction.created_at.desc()).limit(100).all()
    topics = {}
    for x in rows:
        p = Post.query.get(x.post_id)
        if p and p.topic_category:
            topics[p.topic_category] = topics.get(p.topic_category, 0) + 1
    context = {"user": u.to_dict(), "topic_interactions": topics, "recent_events": [x.event_type for x in rows]}
    r, src = generate_ai_response(prompt, context)
    db.session.add(AIInsight(user_id=u.id, prompt=prompt, response=r, source=src))
    db.session.commit()
    return {"response": r, "source": src}

# Direct Messaging
@api_bp.get("/conversations")
@jwt_required()
def conversations():
    u = me_user()
    memberships = ConversationMember.query.filter_by(user_id=u.id).all()
    res = []
    for m in memberships:
        c = Conversation.query.get(m.conversation_id)
        if not c:
            continue
        other_members = [
            cm.user.to_dict() for cm in ConversationMember.query.filter(
                ConversationMember.conversation_id == c.id,
                ConversationMember.user_id != u.id
            ).all() if cm.user
        ]
        last_msg = Message.query.filter_by(conversation_id=c.id).order_by(Message.created_at.desc()).first()
        res.append({
            "id": c.id,
            "other_participants": other_members,
            "last_message": last_msg.to_dict() if last_msg else None,
            "updated_at": c.updated_at.isoformat()
        })
    return {"data": res}

@api_bp.post("/conversations")
@jwt_required()
def create_conversation():
    u = me_user()
    ids = set((request.get_json(silent=True) or {}).get("user_ids", []))
    ids.add(u.id)
    ids = {int(x) for x in ids}
    if len(ids) < 2:
        return {"message": "At least two users required"}, 400

    if len(ids) == 2:
        other_id = [x for x in ids if x != u.id][0]
        user_convs = {m.conversation_id for m in ConversationMember.query.filter_by(user_id=u.id).all()}
        other_convs = {m.conversation_id for m in ConversationMember.query.filter_by(user_id=other_id).all()}
        common = user_convs & other_convs
        for cid in common:
            if ConversationMember.query.filter_by(conversation_id=cid).count() == 2:
                return {"conversation_id": cid, "existing": True}, 200

    c = Conversation()
    db.session.add(c)
    db.session.flush()
    for uid in ids:
        User.query.get_or_404(uid)
        db.session.add(ConversationMember(conversation_id=c.id, user_id=uid))
    db.session.commit()
    return {"conversation_id": c.id, "existing": False}, 201

@api_bp.get("/conversations/<int:cid>/messages")
@jwt_required()
def get_messages(cid):
    u = me_user()
    if not ConversationMember.query.filter_by(conversation_id=cid, user_id=u.id).first():
        return auth_error("Not authorized")
    rows = Message.query.filter_by(conversation_id=cid).order_by(Message.created_at.asc()).limit(200).all()
    return {"data": [x.to_dict() for x in rows]}

@api_bp.post("/conversations/<int:cid>/messages")
@jwt_required()
def send_message(cid):
    u = me_user()
    if not ConversationMember.query.filter_by(conversation_id=cid, user_id=u.id).first():
        return auth_error("Not authorized")
    d = request.get_json(silent=True) or {}
    body = str(d.get("body", "")).strip()
    shared_post_id = d.get("shared_post_id")
    if shared_post_id:
        try:
            shared_post_id = int(shared_post_id)
        except Exception:
            shared_post_id = None

    if not body and not shared_post_id:
        return {"message": "Message body or shared post required"}, 400

    m = Message(conversation_id=cid, sender_id=u.id, body=body or "Shared an insight to chat", shared_post_id=shared_post_id)
    db.session.add(m)
    for member in ConversationMember.query.filter_by(conversation_id=cid).all():
        if member.user_id != u.id:
            db.session.add(Notification(user_id=member.user_id, actor_id=u.id, type="message"))
    db.session.commit()
    return {"message": m.to_dict()}, 201

# Notifications
@api_bp.get("/notifications")
@jwt_required()
def notifications():
    u = me_user()
    rows = Notification.query.filter_by(user_id=u.id).order_by(Notification.created_at.desc()).limit(50).all()
    return {"data": [n.to_dict() for n in rows]}

@api_bp.post("/notifications/read-all")
@jwt_required()
def read_all_notifications():
    Notification.query.filter_by(user_id=me_user().id, read=False).update({"read": True})
    db.session.commit()
    return {"ok": True}

# Communities
@api_bp.get("/communities")
def list_communities():
    viewer = optional_user_id()
    comms = Community.query.order_by(Community.name.asc()).all()
    return {"data": [c.to_dict(viewer) for c in comms]}

@api_bp.post("/communities/<int:cid>/join")
@jwt_required()
def toggle_community(cid):
    u = me_user()
    comm = Community.query.get_or_404(cid)
    existing = CommunityMember.query.filter_by(community_id=comm.id, user_id=u.id).first()
    if existing:
        db.session.delete(existing)
        joined = False
    else:
        db.session.add(CommunityMember(community_id=comm.id, user_id=u.id))
        joined = True
    db.session.commit()
    return {"joined": joined, "community": comm.to_dict(u.id)}

@api_bp.get("/communities/<slug>/posts")
def community_posts(slug):
    comm = Community.query.filter_by(slug=slug).first_or_404()
    viewer = optional_user_id()
    page, limit = page_args()
    rows = Post.query.filter_by(topic_category=comm.name).order_by(Post.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {"data": [p.to_dict(viewer) for p in rows], "community": comm.to_dict(viewer)}

@api_bp.get("/models")
def models():
    return {
        "data": [
            {"name": m.name, "version": m.version, "algorithm": m.algorithm, "status": m.status}
            for m in ModelVersion.query.all()
        ]
    }
