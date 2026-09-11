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
        return {"status": "ok", "service": "Cosmos Social", "version": "4.1.0"}
        
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
        return "Cosmos Social Platform API is Running.", 200

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
            ("ranker", "v4", "Cosmos Hybrid Recommendation + Serendipity Filter")
        ]:
            db.session.add(ModelVersion(name=name, version=ver, algorithm=alg, status="active"))
        db.session.commit()

    # 2. Communities
    default_communities = [
        ("Astrophysics & Cosmos", "astrophysics-cosmos", "🌌", "Exoplanets, deep space telescopes, gravitational waves, and cosmological discoveries.", "linear-gradient(135deg, #4f46e5, #06b6d4)"),
        ("AI & Tech", "ai-tech", "⚡", "Machine learning, neural networks, foundation models, and synthetic reasoning.", "linear-gradient(135deg, #ec4899, #8b5cf6)"),
        ("Web Dev", "web-dev", "💻", "Modern fullstack architecture, React UI systems, fast APIs, and performance engineering.", "linear-gradient(135deg, #3b82f6, #10b981)"),
        ("Creative Arts", "creative-arts", "🎨", "Generative aesthetics, digital painting, procedural design, and creative code.", "linear-gradient(135deg, #f59e0b, #ef4444)"),
        ("Mindfulness", "mindfulness", "🌿", "Digital wellbeing, calm productivity, deep work routines, and philosophy.", "linear-gradient(135deg, #10b981, #14b8a6)")
    ]
    for name, slug, icon, desc, grad in default_communities:
        if not Community.query.filter_by(slug=slug).first():
            db.session.add(Community(name=name, slug=slug, icon=icon, description=desc, banner_gradient=grad))
    db.session.commit()

    # 3. Seed Users if demo doesn't exist
    demo_user = User.query.filter_by(username="demo").first()
    if not demo_user:
        demo_user = User(
            username="demo",
            email="demo@cosmos.social",
            display_name="Cosmos Explorer",
            bio="Navigating the frontiers of AI, exoplanets, and high-performance engineering 🪐",
            avatar_url=""
        )
        demo_user.set_password("Demo1234!")
        db.session.add(demo_user)
        db.session.flush()
        db.session.add(UserPreference(user_id=demo_user.id, preferred_topics="Astrophysics & Cosmos,AI & Tech,Web Dev", exploration_rate=0.25))
        db.session.commit()

    # Seed creators
    creators_info = [
        ("astronomy_hub", "Cosmos Observer", "astronomy@cosmos.social", "Stargazer tracking deep sky nebulae, James Webb data, and interstellar phenomena 🔭"),
        ("ai_frontier", "Neural Architect", "ai@cosmos.social", "Exploring multi-modal AI, agentic reasoning, and next-gen transformer systems 🤖"),
        ("dev_craft", "Elena Vance", "elena@cosmos.social", "Staff engineer building resilient distributed systems and responsive web interfaces ⚡"),
        ("creative_mind", "Marcus Thorne", "marcus@cosmos.social", "Digital artist experimenting with algorithmic geometry, color theory, and sound 🎨"),
        ("mindful_space", "Aria Lin", "aria@cosmos.social", "Advocate for mindful computing, digital serenity, and intentional living 🌿")
    ]
    creator_objs = {}
    for uname, dname, email, bio in creators_info:
        u = User.query.filter_by(username=uname).first()
        if not u:
            u = User(username=uname, display_name=dname, email=email, bio=bio)
            u.set_password("CosmosPass123!")
            db.session.add(u)
            db.session.flush()
            db.session.add(UserPreference(user_id=u.id))
            db.session.commit()
        creator_objs[uname] = u

    # 4. Seed Posts if database is sparse (< 10 posts)
    if Post.query.count() < 10:
        base_posts = [
            (
                "astronomy_hub",
                "Spectacular new high-resolution composite of the Pillars of Creation captured in near-infrared. Notice the vibrant hydrogen gas towers where proto-stars are coalescing at immense gravity! The scale of our universe never ceases to inspire wonder.",
                "#Cosmos #JamesWebb #Astrophysics #Astronomy #Universe",
                "Astrophysics & Cosmos",
                "Positive", 0.94, "wonder", 0.92
            ),
            (
                "ai_frontier",
                "Breakthroughs in local model inference are accelerating fast. Running 7B-parameter models quantized down to 4-bits directly in user memory with sub-15ms token latencies is revolutionizing privacy-preserving AI applications.",
                "#AI #MachineLearning #OpenSource #TechInnovation",
                "AI & Tech",
                "Positive", 0.88, "inspiration", 0.85
            ),
            (
                "dev_craft",
                "Designing interfaces that wow users isn't just about flashy animations—it's about intentional typography, consistent visual rhythm, thoughtful contrast, and instant feedback. Beautiful software is a joy to build and use.",
                "#WebDev #DesignSystems #Frontend #UX #React",
                "Web Dev",
                "Positive", 0.89, "joy", 0.82
            ),
            (
                "creative_mind",
                "Exploring chromatic aberration and cosmic palette blending for my newest generative series. Each frame is computed mathematically using reaction-diffusion differential systems.",
                "#CreativeArts #GenerativeArt #Design #DigitalArt #CosmicVibes",
                "Creative Arts",
                "Positive", 0.86, "wonder", 0.84
            ),
            (
                "mindful_space",
                "Taking a 20-minute digital pause during sunset today. Continuous notifications fragment deep focus. Reclaiming intentional quiet is one of the best upgrades you can give your mental bandwidth.",
                "#Mindfulness #DigitalWellbeing #Focus #MentalHealth #Balance",
                "Mindfulness",
                "Neutral", 0.76, "empathy", 0.80
            ),
            (
                "astronomy_hub",
                "Astronomers have confirmed atmospheric water vapor signatures on exoplanet K2-18b in the habitable zone. While not definitive proof of biology, finding temperate worlds with liquid envelopes brings us closer to answering the ultimate question.",
                "#Exoplanets #HabitableZone #Astrobiology #SpaceExploration",
                "Astrophysics & Cosmos",
                "Positive", 0.91, "curiosity", 0.89
            ),
            (
                "ai_frontier",
                "Hybrid recommendation architectures that combine collaborative user signals with content TF-IDF vectors and serendipity exploration consistently outperform pure engagement maximizers. Diversity keeps platforms healthy.",
                "#RecommenderSystems #DataScience #InformationRetrieval #AI",
                "AI & Tech",
                "Positive", 0.87, "curiosity", 0.86
            ),
            (
                "dev_craft",
                "Clean code isn't code with zero comments; it's code where architecture speaks clearly, error handling is explicit, and developers can onboard without friction. Maintainable over clever every single time.",
                "#SoftwareEngineering #CodeQuality #Architecture #DevLife",
                "Web Dev",
                "Positive", 0.84, "inspiration", 0.81
            ),
            (
                "creative_mind",
                "The intersection of music synthesis and generative geometry: mapped ambient synthesizer polyphony to 3D particle turbulence fields. The results feel like peering into an aurora borealis.",
                "#GenerativeAudio #VisualArt #Synth #CreativeCode",
                "Creative Arts",
                "Positive", 0.90, "wonder", 0.88
            ),
            (
                "mindful_space",
                "Three questions to ask before opening social feeds: 1. Am I seeking connection or escaping boredom? 2. What intention do I have? 3. When will I step away? Mindful agency changes everything.",
                "#IntentionalLiving #Wellbeing #Focus #MindfulTech",
                "Mindfulness",
                "Neutral", 0.74, "empathy", 0.78
            ),
            (
                "astronomy_hub",
                "The James Webb Space Telescope has revealed supermassive black holes at the dawn of the universe with masses that defy early cosmic expansion models. A thrilling time for theoretical physics!",
                "#BlackHoles #Cosmology #Physics #DeepSpace",
                "Astrophysics & Cosmos",
                "Positive", 0.85, "wonder", 0.91
            ),
            (
                "ai_frontier",
                "Understanding the mathematics behind cosine similarity in high-dimensional vector spaces: how token embeddings capture subtle semantic relationships between astrophysics and computational theory.",
                "#Embeddings #LinearAlgebra #VectorSearch #NLP",
                "AI & Tech",
                "Neutral", 0.80, "curiosity", 0.84
            )
        ]

        # Also attempt loading from CSV if present to add variety
        csv_path = Path(__file__).resolve().parent.parent / "data" / "collaborative.csv"
        csv_posts = []
        if csv_path.exists():
            try:
                df = pd.read_csv(csv_path, nrows=8)
                for _, row in df.iterrows():
                    cap = str(row.get("caption", "")).strip()
                    tags = str(row.get("hashtags", "")).strip()
                    if cap and len(cap) > 10:
                        csv_posts.append((
                            "astronomy_hub",
                            cap,
                            tags or "#Cosmos #Community",
                            "Astrophysics & Cosmos",
                            "Positive", 0.82, "wonder", 0.80
                        ))
            except Exception:
                pass

        all_to_seed = base_posts + csv_posts

        created_posts = []
        for uname, caption, tags, topic, sent, sent_conf, emo, emo_conf in all_to_seed:
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

        # Seed initial interactions and likes for demo user so feeds and analytics look alive
        if demo_user and created_posts:
            # Follow creators
            for creator in creator_objs.values():
                if creator.id != demo_user.id:
                    if not Follow.query.filter_by(follower_id=demo_user.id, following_id=creator.id).first():
                        db.session.add(Follow(follower_id=demo_user.id, following_id=creator.id))
            
            # Like and interact with a few posts
            for idx, p in enumerate(created_posts[:6]):
                db.session.add(Like(user_id=demo_user.id, post_id=p.id))
                db.session.add(Interaction(user_id=demo_user.id, post_id=p.id, event_type="like"))
                db.session.add(Interaction(user_id=demo_user.id, post_id=p.id, event_type="view", duration_seconds=18.5))
            
            # Add sample comments
            p0 = created_posts[0]
            db.session.add(Comment(post_id=p0.id, user_id=demo_user.id, text="The resolution on these infrared images is truly mind-blowing! ✨"))
            
            # Join community
            first_comm = Community.query.first()
            if first_comm:
                db.session.add(CommunityMember(community_id=first_comm.id, user_id=demo_user.id))

            db.session.commit()
