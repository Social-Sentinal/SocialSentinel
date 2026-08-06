from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models import Comment, Post, UserInteraction, SentimentLog
from app.services import api_service, content_service, collab_service, sentiment_service

api_bp = Blueprint("api_v1", __name__, url_prefix="/api/v1")


@api_bp.route("/posts", methods=["GET"])
def get_posts():
    """Fetch social feed posts with optional sentiment filtering and search query."""
    sentiment = request.args.get("sentiment", "").strip().capitalize()
    search_q = request.args.get("q", "").strip().lower()

    query = Post.query

    if sentiment in ["Positive", "Neutral", "Negative"]:
        query = query.filter(Post.sentiment == sentiment)

    posts = query.order_by(Post.id.asc()).all()

    if search_q:
        posts = [
            p for p in posts
            if search_q in (p.caption or "").lower()
            or search_q in (p.username or "").lower()
            or search_q in (p.hashtags or "").lower()
        ]

    return jsonify({"status": "success", "count": len(posts), "data": [p.to_dict() for p in posts]})


@api_bp.route("/posts/<int:post_id>/like", methods=["POST"])
def toggle_like(post_id):
    """Toggle post like and log user interaction."""
    post = Post.query.get_or_404(post_id)
    payload = request.json or {}
    is_liked = payload.get("liked", True)

    if is_liked:
        post.likes_count += 1
    else:
        post.likes_count = max(0, post.likes_count - 1)

    try:
        interaction = UserInteraction(
            post_id=post_id,
            caption=post.caption,
            hashtags=post.hashtags,
            liked=is_liked
        )
        db.session.add(interaction)
        db.session.commit()
        return jsonify({"status": "success", "likes_count": post.likes_count, "liked": is_liked})
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@api_bp.route("/posts/<int:post_id>/comments", methods=["POST"])
def add_comment(post_id):
    """Add comment to post."""
    post = Post.query.get_or_404(post_id)
    payload = request.json or {}
    text = payload.get("text", "").strip()

    if not text:
        return jsonify({"status": "error", "message": "Comment text cannot be empty"}), 400

    username = payload.get("username", "social_explorer")
    user_avatar = payload.get(
        "user_avatar",
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
    )

    try:
        new_comment = Comment(
            post_id=post_id,
            username=username,
            user_avatar=user_avatar,
            text=text
        )
        post.comments_count += 1
        db.session.add(new_comment)
        db.session.commit()
        return jsonify({
            "status": "success",
            "data": new_comment.to_dict(),
            "comments_count": post.comments_count
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@api_bp.route("/sentiment/predict", methods=["POST"])
def predict_sentiment():
    """Predict text sentiment with probability breakdown."""
    user_input = request.form.get("text") or (request.json and request.json.get("text")) or ""
    result = sentiment_service.predict_sentiment(user_input)
    return jsonify({"status": "success", **result})


@api_bp.route("/sentiment/emotion", methods=["POST"])
def detect_emotion():
    """Analyze emotion spectrum intensities."""
    user_input = request.form.get("text") or (request.json and request.json.get("text")) or ""
    result = sentiment_service.emotion_detection(user_input)
    return jsonify({"status": "success", **result})


@api_bp.route("/sentiment/wordcloud", methods=["POST"])
def generate_wordcloud():
    """Generate WordCloud PNG image asset."""
    user_input = request.form.get("text") or (request.json and request.json.get("text")) or ""
    msg = sentiment_service.generate_word_cloud(user_input)
    return jsonify({"status": "success", "message": msg, "image_url": "/static/wordcloud.png"})


@api_bp.route("/recommendations/content", methods=["POST", "GET"])
def recommend_content():
    """Word2Vec & Cosine Similarity Content Recommendation."""
    user_input = request.form.get("user_input") or request.args.get("user_input") or (request.json and request.json.get("user_input")) or "nature travel"
    recs = content_service.recommend_posts(user_input)
    return jsonify({"status": "success", "query": user_input, "count": len(recs), "data": recs})


@api_bp.route("/recommendations/collaborative", methods=["GET"])
def recommend_collaborative():
    """Collaborative filtering based on recent user interactions."""
    recs = collab_service.get_collaborative_recommendations()
    return jsonify({"status": "success", "count": len(recs), "data": recs})


@api_bp.route("/analytics/overview", methods=["GET"])
def analytics_overview():
    """Aggregated executive platform analytics."""
    posts = Post.query.all()
    total_posts = len(posts)
    total_views = sum(p.views_count for p in posts) if posts else 0
    total_likes = sum(p.likes_count for p in posts) if posts else 0
    total_comments = sum(p.comments_count for p in posts) if posts else 0

    positive_count = sum(1 for p in posts if (p.sentiment or "").lower() == "positive")
    neutral_count = sum(1 for p in posts if (p.sentiment or "").lower() == "neutral")
    negative_count = sum(1 for p in posts if (p.sentiment or "").lower() == "negative")

    pos_ratio = round((positive_count / max(1, total_posts)) * 100, 1)

    # Calculate top hashtag frequencies
    hashtag_freq = {}
    for p in posts:
        if p.hashtags:
            for h in p.hashtags.split():
                clean_h = h.strip().lower()
                if clean_h.startswith("#"):
                    hashtag_freq[clean_h] = hashtag_freq.get(clean_h, 0) + 1

    sorted_hashtags = sorted(hashtag_freq.items(), key=lambda x: x[1], reverse=True)[:5]
    top_hashtags = [{"hashtag": tag, "count": cnt} for tag, cnt in sorted_hashtags]

    return jsonify({
        "status": "success",
        "data": {
            "total_posts": total_posts,
            "total_views": total_views,
            "total_likes": total_likes,
            "total_comments": total_comments,
            "positive_percentage": pos_ratio,
            "sentiment_counts": {
                "Positive": positive_count,
                "Neutral": neutral_count,
                "Negative": negative_count
            },
            "top_hashtags": top_hashtags
        }
    })


@api_bp.route("/interactions", methods=["POST"])
def log_interaction():
    """Save user interaction metrics (dwell duration, save, share)."""
    payload = request.json or {}
    try:
        interaction = UserInteraction(
            post_id=payload.get("post_id"),
            caption=payload.get("caption", ""),
            hashtags=payload.get("hashtags", ""),
            view_duration=float(payload.get("duration", 0)),
            liked=bool(payload.get("liked", False)),
            saved=bool(payload.get("saved", False)),
            shared=bool(payload.get("shared", False)),
            comment_text=payload.get("comment", "")
        )
        db.session.add(interaction)
        db.session.commit()
        return jsonify({"status": "success", "message": "Interaction saved successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
