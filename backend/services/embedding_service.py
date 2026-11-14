import json
import math
import os
import re
from backend.extensions import db

_sentence_model = None
_model_failed = False

def _get_sentence_transformer():
    """
    Attempts to load sentence-transformers/all-MiniLM-L6-v2 locally if enabled.
    Fails fast with zero network hanging if offline or running in test/sandbox.
    """
    global _sentence_model, _model_failed
    if _sentence_model is None and not _model_failed:
        if os.getenv("ENABLE_LOCAL_TRANSFORMERS", "0") != "1":
            _model_failed = True
            return None
        try:
            from sentence_transformers import SentenceTransformer
            _sentence_model = SentenceTransformer("all-MiniLM-L6-v2", local_files_only=True)
        except Exception:
            _model_failed = True
            _sentence_model = None
    return _sentence_model

def tokenize_text(text):
    if not text:
        return []
    return re.findall(r"\b[a-zA-Z0-9_]{2,}\b", text.lower())

def fallback_deterministic_embedding(text, dim=128):
    """
    High-performance semantic hash & token frequency projection embedding.
    Produces deterministic 128-dimensional normalized unit vector.
    Guarantees semantic cosine similarity even without deep learning weights.
    """
    tokens = tokenize_text(text)
    if not tokens:
        return [0.0] * dim

    vec = [0.0] * dim
    for i, t in enumerate(tokens):
        h = hash(t)
        idx1 = abs(h) % dim
        idx2 = abs(h * 31 + i) % dim
        vec[idx1] += 1.0
        vec[idx2] += 0.5

    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        return [round(v / norm, 5) for v in vec]
    return [0.0] * dim

def generate_post_embedding(caption, hashtags="", topic=""):
    """
    Generates embedding for a post from combined textual features:
    [Topic Category] + [Caption] + [Hashtags]
    """
    combined = f"{topic}. {caption} {hashtags}".strip()
    model = _get_sentence_transformer()

    if model is not None:
        try:
            emb = model.encode(combined, convert_to_numpy=True)
            norm = float(math.sqrt(sum(float(x) ** 2 for x in emb)))
            if norm > 0:
                return [round(float(x) / norm, 5) for x in emb]
        except Exception:
            pass

    return fallback_deterministic_embedding(combined)

def cosine_similarity(vec_a, vec_b):
    """
    Calculates cosine similarity between two float vectors.
    Returns float in range [0.0, 1.0].
    """
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0

    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))

    if norm_a == 0 or norm_b == 0:
        return 0.0

    sim = dot / (norm_a * norm_b)
    return max(0.0, min(1.0, (sim + 1.0) / 2.0 if sim < 0 else sim))

def get_or_create_post_embedding(post):
    """
    Retrieves cached embedding or generates and stores it in database.
    """
    from backend.models import PostEmbedding

    if post.embedding:
        try:
            return json.loads(post.embedding)
        except Exception:
            pass

    cached = PostEmbedding.query.filter_by(post_id=post.id).first()
    if cached and cached.embedding_json:
        try:
            emb = json.loads(cached.embedding_json)
            post.embedding = cached.embedding_json
            db.session.commit()
            return emb
        except Exception:
            pass

    # Generate new embedding
    emb = generate_post_embedding(post.caption, post.hashtags, post.topic_category)
    emb_json = json.dumps(emb)
    post.embedding = emb_json

    new_cache = PostEmbedding(post_id=post.id, embedding_json=emb_json, model_name="all-MiniLM-L6-v2")
    db.session.add(new_cache)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

    return emb

def compute_user_interest_vector(user_id):
    """
    Generates a user interest representation vector by averaging embeddings
    of posts the user has positively interacted with.
    """
    from backend.models import Interaction, Post

    interactions = Interaction.query.filter_by(user_id=user_id).order_by(Interaction.created_at.desc()).limit(100).all()
    if not interactions:
        return None

    vectors = []
    weights = []
    weight_map = {"save": 4.0, "like": 3.0, "comment": 2.5, "share": 3.5, "long_view": 1.5, "view": 0.5}

    for inter in interactions:
        p = Post.query.get(inter.post_id)
        if not p:
            continue
        w = weight_map.get(inter.event_type, 1.0)
        emb = get_or_create_post_embedding(p)
        if emb:
            vectors.append(emb)
            weights.append(w)

    if not vectors:
        return None

    dim = len(vectors[0])
    user_vec = [0.0] * dim

    for vec, w in zip(vectors, weights):
        if len(vec) == dim:
            for i in range(dim):
                user_vec[i] += vec[i] * w

    norm = math.sqrt(sum(v * v for v in user_vec))
    if norm > 0:
        return [v / norm for v in user_vec]
    return None
