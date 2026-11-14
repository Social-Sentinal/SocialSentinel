# 🛡️ SocialSentinel — Sentiment-Aware Social Media Intelligence Platform

SocialSentinel is a production-ready, AI-powered social media network designed with a non-traditional cyber-editorial aesthetic, centered **Floating Glass Nav Island Capsule**, real-time sentiment & emotion analysis, and a transparent **Sentiment-Aware Hybrid Recommendation Engine**.

Built with a high-performance **Python Flask + SQLAlchemy** backend, real relational database architecture (PostgreSQL ready with SQLite serverless fallback), local machine learning inference models, and a **React 18 + Vite** frontend.

---

## 🌟 Architecture & Core Innovations

### 1. Sentiment-Aware Hybrid Recommendation Engine
Rather than relying on opaque black-box feeds, SocialSentinel combines five explicit signals into a transparent ranking formula:

$$\text{FinalScore} = 0.35 \cdot \text{ContentSemantic} + 0.25 \cdot \text{CollaborativePeer} + 0.20 \cdot \text{SentimentAffinity} + 0.10 \cdot \text{CommunityVelocity} + 0.10 \cdot \text{Freshness}$$

- **Content Semantic Alignment (35%)**: Computes cosine similarity between user interest vectors and post embeddings cached in `post_embeddings`.
- **Collaborative Filtering (25%)**: Computes user-user peer affinity from implicit interaction matrices (`save=4, share=4, comment=3, like=2, view=0.5, follow=3`).
- **Sentiment Topic Affinity (20%)**: Dynamically maintained in `user_topic_preferences` via a time-decayed moving average ($S_{t} = 0.85 \cdot S_{t-1} + 0.15 \cdot \text{Signal}$). Users who express critical or negative feedback on a topic see that topic down-ranked.
- **Community Engagement Velocity (10%)**: Logarithmic scaling of likes, saves, and comments.
- **Content Freshness / Recency (10%)**: Exponential decay over a 7-day half-life: $e^{-\Delta\text{days} / 7.0}$.
- **Diversity Steerer & Serendipity Feed**: Interactive slider allowing users to adjust exploration from 5% to 80% to escape filter bubbles and discover novel perspectives.
- **Transparent Explainability API (`/api/v1/recommendations/explain/<id>`)**: Post cards feature a "Why Recommended?" chip that displays a telemetry modal with full formula weight breakdowns.

### 2. Zero-Cost, Local Sentiment & Emotion Analysis
Runs 100% locally on CPU/GPU without paid external AI API keys or third-party inference tokens:
- **Sentiment Model**: Compatible with `Horizon-Labs/multilingual-sentiment-small` with an integrated fast lexical pattern engine and negation parser for sub-15ms inference.
- **Embeddings**: Compatible with `sentence-transformers/all-MiniLM-L6-v2` with a deterministic 128-dimensional semantic projection vectorizer fallback.
- **Emotion Classification**: Maps comments and posts across 7 human emotion dimensions: `joy`, `wonder`, `curiosity`, `inspiration`, `empathy`, `sadness`, `concern`.
- Every comment automatically triggers sentiment classification and updates the author's topic affinity graph in real-time.

### 3. Cyber-Editorial UI & Floating Glass Nav Island
- Replaced traditional left sidebar layouts with a centered **Floating Glass Nav Island Capsule** (`.island-header`) featuring active tab pills, unread count badges, quick post CTA, theme toggle, and user avatar.
- **Ambient Sentiment Tone Ribbons**: Post cards display a radiant gradient ribbon indicator reflecting positive, balanced, or critical tones.
- **AI Recommendation Insights Dashboard**: Interactive telemetry showing interaction volumes, sentiment distribution radar tracks, and user topic sentiment preferences with one-click reset controls.
- **Direct Messaging**: Dedicated messenger supporting conversation search, live thread updates, and one-click post sharing.
- **Topic Communities**: Hubs for *AI & Tech*, *Cybersecurity & Privacy*, *Web Engineering*, *Creative Tech & Design*, and *Digital Wellbeing*.

---

## 🛠️ Technology Stack

