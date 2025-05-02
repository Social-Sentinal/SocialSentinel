# 📊 Sentiments-Based Recommendation System for Instagram

A Flask-based web application that leverages **AI, NLP, and ML models** to generate, analyze, and recommend optimized social media content such as captions, hashtags, and post layouts.

---

## 🚀 Project Description

This project is a smart content generation and analysis platform designed for social media managers, marketers, and content creators. It combines natural language processing, sentiment analysis, and machine learning to help users:

* Generate engaging posts
* Analyze emotional tone
* Predict sentiment
* Recommend better content
* Store user interactions for optimization

The system is modular, interactive, and scalable — capable of API integration, CSV analysis, and visual output like word clouds.

---

## ✅ Core Functionalities

### 🔹 Post Generation

* Automatically generates 20 randomized posts using pre-defined templates or logic.
* Each post includes a caption, hashtags, and timestamp.

### 🔹 User Interaction Logging

* Captures how long a user views a post.
* Saves interactions (caption, hashtag, timestamp, duration) to a `CSV`.

### 🔹 Recommendation Engine

* Suggests new content based on:

  * User input (keywords or sentence)
  * Word2Vec semantic similarity
  * Saved post engagement

### 🔹 Sentiment & Emotion Analysis

* Predicts sentiment (positive, neutral, negative) using a trained **Random Forest** model.
* Detects emotions (happy, sad, angry, etc.) from text.
* Option to generate a **word cloud** from user input.

### 🔹 Report Generation

* Analyzes saved post data (`saved_posts.csv`) to:

  * Predict improved captions and hashtags using ML models.
  * Display AI-generated post recommendations.

### 🔹 API Support

* `/get_pts`: Generates post data from pre-analyzed CSV.
* `/save_pts`: Saves recommended post data via API for integrations.


