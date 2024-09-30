import requests
from pymongo import MongoClient

mongo_client = MongoClient('mongodb://localhost:27017/')
db = mongo_client['SocialSentinel']
collection = db['Sentiment']

# API details
url = "https://text-sentiment-analyzer-api1.p.rapidapi.com/sentiment"
payload = (
    "-----011000010111000001101001\r\n"
    "Content-Disposition: form-data; name=\"text\"\r\n\r\n"
    "I am very busy but my surrounding is very clean and peace\r\n"
    "-----011000010111000001101001--\r\n\r\n"
)

headers = {
	"x-rapidapi-key": "e068aa06e7mshc2bff1b65d8cf33p1f4bf1jsnd9eef98a8f4f",
	"x-rapidapi-host": "text-sentiment-analyzer-api1.p.rapidapi.com",
	"Content-Type": "multipart/form-data; boundary=---011000010111000001101001"
}

# Perform sentiment analysis
response = requests.post(url, data=payload, headers=headers)
sentiment_result = response.json()

# Parse sentiment result (adjust keys based on actual response structure)
sentiment = sentiment_result.get('sentiment', 'Unknown')
score = sentiment_result.get('score', None)

# Data to store in MongoDB
data = {
    'text': "I am very busy but my surrounding is very clean and peace",
    'sentiment': sentiment,
    'score': score
}

# Insert data into MongoDB
collection.insert_one(data)

# Print the response and confirmation
print("Sentiment analysis result:", sentiment_result)
print("Data inserted into MongoDB successfully.")