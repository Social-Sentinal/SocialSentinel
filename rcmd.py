from flask import Flask, render_template, jsonify, request
import random
import csv
import joblib
import numpy as np
import pandas as pd
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)

posts = [
    {
        "id": 1,
        "image_url": "https://picsum.photos/200/300",
        "caption": "Exploring the mountains! #travel #adventure",
        "hashtags": "#travel #adventure",
        "timestamp": "2023-09-28 10:30:00"
    },
    {
        "id": 2,
        "image_url": "https://picsum.photos/seed/picsum/200/300",
        "caption": "Delicious food! #foodie #yum",
        "hashtags": "#foodie #yum",
        "timestamp": "2023-09-28 12:00:00"
    },
    {
        "id": 3,
        "image_url": "https://picsum.photos/200/300?grayscale",
        "caption": "Sunset by the beach! #beachlife #sunset",
        "hashtags": "#beachlife #sunset",
        "timestamp": "2023-09-27 18:45:00"
    }
]

# Load the model bundle
model_bundle = joblib.load('D:/Github/SocialSentinel/model/model_bundle.pkl')
tfidf = model_bundle['tfidf']
scaler = model_bundle['scaler']
df = model_bundle['df']

# NLTK setup for text preprocessing
nltk.download('stopwords')
stop_words = set(stopwords.words('english'))
stemmer = PorterStemmer()

# Define the preprocessing function


def preprocess_text(text):
    text = text.lower()  # Lowercase
    # Remove special characters and numbers
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    tokens = [word for word in text.split() if word not in stop_words]
    tokens = [stemmer.stem(word) for word in tokens]  # Stemming
    return ' '.join(tokens)


# Combine Caption and Hashtags in DataFrame
df['content'] = df['Caption'] + ' ' + df['Hashtags']

# Define function for post recommendation


def recommend_by_caption(input_caption, num_recommendations=5):
    input_caption_processed = preprocess_text(input_caption)
    input_caption_vector = tfidf.transform([input_caption_processed])

    # Extract engagement features
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

    # Get indices of similar posts
    similar_posts_indices = similarity_scores.argsort()[
        ::-1][:num_recommendations]
    return df.iloc[similar_posts_indices]


@app.route('/recommend', methods=['POST'])
def recommend():
    if request.method == 'POST':
        input_caption = request.form['caption']
        num_recommendations = int(request.form.get('num_recommendations', 5))

        # Get recommendations
        recommended_posts = recommend_by_caption(
            input_caption, num_recommendations)

        # Select relevant columns to display
        selected_columns = ['Date', 'Caption',
                            'Hashtags', 'Likes', 'Comments', 'Shares']
        recommended_posts = recommended_posts[selected_columns].to_dict(
            orient='records')

        return jsonify(recommended_posts)


@app.route('/')
def index():
    return render_template('engine.html')


@app.route('/get_posts')
def get_posts():
    return jsonify(random.sample(posts, len(posts)))  # Return shuffled posts


@app.route('/save_post', methods=['POST'])
def save_post():
    post_data = request.json
    # Save the post data along with duration spent viewing it
    with open('saved_posts.csv', mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([post_data['caption'], post_data['hashtags'],
                         post_data['timestamp'], post_data['duration']])
    return jsonify({"message": "Post and duration saved successfully!"})


if __name__ == "__main__":
    app.run(debug=True)