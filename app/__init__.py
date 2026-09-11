import logging
import os
from pathlib import Path
from flask import Flask, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import Config, FRONTEND_DIST_DIR
from app.extensions import db, jwt, cors, limiter

def create_app(config_class=Config):
    app = Flask(__name__, static_folder=str(FRONTEND_DIST_DIR), static_url_path="")
    app.config.from_object(config_class)
    
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, origins=app.config["CORS_ORIGINS"], supports_credentials=True)
    limiter.init_app(app)
    
    from app.routes.api_routes import api_bp
    app.register_blueprint(api_bp)
    
    with app.app_context():
        db.create_all()
        seed_database()
        
    @app.get("/health")
    def health():
        return {"status": "ok", "service": "SocialSentinel", "version": "4.2.0"}
        
    @app.get("/ready")
    def ready():
        try:
            db.session.execute(db.text("SELECT 1"))
            return {"status": "ready"}
        except Exception:
            return {"status": "not_ready"}, 503
            
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def spa(path):
        if path.startswith("api/"):
            return {"status": "error", "message": "Not Found"}, 404
        target = FRONTEND_DIST_DIR / path
        if path and target.exists():
            return send_from_directory(str(FRONTEND_DIST_DIR), path)
        if (FRONTEND_DIST_DIR / "index.html").exists():
            return send_from_directory(str(FRONTEND_DIST_DIR), "index.html")
        return "SocialSentinel Platform API is Running.", 200

    @app.errorhandler(500)
    def err(e):
        logging.exception(e)
        return {"status": "error", "message": "Internal server error"}, 500

    return app

