import os
import requests
import random
from app.config import Config
from app.models import db, UserProfile, Post
from app.utils.data_loader import PROFILES_CATALOG, UNSPLASH_POST_IMAGES, AVATARS, LOCATIONS
from app.services.sentiment_service import predict_sentiment

PUBLIC_SAMPLE_VIDEOS = [
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
]


def get_instagram_user_details(username: str) -> dict:
    """
    Fetch rich Instagram user profile details.
    Queries UserProfile DB / RapidAPI / PROFILES_CATALOG fallback.
    """
    clean_username = username.lower().strip().lstrip("@")
    if not clean_username:
        clean_username = "humansofny"

    # 1. Check existing UserProfile in Database
    existing_profile = UserProfile.query.filter(
        (UserProfile.username == clean_username)
    ).first()

    rapid_key = Config.RAPIDAPI_KEY
    api_key = Config.INSTAGRAM_API_KEY

    # 2. Try RapidAPI / External Instagram API if key is present
    if rapid_key or api_key:
        try:
            url = f"https://{Config.INSTAGRAM_API_HOST}/user/details"
            headers = {
                "X-RapidAPI-Key": rapid_key or api_key,
                "X-RapidAPI-Host": Config.INSTAGRAM_API_HOST
            }
            params = {"username": clean_username}
            resp = requests.get(url, headers=headers, params=params, timeout=4)
            if resp.status_code == 200:
                data = resp.json().get("data") or resp.json().get("user") or resp.json()
                avatar_pic = data.get("profile_pic_url") or data.get("user_avatar")
                if not avatar_pic or "file://" in avatar_pic or "localhost" in avatar_pic:
                    avatar_pic = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"

                profile_dict = {
                    "username": clean_username,
                    "full_name": data.get("full_name") or data.get("ownerFullName") or clean_username.capitalize(),
                    "user_avatar": avatar_pic,
                    "followers_count": data.get("edge_followed_by", {}).get("count") or data.get("follower_count") or 120000,
                    "following_count": data.get("edge_follow", {}).get("count") or data.get("following_count") or 350,
                    "posts_count": data.get("edge_owner_to_timeline_media", {}).get("count") or data.get("posts_count") or 450,
                    "biography": data.get("biography") or "Digital storyteller & content creator.",
                    "external_url": data.get("external_url") or f"https://instagram.com/{clean_username}",
                    "is_verified": bool(data.get("is_verified", True))
                }

                if existing_profile:
                    for k, v in profile_dict.items():
                        setattr(existing_profile, k, v)
                else:
                    new_prof = UserProfile(**profile_dict)
                    db.session.add(new_prof)
                db.session.commit()
                return profile_dict
        except Exception as e:
            print(f"[Instagram API Warning] RapidAPI request failed: {e}. Falling back to catalog.")

    # 3. DB Profile Match
    if existing_profile:
        return existing_profile.to_dict()

    # 4. Catalog Profile Match
    if clean_username in PROFILES_CATALOG:
        cat_data = PROFILES_CATALOG[clean_username]
        new_prof = UserProfile(**cat_data)
        try:
            db.session.add(new_prof)
            db.session.commit()
        except Exception:
            db.session.rollback()
        return cat_data

    # 5. Dynamic Generative Profile
    avatar_idx = abs(hash(clean_username)) % len(AVATARS)
    fallback_data = {
        "username": clean_username,
        "full_name": clean_username.replace("_", " ").replace(".", " ").title(),
        "user_avatar": AVATARS[avatar_idx],
        "followers_count": 48500,
        "following_count": 412,
        "posts_count": 128,
        "biography": f"Official digital profile for @{clean_username}. Exploring tech, lifestyle, and visual stories.",
        "external_url": f"https://instagram.com/{clean_username}",
        "is_verified": True
    }
    return fallback_data


def fetch_live_instagram_posts(query: str) -> list[dict]:
    """
    Search & ingest live social posts.
    Uses Reddit free public API as an open external source if query is provided,
    and falls back cleanly to local DB and high-res dynamic posts.
    """
    clean_query = query.strip().lower().lstrip("#").lstrip("@")
    if not clean_query:
        return [p.to_dict() for p in Post.query.all()]

    # 1. Search local DB posts first
    db_posts = Post.query.filter(
        (Post.username.ilike(f"%{clean_query}%")) |
        (Post.caption.ilike(f"%{clean_query}%")) |
        (Post.hashtags.ilike(f"%{clean_query}%"))
    ).all()

    if db_posts and len(db_posts) >= 3:
        return [p.to_dict() for p in db_posts]

    # 2. Try fetching live public posts via Reddit Public JSON API (Keyless Free Public API)
    try:
        reddit_url = f"https://www.reddit.com/r/{clean_query}/hot.json?limit=12"
        headers = {"User-Agent": "SocialSentinel-Web/2.0"}
        resp = requests.get(reddit_url, headers=headers, timeout=3.5)

        if resp.status_code != 200:
            # Try global search endpoint
            reddit_url = f"https://www.reddit.com/search.json?q={clean_query}&limit=12"
            resp = requests.get(reddit_url, headers=headers, timeout=3.5)

        if resp.status_code == 200:
            children = resp.json().get("data", {}).get("children", [])
            live_posts = []

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

                # Extract preview media or use Unsplash fallback
                url_overridden = pdata.get("url_overridden_by_dest", "")
                img_url = ""
                if url_overridden.endswith((".jpg", ".png", ".webp", ".jpeg")):
                    img_url = url_overridden
                else:
                    img_url = UNSPLASH_POST_IMAGES[idx % len(UNSPLASH_POST_IMAGES)]

                video_url = ""
                if pdata.get("is_video"):
                    video_url = PUBLIC_SAMPLE_VIDEOS[idx % len(PUBLIC_SAMPLE_VIDEOS)]

                # Predict sentiment for fetched caption
                sent_res = predict_sentiment(caption)

                post_obj = {
                    "id": 90000 + idx,
                    "username": author,
                    "full_name": author.capitalize(),
                    "user_avatar": AVATARS[idx % len(AVATARS)],
                    "location": LOCATIONS[idx % len(LOCATIONS)],
                    "caption": caption,
                    "hashtags": f"#{clean_query} #trending #socialsentinel",
                    "image_url": img_url,
                    "video_url": video_url,
                    "likes_count": ups,
                    "comments_count": num_comments,
                    "views_count": ups * 4,
                    "follower_count": ups * 10,
                    "biography": f"Content creator interested in #{clean_query}",
                    "external_url": f"https://reddit.com{pdata.get('permalink', '')}",
                    "timestamp": "Just Now",
                    "sentiment": sent_res.get("sentiment", "Neutral"),
                    "score": sent_res.get("confidence", 0.75),
                    "topic_category": clean_query.capitalize(),
                    "is_verified": idx % 2 == 0
                }
                live_posts.append(post_obj)

            if live_posts:
                return live_posts
    except Exception as e:
        print(f"[Public API Notice] Reddit fetch notice: {e}")

    # 3. Fallback to DB posts query
    fallback_posts = Post.query.limit(20).all()
    return [p.to_dict() for p in fallback_posts]
