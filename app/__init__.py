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

    # Database Initialization & Automatic Seeding
    with app.app_context():
        db.create_all()
        seed_database()

    return app


def seed_database():
    from app.models import Post
    from app.utils.post_generator import generate_posts

    if Post.query.count() == 0:
        sample_posts = generate_posts(25)
        for p in sample_posts:
            new_post = Post(
                caption=p["caption"],
                hashtags=p["hashtags"],
                image_url=p["image_url"],
                likes_count=0,
                comments_count=0,
                views_count=0,
                timestamp=p["timestamp"],
                sentiment="Positive" if "sun" in p["caption"].lower() or "nature" in p["caption"].lower() else "Neutral",
                score=0.85 if "sun" in p["caption"].lower() or "nature" in p["caption"].lower() else 0.5
            )
            db.session.add(new_post)
        try:
            db.session.commit()
            print("[Database] Successfully seeded initial posts.")
        except Exception as e:
            db.session.rollback()
            print(f"[Database Error] Seeding failed: {e}")
