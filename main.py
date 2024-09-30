from flask import Flask, request, render_template
import pickle
from hybrid import HybridRecommendation
app = Flask(__name__)

# Load your models from .pkl files
with open('D:\Github\SocialSentinel\model\sentiment_model.pkl', 'rb') as f:
    sentiment_model = pickle.load(f)

with open('D:\Github\SocialSentinel\model\content.pkl', 'rb') as f:
    content_model = pickle.load(f)

with open('D:\Github\SocialSentinel\model\collaborative_filtering_model.pkl', 'rb') as f:
    collaborative_model = pickle.load(f)

# Initialize the hybrid recommender
hybrid_recommender = HybridRecommendation(
    sentiment_model, content_model, collaborative_model)


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/recommend', methods=['POST'])
def recommend():
    user_input = request.form['user_input']  # Get user input from the form
    recommendations = hybrid_recommender.predict(user_input)

    # Extract required fields for query params
    query_params = {
        "captions": recommendations['captions'].tolist(),
        "hashtags": recommendations['hashtags'].tolist()
    }

    # Fetch real-time URLs
    urls = fetch_real_time_urls(query_params)

    return render_template('reports.html', recommendations=recommendations, urls=urls)


if __name__ == '__main__':
    app.run(debug=True)
