# SocialSentinel: Comprehensive Current-State Codebase Audit

**Date of Audit:** October 2026  
**Audited Target:** [Social-Sentinal/SocialSentinel](https://github.com/Social-Sentinal/SocialSentinel)  
**Evaluator:** Antigravity AI Engineering Assistant

---

## 1. Executive Summary

SocialSentinel was initialized as an AI-powered social networking prototype combining content-based filtering, sentiment analysis, and social interactions. A prior overhaul introduced a dark/light UI design system, SQLite persistence, and heuristic fallbacks for NLP and AI copilot interactions.

However, an exhaustive line-by-line inspection of the backend (`app/`), frontend (`frontend/`), machine learning assets (`models/`), datasets (`data/`), notebooks (`notebooks/`), and configuration reveals substantial architectural, security, and production blockers. The system currently relies on client-side token storage in `localStorage`, lacks Row Level Security (RLS), uses an in-memory rate limiter, uses a toy 98-token TF-IDF model that unpickles with version warnings, and suffers from N+1 query bottlenecks and write contention in the recommendation engine.

This audit documents the exact status of every feature, component, model, dependency, and vulnerability to establish an empirical baseline before beginning the Next.js + Supabase production migration.

---

## 2. Inventory & Feature Implementation Matrix

| Module / Feature | Claimed in README | Actual Implementation Status | Technical Reality in Code |
| :--- | :--- | :--- | :--- |
| **User Sign Up & Login** | ✅ Working | ⚠️ Partially Implemented | Flask JWT with bcrypt passwords. Tokens stored in browser `localStorage`. No email verification, password reset, or OAuth. |
| **Demo Login** | ✅ Working | ✅ Implemented | Dedicated endpoint `POST /api/v1/auth/demo` auto-authenticating the seeded `demo` user. |
| **Session Refresh** | ✅ Working | ⚠️ Insecure | `POST /api/v1/auth/refresh` accepts refresh token from `localStorage`. Prone to XSS token theft. |
| **Profile Management** | ✅ Working | ✅ Implemented | Update bio, display name, avatar URL, and username via `PUT /users/me`. |
| **Follow / Unfollow** | ✅ Working | ✅ Implemented | Database-backed follow toggle in `follows` table with self-follow constraint check. |
| **Post Creation & Deletion**| ✅ Working | ✅ Implemented | Creates post with sentiment/emotion inference. Author-only deletion check in route handler. |
| **Post Editing** | ❌ Not claimed | ⚠️ Partially Implemented | Route `PUT /posts/<id>` exists; frontend lacks an inline edit UI modal. |
| **Likes & Unlikes** | ✅ Working | ✅ Implemented | Database table `likes` with unique constraint `uq_like(user_id, post_id)`. |
| **Saves / Bookmarks** | ✅ Working | ✅ Implemented | Table `saves` with unique constraint `uq_save(user_id, post_id)`. |
| **Comments** | ✅ Working | ⚠️ Partially Implemented | Flat comments only (`Comment` table). Nested replies and threading are missing in schema and UI. |
| **Reposts / Shares** | ✅ Working | ⚠️ Partially Implemented | Recorded in `shares` table, but no true repost feed projection exists. |
| **Hybrid Recommendations**| ✅ Working | ⚠️ Partially Implemented | Scored dynamically across candidates, but wipes and rewrites the `recommendations` table on every query. |
| **Serendipity Explorer** | ✅ Working | ✅ Implemented | `GET /recommendations/serendipity` samples low-engagement topics for discovery. |
| **Sentiment Analysis** | ✅ Working | ⚠️ Compromised Model | Scikit-Learn RandomForest + TF-IDF model loads, but vocabulary is only 98 words; relies heavily on heuristic regex boosts. |
| **Emotion Detection** | ✅ Working | ⚠️ Heuristic Only | Pure regex pattern matching (`EMOTION_PATTERNS`). No neural or statistical emotion model is utilized. |
| **AI Copilot (`/ai/ask`)**| ✅ Working | ⚠️ Hybrid / Fallback | Attempts local Ollama at `localhost:11434`; falls back to deterministic rule-based strings. |
| **Direct Messaging** | ✅ Working | ⚠️ Polling Only | REST polling on `GET /conversations/<id>/messages`. No live WebSockets or Supabase Realtime. |
| **Post Sharing to Chat** | ✅ Working | ✅ Implemented | `Message.shared_post_id` foreign key renders preview cards inside conversation threads. |
| **Communities** | ✅ Working | ✅ Implemented | Table `communities` with join/leave and filtered topic feed. |
| **Reporting & Moderation** | ❌ Missing | ❌ Mock / Skeleton | `Report` table exists in `models.py`, but has zero API routes, no admin review queue, and no mute/block controls. |
| **Search** | ✅ Working | ⚠️ Basic SQL ILIKE | Substring match on username, display name, caption, and hashtags. No full-text search indexing. |
| **Analytics Dashboard** | ✅ Working | ✅ Implemented | Aggregates user interaction counts, event categories, and topic distributions. |

---

## 3. Deep Dive: Machine Learning & Recommendation Audit

### 3.1 Sentiment Model (`models/sentiment_model.pkl`) & Vectorizer (`models/tfidf_vectorizer.pkl`)
- **Inspection Result:**
  - **Estimator Class:** `sklearn.ensemble._forest.RandomForestClassifier` (100 trees, `max_depth=None`).
  - **Vectorizer Class:** `sklearn.feature_extraction.text.TfidfVectorizer`.
  - **Pickle Compatibility Warning:** Pickled using Scikit-Learn `1.3.1`. When unpickled in modern environments (`>= 1.4` or `1.9.0`), Python raises `InconsistentVersionWarning`.
  - **Vocabulary Size:** Exactly **98 tokens** (e.g., `['feeling', 'blessed', 'travel', 'goals', 'adventure', 'healthy', 'living', 'love', 'this', ...]`).
  - **Inference Failure Mode:** Because the vocabulary has only 98 tokens, real-world social media inputs (such as *"The latency on this API is unacceptable"* or *"This cybersecurity framework is groundbreaking"*) generate all-zero feature vectors.
  - **Raw Prediction Behavior:** The model returns unnormalized vote counts (e.g., `[6.5, 156.43, 29.69]`), heavily biased toward `"Neutral"`.
  - **Workaround in Code:** `app/services/sentiment_service.py` was forced to inject a manual lexicon dictionary (`POSITIVE_WORDS` and `NEGATIVE_WORDS`) and an override formula (`boost = 0.45 * (pos_count - neg_count)`) to prevent almost all text from being classified as Neutral.

### 3.2 Emotion Detection (`app/services/sentiment_service.py:emotion_detection`)
- The repository contains no pickled emotion model.
- Emotion detection is 100% regex-based heuristic mapping across 7 keys: `joy`, `wonder`, `curiosity`, `inspiration`, `empathy`, `sadness`, `concern`.
- If no keyword matches, it returns a static fallback (`emotion: "curiosity", confidence: 0.68`).

### 3.3 Recommendation Algorithm (`app/services/recommendation_service.py`)
- **Signals Combined:**
  1. Content token cosine similarity: `c_sim = len(pref_tokens & post_tokens) / sqrt(...)`
  2. Topic alignment: `t_score = topic_weights[p.topic_category] / max_topic_w`
  3. Creator affinity: `cr_score = creator_weights[p.author_id] / max_creator_w`
  4. Follow graph: `social_score = 1.0 if p.author_id in following_ids else 0.0`
  5. Exponential freshness decay: `freshness = exp(-age_days / 10)`
  6. Global engagement log volume: `engagement = min(1.0, log1p(2*likes + 3*comments + 2*saves) / 8)`
  7. Diversity & Serendipity exploration: `expl * random.uniform(0.05, 0.25)`
- **Architectural Bottlenecks Identified:**
  - Candidates are loaded into Python memory via `Post.query.order_by(Post.created_at.desc()).limit(250).all()`.
  - On line 167 of `recommendation_service.py`:
    ```python
    Recommendation.query.filter_by(user_id=user_id).delete()
    for item in selected:
        db.session.add(Recommendation(...))
    db.session.commit()
    ```
    This deletes and re-inserts recommendation records on every single feed fetch, creating severe database lock contention and latency spikes.

---

## 4. Database & Schema Deficiencies

The existing SQLite schema in `app/models.py` contains 17 models:
1. `User` (integer ID, bcrypt hash, username, email)
2. `UserPreference` (foreign key to `users.id`)
3. `Post` (integer ID, foreign key to `users.id`)
4. `Like`, `Save`, `Share`
5. `Follow` (follower_id, following_id)
6. `Comment` (flat structure, no nested replies)
7. `Interaction` (telemetry events: view, skip, like, etc.)
8. `Recommendation` (cached scores and reasons)
9. `Notification` (read status, actor_id, type)
10. `Conversation`, `ConversationMember`, `Message`
11. `Community`, `CommunityMember`
12. `AIInsight`, `ModelVersion`, `Report`, `SearchHistory`

### Identified Deficiencies:
1. **Integer Primary Keys:** Uses auto-increment integers (`SERIAL` / `INTEGER PRIMARY KEY`), which will break when federating with Supabase Auth (where `auth.users.id` is a `UUID`).
2. **Absence of Row Level Security (RLS):** SQLite has no concept of RLS. All data access filtering is currently performed in application-layer Python code.
3. **N+1 Query Cascades:** In `Post.counts()` (lines 55–56 of `models.py`):
   ```python
   def counts(self):
       return {
           "likes": Like.query.filter_by(post_id=self.id).count(),
           "comments": Comment.query.filter_by(post_id=self.id).count(),
           "saves": Save.query.filter_by(post_id=self.id).count(),
           "shares": Share.query.filter_by(post_id=self.id).count(),
           "views": Interaction.query.filter_by(post_id=self.id, event_type="view").count()
       }
   ```
   For a feed of 20 posts, this executes **100 independent SQL COUNT queries**, causing major performance degradation.
4. **Missing Relational Tables:**
   - No `bookmarks` table (named `saves`).
   - No `reposts` table with timeline projection.
   - No `post_media` table for multiple attachments or video metadata.
   - No `hashtags` and `post_hashtags` normalized junction tables (hashtags are stored as unstructured text in `posts.hashtags`).
   - No `blocked_users` or `muted_users` tables.
   - No `moderation_actions` table for tracking moderator decisions.

---

## 5. Security Vulnerability Assessment

1. **Token Storage in `localStorage`:**
   - In `frontend/src/services/api.js`:
     ```javascript
     let access = localStorage.getItem('cosmos_access') || localStorage.getItem('ss_access');
     ```
   - Tokens stored in `localStorage` are fully accessible to any third-party script, browser extension, or XSS payload.
2. **Weak JWT Secret Fallback:**
   - In `app/config.py`:
     ```python
     JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-key-change-me")
     ```
   - If an operator does not set `JWT_SECRET_KEY`, the application defaults to an 18-byte weak key that triggers `InsecureKeyLengthWarning` and is trivial to forge.
3. **In-Memory Rate Limiter:**
   - `Flask-Limiter` runs with memory backend (`memory://`). In any serverless or multi-worker deployment (e.g., Gunicorn with 4 workers), each worker maintains an isolated counter, allowing rate limit bypasses.
4. **Permissive CORS:**
   - `CORS_ORIGINS=*` is set in `.env.example`, allowing any origin to trigger requests if credentials are sent.
5. **Direct User ID Trust:**
   - Several endpoints accept `user_id` parameters without cross-verifying whether the acting user is authorized to perform mutations on behalf of that user.

---

## 6. Build & Test Verification

- **Backend Pytest Suite:**
  - Command: `python -m pytest tests`
  - Result: **3 passed, 15 warnings** (11.54s).
  - Warnings identified: Flask-Limiter in-memory warning, JWT key length < 32 bytes, and SQLAlchemy 2.0 legacy `Query.get()` deprecations.
- **Frontend Vite Build:**
  - Command: `npm run build` in `frontend/`
  - Result: **Passed** (1484 modules transformed, 11.67s, dist size: 206 kB JS, 17 kB CSS).

---

## 7. Migration Conclusions

To meet the requirements of a production-oriented AI social network deployed to Vercel and Supabase:
1. **Frontend & App Layer:** Must migrate to a unified **Next.js App Router (TypeScript)** modular monolith with Server Components, Server Actions, Route Handlers, Tailwind CSS, Lucide icons, and `@supabase/ssr` with secure HTTP-only cookies.
2. **Database:** Must migrate to **Supabase PostgreSQL** with complete UUID primary keys, normalized schema, PostgreSQL triggers for instant counters (eliminating N+1 queries), and complete Row Level Security (RLS) policies.
3. **AI & ML Layer:** Provide a native, high-performance, zero-external-dependency TypeScript NLP implementation of TF-IDF, Sentiment, and Emotion detection for zero-latency Vercel execution, while retaining the Python microservice as an optional standalone inference engine.
4. **Safety & Moderation:** Introduce database-enforced blocking, muting, reporting, and moderation queues.
