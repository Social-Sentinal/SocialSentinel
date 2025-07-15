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

### 🔹 Flow Chart
<img width="12880" height="6448" alt="SocialSentinel" src="https://github.com/user-attachments/assets/553bad9f-8955-4ea2-8b78-1b6d8ed37269" />

### 🔹 Fronted UI
<img width="1920" height="1020" alt="home" src="https://github.com/user-attachments/assets/6b07b83d-e152-4e8b-9558-724e39609e3d" />
<img width="1920" height="1020" alt="enginr" src="https://github.com/user-attachments/assets/53aae66a-4dc0-4f66-8e83-4f4dea303080" />




