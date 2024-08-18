import requests

url = "https://text-sentiment-analyzer-api1.p.rapidapi.com/sentiment"

payload = "-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"text\"\r\n\r\n I am very busy but my surrounding is very clean and peace \r\n-----011000010111000001101001--\r\n\r\n"
headers = {
	"x-rapidapi-key": "give your api key",
	"x-rapidapi-host": "text-sentiment-analyzer-api1.p.rapidapi.com",
	"Content-Type": "multipart/form-data; boundary=---011000010111000001101001"
}

response = requests.post(url, data=payload, headers=headers)

print(response.json())