## Instagram Caption Recommendation Project

This project uses natural language processing (NLP) techniques to recommend similar Instagram captions based on their content. The project utilizes the TF-IDF vectorizer and cosine similarity to calculate the similarity between captions.

## Requirements
Python 3.x
pandas
NumPy
scikit-learn


## Usage
Replace 'Instagram_data.csv' with the path to your Instagram data CSV file.
Run the code to generate recommendations for each caption.
The recommended captions are stored in the Recommendation column of the data DataFrame.


## Note
This project assumes that the Instagram data CSV file has columns named Hashtags and Caption.
The recommend function returns the 4 most similar captions for each input caption. You can adjust the number of recommendations by modifying the argsort() indexing.