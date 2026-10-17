import os
import re
import warnings
from pathlib import Path
import joblib

# Suppress sklearn unpickling warnings
warnings.filterwarnings("ignore", category=UserWarning)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = BASE_DIR / "models" / "sentiment_model.pkl"
VECT_PATH = BASE_DIR / "models" / "tfidf_vectorizer.pkl"

_model = None
_vectorizer = None

def _get_models():
    global _model, _vectorizer
    if _model is None and MODEL_PATH.exists() and VECT_PATH.exists():
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                _model = joblib.load(MODEL_PATH)
                _vectorizer = joblib.load(VECT_PATH)
        except Exception:
            _model = None
            _vectorizer = None
    return _model, _vectorizer

# Lexicons for sentiment nuance & fallback
POSITIVE_WORDS = {
    "love", "amazing", "wonderful", "great", "excellent", "awesome", "fantastic", "brilliant",
    "beautiful", "happy", "joy", "excited", "stellar", "superb", "inspiring", "best",
    "fascinating", "incredible", "favorite", "genius", "cool", "spectacular", "progress",
    "success", "win", "breakthrough", "marvelous", "uplifting", "radiant", "delight"
}
NEGATIVE_WORDS = {
    "bad", "terrible", "horrible", "worst", "hate", "awful", "sad", "disappointed",
    "angry", "broken", "bug", "fail", "failure", "crisis", "disaster", "tragic",
    "depressed", "ugly", "pain", "annoying", "poor", "boring", "useless", "toxic"
}

EMOTION_PATTERNS = {
    "joy": [r"\b(happy|joy|love|delight|celebrat|excited|wonderful|thrill|smile)\b", 0.85],
    "wonder": [r"\b(cosmos|universe|galaxy|stars|mystery|astronomy|stunning|marvel|breathtaking)\b", 0.88],
    "curiosity": [r"\b(discover|explore|learn|curious|how|why|question|research|study|investigat)\b", 0.82],
    "inspiration": [r"\b(create|innovat|build|future|dream|vision|inspire|breakthrough|achiev)\b", 0.86],
    "empathy": [r"\b(support|care|friend|help|community|together|listen|share|connect)\b", 0.80],
    "sadness": [r"\b(sad|grief|cry|miss|lost|heartbreak|down|depress|pain)\b", 0.84],
    "concern": [r"\b(worry|risk|danger|fear|trouble|problem|alert|warning)\b", 0.78]
}

def predict_sentiment(text, user_id=None):
    if not text or not text.strip():
        raise ValueError("Text is required")
    
    clean_text = text.strip()
    words = set(re.findall(r"\b[a-zA-Z]{3,}\b", clean_text.lower()))
    
    pos_count = sum(1 for w in words if w in POSITIVE_WORDS)
    neg_count = sum(1 for w in words if w in NEGATIVE_WORDS)

    model, vectorizer = _get_models()
    
    if model is not None and vectorizer is not None:
        try:
            X = vectorizer.transform([clean_text])
            probs = model.predict_proba(X)[0]
            # Probabilities may be unnormalized vote sums
            total_p = sum(probs)
            if total_p > 0:
                probs = [p / total_p for p in probs]
            
            # Classes are ['Negative', 'Neutral', 'Positive']
            neg_p, neu_p, pos_p = probs[0], probs[1], probs[2]
            
            # Incorporate lexicon boost if present
            if pos_count > neg_count:
                boost = 0.45 * (pos_count - neg_count)
                pos_p += boost
                neu_p = max(0.05, neu_p - boost)
                neg_p = max(0.02, neg_p - 0.2 * boost)
            elif neg_count > pos_count:
                boost = 0.45 * (neg_count - pos_count)
                neg_p += boost
                neu_p = max(0.05, neu_p - boost)
                pos_p = max(0.02, pos_p - 0.2 * boost)
            
            total = neg_p + neu_p + pos_p
            neg_p, neu_p, pos_p = neg_p / total, neu_p / total, pos_p / total
            
            scores = [("Negative", neg_p), ("Neutral", neu_p), ("Positive", pos_p)]
            scores.sort(key=lambda x: x[1], reverse=True)
            best_label, best_conf = scores[0]
            
            return {
                "text": clean_text,
                "sentiment": best_label,
                "confidence": round(float(best_conf), 3),
                "probabilities": {
                    "positive": round(float(pos_p), 3),
                    "neutral": round(float(neu_p), 3),
                    "negative": round(float(neg_p), 3)
                },
                "model_version": "RandomForest-TFIDF-v2"
            }
        except Exception:
            pass

    # Fast heuristic fallback if model fails
    if pos_count > neg_count:
        sentiment = "Positive"
        conf = min(0.95, 0.65 + 0.1 * pos_count)
    elif neg_count > pos_count:
        sentiment = "Negative"
        conf = min(0.95, 0.65 + 0.1 * neg_count)
    else:
        sentiment = "Neutral"
        conf = 0.72

    return {
        "text": clean_text,
        "sentiment": sentiment,
        "confidence": round(conf, 3),
        "probabilities": {
            "positive": 0.8 if sentiment == "Positive" else (0.1 if sentiment == "Negative" else 0.2),
            "neutral": 0.6 if sentiment == "Neutral" else 0.15,
            "negative": 0.8 if sentiment == "Negative" else (0.1 if sentiment == "Positive" else 0.2)
        },
        "model_version": "Heuristic-Lexicon-v1"
    }

def emotion_detection(text):
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
            "model_version": "EmotionPatternDetector-v2"
        }
        
    # Default neutral/curiosity
    return {
        "emotion": "curiosity",
        "confidence": 0.68,
        "model_version": "EmotionPatternDetector-v2"
    }
