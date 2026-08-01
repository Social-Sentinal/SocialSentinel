import random
from app.models import Post, UserInteraction
from app.utils.data_loader import load_model

_caption_model = None
_hashtag_model = None
_tfidf_vectorizer2 = None


def load_collab_models():
    global _caption_model, _hashtag_model, _tfidf_vectorizer2
    if any(m is None for m in (_caption_model, _hashtag_model, _tfidf_vectorizer2)):
        _caption_model = load_model("caption.pkl")
        _hashtag_model = load_model("hashtag.pkl")
        _tfidf_vectorizer2 = load_model("tfidf_vectorizer2.pkl")
    return _caption_model, _hashtag_model, _tfidf_vectorizer2


def get_collaborative_recommendations(limit: int = 6) -> list[dict]:
    caption_model, hashtag_model, tfidf_vectorizer = load_collab_models()

    # Query recent interaction history from database
    interactions = UserInteraction.query.order_by(UserInteraction.id.desc()).limit(20).all()
    posts = Post.query.limit(limit).all()

    recommended_results = []

    if interactions and tfidf_vectorizer and caption_model and hashtag_model:
        for idx, inter in enumerate(interactions[:limit]):
            input_text = f"{inter.caption or 'Exploring nature'} {inter.hashtags or '#travel'}"
            try:
                tfidf_vec = tfidf_vectorizer.transform([input_text])
                pred_caption = caption_model.predict(tfidf_vec)[0]
                pred_hashtags = hashtag_model.predict(tfidf_vec)[0]
            except Exception:
                pred_caption = inter.caption or "Chasing sunrise views"
                pred_hashtags = inter.hashtags or "#morning #vibes"

            recommended_results.append({
                "image_url": f"https://picsum.photos/300/200?random={idx + 10}",
                "predicted_caption": str(pred_caption),
                "predicted_hashtags": str(pred_hashtags),
                "timestamp": inter.timestamp,
                "engagement_score": round(min(0.95, 0.60 + (inter.view_duration * 0.05)), 2)
            })

    if not recommended_results:
        for idx, p in enumerate(posts):
            recommended_results.append({
                "image_url": p.image_url or f"https://picsum.photos/300/200?random={idx + 1}",
                "predicted_caption": f"Recommended: {p.caption}",
                "predicted_hashtags": p.hashtags or "#trending #socialsentinel",
                "timestamp": p.timestamp,
                "engagement_score": round(random.uniform(0.70, 0.95), 2)
            })

    return recommended_results
