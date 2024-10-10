# import requests
# import pymongo
# from pymongo import MongoClient

# # Instagram scraping API URLs
# info_url = "https://instagram-scraper-api2.p.rapidapi.com/v1/info"
# reels_url = "https://instagram-scraper-api2.p.rapidapi.com/v1.2/reels"
# hashtag_url = "https://instagram-scraper-api2.p.rapidapi.com/v1/hashtag"
# posts_url = "https://instagram-scraper-api2.p.rapidapi.com/v1.2/posts"


# querystring = {"hashtag": "summer"}


# headers = {
# 	"x-rapidapi-key": "e068aa06e7mshc2bff1b65d8cf33p1f4bf1jsnd9eef98a8f4f",
# 	"x-rapidapi-host": "instagram-scraper-api2.p.rapidapi.com"
# }

# # Fetch data from Instagram API
# info_res = requests.get(info_url, headers=headers, params=querystring)
# reels_res = requests.get(reels_url, headers=headers, params=querystring)
# posts_res = requests.get(posts_url, headers=headers, params=querystring)
# hashtag_res = requests.get(hashtag_url, headers=headers, params=querystring)

# # Check if the response is successful
# if all(res.status_code == 200 for res in [info_res, reels_res, posts_res, hashtag_res]):
#     info_data = info_res.json().get('data', {})
#     reels_data = reels_res.json().get('data', {})
#     posts_data = posts_res.json().get('data', [])
#     hashtag_data = hashtag_res.json().get('data', [])

#     # MongoDB connection setup
#     client = MongoClient("mongodb://localhost:27017/")
#     db = client["SocialSentinel"]

#     # Collections for storing different types of data
#     info_collection = db["user_info"]
#     reels_collection = db["reels"]
#     posts_collection = db["posts"]
#     hashtags_collection = db["hashtags"]

#     # Insert 'info' and 'reels' data into MongoDB
#     if info_data:
#         info_collection.insert_one(info_data)
#         print("User info inserted into MongoDB.")

#     if reels_data:
#         reels_collection.insert_one(reels_data)
#         print("Reels data inserted into MongoDB.")

#     # Insert 'posts' data into MongoDB (captions, URLs)
#     for post in posts_data:
#         posts_collection.insert_one({
#             "caption": post.get("caption", ""),
#             "url": post.get("url", "")
#         })
#     print("Posts (captions and URLs) inserted into MongoDB.")

#     # Insert 'hashtags' into MongoDB
#     for hashtag in hashtag_data:
#         hashtags_collection.insert_one({"hashtag": hashtag})
#     print("Hashtags inserted into MongoDB.")

# else:
#     print(
#         f"Failed to retrieve data. Status Codes - Info: {info_res.status_code}, Reels: {reels_res.status_code}, Posts: {posts_res.status_code}, Hashtags: {hashtag_res.status_code}")


import requests
import csv

# # Instagram scraping API URLs
info_url = "https://instagram243.p.rapidapi.com/tagposts_top/paris/%7Bend_cursor%7D/%7Bnext_page%7D"
reels_url = "https://instagram243.p.rapidapi.com/tagposts_top/paris/%7Bend_cursor%7D/%7Bnext_page%7D"
hashtag_url = "https://instagram243.p.rapidapi.com/tagposts_top/paris/%7Bend_cursor%7D/%7Bnext_page%7D"
posts_url = "https://instagram243.p.rapidapi.com/tagposts_top/paris/%7Bend_cursor%7D/%7Bnext_page%7D"

querystring = {"hashtag": "summer"}

# headers = {
# 	"x-rapidapi-key": "e068aa06e7mshc2bff1b65d8cf33p1f4bf1jsnd9eef98a8f4f",
# 	"x-rapidapi-host": "instagram-scraper-api2.p.rapidapi.com"
# }
# url = "https://instagram243.p.rapidapi.com/tagposts_top/paris/%7Bend_cursor%7D/%7Bnext_page%7D"

headers = {
	"x-rapidapi-key": "e068aa06e7mshc2bff1b65d8cf33p1f4bf1jsnd9eef98a8f4f",
	"x-rapidapi-host": "instagram243.p.rapidapi.com"
}

# Fetch data from Instagram API
info_res = requests.get(info_url, headers=headers, params=querystring)
reels_res = requests.get(reels_url, headers=headers, params=querystring)
posts_res = requests.get(posts_url, headers=headers, params=querystring)
hashtag_res = requests.get(hashtag_url, headers=headers, params=querystring)

# Check if the response is successful
if all(res.status_code == 200 for res in [info_res, reels_res, posts_res, hashtag_res]):
    info_data = info_res.json().get('data', {})
    reels_data = reels_res.json().get('data', {})
    posts_data = posts_res.json().get('data', [])
    hashtag_data = hashtag_res.json().get('data', [])

    # Combine the fields into one structure
    # Prepare CSV file with relevant fields for all data types
    with open('result.csv', mode='w', newline='', encoding='utf-8') as file:
        fieldnames = ['type', 'caption', 'url', 'hashtag',
                      'info_field', 'info_value', 'reels_field', 'reels_value']
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()

        # Write 'info' data (if available)
        if info_data:
            for key, value in info_data.items():
                writer.writerow({
                    'type': 'info',
                    'caption': '',
                    'url': '',
                    'hashtag': '',
                    'info_field': key,
                    'info_value': value,
                    'reels_field': '',
                    'reels_value': ''
                })

        # Write 'reels' data (if available)
        if reels_data:
            for key, value in reels_data.items():
                writer.writerow({
                    'type': 'reels',
                    'caption': '',
                    'url': '',
                    'hashtag': '',
                    'info_field': '',
                    'info_value': '',
                    'reels_field': key,
                    'reels_value': value
                })

        # Write 'posts' data (captions, URLs)
        for post in posts_data:
            writer.writerow({
                'type': 'post',
                'caption': post.get("caption", ""),
                'url': post.get("url", ""),
                'hashtag': '',
                'info_field': '',
                'info_value': '',
                'reels_field': '',
                'reels_value': ''
            })

        # Write 'hashtags' data
        for hashtag in hashtag_data:
            writer.writerow({
                'type': 'hashtag',
                'caption': '',
                'url': '',
                'hashtag': hashtag,
                'info_field': '',
                'info_value': '',
                'reels_field': '',
                'reels_value': ''
            })

    print("All data saved to 'result.csv'.")

else:
    print(
        f"Failed to retrieve data. Status Codes - Info: {info_res.status_code}, Reels: {reels_res.status_code}, Posts: {posts_res.status_code}, Hashtags: {hashtag_res.status_code}")
