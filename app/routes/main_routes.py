from flask import Blueprint, render_template, request
from app.services import collab_service, content_service

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
    recommended_posts = collab_service.get_collaborative_recommendations()
    return render_template("reports.html", recommended_posts=recommended_posts)


@main_bp.route("/api.html", methods=["GET"])
def api_page():
    return render_template("api.html")
