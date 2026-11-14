# 🛡️ SocialSentinel — AI-Powered Social Intelligence Network

SocialSentinel is a modern social network featuring real-time AI sentiment & emotion analysis, transparent hybrid recommendation ranking, topic communities, and private direct messaging.

Deployed seamlessly to **Vercel** with a serverless Python Flask API backend and a Vite React frontend.

---

## 🌟 Key Features

1. **Intelligent Hybrid Recommendations**:
   - Multi-signal ranking algorithm combining content TF-IDF cosine similarity, collaborative engagement weights (like: 4, save: 5, share: 4, comment: 3), creator affinity, following graphs, and recency decay.
   - **Diversity & Serendipity Engine**: Prevents echo chambers with an adjustable discovery steerer slider to surface novel, high-signal content.
   - **Explainable AI**: Transparent rationale badges on posts and an AI Copilot explaining feed dynamics.

2. **Zero-Latency Sentiment & Emotion Analysis**:
   - Integrated NLP engine combining TF-IDF model inference with lexicon polarity scoring.
   - Real-time tone preview during post authoring, network-wide sentiment pulse analytics, and interactive AI Studio inspector.
   - Emotion classification across 7 dimensions (`joy`, `curiosity`, `wonder`, `inspiration`, `empathy`, `concern`, `sadness`).

3. **Direct Messaging & Post Sharing**:
   - Dedicated direct messenger with real-time conversations, user search, and one-click post sharing.

4. **Topic Communities & Analytics**:
   - Topic hubs including *AI & Tech*, *Cybersecurity & Privacy*, *Web Engineering*, *Creative Tech & Design*, and *Digital Wellbeing*.
   - Live analytics dashboard displaying user engagement signals, top topics, and network velocity.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Blazing fast client rendering, responsive layout, theme toggle (dark/light), Lucide icons. |
| **Backend API** | Flask 3 + SQLAlchemy | RESTful API with JWT authentication, rate limiting, and modular routing. |
| **NLP & Recommendations** | Scikit-Learn + Heuristic Engine | TF-IDF token cosine similarity, collaborative engagement scoring, and emotion detection. |
| **Deployment** | Vercel Serverless | Python serverless API functions (`/api`) + CDN-hosted static frontend assets. |
| **Testing** | Pytest | Comprehensive API integration test suite. |

---

## 📁 Repository Structure

```
SocialSentinel/
├── api/
│   └── index.py          # Vercel serverless entrypoint for Flask backend
├── backend/
│   ├── routes/           # REST API routes (auth, posts, comments, recommendations, AI)
│   ├── services/         # Recommendation, sentiment, and AI copilot services
│   ├── config.py         # App configuration & database settings
│   ├── extensions.py     # SQLAlchemy, JWT, CORS, Limiter extensions
│   ├── models.py         # Relational data models (User, Post, Community, Interaction)
│   └── __init__.py       # Application factory & database seeding
├── frontend/
│   ├── src/              # React components, pages, styles, and API client
│   ├── index.html        # SPA entry HTML
│   ├── package.json      # Frontend dependencies (React, Vite, Lucide)
│   └── vite.config.js    # Vite build and local development proxy configuration
├── tests/
│   └── test_api.py       # Pytest integration tests
├── requirements.txt      # Optimized Python backend dependencies for Vercel
├── vercel.json           # Vercel deployment and routing configuration
├── package.json          # Root scripts (build, dev, test)
└── run.py                # Local development server runner
```

---

## 🚀 Quickstart

### Prerequisites
- Python 3.11+
- Node.js 18+ (Node.js 20+ recommended)

### 1. Environment Setup

```bash
# Clone the repository
git clone https://github.com/Rohan00kumar/SocialSentinel.git
cd SocialSentinel

# Create and activate a Python virtual environment (optional but recommended)
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install backend dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Run Locally

**Run Backend API**:
```bash
python run.py
```
*API runs at http://localhost:5000*

**Run Frontend Dev Server**:
```bash
npm run dev
```
*Frontend runs at http://localhost:3000 with automatic proxying to backend on port 5000.*

### 3. Run Tests

```bash
pytest
```

---

## ☁️ Deployment on Vercel

SocialSentinel is pre-configured for one-click deployment on **Vercel**:

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/new), import the repository.
3. Vercel automatically detects `vercel.json`:
   - Builds the frontend via `cd frontend && npm install && npm run build` to `frontend/dist`.
   - Provisions the serverless Python runtime for `api/index.py` using `requirements.txt`.
4. Configure any optional environment variables in Vercel project settings:
   - `SECRET_KEY`: Secure random string.
   - `JWT_SECRET_KEY`: Secure random string.
   - `DATABASE_URL`: PostgreSQL connection string (e.g. Supabase, Neon, or Railway PostgreSQL). If omitted, falls back to serverless SQLite.
   - `CORS_ORIGINS`: Allowed origins or `*`.
5. Click **Deploy**.

---

## 📄 License

MIT License.
