from flask import Flask
from app.config import Config, STATIC_DIR, TEMPLATES_DIR


def create_app(config_class=Config) -> Flask:
    app = Flask(
        __name__,
        template_folder=str(TEMPLATES_DIR),
        static_folder=str(STATIC_DIR)
    )
    app.config.from_object(config_class)

    # Register Blueprints
    from app.routes.main_routes import main_bp
    from app.routes.sentiment_routes import sentiment_bp
    from app.routes.recommend_routes import recommend_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(sentiment_bp)
    app.register_blueprint(recommend_bp)

    return app
