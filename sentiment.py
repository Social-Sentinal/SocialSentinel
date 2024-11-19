import requests
import csv
import pandas as pd
import random
from datetime import datetime, timedelta

# API details for sentiment analysis
url = "https://text-sentiment-analyzer-api1.p.rapidapi.com/sentiment"
headers = {
    "x-rapidapi-key": "e068aa06e7mshc2bff1b65d8cf33p1f4bf1jsnd9eef98a8f4f",
    "x-rapidapi-host": "text-sentiment-analyzer-api1.p.rapidapi.com",
    "Content-Type": "multipart/form-data; boundary=---011000010111000001101001"
}

# Function to perform sentiment analysis


def get_sentiment_analysis(text):
    payload = (
        "-----011000010111000001101001\r\n"
        f"Content-Disposition: form-data; name=\"text\"\r\n\r\n{text}\r\n"
        "-----011000010111000001101001--\r\n\r\n"
    )
    response = requests.post(url, data=payload, headers=headers)
    return response.json()

# Function to read Instagram content from CSV


def load_content_from_csv(file_name='instagram_results.csv'):
    df = pd.read_csv(file_name)
    return df

# Function to filter content based on sentiment


def filter_content_based_on_sentiment(df, score):
    if score > 0.5:
        # Positive sentiment: Filter for posts with keywords related to positive vibes
        filtered_df = df[df['caption'].str.contains(
            'adventure|explore|happy|freedom|nature', case=False, na=False)]
    elif score == 0.5:
        # Neutral sentiment: Filter for daily life, informative content
        filtered_df = df[df['caption'].str.contains(
            'coffee|morning|food|city', case=False, na=False)]
    else:
        # Negative sentiment: Filter for relaxing, peaceful, uplifting content
        filtered_df = df[df['caption'].str.contains(
            'relax|calm|peace|sunset|serenity', case=False, na=False)]

    return filtered_df

# Function to recommend content


def recommend_content(df, score, num_posts=5):
    filtered_df = filter_content_based_on_sentiment(df, score)
    recommended_posts = filtered_df.sample(
        n=min(num_posts, len(filtered_df)))  # Randomly pick posts
    return recommended_posts

# Function to save recommended content to a new CSV file


def save_recommendations_to_csv(recommended_posts, file_name='recommended_content.csv'):
    recommended_posts.to_csv(file_name, index=False)
    print(f"Recommended content saved to {file_name}")

# Main function to execute the analysis and provide recommendations


def analyze_and_recommend(csv_file='instagram_results.csv', output_file='recommended_content.csv'):
    # Get user input for text to analyze
    user_text = input("Enter the text for sentiment analysis: ")

    # Perform sentiment analysis
    sentiment_result = get_sentiment_analysis(user_text)

    # Extract sentiment and score
    sentiment = sentiment_result.get('sentiment', 'Unknown')
    # Assuming score is normalized between 0 and 1
    score = sentiment_result.get('score', 0.0)

    # Load Instagram content from CSV
    df = load_content_from_csv(csv_file)

    # Recommend Instagram content based on sentiment score
    recommended_posts = recommend_content(df, score)

    # Save recommended posts to a new CSV file
    save_recommendations_to_csv(recommended_posts, output_file)

    # Print the sentiment result and recommended posts
    print(f"Sentiment analysis result: {sentiment_result}")
    print(f"Recommended Instagram posts based on sentiment score ({score}):")
    # Display important columns
    print(recommended_posts[['alt', 'caption', 'url']])


# Run the analysis and recommendation
if __name__ == "__main__":
    analyze_and_recommend()
