import re
import numpy as np
import pandas as pd
import nltk
import pickle
from nltk.corpus import stopwords
from gensim.models import Word2Vec
from sklearn.metrics.pairwise import cosine_similarity
from flask import Flask, jsonify, render_template, request

# Initialize Flask application
app = Flask(__name__)

# Download NLTK stopwords
nltk.download('stopwords')
stop_words = set(stopwords.words('english'))


def clean_text(text):
    text = re.sub(r'http\S+', '', text)  # Remove URLs
    text = re.sub(r'[^a-zA-Z\s]', '', text)  # Remove special characters
    text = text.lower()
    text = ' '.join([word for word in text.split() if word not in stop_words])
    return text


def load_data():
    df = pd.read_csv('D:\Github\SocialSentinel\model\content_with_logic.csv')
    df['content'] = df['Caption'].fillna('') + ' ' + df['Hashtags'].fillna('')
    df['clean_content'] = df['content'].apply(clean_text)
    df['tokenized_content'] = df['clean_content'].apply(lambda x: x.split())
    return df


def train_word2vec(df):
    word2vec_model = Word2Vec(
        sentences=df['tokenized_content'], vector_size=100, window=5, min_count=1, workers=4)
    return word2vec_model


def get_avg_word2vec(tokens, model):
    vectors = [model.wv[word] for word in tokens if word in model.wv]
    return np.mean(vectors, axis=0) if vectors else np.zeros(100)


def recommend_posts(user_input, df, model):
    """Recommend posts based on the user's input."""
    user_input_cleaned = clean_text(user_input)
    input_tokens = user_input_cleaned.split()

    # Get the average Word2Vec embedding for the user input
    user_input_embedding = get_avg_word2vec(input_tokens, model)

    # Calculate cosine similarity with all post embeddings
    cosine_similarities = cosine_similarity(user_input_embedding.reshape(
        1, -1), np.array(df['content_embeddings'].tolist()))

    # Get top 5 recommendations based on cosine similarity
    # Adjust this number for more recommendations
    recommended_post_indices = np.argsort(cosine_similarities[0])[-10:]
    recommended_posts = df.iloc[recommended_post_indices]

    return recommended_posts[['Caption', 'Hashtags']]


# @app.route('/', methods=['GET', 'POST'])
# def index():
#     recommended_posts = []
#     if request.method == 'POST':
#         user_input = request.form.get('user_input', '')
#         recommended_posts = recommend_posts(user_input, df, word2vec_model)
#         return render_template('contact.html', user_input=user_input, recommended_posts=recommended_posts.to_dict(orient='records'))

#     return render_template('contact.html', recommended_posts=recommended_posts)


# # Load dataset and train the model
# df = load_data()
# word2vec_model = train_word2vec(df)

# # Get average Word2Vec embeddings for each post
# df['content_embeddings'] = df['tokenized_content'].apply(
#     lambda x: get_avg_word2vec(x, word2vec_model))

# if __name__ == '__main__':
#     app.run(debug=True)
