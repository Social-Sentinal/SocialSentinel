"""Optional production ML adapters. Heavy models are loaded lazily.
Set HF_SENTIMENT_MODEL/HF_EMOTION_MODEL to enable Hugging Face inference.
"""
import os

_sentiment = None
_emotion = None

def _load_sentiment():
    global _sentiment
    if _sentiment is not None: return _sentiment
    try:
        from transformers import pipeline
        _sentiment = pipeline('sentiment-analysis', model=os.getenv('HF_SENTIMENT_MODEL','cardiffnlp/twitter-roberta-base-sentiment-latest'))
    except Exception:
        _sentiment = False
    return _sentiment

def transformer_sentiment(text):
    model=_load_sentiment()
    if not model: return None
    try:
        rows=model(text[:2000], truncation=True)
        return rows[0]
    except Exception:
        return None
