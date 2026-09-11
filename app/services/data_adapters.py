import requests
import random
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from app.models import db, UserProfile, Post
from app.utils.data_loader import PROFILES_CATALOG, DIVERSE_CREATORS, UNSPLASH_POST_IMAGES, AVATARS, LOCATIONS
from app.services.sentiment_service import predict_sentiment

PUBLIC_SAMPLE_VIDEOS = [
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
]


class BaseDataProvider(ABC):
    """Abstract Data Provider Interface"""

    @abstractmethod
    def fetch_posts(self, query: str = "", limit: int = 15) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def fetch_user_profile(self, username: str) -> Optional[Dict[str, Any]]:
        pass


class LivePublicApiAdapter(BaseDataProvider):
    """
    Tier 1 Data Provider: Fetches keyless real-time social posts via Reddit JSON API.
    """

    def fetch_posts(self, query: str = "", limit: int = 15) -> List[Dict[str, Any]]:
        clean_q = query.strip().lower().lstrip("#").lstrip("@")
        if not clean_q:
            clean_q = "technology"

        headers = {"User-Agent": "SocialSentinel-Web/2.0"}
        posts = []

        try:
            url = f"https://www.reddit.com/r/{clean_q}/hot.json?limit={limit}"
            resp = requests.get(url, headers=headers, timeout=3.5)

            if resp.status_code != 200:
                url = f"https://www.reddit.com/search.json?q={clean_q}&limit={limit}"
                resp = requests.get(url, headers=headers, timeout=3.5)

            if resp.status_code == 200:
                children = resp.json().get("data", {}).get("children", [])
                for idx, child in enumerate(children):
                    pdata = child.get("data", {})
                    title = pdata.get("title", "").strip()
                    selftext = pdata.get("selftext", "").strip()
                    caption = f"{title}. {selftext[:180]}".strip() if selftext else title

                    if not caption or len(caption) < 8:
                        continue

                    author = pdata.get("author", "social_creator").lower()
                    ups = pdata.get("ups", 420)
                    num_comments = pdata.get("num_comments", 24)

                    url_dest = pdata.get("url_overridden_by_dest", "")
                    img_url = url_dest if url_dest.endswith((".jpg", ".png", ".webp", ".jpeg")) else UNSPLASH_POST_IMAGES[idx % len(UNSPLASH_POST_IMAGES)]
                    video_url = PUBLIC_SAMPLE_VIDEOS[idx % len(PUBLIC_SAMPLE_VIDEOS)] if pdata.get("is_video") else ""

                    sent_res = predict_sentiment(caption)

                    creator_meta = DIVERSE_CREATORS[idx % len(DIVERSE_CREATORS)]

                    posts.append({
                        "id": 95000 + idx,
                        "username": author if author != "[deleted]" else creator_meta["username"],
                        "full_name": author.capitalize() if author != "[deleted]" else creator_meta["full_name"],
                        "user_avatar": creator_meta["avatar"],
                        "location": LOCATIONS[idx % len(LOCATIONS)],
                        "caption": caption,
                        "hashtags": f"#{clean_q} #trending #socialsentinel",
                        "image_url": img_url,
                        "video_url": video_url,
                        "likes_count": ups,
                        "comments_count": num_comments,
                        "views_count": ups * 4,
                        "follower_count": ups * 12,
                        "biography": creator_meta["bio"],
                        "external_url": f"https://reddit.com{pdata.get('permalink', '')}",
                        "timestamp": "Just Now",
                        "sentiment": sent_res.get("sentiment", "Neutral"),
                        "score": sent_res.get("confidence", 0.75),
                        "topic_category": clean_q.capitalize(),
                        "is_verified": idx % 2 == 0
                    })
        except Exception as e:
            print(f"[Adapter Notice] LivePublicApiAdapter query notice: {e}")

        return posts

    def fetch_user_profile(self, username: str) -> Optional[Dict[str, Any]]:
        clean_un = username.strip().lower().lstrip("@")
        if not clean_un:
            return None

        try:
            url = f"https://www.reddit.com/user/{clean_un}/about.json"
            headers = {"User-Agent": "SocialSentinel-Web/2.0"}
            resp = requests.get(url, headers=headers, timeout=3.0)

            if resp.status_code == 200:
                udata = resp.json().get("data", {})
                karma = udata.get("total_karma", 15400)
                icon = udata.get("icon_img", "").split("?")[0]
                if not icon or not icon.startswith("http"):
                    icon = AVATARS[abs(hash(clean_un)) % len(AVATARS)]

                return {
                    "username": clean_un,
                    "full_name": clean_un.capitalize(),
                    "user_avatar": icon,
                    "followers_count": karma * 3,
                    "following_count": 240,
                    "posts_count": random.randint(40, 800),
                    "biography": f"Social content creator @{clean_un}.",
                    "external_url": f"https://reddit.com/user/{clean_un}",
                    "is_verified": True
                }
        except Exception as e:
            print(f"[Adapter Notice] LivePublicApiAdapter profile notice: {e}")

        return None


