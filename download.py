import requests

url = "https://all-media-downloader.p.rapidapi.com/download"

payload = "-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"url\"\r\n\r\nhttps://www.instagram.com/instagram/?hl=en\r\n-----011000010111000001101001--\r\n\r\n"
headers = {
	"x-rapidapi-key": "e068aa06e7mshc2bff1b65d8cf33p1f4bf1jsnd9eef98a8f4f",
	"x-rapidapi-host": "all-media-downloader.p.rapidapi.com",
	"Content-Type": "multipart/form-data; boundary=---011000010111000001101001"
}

response = requests.post(url, data=payload, headers=headers)

print(response.json())