def seed_database():
    from app.models import User, UserPreference, Post, Community, CommunityMember, Follow, Like, Comment, Interaction, ModelVersion
    import pandas as pd
    
    # 1. Model versions
    if ModelVersion.query.count() == 0:
        for name, ver, alg in [
            ("sentiment", "v2", "RandomForest + TF-IDF with Lexicon Nuance"),
            ("emotion", "v2", "Heuristic Emotion Pattern Engine"),
            ("ranker", "v4", "SocialSentinel Hybrid Recommendation + Diversity Engine")
        ]:
            db.session.add(ModelVersion(name=name, version=ver, algorithm=alg, status="active"))
        db.session.commit()

    # 2. Communities
    default_communities = [
        ("AI & Tech", "ai-tech", "⚡", "Machine learning, neural networks, foundation models, and synthetic reasoning.", "linear-gradient(135deg, #6366f1, #8b5cf6)"),
        ("Cybersecurity & Privacy", "cybersecurity", "🛡️", "Defensive security, privacy-preserving systems, cryptography, and network resilience.", "linear-gradient(135deg, #0ea5e9, #2563eb)"),
        ("Web Engineering", "web-engineering", "💻", "Modern fullstack architecture, React UI systems, fast APIs, and performance engineering.", "linear-gradient(135deg, #3b82f6, #10b981)"),
        ("Creative Tech & Design", "creative-tech", "🎨", "Generative aesthetics, digital design, procedural systems, and creative code.", "linear-gradient(135deg, #f59e0b, #ef4444)"),
        ("Digital Wellbeing", "digital-wellbeing", "🌿", "Mindful computing, calm focus, digital balance, and personal productivity.", "linear-gradient(135deg, #10b981, #14b8a6)")
    ]
    for name, slug, icon, desc, grad in default_communities:
        existing = Community.query.filter_by(slug=slug).first()
        if not existing:
            db.session.add(Community(name=name, slug=slug, icon=icon, description=desc, banner_gradient=grad))
    db.session.commit()

    # 3. Seed Users if demo doesn't exist
    demo_user = User.query.filter_by(username="demo").first()
    if not demo_user:
        demo_user = User(
            username="demo",
            email="demo@socialsentinel.io",
            display_name="Sentinel Explorer",
            bio="Exploring intelligent recommendations, sentiment steering, and AI safety on SocialSentinel 🛡️",
            avatar_url=""
        )
        demo_user.set_password("Demo1234!")
        db.session.add(demo_user)
        db.session.flush()
        db.session.add(UserPreference(user_id=demo_user.id, preferred_topics="AI & Tech,Web Engineering,Cybersecurity & Privacy", exploration_rate=0.20))
        db.session.commit()

    # Seed creator profiles
    creators_info = [
        ("ai_research", "AI Research Lab", "ai@socialsentinel.io", "Exploring multimodal foundation models, local inference, and agentic workflows 🤖"),
        ("sentinel_sec", "Sentinel Security", "sec@socialsentinel.io", "Threat intelligence, privacy-preserving AI, and web security engineering 🛡️"),
        ("dev_craft", "Elena Vance", "elena@socialsentinel.io", "Staff engineer building resilient distributed backends and modern web UI systems ⚡"),
        ("design_pulse", "Marcus Thorne", "marcus@socialsentinel.io", "Design systems, typography, micro-interactions, and visual harmony 🎨"),
        ("mindful_tech", "Aria Lin", "aria@socialsentinel.io", "Advocate for mindful technology, intentional screen habits, and digital wellness 🌿")
    ]
    creator_objs = {}
    for uname, dname, email, bio in creators_info:
        u = User.query.filter_by(username=uname).first()
        if not u:
            u = User(username=uname, display_name=dname, email=email, bio=bio)
            u.set_password("SentinelPass123!")
            db.session.add(u)
            db.session.flush()
            db.session.add(UserPreference(user_id=u.id))
            db.session.commit()
        creator_objs[uname] = u

    # 4. Seed rich posts if sparse (< 10 posts)
    if Post.query.count() < 10:
        base_posts = [
            (
                "ai_research",
                "Breakthroughs in local model inference are accelerating fast. Running quantized 4-bit transformer architectures directly in browser memory with sub-15ms token latencies provides true user privacy without cloud dependence.",
                "#AI #MachineLearning #OpenSource #TechInnovation",
                "AI & Tech",
                "Positive", 0.92, "inspiration", 0.88
            ),
            (
                "sentinel_sec",
                "Zero-trust security principles in modern API design: token rotation, strict rate limiting, robust cryptographic hashing, and automated anomaly detection. Protecting user data is the foundational responsibility of any social network.",
                "#Cybersecurity #InfoSec #Privacy #WebSecurity",
                "Cybersecurity & Privacy",
                "Positive", 0.89, "curiosity", 0.85
            ),
            (
                "dev_craft",
                "Designing software that wows users is about intentional typography, consistent layout grids, thoughtful contrast, and instant feedback. Beautiful software is an absolute joy to build and use.",
                "#WebEngineering #DesignSystems #Frontend #UX #React",
                "Web Engineering",
                "Positive", 0.94, "joy", 0.90
            ),
            (
                "design_pulse",
                "Crafting high-contrast design systems: dark mode shouldn't just be inverted colors; it requires calibrated gray scales, refined elevations, and intentional glowing accents that reduce visual strain.",
                "#DesignSystems #UIUX #Creativity #VisualHierarchy",
                "Creative Tech & Design",
                "Positive", 0.88, "wonder", 0.84
            ),
            (
                "mindful_tech",
                "Taking intentional digital pauses during the workday preserves focus and reduces cognitive fatigue. Algorithms should empower human agency, not capture human attention through addictive loops.",
                "#DigitalWellbeing #Focus #MentalHealth #Balance",
                "Digital Wellbeing",
                "Positive", 0.85, "empathy", 0.82
            ),
            (
                "ai_research",
                "Hybrid recommendation architectures that combine collaborative user signals with content TF-IDF vectors and serendipity exploration consistently outperform pure engagement maximizers. Diversity keeps platforms healthy.",
                "#RecommenderSystems #DataScience #InformationRetrieval #AI",
                "AI & Tech",
                "Positive", 0.87, "curiosity", 0.86
            ),
            (
                "sentinel_sec",
                "Client-side encryption for direct messaging ensures private communications remain strictly between participants. As AI systems become more prevalent, data privacy and provenance will define trust.",
                "#Privacy #Encryption #SocialSentinel #Security",
                "Cybersecurity & Privacy",
                "Positive", 0.90, "inspiration", 0.87
            ),
            (
                "dev_craft",
                "Clean code isn't code with zero comments; it's code where architecture speaks clearly, error handling is explicit, and developers can onboard without friction. Maintainable over clever every single time.",
                "#SoftwareEngineering #CodeQuality #Architecture #DevLife",
                "Web Engineering",
                "Positive", 0.86, "inspiration", 0.83
            ),
            (
                "design_pulse",
                "Experimenting with algorithmic layouts and procedural gradients for dynamic UI cards. The result feels organic, alive, and instantly engaging.",
                "#GenerativeDesign #CreativeCode #Frontend #Animation",
                "Creative Tech & Design",
                "Positive", 0.91, "wonder", 0.89
            ),
            (
                "mindful_tech",
                "Three questions to ask before opening your feeds: 1. Am I seeking connection or escaping boredom? 2. What intention do I have? 3. When will I step away? Mindful agency changes everything.",
                "#IntentionalLiving #Wellbeing #Focus #MindfulTech",
                "Digital Wellbeing",
                "Neutral", 0.74, "empathy", 0.78
            )
        ]

        created_posts = []
        for uname, caption, tags, topic, sent, sent_conf, emo, emo_conf in base_posts:
            author = creator_objs.get(uname) or demo_user
            p = Post(
                author_id=author.id,
                caption=caption,
                hashtags=tags,
                topic_category=topic,
                sentiment=sent,
                sentiment_confidence=sent_conf,
                emotion=emo,
                emotion_confidence=emo_conf
            )
            db.session.add(p)
            created_posts.append(p)
        db.session.commit()

        # Follow creators and seed initial likes
        if demo_user and created_posts:
            for creator in creator_objs.values():
                if creator.id != demo_user.id:
                    if not Follow.query.filter_by(follower_id=demo_user.id, following_id=creator.id).first():
                        db.session.add(Follow(follower_id=demo_user.id, following_id=creator.id))
            
            for p in created_posts[:5]:
                db.session.add(Like(user_id=demo_user.id, post_id=p.id))
                db.session.add(Interaction(user_id=demo_user.id, post_id=p.id, event_type="like"))
                db.session.add(Interaction(user_id=demo_user.id, post_id=p.id, event_type="view", duration_seconds=15.0))
            
            p0 = created_posts[0]
            db.session.add(Comment(post_id=p0.id, user_id=demo_user.id, text="Sub-15ms local inference is a huge milestone for user privacy! 🚀"))
            
            first_comm = Community.query.first()
            if first_comm:
                db.session.add(CommunityMember(community_id=first_comm.id, user_id=demo_user.id))

            db.session.commit()
