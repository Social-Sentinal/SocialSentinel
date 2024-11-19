from flask import request, jsonify, Flask, render_template
import random
import csv
import pickle
import pandas as pd
import re
from post_generator import generate_posts
from senti import predict_sentiment, generate_word_cloud, emotion_detection
from collab import load_model_and_vectorizer, analyze_csv_data, get_random_images
from content import recommend_posts, load_data, train_word2vec, get_avg_word2vec
import api_logic

app = Flask(__name__)

# Generate random posts (20 posts)
posts = generate_posts(20)


@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')

## Engine Page ##


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
        recommendations = recommend_posts(
            user_input)  # Make sure this is defined

        return render_template('engine.html', recommendations=recommendations)
    # Render engine.html for GET requests
    return render_template('engine.html')

### Sentiments Page ###


@app.route('/sentiments.html', methods=['GET'])
def sentiments():
    return render_template('sentiments.html')


@app.route('/predict', methods=['POST'])
def predict():
    user_input = request.form['text']
    result = predict_sentiment(user_input)
    return jsonify(result)


@app.route('/emotion', methods=['POST'])
def emotion():
    user_input = request.form['text']
    result = emotion_detection(user_input)
    return jsonify(result)


@app.route('/wordcloud', methods=['POST'])
def wordcloud():
    user_input = request.form['text']
    generate_word_cloud(user_input)
    return "Word Cloud Generated", 200


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

## Report Page ##


@app.route('/reports.html', methods=['GET'])
def reports():
    # Load models and vectorizer
    caption_model, hashtag_model, tfidf_vectorizer = load_model_and_vectorizer()

    # Check if models are loaded successfully
    if not all([caption_model, hashtag_model, tfidf_vectorizer]):
        return "Error loading models. Please check the logs."

    # Analyze the input CSV data and get the output
    csv_output = analyze_csv_data(
        caption_model, hashtag_model, tfidf_vectorizer, 'saved_posts.csv', 'predictions.csv')

    # Check if the analysis was successful
    if csv_output is None:
        return "Error processing CSV data. Please check the logs."

    # Generate recommended posts based on predictions
    recommended_posts = [
        {
            "image_url": get_random_images(['https://picsum.photos/200/300' for _ in range(20)], num_images=random.randint(1, 3)),
            "caption": row['predicted_caption'],
            "hashtags": row['predicted_hashtags'],
            # Replace with actual timestamps or fetch dynamically
            "timestamp": "2024-10-15 14:05:41"
        } for _, row in csv_output.iterrows()
    ]

    # Pass the output data to the template
    return render_template('reports.html', recommended_posts=recommended_posts)


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


# Load dataset and train the model
df = load_data()
word2vec_model = train_word2vec(df)

@app.route('/contact.html', methods=['GET', 'POST'])
def index():
    recommended_posts = []
    if request.method == 'POST':
        user_input = request.form.get('user_input', '')
        # Make sure the function to recommend posts is correctly defined and returns the right data structure
        recommended_posts = recommend_posts(user_input, df, word2vec_model)
        return render_template('contact.html', user_input=user_input, recommended_posts=recommended_posts)

    return render_template('contact.html', recommended_posts=recommended_posts)



# Get average Word2Vec embeddings for each post
df['content_embeddings'] = df['tokenized_content'].apply(
    lambda x: get_avg_word2vec(x, word2vec_model))


# API
df5 = pd.read_csv('recommended_content.csv')


@app.route('/api.html')
def api():
    return render_template('api.html')

# Route to fetch post data and sentiments


@app.route('/get_pts')
def get_pts():
    posts = api_logic.generate_posts(df5)
    return jsonify(posts)

# Route to save recommended posts


@app.route('/save_pts', methods=['POST'])
def save_pts():
    post_data = request.json
    api_logic.save_post(post_data)
    return jsonify({'message': 'Post saved successfully!'})

if __name__ == '__main__':
    app.run(debug=True)
