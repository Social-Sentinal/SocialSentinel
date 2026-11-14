from collections import Counter
from datetime import datetime, timezone
import math
import random
from backend.extensions import db
from backend.models import Post, Interaction, Like, Save, Follow, Block, UserTopicPreference, UserPreference
from backend.services.embedding_service import get_or_create_post_embedding, compute_user_interest_vector, cosine_similarity
from backend.services.collaborative_service import compute_collaborative_scores

def recommend(user_id, query="", limit=25, exploration=0.20):
    """
    Hybrid Sentiment-Aware Recommendation Engine:
    Combines:
    1. Content semantic embedding cosine similarity (35%)
    2. Collaborative user-peer interaction matrix (25%)
    3. Sentiment preference score per topic (20%)
    4. Global engagement velocity (10%)
    5. Freshness / recency decay (10%)
    Plus user-controllable serendipity exploration.
    """
    # 1. Fetch user blocks & exclusions
    blocked_user_ids = {b.blocked_id for b in Block.query.filter_by(blocker_id=user_id).all()}
    blocked_by_ids = {b.blocker_id for b in Block.query.filter_by(blocked_id=user_id).all()}
    excluded_authors = blocked_user_ids | blocked_by_ids

    # 2. Get candidate posts
    query_filter = Post.author_id.notin_(excluded_authors) if excluded_authors else True
    candidates = Post.query.filter(query_filter).order_by(Post.created_at.desc()).limit(200).all()
    if not candidates:
        return []

    candidate_ids = [p.id for p in candidates]

    # 3. User representations
    user_interest_vector = compute_user_interest_vector(user_id)
    collab_scores = compute_collaborative_scores(user_id, candidate_ids)
    following_ids = {f.following_id for f in Follow.query.filter_by(follower_id=user_id).all()}

    # 4. User Topic Sentiment Preferences
    topic_prefs = {tp.topic: tp.sentiment_score for tp in UserTopicPreference.query.filter_by(user_id=user_id).all()}

    # Check exploration setting from user preference
    pref_obj = UserPreference.query.filter_by(user_id=user_id).first()
    if pref_obj:
        exploration = max(0.05, min(0.80, pref_obj.exploration_rate))

    now = datetime.now(timezone.utc)
    scored = []

    for post in candidates:
        # A. Content Score (Cosine similarity of embeddings)
        post_emb = get_or_create_post_embedding(post)
        if user_interest_vector and post_emb:
            c_score = cosine_similarity(user_interest_vector, post_emb)
        else:
            c_score = 0.35  # Neutral baseline for new users

        # B. Collaborative Score
        col_score = collab_scores.get(post.id, 0.0)
        if post.author_id in following_ids:
            col_score = min(1.0, col_score + 0.30)

        # C. Sentiment Preference Score
        # If user has a positive sentiment history on this topic -> boosts score
        # If user has expressing repeated negative sentiment -> dampens score
        topic_sent = topic_prefs.get(post.topic_category, 0.5)
        # Normalize: 0.5 is neutral baseline, > 0.5 is boost, < 0.5 is discount
        sent_score = max(0.0, min(1.0, topic_sent))

        # D. Engagement / Interaction Velocity Score
        counts = post.counts()
        raw_engagement = (
            counts["likes"] * 2.0 +
            counts["saves"] * 4.0 +
            counts["comments"] * 3.0 +
            counts["shares"] * 4.0 +
            counts["views"] * 0.5
        )
        interaction_score = min(1.0, math.log1p(raw_engagement) / 6.0)

        # E. Recency Score (Exponential half-life of 7 days)
        created_time = post.created_at.replace(tzinfo=post.created_at.tzinfo or timezone.utc)
        age_days = max(0.0, (now - created_time).total_seconds() / 86400.0)
        recency_score = math.exp(-age_days / 7.0)

        # F. Weighted Hybrid Fusion Formula
        w_content = 0.35 - (0.10 * exploration)
        w_collab = 0.25
        w_sentiment = 0.20
        w_interaction = 0.10
        w_recency = 0.10

        final_score = (
            w_content * c_score +
            w_collab * col_score +
            w_sentiment * sent_score +
            w_interaction * interaction_score +
            w_recency * recency_score
        )

        # Serendipity exploration injection
        if exploration > 0:
            noise = random.uniform(-0.05, 0.05) * exploration
            final_score = max(0.0, min(1.0, final_score + noise))

        # Build clear human-readable explanation
        reasons = []
        if post.author_id in following_ids:
            reasons.append("from a creator you follow")
        if topic_sent > 0.65:
            reasons.append(f"you expressed high positive sentiment in #{post.topic_category}")
        elif topic_sent < 0.35:
            reasons.append("exploring diverse perspectives")
        if c_score > 0.60:
            reasons.append(f"matches your interests in #{post.topic_category}")
        if col_score > 0.40:
            reasons.append("popular among peers with similar taste")
        if interaction_score > 0.50:
            reasons.append("trending in the community")

        reason_str = " · ".join(reasons[:2]) if reasons else f"relevant to #{post.topic_category}"

        scored.append({
            "post": post,
            "score": round(final_score, 4),
            "reason": f"🎯 {round(final_score * 100)}% match · {reason_str}",
            "breakdown": {
                "content_score": round(c_score, 3),
                "collaborative_score": round(col_score, 3),
                "sentiment_score": round(sent_score, 3),
                "interaction_score": round(interaction_score, 3),
                "recency_score": round(recency_score, 3),
                "final_score": round(final_score, 4)
            }
        })

    # Sort descending by final score
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]

