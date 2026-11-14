from datetime import datetime, timezone
import json
import math
import os
import re
from backend.extensions import db

_hf_sentiment_pipeline = None
_hf_failed = False

def _get_hf_sentiment_pipeline():
    """
    Attempts to load Horizon-Labs/multilingual-sentiment-small or lightweight
    transformers sentiment pipeline with local caching if enabled.
    Fails fast with zero network hanging when offline or in test/sandbox.
    """
    global _hf_sentiment_pipeline, _hf_failed
    if _hf_sentiment_pipeline is None and not _hf_failed:
        if os.getenv("ENABLE_LOCAL_TRANSFORMERS", "0") != "1":
            _hf_failed = True
            return None
        try:
            from transformers import pipeline
            model_name = os.getenv("SENTIMENT_MODEL_NAME", "Horizon-Labs/multilingual-sentiment-small")
            _hf_sentiment_pipeline = pipeline("sentiment-analysis", model=model_name, local_files_only=True)
        except Exception:
            _hf_failed = True
            _hf_sentiment_pipeline = None
    return _hf_sentiment_pipeline

# Lexicons for high-performance localized sentiment nuance
POSITIVE_WORDS = {
    "love", "amazing", "wonderful", "great", "excellent", "awesome", "fantastic", "brilliant",
    "beautiful", "happy", "joy", "excited", "stellar", "superb", "inspiring", "best",
    "fascinating", "incredible", "favorite", "genius", "cool", "spectacular", "progress",
    "success", "win", "breakthrough", "marvelous", "uplifting", "radiant", "delight",
    "clean", "fast", "efficient", "resilient", "safe", "secure", "impressive", "promising",
    "helpful", "innovative", "proud", "clarity", "empowering", "mindful", "peaceful"
}

NEGATIVE_WORDS = {
    "bad", "terrible", "horrible", "worst", "hate", "awful", "sad", "disappointed",
    "angry", "broken", "bug", "fail", "failure", "crisis", "disaster", "tragic",
    "depressed", "ugly", "pain", "annoying", "poor", "boring", "useless", "toxic",
    "vulnerable", "insecure", "crash", "flaw", "leak", "breach", "slow", "damage",
    "confusing", "misleading", "fraud", "shameful", "distracting", "draining", "exhausting"
}

NEGATIONS = {"not", "no", "never", "hardly", "barely", "scarcely", "without", "dont", "cant", "wont"}

EMOTION_PATTERNS = {
    "joy": [r"\b(happy|joy|love|delight|celebrat|excited|wonderful|thrill|smile|cheerful)\b", 0.85],
    "wonder": [r"\b(cosmos|universe|galaxy|stars|mystery|astronomy|stunning|marvel|breathtaking|awe)\b", 0.88],
    "curiosity": [r"\b(discover|explore|learn|curious|how|why|question|research|study|investigat|wondering)\b", 0.82],
    "inspiration": [r"\b(create|innovat|build|future|dream|vision|inspire|breakthrough|achiev|empower)\b", 0.86],
    "empathy": [r"\b(support|care|friend|help|community|together|listen|share|connect|kindness)\b", 0.80],
    "sadness": [r"\b(sad|grief|cry|miss|lost|heartbreak|down|depress|pain|unhappy)\b", 0.84],
    "concern": [r"\b(worry|risk|danger|fear|trouble|problem|alert|warning|threat|unsafe)\b", 0.78]
}

def normalize_text(text):
    """
    Cleans and normalizes text while preserving punctuation, emojis, and negations.
    """
    if not text:
        return ""
    # Normalize excessive whitespace but preserve casing and emojis
    cleaned = re.sub(r"\s+", " ", text.strip())
    return cleaned

