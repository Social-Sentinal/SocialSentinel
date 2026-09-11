import os
import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, decode_token
from app.extensions import db, limiter
from app.models import *
from app.services.recommendation_service import recommend, get_serendipity_feed
from app.services.sentiment_service import predict_sentiment, emotion_detection
from app.services.ai_service import generate_ai_response

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
    return {"status": "ok", "service": "Cosmos Social", "version": "4.1.0"}

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
    if User.query.filter((User.email == email) | (User.username == username)).first():
        return {"message": "Email or username already exists"}, 409

    u = User(username=username, email=email, display_name=display)
    u.set_password(password)
    db.session.add(u)
    db.session.flush()
    db.session.add(UserPreference(user_id=u.id))
    db.session.commit()
    return {
        "user": u.to_dict(True),
        "access_token": create_access_token(identity=str(u.id)),
        "refresh_token": create_refresh_token(identity=str(u.id))
    }, 201

@api_bp.post("/auth/login")
@limiter.limit("20 per minute")
def login():
    d = request.get_json(silent=True) or {}
    ident = str(d.get("email") or d.get("username") or "").strip().lower()
    u = User.query.filter((User.email == ident) | (User.username == ident)).first()
    if not u or not u.check_password(str(d.get("password", ""))):
        return {"message": "Invalid credentials"}, 401
    return {
        "user": u.to_dict(True),
        "access_token": create_access_token(identity=str(u.id)),
        "refresh_token": create_refresh_token(identity=str(u.id))
    }

@api_bp.post("/auth/demo")
def demo_login():
    u = User.query.filter_by(username="demo").first()
    if not u:
        u = User.query.first()
    if not u:
        return {"message": "No demo user initialized yet"}, 404
    return {
        "user": u.to_dict(True),
        "access_token": create_access_token(identity=str(u.id)),
        "refresh_token": create_refresh_token(identity=str(u.id))
    }

@api_bp.post("/auth/refresh")
@jwt_required(refresh=True)
def refresh():
    return {"access_token": create_access_token(identity=str(get_jwt_identity()))}

@api_bp.get("/users/me")
@jwt_required()
def me():
    u = me_user()
    if not u:
        return auth_error()
    return {"user": u.to_dict(True), "preferences": (u.preferences or UserPreference(user_id=u.id)).to_dict()}

@api_bp.put("/users/me")
@jwt_required()
def update_me():
    u = me_user()
    if not u:
        return auth_error()
    d = request.get_json(silent=True) or {}
    for k in ("display_name", "bio", "avatar_url"):
        if k in d:
            setattr(u, k, str(d[k])[:1000])
    if "username" in d:
        v = str(d["username"]).lower().strip()
        if not re.fullmatch(r"[a-z0-9_]{3,40}", v):
            return {"message": "Invalid username format"}, 400
        if User.query.filter(User.username == v, User.id != u.id).first():
            return {"message": "Username already taken"}, 409
        u.username = v
    db.session.commit()
    return {"user": u.to_dict(True)}

@api_bp.put("/users/preferences")
@jwt_required()
def prefs():
    u = me_user()
    if not u:
        return auth_error()
    p = u.preferences or UserPreference(user_id=u.id)
    d = request.get_json(silent=True) or {}
    if "preferred_topics" in d:
        p.preferred_topics = ",".join(map(str, d["preferred_topics"]))[:1000]
    if "theme" in d and d["theme"] in ("system", "light", "dark"):
        p.theme = d["theme"]
    if "exploration_rate" in d:
        p.exploration_rate = max(0.0, min(1.0, float(d["exploration_rate"])))
    db.session.add(p)
    db.session.commit()
    return {"preferences": p.to_dict()}

@api_bp.get("/users/<username>")
def public_profile(username):
    u = User.query.filter_by(username=username.lower()).first_or_404()
    return {"user": u.to_dict()}

@api_bp.post("/users/<int:user_id>/follow")
@jwt_required()
def follow(user_id):
    u = me_user()
    target = User.query.get_or_404(user_id)
    if u.id == target.id:
        return {"message": "Cannot follow yourself"}, 400
    f = Follow.query.filter_by(follower_id=u.id, following_id=target.id).first()
    if f:
        db.session.delete(f)
        action = "unfollow"
    else:
        db.session.add(Follow(follower_id=u.id, following_id=target.id))
        db.session.add(Notification(user_id=target.id, actor_id=u.id, type="follow"))
        action = "follow"
    db.session.commit()
    return {"action": action, "following": action == "follow"}

