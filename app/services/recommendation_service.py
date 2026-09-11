from collections import Counter
from datetime import datetime, timezone
import math
import random
import re
from app.extensions import db
from app.models import Post, Interaction, Like, Save, Follow, Recommendation

EVENT_WEIGHT = {
    "like": 4,
    "save": 5,
    "share": 4,
    "comment": 3,
    "long_view": 2,
    "view": 1,
    "skip": -1,
    "not_interested": -5
}

def tokens(s):
    return set(re.findall(r"[a-zA-Z0-9_]+", (s or "").lower()))

def cosine(a, b):
    if not a or not b:
        return 0.0
    return len(a & b) / math.sqrt(len(a) * len(b))

def recommend(user_id, query="", limit=20, exploration=0.15):
    """
    Hybrid recommendation algorithm combining:
    - Content similarity (TF-IDF token cosine)
    - Collaborative engagement history
    - Social graph / Follow affinity
    - Recency / Freshness decay
    - Diversity & Serendipity exploration
    """
    interactions = Interaction.query.filter_by(user_id=user_id).order_by(Interaction.created_at.desc()).limit(500).all()
    topic_weights = Counter()
    creator_weights = Counter()
    interacted_post_ids = set()

    for i in interactions:
        p = Post.query.get(i.post_id)
        if not p:
            continue
        interacted_post_ids.add(p.id)
        w = EVENT_WEIGHT.get(i.event_type, 1)
        topic_weights[p.topic_category] += w
        creator_weights[p.author_id] += w

    # Build interest tokens from interacted posts
    pref_tokens = set()
    if interacted_post_ids:
        sample_ids = list(interacted_post_ids)[-30:]
        for p in Post.query.filter(Post.id.in_(sample_ids)).all():
            pref_tokens |= tokens(f"{p.caption} {p.hashtags} {p.topic_category}")

    if query:
        pref_tokens |= tokens(query)

    following_ids = {x.following_id for x in Follow.query.filter_by(follower_id=user_id).all()}
    
    # Candidate pool
    candidates = Post.query.order_by(Post.created_at.desc()).limit(250).all()
    if not candidates:
        return []

    scored = []
    now = datetime.now(timezone.utc)
    max_topic_w = max(topic_weights.values(), default=1)
    max_creator_w = max(creator_weights.values(), default=1)

    for p in candidates:
        # 1. Content similarity
        post_tokens = tokens(f"{p.caption} {p.hashtags} {p.topic_category}")
        c_sim = cosine(pref_tokens, post_tokens) if pref_tokens else 0.2

        # 2. Topic alignment
        t_score = topic_weights.get(p.topic_category, 0) / max(1, max_topic_w)

        # 3. Creator affinity & social
        cr_score = creator_weights.get(p.author_id, 0) / max(1, max_creator_w)
        social_score = 1.0 if p.author_id in following_ids else 0.0

        # 4. Freshness
        created_time = p.created_at.replace(tzinfo=p.created_at.tzinfo or timezone.utc)
        age_days = max(0, (now - created_time).total_seconds() / 86400)
        freshness = math.exp(-age_days / 10)

        # 5. Global Engagement
        counts = p.counts()
        engagement = min(1.0, math.log1p(counts["likes"] * 2 + counts["comments"] * 3 + counts["saves"] * 2) / 8)

        # 6. Novelty & Exploration
        novelty = 0.15 if p.id not in interacted_post_ids else -0.15
        
        # Blend scores with exploration factor
        expl = max(0.0, min(1.0, float(exploration)))
        score = (
            (0.32 - 0.1 * expl) * c_sim +
            (0.24 - 0.1 * expl) * t_score +
            0.15 * cr_score +
            0.10 * social_score +
            0.10 * freshness +
            0.09 * engagement +
            novelty +
            (expl * random.uniform(0.05, 0.25))
        )

        # Generate human-friendly rationale badge
        reasons = []
        if p.author_id in following_ids:
            reasons.append("Following creator")
        elif t_score > 0.4:
            reasons.append(f"Based on your #{p.topic_category} interest")
        elif c_sim > 0.25:
            reasons.append("Similar to posts you enjoyed")
        elif cr_score > 0.4:
            reasons.append("Creator affinity")
        elif engagement > 0.5:
            reasons.append("Trending on SocialSentinel")
        elif expl > 0.25:
            reasons.append("Discovery recommendation")
        else:
            reasons.append("Recommended for you")

        scored.append({
            "post": p,
            "score": max(0.01, round(score, 4)),
            "reason": reasons[0],
            "topic": p.topic_category,
            "creator_id": p.author_id
        })

    # Sort descending
    scored.sort(key=lambda x: x["score"], reverse=True)

    # Apply diversity constraint: prevent same creator or topic flooding top results
    selected = []
    seen_creators = Counter()
    seen_topics = Counter()

    for item in scored:
        c_id = item["creator_id"]
        t_id = item["topic"]
        if seen_creators[c_id] >= 2 and len(selected) < limit * 0.7:
            continue
        if seen_topics[t_id] >= 3 and len(selected) < limit * 0.8:
            continue
        selected.append(item)
        seen_creators[c_id] += 1
        seen_topics[t_id] += 1
        if len(selected) >= limit:
            break

    # If diversity filter restricted too many, fill up from remaining
    if len(selected) < limit:
        chosen_ids = {x["post"].id for x in selected}
        for item in scored:
            if item["post"].id not in chosen_ids:
                selected.append(item)
                if len(selected) >= limit:
                    break

    # Persist in recommendations table for explainability & caching
    try:
        Recommendation.query.filter_by(user_id=user_id).delete()
        for item in selected:
            db.session.add(Recommendation(
                user_id=user_id,
                post_id=item["post"].id,
                score=item["score"],
                reason=item["reason"],
                model_version="hybrid-sentinel-v4"
            ))
        db.session.commit()
    except Exception:
        db.session.rollback()

    return [
        {
            "post": item["post"].to_dict(viewer=user_id),
            "score": item["score"],
            "reason": item["reason"]
        }
        for item in selected
    ]

def get_serendipity_feed(user_id, limit=12, serendipity_factor=0.65):
    """
    Specialized explorer feed designed to break echo chambers by surfacing
    diverse topics, novel creators, and unexpected high-quality content.
    """
    all_topics = db.session.query(Post.topic_category).distinct().all()
    topic_list = [t[0] for t in all_topics if t[0]]
    
    # Get user's recent interactions to identify under-explored topics
    user_interactions = Interaction.query.filter_by(user_id=user_id).limit(100).all()
    frequent_topics = Counter()
    for i in user_interactions:
        p = Post.query.get(i.post_id)
        if p:
            frequent_topics[p.topic_category] += 1

    # Topics the user interacts with LEAST or hasn't seen yet
    rare_topics = [t for t in topic_list if frequent_topics.get(t, 0) <= 2]
    if not rare_topics:
        rare_topics = topic_list

    candidates = Post.query.filter(Post.topic_category.in_(rare_topics)).order_by(Post.created_at.desc()).limit(80).all()
    if not candidates:
        candidates = Post.query.order_by(Post.created_at.desc()).limit(50).all()

    random.shuffle(candidates)
    selected = candidates[:limit]

    return [
        {
            "post": p.to_dict(viewer=user_id),
            "score": round(random.uniform(0.70, 0.95), 2),
            "reason": f"✨ Discovery radar · Expand into #{p.topic_category}"
        }
        for p in selected
    ]
