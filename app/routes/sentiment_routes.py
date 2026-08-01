from flask import Blueprint, jsonify, request
from app.services import sentiment_service

sentiment_bp = Blueprint("sentiment", __name__)


@sentiment_bp.route("/predict", methods=["POST"])
def predict():
    user_input = request.form.get("text", "")
    result = sentiment_service.predict_sentiment(user_input)
    return jsonify(result)


@sentiment_bp.route("/emotion", methods=["POST"])
def emotion():
    user_input = request.form.get("text", "")
    result = sentiment_service.emotion_detection(user_input)
    return jsonify(result)


@sentiment_bp.route("/wordcloud", methods=["POST"])
def wordcloud():
    user_input = request.form.get("text", "")
    msg = sentiment_service.generate_word_cloud(user_input)
    return msg, 200