@api_bp.get("/posts")
def posts():
    viewer = optional_user_id()
    page, limit = page_args()
    q = (request.args.get("q") or "").strip()
    topic = request.args.get("topic")
    sentiment = request.args.get("sentiment")
    author = request.args.get("author")
    
    query = Post.query
    if q:
        query = query.filter(db.or_(Post.caption.ilike(f"%{q}%"), Post.hashtags.ilike(f"%{q}%")))
    if topic and topic.lower() != "all":
        query = query.filter_by(topic_category=topic)
    if sentiment and sentiment.lower() != "all":
        query = query.filter_by(sentiment=sentiment)
    if author:
        query = query.join(User).filter(User.username == author)
        
    query = query.order_by(Post.created_at.desc())
    total = query.count()
    rows = query.offset((page - 1) * limit).limit(limit).all()
    return {
        "data": [p.to_dict(viewer) for p in rows],
        "page": page,
        "limit": limit,
        "total": total
    }

@api_bp.post("/posts")
@jwt_required()
def create_post():
    u = me_user()
    d = request.get_json(silent=True) or {}
    text = str(d.get("caption", "")).strip()
    if not text or len(text) > 5000:
        return {"message": "Caption must be 1-5000 characters"}, 400
        
    p = Post(
        author_id=u.id,
        caption=text,
        hashtags=str(d.get("hashtags", ""))[:1000],
        media_url=d.get("media_url"),
        topic_category=str(d.get("topic", "Astrophysics & Cosmos"))[:80]
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
    db.session.commit()
    return {"post": p.to_dict(u.id)}, 201

@api_bp.put("/posts/<int:post_id>")
@jwt_required()
def edit_post(post_id):
    p = Post.query.get_or_404(post_id)
    u = me_user()
    if p.author_id != u.id:
        return auth_error("Not allowed")
    d = request.get_json(silent=True) or {}
    p.caption = str(d.get("caption", p.caption)).strip()
    p.hashtags = str(d.get("hashtags", p.hashtags))[:1000]
    db.session.commit()
    return {"post": p.to_dict(u.id)}

@api_bp.delete("/posts/<int:post_id>")
@jwt_required()
def delete_post(post_id):
    p = Post.query.get_or_404(post_id)
    u = me_user()
    if p.author_id != u.id:
        return auth_error("Not allowed")
    db.session.delete(p)
    db.session.commit()
    return {"deleted": True}

@api_bp.post("/posts/<int:post_id>/<action>")
@jwt_required()
def interaction(post_id, action):
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
    elif action == "save":
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
        result = True
    else:
        return {"message": "Unsupported action"}, 400
    db.session.commit()
    return {"post": p.to_dict(u.id), "result": result}

@api_bp.get("/posts/<int:post_id>/comments")
def comments(post_id):
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
    c = Comment(post_id=p.id, user_id=u.id, text=text)
    db.session.add(c)
    if p.author_id != u.id:
        db.session.add(Notification(user_id=p.author_id, actor_id=u.id, type="comment", post_id=p.id))
    db.session.add(Interaction(user_id=u.id, post_id=p.id, event_type="comment"))
    db.session.commit()
    return {"comment": c.to_dict()}, 201

@api_bp.get("/recommendations/feed")
@jwt_required(optional=True)
def feed():
    uid = int(get_jwt_identity()) if get_jwt_identity() else (optional_user_id() or 1)
    u = User.query.get(uid)
    page, limit = page_args()
    expl = u.preferences.exploration_rate if (u and u.preferences) else 0.15
    q = request.args.get("query", "")
    return {"data": recommend(uid, q, limit, expl), "page": page}

@api_bp.get("/recommendations/serendipity")
@jwt_required(optional=True)
def serendipity():
    uid = int(get_jwt_identity()) if get_jwt_identity() else (optional_user_id() or 1)
    page, limit = page_args()
    factor = float(request.args.get("factor", 0.65))
    return {"data": get_serendipity_feed(uid, limit, factor)}

@api_bp.post("/events")
@jwt_required()
def event():
    u = me_user()
    d = request.get_json(silent=True) or {}
    pid = int(d.get("post_id", 0))
    et = str(d.get("event_type", "view"))
    if et not in ("view", "long_view", "skip", "not_interested"):
        return {"message": "Use action endpoints for social interactions"}, 400
    db.session.add(Interaction(user_id=u.id, post_id=pid, event_type=et, duration_seconds=max(0, float(d.get("duration_seconds", 0)))))
    db.session.commit()
    return {"recorded": True}

@api_bp.get("/analytics/overview")
@jwt_required()
def analytics():
    u = me_user()
    rows = Interaction.query.filter_by(user_id=u.id).all()
    counts = {}
    for r in rows:
        counts[r.event_type] = counts.get(r.event_type, 0) + 1
    topics = {}
    for x in rows:
        p = Post.query.get(x.post_id)
        if p and p.topic_category:
            topics[p.topic_category] = topics.get(p.topic_category, 0) + 1
    return {
        "data": {
            "interactions": len(rows),
            "events": counts,
            "topics": topics,
            "posts_created": Post.query.filter_by(author_id=u.id).count(),
            "followers_count": Follow.query.filter_by(following_id=u.id).count(),
            "following_count": Follow.query.filter_by(follower_id=u.id).count()
        }
    }

@api_bp.get("/notifications")
@jwt_required()
def notifications():
    u = me_user()
    rows = Notification.query.filter_by(user_id=u.id).order_by(Notification.created_at.desc()).limit(50).all()
    return {
        "data": [
            {
                "id": n.id,
                "type": n.type,
                "read": n.read,
                "actor": User.query.get(n.actor_id).to_dict() if n.actor_id else None,
                "created_at": n.created_at.isoformat(),
                "post_id": n.post_id
            }
            for n in rows
        ]
    }

@api_bp.post("/notifications/read-all")
@jwt_required()
def read_all():
    Notification.query.filter_by(user_id=me_user().id, read=False).update({"read": True})
    db.session.commit()
    return {"ok": True}

@api_bp.get("/search")
def search():
    q = (request.args.get("q") or "").strip()
    page, limit = page_args()
    if not q:
        return {"users": [], "posts": [], "topics": []}
    users = User.query.filter(db.or_(User.username.ilike(f"%{q}%"), User.display_name.ilike(f"%{q}%"))).limit(limit).all()
    posts = Post.query.filter(db.or_(Post.caption.ilike(f"%{q}%"), Post.hashtags.ilike(f"%{q}%"))).order_by(Post.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    viewer = optional_user_id()
    return {
        "users": [x.to_dict() for x in users],
        "posts": [x.to_dict(viewer) for x in posts]
    }

@api_bp.post("/sentiment/predict")
@jwt_required(optional=True)
def sentiment():
    d = request.get_json(silent=True) or {}
    text = str(d.get("text", "")).strip()
    if not text:
        return {"message": "Text is required"}, 400
    uid = int(get_jwt_identity()) if get_jwt_identity() else None
    return predict_sentiment(text, uid)

@api_bp.post("/sentiment/emotion")
@jwt_required(optional=True)
def emotion():
    d = request.get_json(silent=True) or {}
    text = str(d.get("text", "")).strip()
    if not text:
        return {"message": "Text is required"}, 400
    return emotion_detection(text)

@api_bp.get("/ai/explain/<int:post_id>")
@jwt_required()
def explain(post_id):
    u = me_user()
    p = Post.query.get_or_404(post_id)
    rows = Interaction.query.filter_by(user_id=u.id).all()
    same = sum(1 for x in rows if (Post.query.get(x.post_id) and Post.query.get(x.post_id).topic_category == p.topic_category))
    context = {
        "post": {"caption": p.caption, "topic": p.topic_category},
        "signals": {"prior_topic_interactions": same, "author": p.author.username if p.author else "cosmos"},
        "user": u.to_dict()
    }
    r, src = generate_ai_response("Explain why this post may be relevant to me.", context)
    db.session.add(AIInsight(user_id=u.id, prompt=f"Explain post {post_id}", response=r, source=src))
    db.session.commit()
    return {"response": r, "source": src, "signals": context["signals"]}

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

# Direct Messaging & Post Sharing
@api_bp.get("/conversations")
@jwt_required()
def conversations():
    u = me_user()
    ids = [m.conversation_id for m in ConversationMember.query.filter_by(user_id=u.id).all()]
    out = []
    for cid in ids:
        members = ConversationMember.query.filter_by(conversation_id=cid).all()
        msgs = Message.query.filter_by(conversation_id=cid).order_by(Message.created_at.desc()).limit(1).all()
        out.append({
            "id": cid,
            "members": [User.query.get(x.user_id).to_dict() for x in members if User.query.get(x.user_id)],
            "last_message": msgs[0].to_dict() if msgs else None
        })
    return {"data": out}

@api_bp.post("/conversations")
@jwt_required()
def create_conversation():
    u = me_user()
    ids = set((request.get_json(silent=True) or {}).get("user_ids", []))
    ids.add(u.id)
    ids = {int(x) for x in ids}
    if len(ids) < 2:
        return {"message": "At least two users required"}, 400
    
    # Check if a conversation between these exact two users already exists
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
def messages(cid):
    u = me_user()
    if not ConversationMember.query.filter_by(conversation_id=cid, user_id=u.id).first():
        return auth_error("Not allowed")
    rows = Message.query.filter_by(conversation_id=cid).order_by(Message.created_at.asc()).limit(200).all()
    return {"data": [x.to_dict() for x in rows]}

@api_bp.post("/conversations/<int:cid>/messages")
@jwt_required()
def send_message(cid):
    u = me_user()
    if not ConversationMember.query.filter_by(conversation_id=cid, user_id=u.id).first():
        return auth_error("Not allowed")
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
    if len(body) > 5000:
        return {"message": "Message must be 1-5000 characters"}, 400

    m = Message(
        conversation_id=cid,
        sender_id=u.id,
        body=body or "Shared a post to conversation",
        shared_post_id=shared_post_id
    )
    db.session.add(m)
    for member in ConversationMember.query.filter_by(conversation_id=cid).all():
        if member.user_id != u.id:
            db.session.add(Notification(user_id=member.user_id, actor_id=u.id, type="message"))
    db.session.commit()
    return {"message": m.to_dict()}, 201

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
