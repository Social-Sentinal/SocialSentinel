# collab.py

import joblib
import pandas as pd
import random


def load_model_and_vectorizer():
    """Load the trained models and TF-IDF vectorizer from disk."""
    try:
        caption_model = joblib.load('caption.pkl')
        hashtag_model = joblib.load('hashtag.pkl')
        tfidf_vectorizer = joblib.load('tfidf_vectorizer2.pkl')
        return caption_model, hashtag_model, tfidf_vectorizer
    except Exception as e:
        print(f"Error loading models: {e}")
        return None, None, None


def analyze_csv_data(caption_model, hashtag_model, tfidf_vectorizer, input_csv, output_csv):
    """Load input data from CSV, make predictions, and save the output."""
    try:
        # Load the input data from CSV
        df = pd.read_csv(input_csv)

        # Combine captions and hashtags for prediction
        df['text'] = df['caption'] + ' ' + df['hashtags']

        # Vectorize the input text
        input_tfidf = tfidf_vectorizer.transform(df['text'])

        # Make predictions
        predicted_captions = caption_model.predict(input_tfidf)
        predicted_hashtags = hashtag_model.predict(input_tfidf)

        # Add predictions to the DataFrame
        df['predicted_caption'] = predicted_captions
        df['predicted_hashtags'] = predicted_hashtags

        # Save the predictions to a new CSV file
        df.to_csv(output_csv, index=False)

        return df
    except Exception as e:
        print(f"Error analyzing CSV data: {e}")
        return None


def get_random_images(image_urls, num_images=3):
    """Randomly select multiple images from the provided URLs."""
    return random.sample(image_urls, min(num_images, len(image_urls)))
