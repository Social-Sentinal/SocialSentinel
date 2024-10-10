from flask import Flask, request, jsonify, render_template
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer

# Initialize Flask app
app = Flask(__name__)

# Load the model bundle
model_bundle = joblib.load('sentiment_model.pkl')
tfidf = model_bundle['tfidf']
# scaler = model_bundle['scaler']
df = model_bundle['df']

# NLTK setup for text preprocessing
nltk.download('stopwords')
stop_words = set(stopwords.words('english'))
stemmer = PorterStemmer()

# Define the preprocessing function again


def preprocess_text(text):
    text = text.lower()  # Lowercase
    # Remove special characters and numbers
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    tokens = [word for word in text.split() if word not in stop_words]
    tokens = [stemmer.stem(word) for word in tokens]  # Stemming
    return ' '.join(tokens)


# Combine Caption and Hashtags
df['content'] = df['Caption'] + ' ' + df['Hashtags']

# Define function for post recommendation


def recommend_by_caption(input_caption, num_recommendations=5):
    input_caption_processed = preprocess_text(input_caption)
    input_caption_vector = tfidf.transform([input_caption_processed])

    engagement_features = df[['Likes', 'Comments', 'Shares',
                              'Saves', 'Profile Visits', 'Follows']].values
    zeros_for_engagement = np.zeros(
        engagement_features.shape[1]).reshape(1, -1)
    input_combined_features = np.hstack(
        [input_caption_vector.toarray(), zeros_for_engagement])

    # Compute cosine similarity
    combined_features = np.hstack(
        [tfidf.transform(df['content']).toarray(), engagement_features])
    similarity_scores = cosine_similarity(
        input_combined_features, combined_features).flatten()

    similar_posts_indices = similarity_scores.argsort()[
        ::-1][:num_recommendations]
    return df.iloc[similar_posts_indices]

# Define route for the homepage


@app.route('/')
def home():
    return render_template('reports.html')

# Define route for handling recommendations


@app.route('/recommend', methods=['POST'])
def recommend():
    if request.method == 'POST':
        input_caption = request.form['caption']
        num_recommendations = int(request.form.get('num_recommendations', 5))

        # Get recommendations
        recommended_posts = recommend_by_caption(
            input_caption, num_recommendations)

        # Select the relevant columns to display
        selected_columns = ['Date', 'Caption',
                            'Hashtags', 'Likes', 'Comments', 'Shares']
        recommended_posts = recommended_posts[selected_columns].to_dict(
            orient='records')

        return jsonify(recommended_posts)


# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)