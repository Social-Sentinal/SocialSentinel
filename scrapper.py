import requests
import pymongo 
from pymongo import MongoClient

url = "https://instagram-scraper-api2.p.rapidapi.com/v1.2/posts"

# all instagram scrapping information
info = "https://instagram-scraper-api2.p.rapidapi.com/v1/info"
# followers = "https://instagram-scraper-api2.p.rapidapi.com/v1/followers"
# post = "https://instagram-scraper-api2.p.rapidapi.com/v1.2/posts"
# reels = "https://instagram-scraper-api2.p.rapidapi.com/v1.2/reels"
# stories = "https://instagram-scraper-api2.p.rapidapi.com/v1/stories"
hastag = "https://instagram-scraper-api2.p.rapidapi.com/v1/hashtag"
# similar_accounts = "https://instagram-scraper-api2.p.rapidapi.com/v1/similar_accounts"
# likes = "https://instagram-scraper-api2.p.rapidapi.com/v1/likes"
# comments = "https://instagram-scraper-api2.p.rapidapi.com/v1/comments"
# about = "https://instagram-scraper-api2.p.rapidapi.com/v1/info_about"

# input from user 
# username = input("Enter the username of the account you want to scrape: ")
# querystring = {"username_or_id_or_url": username}
# captions or sentiments as input
querystring = {"username_or_id_or_url": "virat"}

headers = {
	"x-rapidapi-key": "e068aa06e7mshc2bff1b65d8cf33p1f4bf1jsnd9eef98a8f4f",
	"x-rapidapi-host": "instagram-scraper-api2.p.rapidapi.com"
}

# post_res = requests.get(post, headers=headers, params=querystring)
# store_res = requests.get(stories, headers=headers, params=querystring)
# has_res = requests.get(hastag, headers=headers, params=querystring)
# follo_res = requests.get(followers, headers=headers, params=querystring)
info_res = requests.get(info, headers=headers, params=querystring)
# reels_res = requests.get(reels, headers=headers, params=querystring)
# likes_res = requests.get(likes, headers=headers, params=querystring)
# comments_res = requests.get(comments, headers=headers, params=querystring)
# about_res = requests.get(about, headers=headers, params=querystring)
# sim_res = requests.get(similar_accounts,headers=headers,params=querystring)


print(info_res.json()['data'])['urls']
# client = pymongo.MongoClient("mongodb://localhost:27017/")
# db = client["SocialSentinel"]
# collection = db["reels"]
# collection.insert_one(reels_res.json()['data'])