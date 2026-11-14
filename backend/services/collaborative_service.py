from collections import defaultdict, Counter
import math
from backend.extensions import db
from backend.models import Interaction, Follow, Like, Save, Post, Block

INTERACTION_WEIGHTS = {
    "save": 4.0,
    "share": 4.0,
    "follow": 3.0,
    "comment": 3.0,
    "like": 2.0,
    "long_view": 1.5,
    "view": 0.5,
    "skip": -1.0,
    "not_interested": -4.0
}

def get_user_interaction_vector(user_id, limit=200):
    """
    Returns dict mapping post_id -> cumulative interaction weight for this user.
    """
    rows = Interaction.query.filter_by(user_id=user_id).order_by(Interaction.created_at.desc()).limit(limit).all()
    vec = defaultdict(float)
    for r in rows:
        vec[r.post_id] += INTERACTION_WEIGHTS.get(r.event_type, 1.0)
    return vec

def vector_cosine(dict_a, dict_b):
    """
    Computes cosine similarity between two sparse interaction vectors.
    """
    if not dict_a or not dict_b:
        return 0.0

    common_keys = set(dict_a.keys()) & set(dict_b.keys())
    if not common_keys:
        return 0.0

    dot = sum(dict_a[k] * dict_b[k] for k in common_keys)
    norm_a = math.sqrt(sum(v * v for v in dict_a.values()))
    norm_b = math.sqrt(sum(v * v for v in dict_b.values()))

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return max(0.0, dot / (norm_a * norm_b))

def compute_collaborative_scores(user_id, candidate_post_ids):
    """
    Computes collaborative filtering affinity score for candidate posts:
    1. Identifies top-K most similar peers based on interaction history.
    2. Aggregates peer endorsements weighted by user similarity.
    3. Normalizes score between [0.0, 1.0].
    """
    user_vec = get_user_interaction_vector(user_id)
    if not user_vec:
        # Cold start fallback: popular engagement
        return {}

    # Sample other active users who interacted with the same items
    shared_item_users = db.session.query(Interaction.user_id)\
        .filter(Interaction.post_id.in_(list(user_vec.keys())), Interaction.user_id != user_id)\
        .distinct().limit(100).all()

    peer_ids = [u[0] for u in shared_item_users]
    if not peer_ids:
        return {}

    # Calculate user similarities
    similarities = {}
    for peer_id in peer_ids:
        peer_vec = get_user_interaction_vector(peer_id)
        sim = vector_cosine(user_vec, peer_vec)
        if sim > 0.05:
            similarities[peer_id] = sim

    if not similarities:
        return {}

    # Sort peers by similarity
    top_peers = sorted(similarities.items(), key=lambda x: x[1], reverse=True)[:25]

    # Score candidate posts
    post_scores = defaultdict(float)
    max_score = 0.0

    for peer_id, sim in top_peers:
        peer_interactions = Interaction.query.filter(
            Interaction.user_id == peer_id,
            Interaction.post_id.in_(candidate_post_ids)
        ).all()

        for inter in peer_interactions:
            w = INTERACTION_WEIGHTS.get(inter.event_type, 1.0)
            if w > 0:
                score = sim * w
                post_scores[inter.post_id] += score
                if post_scores[inter.post_id] > max_score:
                    max_score = post_scores[inter.post_id]

    if max_score > 0:
        return {pid: round(min(1.0, s / max_score), 4) for pid, s in post_scores.items()}
    return {}