class DatabaseCacheAdapter(BaseDataProvider):
    """
    Tier 2 Data Provider: Queries pre-indexed SQLite database records.
    """

    def fetch_posts(self, query: str = "", limit: int = 15) -> List[Dict[str, Any]]:
        from flask import has_app_context
        if not has_app_context():
            return []

        clean_q = query.strip().lower().lstrip("#").lstrip("@")
        db_query = Post.query

        if clean_q:
            db_query = db_query.filter(
                (Post.username.ilike(f"%{clean_q}%")) |
                (Post.caption.ilike(f"%{clean_q}%")) |
                (Post.hashtags.ilike(f"%{clean_q}%")) |
                (Post.topic_category.ilike(f"%{clean_q}%"))
            )

        db_posts = db_query.limit(limit).all()
        return [p.to_dict() for p in db_posts]

    def fetch_user_profile(self, username: str) -> Optional[Dict[str, Any]]:
        from flask import has_app_context
        if not has_app_context():
            return None

        clean_un = username.strip().lower().lstrip("@")
        profile = UserProfile.query.filter(UserProfile.username == clean_un).first()
        return profile.to_dict() if profile else None


class DynamicGenerativeAdapter(BaseDataProvider):
    """
    Tier 3 Data Provider: Guaranteed fallback generator using rich diverse creator catalog.
    """

    def fetch_posts(self, query: str = "", limit: int = 15) -> List[Dict[str, Any]]:
        from flask import has_app_context
        if has_app_context():
            all_posts = [p.to_dict() for p in Post.query.all()]
            if all_posts:
                return all_posts[:limit]

        # Generate on the fly if DB is unpopulated or outside context
        generated = []
        for idx in range(limit):
            creator = DIVERSE_CREATORS[idx % len(DIVERSE_CREATORS)]
            generated.append({
                "id": 80000 + idx,
                "username": creator["username"],
                "full_name": creator["full_name"],
                "user_avatar": creator["avatar"],
                "location": LOCATIONS[idx % len(LOCATIONS)],
                "caption": f"Exploring digital stories & sentiment analysis insight #{idx + 1}.",
                "hashtags": "#socialsentinel #ai #inspiration",
                "image_url": UNSPLASH_POST_IMAGES[idx % len(UNSPLASH_POST_IMAGES)],
                "video_url": PUBLIC_SAMPLE_VIDEOS[idx % len(PUBLIC_SAMPLE_VIDEOS)] if idx % 3 == 0 else "",
                "likes_count": random.randint(400, 12000),
                "comments_count": random.randint(20, 450),
                "views_count": random.randint(2000, 45000),
                "follower_count": random.randint(15000, 950000),
                "biography": creator["bio"],
                "external_url": f"https://instagram.com/{creator['username']}",
                "timestamp": "Just Now",
                "sentiment": "Positive" if idx % 2 == 0 else "Neutral",
                "score": 0.85,
                "topic_category": "Personal Growth",
                "is_verified": True
            })
        return generated

    def fetch_user_profile(self, username: str) -> Optional[Dict[str, Any]]:
        clean_un = username.strip().lower().lstrip("@")
        if clean_un in PROFILES_CATALOG:
            return PROFILES_CATALOG[clean_un]

        creator = DIVERSE_CREATORS[abs(hash(clean_un)) % len(DIVERSE_CREATORS)]
        return {
            "username": clean_un,
            "full_name": clean_un.replace("_", " ").title(),
            "user_avatar": creator["avatar"],
            "followers_count": random.randint(24000, 850000),
            "following_count": random.randint(150, 450),
            "posts_count": random.randint(50, 600),
            "biography": f"Official profile for @{clean_un}. Exploring visual storytelling and technology.",
            "external_url": f"https://instagram.com/{clean_un}",
            "is_verified": True
        }


class UnifiedSocialDataProvider:
    """
    Multi-Tier Data Provider Manager.
    Sequentially attempts Tier 1 (Live Public API) -> Tier 2 (DB Cache) -> Tier 3 (Dynamic Generative).
    """

    def __init__(self):
        self.adapters: List[BaseDataProvider] = [
            LivePublicApiAdapter(),
            DatabaseCacheAdapter(),
            DynamicGenerativeAdapter()
        ]

    def get_posts(self, query: str = "", limit: int = 15) -> List[Dict[str, Any]]:
        for adapter in self.adapters:
            try:
                posts = adapter.fetch_posts(query=query, limit=limit)
                if posts and len(posts) > 0:
                    return posts
            except Exception as e:
                print(f"[UnifiedProvider] Adapter {adapter.__class__.__name__} failed: {e}")

        # Fallback to empty list safety
        return []

    def get_user_profile(self, username: str) -> Dict[str, Any]:
        for adapter in self.adapters:
            try:
                profile = adapter.fetch_user_profile(username)
                if profile:
                    return profile
            except Exception as e:
                print(f"[UnifiedProvider] Profile adapter {adapter.__class__.__name__} failed: {e}")

        # Guaranteed fallback profile
        return DynamicGenerativeAdapter().fetch_user_profile(username)