def get_serendipity_feed(user_id, limit=25):
    """
    Dedicated serendipity feed: maximizes topic diversity and novelty
    to intentionally break filter bubbles and introduce high-signal discoveries.
    """
    return recommend(user_id, limit=limit, exploration=0.65)

def explain_recommendation(user_id, post_id):
    """
    Detailed explainability API for a specific post.
    Returns full score breakdown and clear transparent rationale.
    """
    post = Post.query.get_or_404(post_id)
    user_interest_vector = compute_user_interest_vector(user_id)
    collab_scores = compute_collaborative_scores(user_id, [post_id])
    following_ids = {f.following_id for f in Follow.query.filter_by(follower_id=user_id).all()}

    topic_pref = UserTopicPreference.query.filter_by(user_id=user_id, topic=post.topic_category).first()
    sent_score = topic_pref.sentiment_score if topic_pref else 0.5

    post_emb = get_or_create_post_embedding(post)
    c_score = cosine_similarity(user_interest_vector, post_emb) if (user_interest_vector and post_emb) else 0.35
    col_score = collab_scores.get(post.id, 0.0)
    if post.author_id in following_ids:
        col_score = min(1.0, col_score + 0.30)

    now = datetime.now(timezone.utc)
    created_time = post.created_at.replace(tzinfo=post.created_at.tzinfo or timezone.utc)
    age_days = max(0.0, (now - created_time).total_seconds() / 86400.0)
    recency_score = math.exp(-age_days / 7.0)

    counts = post.counts()
    raw_engagement = counts["likes"] * 2 + counts["saves"] * 4 + counts["comments"] * 3
    interaction_score = min(1.0, math.log1p(raw_engagement) / 6.0)

    final_score = (
        0.35 * c_score +
        0.25 * col_score +
        0.20 * sent_score +
        0.10 * interaction_score +
        0.10 * recency_score
    )

    return {
        "post_id": post.id,
        "topic": post.topic_category,
        "final_score": round(final_score, 4),
        "match_percentage": int(round(final_score * 100)),
        "breakdown": {
            "content_semantic_score": round(c_score, 3),
            "collaborative_peer_score": round(col_score, 3),
            "sentiment_affinity_score": round(sent_score, 3),
            "community_velocity_score": round(interaction_score, 3),
            "freshness_score": round(recency_score, 3)
        },
        "rationale": (
            f"This post was ranked with a {int(round(final_score * 100))}% affinity score. "
            f"Your historical interactions with #{post.topic_category} reflect "
            f"{'positive' if sent_score >= 0.60 else 'balanced' if sent_score >= 0.40 else 'critical'} sentiment feedback. "
            f"Content embeddings show {int(round(c_score * 100))}% semantic alignment with your interests."
        )
    }
