# ✨ Cosmos Social — AI-Powered Social Universe

Cosmos is a modern, database-backed social platform featuring real-time direct messaging, intelligent hybrid recommendations (content-based TF-IDF + collaborative filtering + serendipity & diversity exploration), instant scikit-learn sentiment analysis, dark/light themes, and dynamic data seeding.

---

## 🌟 Key Features

1. **Intelligent Hybrid Recommendations**:
   - Multi-signal ranking algorithm combining content TF-IDF cosine similarity, collaborative engagement weights (like: 4, save: 5, share: 4, comment: 3), creator affinity, social follow graphs, and recency decay.
   - **Serendipity & Diversity Engine**: Break echo chambers with adjustable exploration sliders and serendipity feeds to surface unexpected, diverse topics.
   - **Explainable AI**: Grounded rationale badges on every post ("🎯 88% Match · Based on your #Astrophysics engagement").

2. **Lightning-Fast Sentiment & Emotion Analysis**:
   - Powered by local Scikit-Learn Random Forest and TF-IDF models (`models/sentiment_model.pkl` + `models/tfidf_vectorizer.pkl`) with lexicon polarity refinement.
   - Zero heavyweight transformer downloads required at runtime.
   - Real-time tone feedback during post authoring and interactive AI Studio inspector.

3. **Direct Messaging & One-Click Post Sharing**:
   - Two-column Direct Messenger with real-time polling, conversation switcher, and user search.
   - One-click "Share to Chat" modal allowing instant sharing of any post into conversation threads with live previews.

4. **Cosmos Communities**:
   - Topic hubs including *Astrophysics & Cosmos*, *AI & Tech*, *Web Dev*, *Creative Arts*, and *Mindfulness*.
   - Instant 1-click Join/Leave with live member and post metrics.

5. **Grounded AI Copilot**:
   - Seamlessly integrates with local Ollama (`llama3.2:3b`) when active, with intelligent grounded fallbacks so queries never crash when offline.

6. **Bulletproof Visuals & Theming**:
   - Inline SVG gradient generator guarantees beautiful avatar and media rendering on any offline or firewalled machine.
   - Sleek Dark and Light themes with persistent user preferences.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Lucide Icons, Vanilla CSS Design System with custom properties and responsive 3-column layout.
- **Backend**: Flask 3, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Limiter, Flask-CORS.
- **Machine Learning**: Scikit-Learn, Joblib, TF-IDF Vectorization, Cosine Similarity, Heuristic Pattern Detection.
- **Database**: SQLite (local development) / PostgreSQL (production).
- **Deployment**: Render-ready (`render.yaml`, `build.sh`, Gunicorn).

---

## 🚀 Quickstart

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Backend Setup
```bash
# Clone and enter directory
cd SocialSentinel

# Create & activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server (database seeds automatically on first launch)
python run.py
```
Backend API will be available at `http://127.0.0.1:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend development server will run at `http://localhost:5173`.

### 3. Production Build
```bash
cd frontend
npm run build
```
The Flask server automatically serves `frontend/dist` as a Single Page Application at `http://127.0.0.1:5000/`.

---

## 🧪 Demo Credentials

The platform automatically seeds rich sample data and a demo user if the database is sparse:
- **Username**: `demo`
- **Password**: `Demo1234!`
- Or simply click **"🚀 Try Demo Account (Cosmos Explorer)"** on the login screen for instant 1-click access!

---

## 📡 API Endpoints

All APIs are prefixed with `/api/v1`:

- **Auth**: `POST /auth/register`, `POST /auth/login`, `POST /auth/demo`, `POST /auth/refresh`
- **User**: `GET /users/me`, `PUT /users/me`, `PUT /users/preferences`, `POST /users/:id/follow`
- **Feed & Posts**: `GET /posts`, `POST /posts`, `GET /recommendations/feed`, `GET /recommendations/serendipity`, `POST /posts/:id/:action` (`like`, `save`, `share`, `view`)
- **Comments**: `GET /posts/:id/comments`, `POST /posts/:id/comments`
- **Communities**: `GET /communities`, `POST /communities/:id/join`, `GET /communities/:slug/posts`
- **Messages**: `GET /conversations`, `POST /conversations`, `GET /conversations/:id/messages`, `POST /conversations/:id/messages`
- **AI & Sentiment**: `POST /sentiment/predict`, `POST /sentiment/emotion`, `POST /ai/ask`, `GET /ai/explain/:id`
- **Analytics**: `GET /analytics/overview`
- **Health**: `GET /health`

---

## ☁️ Deployment

Deployable to **Render** in 1-click using the included `render.yaml`:
1. Connect GitHub repository to Render.
2. Render detects `render.yaml` and executes `bash build.sh`.
3. Health check at `/health` ensures seamless zero-downtime deployments.