def predict_sentiment(text, user_id=None):
    """
    Predicts sentiment label ('Positive', 'Neutral', 'Negative') and confidence score.
    Uses local HuggingFace pipeline when available, with fast lexical pattern fallback.
    """
    if not text or not text.strip():
        raise ValueError("Text is required")

    clean_text = normalize_text(text)
    hf = _get_hf_sentiment_pipeline()

    if hf is not None:
        try:
            res = hf(clean_text[:512])[0]
            label_raw = res.get("label", "").upper()
            score = float(res.get("score", 0.85))
            if "POS" in label_raw:
                label = "Positive"
            elif "NEG" in label_raw:
                label = "Negative"
            else:
                label = "Neutral"

            return {
                "text": clean_text,
                "sentiment": label,
                "confidence": round(score, 3),
                "probabilities": {
                    "positive": round(score if label == "Positive" else (1 - score) / 2, 3),
                    "neutral": round(score if label == "Neutral" else 0.2, 3),
                    "negative": round(score if label == "Negative" else (1 - score) / 2, 3)
                },
                "model_version": "Horizon-Labs-multilingual-sentiment"
            }
        except Exception:
            pass

    # Fast, reliable lexical engine
    words = re.findall(r"\b[a-zA-Z]{3,}\b", clean_text.lower())
    if not words:
        return {
            "text": clean_text,
            "sentiment": "Neutral",
            "confidence": 0.70,
            "probabilities": {"positive": 0.20, "neutral": 0.60, "negative": 0.20},
            "model_version": "SentinelLexicon-v3"
        }

    pos_score = 0
    neg_score = 0

    for i, w in enumerate(words):
        is_negated = (i > 0 and words[i - 1] in NEGATIONS) or (i > 1 and words[i - 2] in NEGATIONS)
        if w in POSITIVE_WORDS:
            if is_negated:
                neg_score += 1.0
            else:
                pos_score += 1.0
        elif w in NEGATIVE_WORDS:
            if is_negated:
                pos_score += 0.8
            else:
                neg_score += 1.0

    total_hits = pos_score + neg_score
    if total_hits == 0:
        sentiment = "Neutral"
        conf = 0.72
        p_pos, p_neu, p_neg = 0.20, 0.60, 0.20
    elif pos_score > neg_score:
        sentiment = "Positive"
        margin = pos_score - neg_score
        conf = min(0.96, 0.65 + 0.08 * margin)
        p_pos = min(0.92, 0.55 + 0.10 * margin)
        p_neu = max(0.05, 0.35 - 0.06 * margin)
        p_neg = max(0.02, 1.0 - (p_pos + p_neu))
    elif neg_score > pos_score:
        sentiment = "Negative"
        margin = neg_score - pos_score
        conf = min(0.96, 0.65 + 0.08 * margin)
        p_neg = min(0.92, 0.55 + 0.10 * margin)
        p_neu = max(0.05, 0.35 - 0.06 * margin)
        p_pos = max(0.02, 1.0 - (p_neg + p_neu))
    else:
        sentiment = "Neutral"
        conf = 0.68
        p_pos, p_neu, p_neg = 0.30, 0.40, 0.30

    return {
        "text": clean_text,
        "sentiment": sentiment,
        "confidence": round(float(conf), 3),
        "probabilities": {
            "positive": round(float(p_pos), 3),
            "neutral": round(float(p_neu), 3),
            "negative": round(float(p_neg), 3)
        },
        "model_version": "SentinelLexicon-v3"
    }

def emotion_detection(text):
    """
    Classifies text emotion across 7 dimensions:
    joy, wonder, curiosity, inspiration, empathy, sadness, concern.
    """
    if not text or not text.strip():
        raise ValueError("Text is required")

    lower = text.lower()
    matched = []

    for emotion, (pat, base_conf) in EMOTION_PATTERNS.items():
        hits = len(re.findall(pat, lower))
        if hits > 0:
            matched.append((emotion, min(0.98, base_conf + 0.04 * (hits - 1))))

    if matched:
        matched.sort(key=lambda x: x[1], reverse=True)
        top_emotion, top_conf = matched[0]
        return {
            "emotion": top_emotion,
            "confidence": round(top_conf, 3),
            "model_version": "EmotionPatternDetector-v3"
        }

    return {
        "emotion": "curiosity",
        "confidence": 0.68,
        "model_version": "EmotionPatternDetector-v3"
    }

def record_comment_sentiment_and_update_profile(user_id, post_id, comment_id, text, topic):
    """
    Pipeline executed upon comment submission:
    1. Analyzes sentiment and emotion.
    2. Stores record in sentiment_analysis table.
    3. Updates user's UserTopicPreference with time-decayed moving average.
    """
    from backend.models import SentimentAnalysis, UserTopicPreference

    sent_res = predict_sentiment(text, user_id=user_id)
    label = sent_res["sentiment"]
    conf = sent_res["confidence"]

    # 1. Record in sentiment_analysis table
    record = SentimentAnalysis(
        user_id=user_id,
        post_id=post_id,
        comment_id=comment_id,
        sentiment_label=label,
        confidence_score=conf,
        model_name=sent_res.get("model_version", "SentinelLexicon-v3"),
        model_version="v3"
    )
    db.session.add(record)

    # 2. Update UserTopicPreference
    if topic:
        pref = UserTopicPreference.query.filter_by(user_id=user_id, topic=topic).first()
        if not pref:
            pref = UserTopicPreference(
                user_id=user_id,
                topic=topic,
                positive_count=0,
                neutral_count=0,
                negative_count=0,
                sentiment_score=0.5,
                interaction_count=0
            )
            db.session.add(pref)

        pref.interaction_count = (pref.interaction_count or 0) + 1
        val = 1.0 if label == "Positive" else (0.0 if label == "Negative" else 0.5)

        if label == "Positive":
            pref.positive_count = (pref.positive_count or 0) + 1
        elif label == "Negative":
            pref.negative_count = (pref.negative_count or 0) + 1
        else:
            pref.neutral_count = (pref.neutral_count or 0) + 1

        # Exponential moving average with confidence weight
        alpha = 0.20 * conf
        pref.sentiment_score = round((1.0 - alpha) * pref.sentiment_score + alpha * val, 4)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

    return sent_res