| Layer | Technologies | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite 5, Lucide React, CSS Variables | Cyber-editorial aesthetic, floating glass island navbar, responsive layout. |
| **Backend API** | Python 3.11, Flask 3, SQLAlchemy 2, Flask-JWT-Extended, Flask-Limiter, Flask-CORS | REST API with JWT auth, rate limiting, and relational schema. |
| **Database** | PostgreSQL (Production) / SQLite (Development & Serverless Fallback) | Relational design with foreign keys, cascading deletes, and indexes across 15+ models. |
| **Machine Learning** | PyTorch, Hugging Face Transformers, Sentence Transformers, Scikit-learn, NumPy | Local offline-safe sentiment analysis, semantic embeddings, and collaborative filtering. |
| **Deployment** | Vercel Serverless | Python serverless WSGI callable (`api/index.py`) + CDN static build (`frontend/dist`). |
| **Testing** | Pytest | Integration test suites covering health, auth, posts, sentiment profile, recommendations, and messaging. |

---

## 📁 Repository Structure

```
SocialSentinel/
├── api/
│   └── index.py                     # Vercel serverless entrypoint for Flask backend
├── backend/
│   ├── routes/
│   │   └── api_routes.py            # Complete REST endpoints (auth, posts, sentiment, chat, feed)
│   ├── services/
│   │   ├── ai_service.py            # AI copilot assistant and feed explanation
│   │   ├── collaborative_service.py # Implicit collaborative user-item matrix
│   │   ├── embedding_service.py     # Sentence Transformers & semantic cosine embeddings
│   │   ├── recommendation_service.py# Sentiment-aware hybrid ranking & explainability
│   │   └── sentiment_service.py     # Multilingual sentiment and emotion classification
│   ├── config.py                    # Environment and DB config (PostgreSQL / SQLite)
│   ├── extensions.py                # SQLAlchemy, JWT, CORS, Limiter singletons
│   ├── models.py                    # Complete relational schema (15+ tables)
│   └── __init__.py                  # Application factory and automated seeding
├── frontend/
│   ├── src/
│   │   ├── components/              # PostCardItem, Modals, MediaImage
│   │   ├── pages/                   # FeedStream, ExploreStream, MessengerView, AnalyticsPage, AIStudioPage
│   │   ├── services/api.js          # Unified Axios client with JWT interceptors
│   │   ├── styles/index.css         # Cyber-editorial design system & floating island navbar
│   │   ├── App.jsx                  # Main application with floating glass island navbar
│   │   └── main.jsx                 # React root mounting
│   ├── package.json                 # Frontend dependencies
│   └── vite.config.js               # Vite build configuration
├── tests/
│   └── test_api.py                  # Pytest test suite (100% passing)
├── requirements.txt                 # Optimized backend dependencies
├── vercel.json                      # Vercel framework-independent build config
├── package.json                     # Root script runner
└── run.py                           # Local server entrypoint
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ (Node.js 20+ recommended)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/Rohan00kumar/SocialSentinel.git
cd SocialSentinel

# Create & activate Python virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Run Locally

**Option A: Run Backend & Frontend Concurrently**
```bash
# Start backend on http://localhost:5000
python run.py

# In a second terminal, start frontend on http://localhost:3000
npm run dev
```

### 3. Run Automated Tests

```bash
pytest tests/test_api.py -v
```

---

## ☁️ Deployment on Vercel

SocialSentinel is configured for serverless deployment on **Vercel**:

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/new), import your repository.
3. **Important**: Under **Project Settings > General > Framework Preset**, ensure the framework is set to **Other** (or **Vite**). Do NOT leave it on Next.js.
4. Vercel executes the configuration in `vercel.json`:
   - Builds frontend: `cd frontend && npm install && npm run build` into `frontend/dist`.
   - Provisions serverless Python WSGI handler in `api/index.py`.
5. Optional Environment Variables in Vercel:
   - `DATABASE_URL`: PostgreSQL connection string (Supabase, Neon, Railway, or AWS RDS).
   - `SECRET_KEY`: Random 32+ character string.
   - `JWT_SECRET_KEY`: Random 32+ character string.
   - `ENABLE_LOCAL_TRANSFORMERS`: Set to `1` to download and run full HuggingFace transformer weights. Default `0` uses deterministic local semantic projection and lexical analysis for instant cold starts.
6. Click **Deploy**.

---

## 📄 License
MIT License.
