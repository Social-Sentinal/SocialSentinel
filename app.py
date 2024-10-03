from flask import request, jsonify, Flask, render_template
import random
import csv
from post_generator import generate_posts  # Ensure this file generates random posts
import pickle
import pandas as pd
import re

app = Flask(__name__)

# Generate random posts (20 posts)
posts = generate_posts(20)

@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')

@app.route('/engine.html', methods=['GET'])
def admin():
    return render_template('engine.html')

@app.route('/get_posts', methods=['GET'])
def get_posts():
    # Shuffle posts and return a random selection
    return jsonify(random.sample(posts, len(posts)))


@app.route('/save_post', methods=['POST'])
def save_post():
    post_data = request.json
    # Save the post data along with duration spent viewing it
    with open('saved_posts.csv', mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([post_data['caption'], post_data['hashtags'],
                         post_data['timestamp'], post_data['duration']])
    return jsonify({"message": "Post and duration saved successfully!"})

@app.route('/engine.html', methods=['GET', 'POST'])
def recommend():
    if request.method == 'POST':
        user_input = request.form['user_input']  # Get user input from the form
        recommendations = hybrid_recommender.predict(user_input)  # Ensure this is defined
        
        # Extract required fields for query params
        query_params = {
            "captions": recommendations['captions'].tolist(),
            "hashtags": recommendations['hashtags'].tolist()
        }

        # Fetch real-time URLs (ensure this function is defined)
        urls = fetch_real_time_urls(query_params)

        return render_template('engine.html', recommendations=recommendations, urls=urls)
    return render_template('engine.html')  # Render engine.html for GET requests

@app.route('/sentiments.html', methods=['GET'])
def sentiments():
    return render_template('sentiments.html')

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

@app.route('/predict', methods=['POST'])
def predict():
    user_input = request.form['text']  # Get the user input from the form
    # Create a DataFrame for the input
    test_data = pd.DataFrame({'text': [user_input]})

    # Apply preprocessing
    test_data['text'] = test_data['text'].apply(preprocess_text)

    # Vectorize the preprocessed text data
    X_test = tfidf_vectorizer.transform(test_data['text'])

    # Make predictions
    predictions = random_forest_model.predict(X_test)

    # Return the result
    return jsonify({'text': user_input, 'sentiment': predictions[0]})


@app.route('/reports.html', methods=['GET'])
def reports():
    # Example data for reports (in a real application, you would fetch this from a database or analysis)
    report_data = {
        "total_sentiments": 100,
        "positive": 70,
        "negative": 20,
        "neutral": 10,
    }

    # Generate or fetch recommended posts based on sentiments
    recommended_posts = generate_recommended_posts(report_data)

    return render_template('reports.html', report_data=report_data, recommended_posts=recommended_posts)


def generate_recommended_posts(report_data):
    # This is a placeholder function. Implement your logic to generate or fetch recommended posts.
    # Example recommended posts structure
    return [
        {
            "image_url": "https://picsum.photos/200/300",
            "caption": "Amazing sunset view! #sunset #nature",
            "hashtags": "#sunset #nature",
            "timestamp": "2023-09-27 18:45:00"
        },
        {
            "image_url": "https://picsum.photos/seed/1/200/300",
            "caption": "Delicious meal! #food #yum",
            "hashtags": "#food #yum",
            "timestamp": "2023-09-28 12:00:00"
        },
        {
            "image_url": "https://picsum.photos/seed/2/200/300",
            "caption": "Adventure awaits! #travel #explore",
            "hashtags": "#travel #explore",
            "timestamp": "2023-09-28 10:30:00"
        }
    ]


@app.route('/analyze_sentiment', methods=['POST'])
def analyze_sentiment():
    user_input = request.form['text']  # Get the user input from the form
    # Create a DataFrame for the input
    test_data = pd.DataFrame({'text': [user_input]})

    # Apply preprocessing
    test_data['text'] = test_data['text'].apply(preprocess_text)

    # Vectorize the preprocessed text data
    X_test = tfidf_vectorizer.transform(test_data['text'])

    # Make predictions
    predictions = random_forest_model.predict(X_test)

    # Prepare analysis result
    analysis_result = {
        'text': user_input,
        'sentiment': predictions[0]
    }

    # Generate or fetch recommended posts based on the sentiment analysis
    recommended_posts = generate_recommended_posts(analysis_result)

    return render_template('reports.html', analysis_result=analysis_result, recommended_posts=recommended_posts)


@app.route('/contact.html', methods=['GET'])
def report():
    # Example data for reports (in a real application, you would fetch this from a database or analysis)
    report_data = {
        "total_sentiments": 100,
        "positive": 70,
        "negative": 20,
        "neutral": 10,
    }

    # Generate or fetch recommended posts based on sentiments
    recommended_posts = generate_recommended_posts(report_data)

    return render_template('contact.html', report_data=report_data, recommended_posts=recommended_posts)


if __name__ == '__main__':
    app.run(debug=True)
