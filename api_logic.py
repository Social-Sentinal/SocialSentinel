import pandas as pd
from textblob import TextBlob

# Function to get sentiment score using TextBlob (You can replace it with your own logic)


def analyze_sentiment(text):
    analysis = TextBlob(text)
    sentiment = analysis.sentiment.polarity
    if sentiment > 0:
        return "Positive", sentiment
    elif sentiment == 0:
        return "Neutral", sentiment
    else:
        return "Negative", sentiment

# Function to generate posts with sentiment analysis


def generate_posts(df5):
    posts = []
    for index, row in df5.iterrows():
        sentiment, score = analyze_sentiment(row['caption'])

        post = {
            'id': index,
            'caption': row['caption'],
            'sentiment': sentiment,
            'score': round(score, 2),  # Round score to 2 decimal places
            'prediction': 'Likely to engage' if sentiment == 'Positive' else 'Less likely to engage',
            'url': row['url'],  # Replace with your URL column
            'timestamp': row['timestamp']  # Replace with your timestamp column
        }
        posts.append(post)
    return posts

# Function to save recommended post data


def save_pts(post_data):
    recommendation_data = {
        'caption': post_data['caption'],
        'hashtags': post_data['hashtags'],
        'timestamp': post_data['timestamp'],
        'duration': post_data['duration'],
    }

    # Append this to a CSV file for saving recommendations
    recommendations_df = pd.DataFrame([recommendation_data])
    recommendations_df.to_csv('recommended_posts.csv',
                              mode='a', header=False, index=False)
