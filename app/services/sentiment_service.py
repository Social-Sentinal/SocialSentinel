import os
import random
import pandas as pd
from wordcloud import WordCloud
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend to prevent GUI thread blocking
import matplotlib.pyplot as plt

from app.config import STATIC_DIR
from app.utils.data_loader import load_model
from app.utils.text_utils import preprocess_text

_model = None
_vectorizer = None


def get_sentiment_model_and_vectorizer():
    global _model, _vectorizer
    if _model is None or _vectorizer is None:
        _model = load_model("sentiment_model.pkl")
        _vectorizer = load_model("tfidf_vectorizer.pkl")
    return _model, _vectorizer


def predict_sentiment(user_input: str) -> dict:
    model, vectorizer = get_sentiment_model_and_vectorizer()
    processed_input = preprocess_text(user_input)

    if model is None or vectorizer is None:
        return {
            "text": user_input,
            "sentiment": "Neutral",
            "confidence": 0.5,
            "distribution": {"positive": 33.33, "neutral": 33.33, "negative": 33.33}
        }

    test_data = pd.DataFrame({"text": [processed_input]})
    X_test = vectorizer.transform(test_data["text"])

    try:
        probabilities = model.predict_proba(X_test)[0]
        confidence = float(max(probabilities))
        sentiment = str(model.predict(X_test)[0])

        # Assuming class order: positive, neutral, negative
        positive_prob = round(probabilities[0] * 100, 2) if len(probabilities) > 0 else 33.33
        neutral_prob = round(probabilities[1] * 100, 2) if len(probabilities) > 1 else 33.33
        negative_prob = round(probabilities[2] * 100, 2) if len(probabilities) > 2 else 33.33

        sentiment_dist = {
            "positive": positive_prob,
            "neutral": neutral_prob,
            "negative": negative_prob,
        }

        return {
            "text": user_input,
            "sentiment": sentiment,
            "confidence": confidence,
            "distribution": sentiment_dist
        }
    except Exception as e:
        print(f"[Error] Prediction failed: {e}")
        return {
            "text": user_input,
            "sentiment": "Neutral",
            "confidence": 0.5,
            "distribution": {"positive": 33.33, "neutral": 33.33, "negative": 33.33}
        }


def emotion_detection(user_input: str) -> dict:
    emotions = ["joy", "anger", "sadness", "surprise"]
    emotion_intensity = {emotion: round(random.uniform(0.1, 1.0), 2) for emotion in emotions}
    return {"text": user_input, "emotions": emotion_intensity}


def generate_word_cloud(sentiment_text: str) -> str:
    """Generate WordCloud image and save it to static directory."""
    if not sentiment_text:
        sentiment_text = "social sentinel sentiment analysis"
    wordcloud = WordCloud(width=800, height=400, background_color="white").generate(sentiment_text)
    
    output_path = STATIC_DIR / "wordcloud.png"
    STATIC_DIR.mkdir(parents=True, exist_ok=True)
    wordcloud.to_file(str(output_path))
    return "Word Cloud Generated"
