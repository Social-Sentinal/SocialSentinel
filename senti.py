import re
import pickle
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import random

# Load the Random Forest model and TF-IDF vectorizer
with open('sentiment_model.pkl', 'rb') as model_file:
    random_forest_model = pickle.load(model_file)

with open('tfidf_vectorizer.pkl', 'rb') as vectorizer_file:
    tfidf_vectorizer = pickle.load(vectorizer_file)

# Preprocess the text data


def preprocess_text(text):
    text = text.lower()  # Convert to lowercase
    # Remove special characters and numbers
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    return text

# Predict sentiment with confidence score


def predict_sentiment(user_input):
    test_data = pd.DataFrame({'text': [user_input]})
    test_data['text'] = test_data['text'].apply(preprocess_text)
    X_test = tfidf_vectorizer.transform(test_data['text'])

    # Predictions and confidence
    probabilities = random_forest_model.predict_proba(X_test)
    confidence = max(probabilities[0])  # Highest probability score
    sentiment = random_forest_model.predict(X_test)[0]

    sentiment_dist = {
        'positive': round(probabilities[0][0] * 100, 2),
        'neutral': round(probabilities[0][1] * 100, 2),
        'negative': round(probabilities[0][2] * 100, 2),
    }

    return {'text': user_input, 'sentiment': sentiment, 'confidence': confidence, 'distribution': sentiment_dist}

# Generate Word Cloud


def generate_word_cloud(sentiment_text):
    wordcloud = WordCloud().generate(sentiment_text)
    plt.imshow(wordcloud, interpolation='bilinear')
    plt.axis("off")
    plt.show()

# Emotion detection (stub for example, you would replace this with an actual model)


def emotion_detection(user_input):
    # Placeholder logic for detecting emotions
    emotions = ["joy", "anger", "sadness", "surprise"]
    emotion_intensity = {emotion: random.uniform(
        0.1, 1.0) for emotion in emotions}  # Random intensity values
    return {'text': user_input, 'emotions': emotion_intensity}
