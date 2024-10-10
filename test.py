import requests

url = "https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/index"

querystring = {"url": "https://www.instagram.com/p/C46UwiUvm_D/"}

headers = {
	"x-rapidapi-key": "e068aa06e7mshc2bff1b65d8cf33p1f4bf1jsnd9eef98a8f4f",
	"x-rapidapi-host": "instagram-downloader-download-instagram-videos-stories.p.rapidapi.com"
}

response = requests.get(url, headers=headers, params=querystring)

print(response.json())
