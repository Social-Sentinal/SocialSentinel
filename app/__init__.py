from flask import Flask
from app.config import Config, DATA_DIR, STATIC_DIR, TEMPLATES_DIR
from app.extensions import db


def create_app(config_class=Config) -> Flask:
    app = Flask(
        __name__,
        template_folder=str(TEMPLATES_DIR),
        static_folder=str(STATIC_DIR)
    )
    app.config.from_object(config_class)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    db.init_app(app)

    # Register Blueprints
    from app.routes.main_routes import main_bp
    from app.routes.sentiment_routes import sentiment_bp
    from app.routes.recommend_routes import recommend_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(sentiment_bp)
    app.register_blueprint(recommend_bp)

    # Database Initialization & Real Content Seeding
    with app.app_context():
        db.create_all()
        seed_database()

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
