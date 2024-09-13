import requests
import pymongo 
from pymongo import MongoClient

url = "https://instagram-scraper-api2.p.rapidapi.com/v1.2/posts"

# all instagram scrapping information
info = "https://instagram-scraper-api2.p.rapidapi.com/v1/info"
followers = "https://instagram-scraper-api2.p.rapidapi.com/v1/followers"
post = "https://instagram-scraper-api2.p.rapidapi.com/v1.2/posts"
reels = "https://instagram-scraper-api2.p.rapidapi.com/v1.2/reels"
stories = "https://instagram-scraper-api2.p.rapidapi.com/v1/stories"
hastag = "https://instagram-scraper-api2.p.rapidapi.com/v1/hashtag"
similar_accounts = "https://instagram-scraper-api2.p.rapidapi.com/v1/similar_accounts"
likes = "https://instagram-scraper-api2.p.rapidapi.com/v1/likes"
comments = "https://instagram-scraper-api2.p.rapidapi.com/v1/comments"
about = "https://instagram-scraper-api2.p.rapidapi.com/v1/info_about"

querystring = {"username_or_id_or_url": "mrbeast"}

headers = {
	"x-rapidapi-key": "e068aa06e7mshc2bff1b65d8cf33p1f4bf1jsnd9eef98a8f4f",
	"x-rapidapi-host": "instagram-scraper-api2.p.rapidapi.com"
}

response = requests.get(about, headers=headers, params=querystring)

print(response.json()['data'])

client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["SocialSentinel"]
collection = db["content"]
collection.insert_one(response.json()['data'])