import random
from flask import Blueprint, render_template, request
from app.services import content_service, collab_service

main_bp = Blueprint("main", __name__)


@main_bp.route("/", methods=["GET"])
def home():
    return render_template("index.html")


@main_bp.route("/engine.html", methods=["GET"])
def engine_page():
    return render_template("engine.html")


@main_bp.route("/sentiments.html", methods=["GET"])
def sentiments_page():
    return render_template("sentiments.html")


@main_bp.route("/contact.html", methods=["GET", "POST"])
def contact_page():
    recommended_posts = []
    user_input = ""
    if request.method == "POST":
        user_input = request.form.get("user_input", "").strip()
        if user_input:
            recommended_posts = content_service.recommend_posts(user_input)

    return render_template(
        "contact.html",
        user_input=user_input,
        recommended_posts=recommended_posts
    )


@main_bp.route("/reports.html", methods=["GET"])
def reports_page():
    csv_output = collab_service.analyze_csv_data("saved_posts.csv", "predictions.csv")

    recommended_posts = []
    if not csv_output.empty and "predicted_caption" in csv_output.columns:
        for index, row in csv_output.iterrows():
            recommended_posts.append({
                "image_url": f"https://picsum.photos/300/200?random={index + 1}",
                "caption": row.get("predicted_caption", "Recommended Caption"),
                "hashtags": row.get("predicted_hashtags", "#trending #sentinel"),
                "timestamp": "2024-10-15 14:05:41"
            })
    else:
        # Fallback list if prediction data is empty
        recommended_posts = [
            {
                "image_url": "https://picsum.photos/300/200?random=1",
                "caption": "Exploring nature and mountain trails",
                "hashtags": "#adventure #explore",
                "timestamp": "2024-10-15 14:05:41"
            }
        ]

    return render_template("reports.html", recommended_posts=recommended_posts)


@main_bp.route("/api.html", methods=["GET"])
def api_page():
    return render_template("api.html")
