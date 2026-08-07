import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from gensim.models import Word2Vec

from app.config import MODELS_DIR
from app.models import Post, UserInteraction, UserInterestProfile
from app.utils.text_utils import clean_text

_word2vec_model = None


def get_word2vec_model():
    global _word2vec_model
    if _word2vec_model is None:
        model_path = MODELS_DIR / "word2vec_model.model"
        if model_path.exists():
            try:
                _word2vec_model = Word2Vec.load(str(model_path))
            except Exception as e:
                print(f"[Warning] Failed to load saved Word2Vec model: {e}")
                _word2vec_model = None

        if _word2vec_model is None:
            # Fallback training on default corpora
            sample_sentences = [
                ["career", "failure", "job", "rejection", "interview", "success", "motivation"],
                ["breakup", "sadness", "lonely", "healing", "moving", "love", "self"],
                ["exploring", "mountains", "nature", "adventure"],
                ["delicious", "food", "foodie", "yum"],
                ["sunset", "beach", "beachlife", "ocean"],
                ["morning", "coffee", "vibes", "sunrise"],
                ["hiking", "forest", "wilderness", "trail"]
            ]
            _word2vec_model = Word2Vec(
                sentences=sample_sentences, vector_size=100, window=5, min_count=1, workers=2
            )
    return _word2vec_model


def get_avg_word2vec(tokens: list[str], model: Word2Vec) -> np.ndarray:
    vectors = [model.wv[word] for word in tokens if word in model.wv]
    return np.mean(vectors, axis=0) if vectors else np.zeros(100)


def calculate_user_recent_sentiment() -> float:
    """
    Calculate user's exponentially weighted moving average sentiment score [-1.0 to +1.0].
    Based on recent watch history, likes, and comments.
    """
    recent_interactions = UserInteraction.query.order_by(UserInteraction.id.desc()).limit(10).all()
    if not recent_interactions:
        return 0.1  # Slightly positive default bias

    total_weight = 0.0
    sentiment_sum = 0.0

    for idx, inter in enumerate(recent_interactions):
        weight = 1.0 / (idx + 1.0)
        # Infer sentiment from caption or interaction
        text = (inter.caption or "").lower()
        if any(w in text for w in ["sad", "depressed", "lonely", "failed", "breakup", "rejected", "crying", "suffering"]):
            score = -0.8
        elif any(w in text for w in ["happy", "success", "motivational", "inspiring", "healing", "love", "great", "win"]):
            score = 0.8
        else:
            score = 0.0

        if inter.liked:
            score += 0.2
        if inter.saved:
            score += 0.1

        sentiment_sum += score * weight
        total_weight += weight

    return float(np.clip(sentiment_sum / max(0.001, total_weight), -1.0, 1.0))


def recommend_posts(user_input: str, num_recommendations: int = 6, enable_sentiment_steering: bool = True) -> list[dict]:
    model = get_word2vec_model()
    posts = Post.query.all()

    if not posts:
        return []

    cleaned_input = clean_text(user_input)
    input_tokens = cleaned_input.split()
    user_embedding = get_avg_word2vec(input_tokens, model)

    user_sentiment = calculate_user_recent_sentiment()

    scored_posts = []

    for post in posts:
        content_text = f"{post.caption} {post.hashtags or ''} {post.topic_category or ''}"
        cleaned_post = clean_text(content_text)
        tokens = cleaned_post.split()
        post_embedding = get_avg_word2vec(tokens, model)

        # 1. Topic Similarity Score (Cosine Similarity)
        if np.linalg.norm(user_embedding) > 0 and np.linalg.norm(post_embedding) > 0:
            sim_score = float(cosine_similarity(user_embedding.reshape(1, -1), post_embedding.reshape(1, -1))[0][0])
        else:
            # Fallback text token overlap score
            overlap = len(set(input_tokens).intersection(set(tokens)))
            sim_score = min(1.0, overlap / max(1, len(input_tokens)))

        sim_score = max(0.1, sim_score)

        # 2. Sentiment Uplift Steering Score
        post_sentiment_val = 0.8 if (post.sentiment or "").lower() == "positive" else (-0.6 if (post.sentiment or "").lower() == "negative" else 0.0)
        
        if enable_sentiment_steering and user_sentiment < 0:
            # User is in negative state -> boost candidate posts with positive sentiment on the SAME topic
            steer_score = (1.0 - user_sentiment) * max(0.0, post_sentiment_val)
        else:
            steer_score = 0.5 + 0.3 * post_sentiment_val

        # 3. Popularity & Collaborative Score
        popularity = min(1.0, (post.likes_count * 2 + post.comments_count * 5 + post.views_count * 0.1) / 10000.0)

        # 4. Hybrid Final Score Calculation
        w_topic = 0.40
        w_steer = 0.35 if enable_sentiment_steering else 0.05
        w_pop = 0.25

        hybrid_score = (w_topic * sim_score) + (w_steer * steer_score) + (w_pop * popularity)

        scored_posts.append({
            "post": post,
            "topic_similarity": round(sim_score, 3),
            "sentiment_steering_score": round(steer_score, 3),
            "popularity_score": round(popularity, 3),
            "hybrid_score": round(hybrid_score, 3)
        })

    # Sort by hybrid score descending
    scored_posts.sort(key=lambda x: x["hybrid_score"], reverse=True)

    results = []
    for item in scored_posts[:num_recommendations]:
        p = item["post"]
        p_dict = p.to_dict()
        p_dict.update({
            "similarity": item["topic_similarity"],
            "steering_score": item["sentiment_steering_score"],
            "hybrid_score": item["hybrid_score"],
            "recommendation_reason": "Topic-matched Emotional Uplift" if item["sentiment_steering_score"] > 0.6 else "Topic Interest Match"
        })
        results.append(p_dict)

    return results

