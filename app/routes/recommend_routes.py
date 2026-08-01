from flask import Blueprint, jsonify, render_template, request
from app.extensions import db
from app.models import Comment, Post, UserInteraction
from app.services import api_service, content_service, sentiment_service

recommend_bp = Blueprint("recommend", __name__)


# --- RESTful API V1 Endpoints for React Frontend ---

@recommend_bp.route("/api/v1/posts", methods=["GET"])
def api_v1_get_posts():
    posts = Post.query.order_by(Post.id.asc()).all()
    return jsonify({"status": "success", "count": len(posts), "data": [p.to_dict() for p in posts]})


@recommend_bp.route("/api/v1/posts/<int:post_id>/like", methods=["POST"])
def api_v1_toggle_like(post_id):
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


@recommend_bp.route("/api/v1/posts/<int:post_id>/comments", methods=["POST"])
def api_v1_add_comment(post_id):
    post = Post.query.get_or_404(post_id)
    payload = request.json or {}
    text = payload.get("text", "").strip()

    if not text:
        return jsonify({"status": "error", "message": "Comment text cannot be empty"}), 400

    username = payload.get("username", "social_explorer")
    user_avatar = payload.get("user_avatar", "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80")

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
        return jsonify({"status": "success", "data": new_comment.to_dict(), "comments_count": post.comments_count})
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@recommend_bp.route("/api/v1/interactions", methods=["POST"])
def api_v1_save_interaction():
    payload = request.json or {}
    post_id = payload.get("post_id")
    duration = float(payload.get("duration", 0))

    try:
        interaction = UserInteraction(
            post_id=post_id,
            caption=payload.get("caption", ""),
            hashtags=payload.get("hashtags", ""),
            view_duration=duration,
            liked=bool(payload.get("liked", False)),
            saved=bool(payload.get("saved", False)),
            shared=bool(payload.get("shared", False)),
            comment_text=payload.get("comment", "")
        )
        db.session.add(interaction)

        if post_id:
            target_post = Post.query.get(post_id)
            if target_post:
                target_post.views_count += 1

        db.session.commit()
        return jsonify({"status": "success", "message": "Interaction persisted."})
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


# --- Legacy Compatibility Endpoints ---

@recommend_bp.route("/get_posts", methods=["GET"])
def get_posts():
    posts = Post.query.all()
    return jsonify([p.to_dict() for p in posts])


@recommend_bp.route("/save_post", methods=["POST"])
def save_post():
    post_data = request.json or {}
    post_id = post_data.get("id")
    duration = float(post_data.get("duration", 0))
    liked = bool(post_data.get("liked", False))
    shared = bool(post_data.get("shared", False))
    comment_text = post_data.get("comment", "")

    try:
        interaction = UserInteraction(
            post_id=post_id,
            caption=post_data.get("caption", ""),
            hashtags=post_data.get("hashtags", ""),
            view_duration=duration,
            liked=liked,
            shared=shared,
            comment_text=comment_text
        )
        db.session.add(interaction)

        if post_id:
            target_post = Post.query.get(post_id)
            if target_post:
                target_post.views_count += 1
                if liked:
                    target_post.likes_count += 1

        db.session.commit()
        return jsonify({"message": "Interaction saved to database successfully!", "status": "success"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Database save error: {str(e)}", "status": "error"}), 500


@recommend_bp.route("/get_pts", methods=["GET"])
def get_pts():
    posts = api_service.generate_api_posts()
    return jsonify(posts)


@recommend_bp.route("/save_pts", methods=["POST"])
def save_pts():
    post_data = request.json or {}
    api_service.save_api_post(post_data)
    return jsonify({"message": "Post saved successfully!"})


@recommend_bp.route("/analyze_sentiment", methods=["POST"])
def analyze_sentiment():
    user_input = request.form.get("text", "")
    sentiment_result = sentiment_service.predict_sentiment(user_input)

    analysis_result = {
        "text": user_input,
        "sentiment": sentiment_result.get("sentiment", "Neutral")
    }

    recommended_posts = content_service.recommend_posts(user_input)

    return render_template(
        "reports.html",
        analysis_result=analysis_result,
        recommended_posts=recommended_posts
    )
