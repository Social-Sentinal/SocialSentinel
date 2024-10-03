import pickle
import numpy as np
import pandas as pd

class HybridRecommendation:
    def __init__(self, sentiment_model, content_model, collaborative_model):
        self.sentiment_model = sentiment_model
        self.content_model = content_model
        self.collaborative_model = collaborative_model

    def predict(self, user_input):
        # Get sentiment prediction
        sentiment_score = self.sentiment_model.predict([user_input])[0]

        # Get content-based recommendations
        content_recommendations = self.content_model.get_recommendations(
            user_input)

        # Get collaborative recommendations
        collaborative_recommendations = self.collaborative_model.get_recommendations(
            user_input)

        # Combine results (you can use your logic for weighting)
        combined_results = self.combine_recommendations(
            content_recommendations, collaborative_recommendations, sentiment_score)

        return combined_results

    def combine_recommendations(self, content, collaborative, sentiment):
        # Logic to combine content and collaborative recommendations
        combined = pd.concat([content, collaborative])
        # combined['score'] = combined['score'] * \
        #     sentiment  
        return combined.sort_values(by='score', ascending=False).head(10)
