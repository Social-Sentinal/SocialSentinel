import requests
import pymongo 
from pymongo import MongoClient

url = "https://instagram-scraper-api2.p.rapidapi.com/v1/likes"

querystring = {"code_or_id_or_url": "CxYQJO8xuC6"}

headers = {
	"x-rapidapi-key": "give your api key",
	"x-rapidapi-host": "instagram-scraper-api2.p.rapidapi.com"
}

response = requests.get(url, headers=headers, params=querystring)



client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["SocialSentinel"]
collection = db["Sentiments"]
collection.insert_many(response.json()['data']['items'])