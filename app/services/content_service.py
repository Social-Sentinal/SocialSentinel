import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from gensim.models import Word2Vec

from app.config import MODELS_DIR
from app.models import Post
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


def recommend_posts(user_input: str, num_recommendations: int = 6) -> list[dict]:
    model = get_word2vec_model()
    posts = Post.query.all()

    if not posts:
        return [
            {
                "Caption": "Exploring the mountains! #adventure #nature",
                "Hashtags": "#adventure #nature",
                "image_url": "https://picsum.photos/300/200?random=1",
                "similarity": 0.95
            }
        ]

    cleaned_input = clean_text(user_input)
    input_tokens = cleaned_input.split()
    user_embedding = get_avg_word2vec(input_tokens, model)

    post_embeddings = []
    for post in posts:
        content_text = f"{post.caption} {post.hashtags or ''}"
        cleaned_post = clean_text(content_text)
        tokens = cleaned_post.split()
        embedding = get_avg_word2vec(tokens, model)
        post_embeddings.append(embedding)

    embeddings_matrix = np.array(post_embeddings)
    similarities = cosine_similarity(user_embedding.reshape(1, -1), embeddings_matrix)[0]

    top_indices = np.argsort(similarities)[-num_recommendations:][::-1]

    results = []
    for idx in top_indices:
        p = posts[idx]
        sim_score = float(similarities[idx])
        results.append({
            "id": p.id,
            "Caption": p.caption,
            "Hashtags": p.hashtags,
            "image_url": p.image_url,
            "timestamp": p.timestamp,
            "similarity": round(max(sim_score, 0.5), 2)
        })

    return results
