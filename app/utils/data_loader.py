import os
import random
import joblib
import pickle
import pandas as pd
from typing import Any, Optional
from app.config import DATA_DIR, MODELS_DIR

# Curated High-Resolution Social Photography Assets
UNSPLASH_POST_IMAGES = [
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80"
]

AVATARS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
]

DIVERSE_CREATORS = [
    {"username": "career_mentor", "full_name": "Alex Tech Career", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", "bio": "Tech career coach & engineering mentor"},
    {"username": "interview_pro", "full_name": "Sarah Interview Hacks", "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", "bio": "Helping engineers land top tech offers"},
    {"username": "mindful_living", "full_name": "Elena Wellness", "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80", "bio": "Mindfulness & self-care storyteller"},
    {"username": "self_healing_guide", "full_name": "Marcus Self Love", "avatar": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=150&auto=format&fit=crop&q=80", "bio": "Author & emotional healing practitioner"},
    {"username": "techcrunch", "full_name": "TechCrunch", "avatar": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80", "bio": "Reporting on tech news, startups, venture capital, and Silicon Valley innovations."},
    {"username": "zen_master", "full_name": "Zen Mindfulness Guide", "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80", "bio": "Daily meditation, stress relief techniques, and emotional wellness coaching."},
    {"username": "code_craft", "full_name": "Dev Code Craft", "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80", "bio": "Master Full-Stack, AI Engineering & Software Architecture."},
    {"username": "travel_bug", "full_name": "Wanderlust Travels", "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80", "bio": "Exploring hidden world landscapes and outdoor mountain adventures. 🏔️✈️"},
    {"username": "natgeo", "full_name": "National Geographic", "avatar": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=150&auto=format&fit=crop&q=80", "bio": "Inspiring people to care about the planet since 1888. 🌍✨"},
    {"username": "mrbeast", "full_name": "Jimmy Donaldson", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", "bio": "I want to make the world a better place before I die. Feastables & Philanthropy."},
    {"username": "creators", "full_name": "Instagram Creators", "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80", "bio": "Tips, inspiration, and news for digital content creators building their community."},
    {"username": "humansofny", "full_name": "Humans of New York", "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", "bio": "New York City, one story at a time. Photographed and written by Brandon Stanton."}
]

USERNAMES = [c["username"] for c in DIVERSE_CREATORS]
LOCATIONS = ["New York, NY", "London, UK", "Paris, France", "Tokyo, Japan", "Los Angeles, CA", "San Francisco, CA", "Seattle, WA", "Austin, TX"]


def load_model(filename: str) -> Optional[Any]:
    model_path = MODELS_DIR / filename
    if not model_path.exists():
        print(f"[Warning] Model file not found: {model_path}")
        return None

    try:
        return joblib.load(model_path)
    except Exception:
        try:
            with open(model_path, "rb") as f:
                return pickle.load(f)
        except Exception as e:
            print(f"[Error] Failed to load model {filename}: {e}")
            return None


def load_dataset(filename: str) -> pd.DataFrame:
    csv_path = DATA_DIR / filename
    if not csv_path.exists():
        print(f"[Warning] Dataset file not found: {csv_path}")
        return pd.DataFrame()

    try:
        return pd.read_csv(csv_path)
    except Exception as e:
        print(f"[Error] Failed to load dataset {filename}: {e}")
        return pd.DataFrame()


PROFILES_CATALOG = {c["username"]: {
    "username": c["username"],
    "full_name": c["full_name"],
    "user_avatar": c["avatar"],
    "followers_count": random.randint(15000, 25000000),
    "following_count": random.randint(120, 600),
    "posts_count": random.randint(80, 4500),
    "biography": c["bio"],
    "external_url": f"https://instagram.com/{c['username']}",
    "is_verified": True
} for c in DIVERSE_CREATORS}


def load_default_user_profiles() -> list[dict]:
    """Return default enriched user profile catalog."""
    return list(PROFILES_CATALOG.values())


def parse_real_instagram_posts() -> list[dict]:
    """Parse real Instagram dataset items and seed topic-paired sentiment content."""
    df = load_dataset("instagram_results.csv")
    posts = []

    # Curated topic-paired posts for explicit sentiment steering evaluation
    WELLBEING_SEED_POSTS = [
        {
            "username": "career_mentor",
            "full_name": "Alex Tech Career",
            "user_avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            "location": "Silicon Valley, CA",
            "caption": "Devastated after getting rejected from my 15th job interview today. Feeling like a complete career failure and losing hope. #jobsearch #failure #career #depressed",
            "hashtags": "#jobsearch #failure #career #depressed",
            "image_url": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80",
            "likes_count": 420,
            "comments_count": 89,
            "views_count": 3400,
            "follower_count": 45000,
            "biography": "Tech career coach & engineering mentor",
            "external_url": "https://linkedin.com",
            "timestamp": "2024-09-20",
            "sentiment": "Negative",
            "score": 0.15,
            "topic_category": "Career",
            "is_verified": True
        },
        {
            "username": "interview_pro",
            "full_name": "Sarah Interview Hacks",
            "user_avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            "location": "Seattle, WA",
            "caption": "How I cracked my Senior Software Engineer interview after 10 rejections! 5 key strategies that changed everything. Never give up on your career success! #careersuccess #interviewtips #motivation #tech",
            "hashtags": "#careersuccess #interviewtips #motivation #tech",
            "image_url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
            "likes_count": 8420,
            "comments_count": 312,
            "views_count": 28900,
            "follower_count": 120000,
            "biography": "Helping engineers land top tech offers",
            "external_url": "https://careerhacks.io",
            "timestamp": "2024-09-21",
            "sentiment": "Positive",
            "score": 0.94,
            "topic_category": "Career",
            "is_verified": True
        },
        {
            "username": "mindful_living",
            "full_name": "Elena Wellness",
            "user_avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
            "location": "Los Angeles, CA",
            "caption": "Going through a painful breakup and feeling completely lonely and broken inside. Hardest week of my life. #breakup #sadness #lonely #heartbroken",
            "hashtags": "#breakup #sadness #lonely #heartbroken",
            "image_url": "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80",
            "likes_count": 630,
            "comments_count": 140,
            "views_count": 4200,
            "follower_count": 38000,
            "biography": "Mindfulness & self-care storyteller",
            "external_url": "https://mindfulwellness.com",
            "timestamp": "2024-09-18",
            "sentiment": "Negative",
            "score": 0.18,
            "topic_category": "Relationships",
            "is_verified": False
        },
        {
            "username": "self_healing_guide",
            "full_name": "Marcus Self Love",
            "user_avatar": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=150&auto=format&fit=crop&q=80",
            "location": "Austin, TX",
            "caption": "7 powerful steps for self-healing after a relationship ends. Rebuilding your confidence, moving on, and embracing self-love! 🌸✨ #selfhealing #movingon #selflove #relationshipadvice",
            "hashtags": "#selfhealing #movingon #selflove #relationshipadvice",
            "image_url": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80",
            "likes_count": 9240,
            "comments_count": 420,
            "views_count": 35100,
            "follower_count": 95000,
            "biography": "Author & emotional healing practitioner",
            "external_url": "https://selfhealing.org",
            "timestamp": "2024-09-19",
            "sentiment": "Positive",
            "score": 0.96,
            "topic_category": "Relationships",
            "is_verified": True
        }
    ]

    posts.extend(WELLBEING_SEED_POSTS)

    if not df.empty and "caption" in df.columns:
        for idx, row in df.iterrows():
            caption = str(row.get("caption", ""))
            if not caption or caption == "nan" or len(caption) < 15:
                continue

            # Pick creator metadata dynamically across diverse catalog
            creator = DIVERSE_CREATORS[idx % len(DIVERSE_CREATORS)]
            username = creator["username"]

            likes = int(row.get("likesCount", 1240)) if str(row.get("likesCount", "")).isdigit() else 1240
            comments = int(row.get("commentsCount", 42)) if str(row.get("commentsCount", "")).isdigit() else 42

            image_url = UNSPLASH_POST_IMAGES[idx % len(UNSPLASH_POST_IMAGES)]
            location = LOCATIONS[idx % len(LOCATIONS)]

            # Extract hashtags
            words = caption.split()
            hashtags_list = [w for w in words if w.startswith("#")]
            hashtags = " ".join(hashtags_list[:5]) if hashtags_list else "#life #story #instagram"

            is_pos = any(w in caption.lower() for w in ["love", "happy", "beautiful", "blessed", "wonderful", "miracle", "rich", "great", "inspire", "success"])
            is_neg = any(w in caption.lower() for w in ["fail", "sad", "depressed", "hard", "lost", "tired", "broken", "rejection"])
            
            sentiment = "Positive" if is_pos else ("Negative" if is_neg else "Neutral")
            score = 0.88 if is_pos else (0.20 if is_neg else 0.50)

            # Assign topic category
            if any(w in caption.lower() for w in ["tech", "coding", "software", "ai", "startup"]):
                topic = "Technology"
            elif any(w in caption.lower() for w in ["travel", "mountain", "beach", "city", "explore"]):
                topic = "Travel"
            elif any(w in caption.lower() for w in ["fitness", "gym", "health", "workout"]):
                topic = "Fitness"
            else:
                topic = "Personal Growth"

            posts.append({
                "username": username,
                "full_name": creator["full_name"],
                "user_avatar": creator["avatar"],
                "location": location,
                "caption": caption[:350],
                "hashtags": hashtags,
                "image_url": image_url,
                "likes_count": likes,
                "comments_count": comments,
                "views_count": likes * 3,
                "follower_count": random.randint(25000, 1500000),
                "biography": creator["bio"],
                "external_url": f"https://instagram.com/{username}",
                "timestamp": str(row.get("timestamp", "2024-09-15 14:30:00"))[:10],
                "sentiment": sentiment,
                "score": score,
                "topic_category": topic,
                "is_verified": idx % 2 == 0
            })

            if len(posts) >= 30:
                break

    return posts
