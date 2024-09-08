## Instagram Photo Recommendation System

This script uses the Instagram API to build a photo recommendation system. It analyzes the user's liked photos, their friends' photos, and the hashtags used in those photos to provide personalized recommendations.

## Requirements
Instagram API credentials (username and password)
Python 3.x
Required libraries: InstagramAPI, pandas, tqdm, numpy, datetime, networkx, re, matplotlib


## Usage
Replace login and password with your Instagram API credentials.
Run the script to generate recommendations.
The script will print the top 10 recommended photos and their corresponding URLs.
The script will also generate two bar charts: one for the top 10 recommended photos and one for the top 10 recommended hashtags.


## How it Works
The script logs in to the Instagram API using the provided credentials.
It retrieves the user's liked photos and their friends' photos.
It builds a graph of the user's social network using the networkx library.
It calculates a personalized PageRank score for each user in the graph.
It retrieves the photos from each user in the graph and calculates a score for each photo based on its likes, comments, and timestamp.
It recommends the top 10 photos with the highest scores.
It also recommends the top 10 hashtags used in the user's liked photos.


## Notes
This script is for educational purposes only and should not be used for commercial purposes without Instagram's permission.
The script may take some time to run due to the API rate limits.
The script assumes that the user has a public Instagram account. If the user has a private account, the script may not work as expected.