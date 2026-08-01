import random
import pandas as pd
from wordcloud import WordCloud
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from app.config import STATIC_DIR
from app.extensions import db
from app.models import SentimentLog
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

    sentiment = "Neutral"
    confidence = 0.5
    sentiment_dist = {"positive": 33.33, "neutral": 33.34, "negative": 33.33}

    if model is not None and vectorizer is not None:
        try:
            test_data = pd.DataFrame({"text": [processed_input]})
            X_test = vectorizer.transform(test_data["text"])
            probabilities = model.predict_proba(X_test)[0]
            confidence = float(max(probabilities))
            sentiment = str(model.predict(X_test)[0])

            positive_prob = round(probabilities[0] * 100, 2) if len(probabilities) > 0 else 33.33
            neutral_prob = round(probabilities[1] * 100, 2) if len(probabilities) > 1 else 33.34
            negative_prob = round(probabilities[2] * 100, 2) if len(probabilities) > 2 else 33.33

            sentiment_dist = {
                "positive": positive_prob,
                "neutral": neutral_prob,
                "negative": negative_prob,
            }
        except Exception as e:
            print(f"[Error] Prediction computation failed: {e}")

    # Persist log to SQLite Database
    try:
        log_entry = SentimentLog(
            input_text=user_input,
            sentiment=sentiment,
            confidence=confidence,
            positive_score=sentiment_dist["positive"],
            neutral_score=sentiment_dist["neutral"],
            negative_score=sentiment_dist["negative"]
        )
        db.session.add(log_entry)
        db.session.commit()
    except Exception as err:
        db.session.rollback()
        print(f"[Database Error] Saving sentiment log failed: {err}")

    return {
        "text": user_input,
        "sentiment": sentiment,
        "confidence": confidence,
        "distribution": sentiment_dist
    }


def emotion_detection(user_input: str) -> dict:
    emotions = ["joy", "anger", "sadness", "surprise"]
    emotion_intensity = {emotion: round(random.uniform(0.1, 1.0), 2) for emotion in emotions}
    return {"text": user_input, "emotions": emotion_intensity}


def generate_word_cloud(sentiment_text: str) -> str:
    if not sentiment_text or not sentiment_text.strip():
        sentiment_text = "SocialSentinel Sentiment Analysis Cloud Trends Insights"

    wordcloud = WordCloud(width=800, height=400, background_color="white").generate(sentiment_text)
    output_path = STATIC_DIR / "wordcloud.png"
    STATIC_DIR.mkdir(parents=True, exist_ok=True)
    wordcloud.to_file(str(output_path))
    return "Word Cloud Generated"
