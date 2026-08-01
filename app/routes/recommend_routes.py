from flask import Blueprint, jsonify, render_template, request
from app.extensions import db
from app.models import Post, UserInteraction
from app.services import api_service, content_service, sentiment_service

recommend_bp = Blueprint("recommend", __name__)


@recommend_bp.route("/get_posts", methods=["GET"])
def get_posts():
    posts = Post.query.all()
    return jsonify([p.to_dict() for p in posts])


@recommend_bp.route("/save_post", methods=["POST"])
def save_post():
    post_data = request.json or {}
    caption = post_data.get("caption", "")
    hashtags = post_data.get("hashtags", "")
    post_id = post_data.get("id")
    duration = float(post_data.get("duration", 0))
    liked = bool(post_data.get("liked", False))
    shared = bool(post_data.get("shared", False))
    comment_text = post_data.get("comment", "")

    try:
        interaction = UserInteraction(
            post_id=post_id,
            caption=caption,
            hashtags=hashtags,
            view_duration=duration,
            liked=liked,
            shared=shared,
            comment_text=comment_text
        )
        db.session.add(interaction)

        # Update view count or like count on Post object if post_id is provided
        if post_id:
            target_post = Post.query.get(post_id)
            if target_post:
                target_post.views_count += 1
                if liked:
                    target_post.likes_count += 1
                if comment_text:
                    target_post.comments_count += 1

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
