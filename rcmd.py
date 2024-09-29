from flask import Flask, render_template, jsonify, request
import random
import csv
from datetime import datetime

app = Flask(__name__)

# Random post data (could be fetched from a database or API in a real-world app)
posts = [
    {
        "id": 1,
        # Random images from Unsplash
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


@app.route('/')
def index():
    return render_template('admin.html')


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