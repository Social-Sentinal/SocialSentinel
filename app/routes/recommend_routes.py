import csv
import random
from flask import Blueprint, jsonify, render_template, request

from app.config import DATA_DIR
from app.services import api_service, content_service, sentiment_service
from app.utils import post_generator

recommend_bp = Blueprint("recommend", __name__)
_cached_posts = post_generator.generate_posts(20)


@recommend_bp.route("/get_posts", methods=["GET"])
def get_posts():
    return jsonify(random.sample(_cached_posts, len(_cached_posts)))


@recommend_bp.route("/save_post", methods=["POST"])
def save_post():
    post_data = request.json or {}
    caption = post_data.get("caption", "")
    hashtags = post_data.get("hashtags", "")
    timestamp = post_data.get("timestamp", "")
    duration = post_data.get("duration", 0)

    save_path = DATA_DIR / "saved_posts.csv"
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    with open(save_path, mode="a", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow([caption, hashtags, timestamp, duration])

    return jsonify({"message": "Post and duration saved successfully!"})


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

    formatted_recommendations = []
    for idx, post in enumerate(recommended_posts):
        formatted_recommendations.append({
            "image_url": f"https://picsum.photos/300/200?random={idx + 1}",
            "caption": post.get("Caption", ""),
            "hashtags": post.get("Hashtags", ""),
            "timestamp": "2024-10-15 14:05:41"
        })

    return render_template(
        "reports.html",
        analysis_result=analysis_result,
        recommended_posts=formatted_recommendations
    )
