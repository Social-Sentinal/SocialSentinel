import logging
import os
from flask import Flask, request, send_from_directory
from app.config import Config, DATA_DIR, FRONTEND_DIST_DIR, STATIC_DIR
from app.extensions import db


def create_app(config_class=Config) -> Flask:
    dist_dir = str(FRONTEND_DIST_DIR) if FRONTEND_DIST_DIR.exists() else str(STATIC_DIR)

    app = Flask(
        __name__,
        static_folder=dist_dir,
        static_url_path=""
    )
    app.config.from_object(config_class)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    db.init_app(app)

    # Register Modern API Blueprint
    from app.routes.api_routes import api_bp
    from app.routes.recommend_routes import recommend_bp
    from app.routes.sentiment_routes import sentiment_bp

    app.register_blueprint(api_bp)
    app.register_blueprint(recommend_bp)
    app.register_blueprint(sentiment_bp)

    # Database Initialization & Real Content Seeding
    with app.app_context():
        db.create_all()
        seed_database()

    # Serve React Single Page Application (SPA Fallback)
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_spa(path):
        if path.startswith("api/"):
            return {"status": "error", "message": "Resource Not Found"}, 404

        target_file = FRONTEND_DIST_DIR / path
        if path != "" and target_file.exists():
            return send_from_directory(str(FRONTEND_DIST_DIR), path)
        
        # Fallback to React index.html
        if (FRONTEND_DIST_DIR / "index.html").exists():
            return send_from_directory(str(FRONTEND_DIST_DIR), "index.html")

        return "<h1>SocialSentinel Backend Running</h1><p>Please build the React frontend: <code>cd frontend && npm run build</code></p>", 200

    # Error Handlers
    @app.errorhandler(500)
    def internal_server_error(e):
        logging.exception("An internal server error occurred: %s", e)
        if request.path.startswith("/api/"):
            return {"status": "error", "message": "Internal Server Error"}, 500
        return "<h1>500 Internal Server Error</h1>", 500

    return app


def seed_database():
    from app.models import Post
    from app.utils.data_loader import parse_real_instagram_posts

    if Post.query.count() == 0:
        real_posts = parse_real_instagram_posts()
        for p in real_posts:
            new_post = Post(
                username=p["username"],
                user_avatar=p["user_avatar"],
                location=p["location"],
                caption=p["caption"],
                hashtags=p["hashtags"],
                image_url=p["image_url"],
                likes_count=p["likes_count"],
                comments_count=p["comments_count"],
                views_count=p["views_count"],
                timestamp=p["timestamp"],
                sentiment=p["sentiment"],
                score=p["score"]
            )
            db.session.add(new_post)
        try:
            db.session.commit()
            print("[Database] Successfully seeded real Instagram dataset posts.")
        except Exception as e:
            db.session.rollback()
            print(f"[Database Error] Seeding failed: {e}")
