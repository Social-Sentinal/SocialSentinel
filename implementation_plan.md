# SocialSentinel Platform - Complete Overhaul & Production Upgrade

Transform the project into **SocialSentinel**, a modern, vibrant, AI-powered social media network with real-time direct messaging, intelligent hybrid recommendations (content-based + collaborative + serendipity & diversity), reliable sentiment analysis, dark/light themes, dynamic data seeding, and production deployment readiness.

## User Review Required

> [!IMPORTANT]
>
> - **Branding & Identity**: Transition all references from "SocialSentinel" to **SocialSentinel** (SocialSentinel), featuring a futuristic galaxy/star logo mark and modern typography.
> - **Model Execution**: Connect local scikit-learn models (`sentiment_model.pkl` + `tfidf_vectorizer.pkl`) as the primary lightning-fast sentiment engine, with zero external HuggingFace/Ollama runtime crashes.
> - **Real-Time Direct Messaging & Sharing**: Provide a dedicated messenger view with active conversation list, user search, live messaging with auto-refresh, and one-click "Share to Chat" from any post.
> - **Dynamic Data Seeding**: Automatically populate initial rich users, posts, topics, and interactions from `content_with_logic.csv` and `collaborative.csv` when database is sparse so the platform is immediately active and testable.
> - **Git & Deployment**: Cleanly stage git deletions of legacy exoplanet files, add the new Cosmos web platform files, commit, push to GitHub, and update `render.yaml` and `build.sh`.

---

## Key Problems Identified & Target Fixes

1. **Page Load & Broken Dependencies**:
   - `FeedPage.jsx` and other components tried to import non-existent named exports from `services/api.js`.
   - Database had only 1 post and 1 user, causing empty states everywhere.
   - Images failed on external systems due to hardcoded Unsplash links with no fallback.
2. **Theme System (Light & Dark)**:
   - Hardcoded light pinks, broken contrast, unstyled cards in dark mode.
   - Unified CSS custom properties (`--bg-primary`, `--bg-card`, `--bg-elevated`, `--text-primary`, `--text-secondary`, `--border-color`, `--accent-primary`, etc.) with seamless toggle.
3. **Text & Icon Sizing**:
   - Fonts were 10-12px and icons were 14-16px.
   - Elevate body fonts to 15-16px, headings to 24-34px, navigation and action icons to 20-24px, and expand touch/click targets to 42-48px.
4. **Main Logo & Irrelevant Legacy Clean-up**:
   - Replace "SocialSentinel" branding across frontend (`Navbar`, `App`, `Auth`, `index.html`) and backend (`app/__init__.py`, `api_routes.py`, `render.yaml`).
   - Clean up deleted exoplanet files from git tracking.
5. **Organized Social Media Layout**:
   - Left Sidebar Rail: Cosmos brand, Home Feed, Explore, Messages (with live unread badge), Communities, AI Studio, Analytics, Profile, Create Post, Theme Toggle, User status.
   - Central Feed / Active View: Quick composer, filter pills (For You, Following, Trending, Topics), rich posts.
   - Right Sidebar: Serendipity & Diversity explorer, Suggested Communities/Groups with Join button, Trending Hashtags, Top Creators to follow.
6. **AI Features & Recommendation Models**:
   - Sentiment & Emotion: Use `models/sentiment_model.pkl` + `tfidf_vectorizer.pkl` with fast heuristics fallback.
   - Recommendations: Hybrid scoring combining content TF-IDF similarity, collaborative user interaction history, creator affinity, freshness, and diversity/serendipity exploration.
   - Recommendation Justification: Clear badge and explainability on every post (e.g. "🎯 85% Match · Based on your #AI engagement").
   - AI Copilot: Instant, grounded responses without crashing if Ollama is absent.
7. **Direct Messaging & Post Sharing**:
   - Dedicated Chat Interface with conversation list, recipient selector, chat history, and periodic live polling.
   - Direct Post Share: Share modal on every post allowing instant sharing into any chat conversation with preview.
8. **Communities & Groups**:
   - Groups/Communities system (AI & Tech, Astrophysics & Cosmos, Web Dev, Creative Arts, Wellness) with join/leave and filtered posts.
9. **Advanced AI Features in Sidebar** (Future Scope):
   - **AI-Generated Post Creation**: Users can generate post content (text + image suggestions) using AI.
   - **Community Trend Analysis**: AI analyzes community posts to surface rising topics and discussions.
   - **Personalized AI Insights**: AI provides personalized tips and suggestions based on user activity.
   - **Community Health Monitoring**: AI monitors community sentiment and engagement levels.
   - **AI-Powered Moderation**: AI helps identify and flag inappropriate content.
10. **Performance Optimization**:

- Optimize database queries for better performance.
- Implement caching for frequently accessed data.
- Optimize API endpoints for better performance.

---

## Proposed Changes

### Backend (`app/`)

#### [MODIFY] [app/services/sentiment_service.py](file:///d:/My%20Projects/HPX/Cosmos_web/app/services/sentiment_service.py)

- Load `models/sentiment_model.pkl` and `models/tfidf_vectorizer.pkl` using `joblib`.
- Perform instantaneous predictions for `Positive`, `Neutral`, `Negative` with probability confidence.
- Provide reliable emotion detection heuristics (Joy, Curiosity, Inspiration, Wonder, Empathy) with zero dependency on heavy transformer downloads.

#### [MODIFY] [app/services/recommendation_service.py](file:///d:/My%20Projects/HPX/Cosmos_web/app/services/recommendation_service.py)

- Implement hybrid recommendation engine combining:
  - Content-based TF-IDF cosine similarity.
  - Collaborative filtering engagement weights (`like`: 4, `save`: 5, `share`: 4, `comment`: 3).
  - Creator affinity and follow signals.
  - Serendipity & Diversity boost (exploration factor to surface unexpected, diverse topics).
- Return structured, justified outputs with human-readable rationale badges.

#### [MODIFY] [app/services/ai_service.py](file:///d:/My%20Projects/HPX/Cosmos_web/app/services/ai_service.py)

- Support local Ollama when available, with a smart, grounded Cosmos AI copilot fallback when Ollama is offline so queries never crash.

#### [MODIFY] [app/routes/api_routes.py](file:///d:/My%20Projects/HPX/Cosmos_web/app/routes/api_routes.py)

- Add `/communities` endpoints (list, join, leave, get community posts).
- Enhance `/conversations` and `/conversations/<id>/messages` with post sharing attachment payload (`shared_post_id`).
- Add `/recommendations/serendipity` endpoint for diverse discovery.
- Update branding and response payloads.

#### [MODIFY] [app/**init**.py](file:///d:/My%20Projects/HPX/Cosmos_web/app/__init__.py)

- Update branding to Cosmos.
- Enhance `seed_database()` to automatically import real posts and creators from `data/content_with_logic.csv` and `data/collaborative.csv` if the database has fewer than 10 posts.

---

### Frontend (`frontend/`)

#### [MODIFY] [frontend/index.html](file:///d:/My%20Projects/HPX/Cosmos_web/frontend/index.html)

- Change title to `Cosmos · AI-Powered Social Universe`.
- Update meta tags, favicon, and theme color.

#### [MODIFY] [frontend/src/styles/index.css](file:///d:/My%20Projects/HPX/Cosmos_web/frontend/src/styles/index.css)

- Implement a comprehensive CSS design system:
  - CSS variables for Light and Dark themes.
  - Generous typography scale (body 15-16px, headings 20-34px, icons 20-24px).
  - High-contrast, glassmorphism cards, glowing accents, smooth micro-interactions.
  - Responsive layout for desktop (3-column), tablet (2-column), and mobile (bottom navigation).

#### [MODIFY] [frontend/src/services/api.js](file:///d:/My%20Projects/HPX/Cosmos_web/frontend/src/services/api.js)

- Provide all necessary API methods: `auth`, `me`, `updateUser`, `feed`, `search`, `post`, `action`, `comments`, `comment`, `analytics`, `notifications`, `ask`, `explain`, `conversations`, `createConversation`, `messages`, `sendMessage`, `communities`, `joinCommunity`, `serendipityFeed`.
- Support guest / demo login for immediate testing.

#### [MODIFY] [frontend/src/App.jsx](file:///d:/My%20Projects/HPX/Cosmos_web/frontend/src/App.jsx)

- Redesign into a full-featured, responsive social media platform:
  - **Left Navigation**: Cosmos Logo (`✨ COSMOS`), Home Feed, Explore, Messages (with live unread badge), Communities, AI Studio, Analytics, Profile, "+ Create Post", Theme Toggle, User Card.
  - **Main View**:
    - **Feed**: Post composer with live sentiment preview, category pills (All, AI & Tech, Cosmos, Creative, Mindfulness), post stream with Like/Save/Comment/Share-to-Chat, recommendation justification badges ("Why this post?").
    - **Messages**: Two-column direct messaging interface (Conversation list + Live chat window with polling, message timestamps, post preview card for shared posts).
    - **Explore**: Search posts, creators, hashtags with instant filtering.
    - **Communities**: Browse and join topic communities with active member counts.
    - **AI Studio**: Sentiment analyzer, emotion radar, and AI Copilot.
    - **Analytics**: Personal engagement stats, sentiment breakdown, topic distribution.
    - **Profile**: Avatar, follower stats, bio editor, user's created posts.
  - **Right Sidebar**:
    - **Serendipity & Diversity** widget with exploration slider.
    - **Suggested Communities** with quick "Join" button.
    - **Trending Hashtags**.
    - **Who to Follow** recommendations.
  - **Share Modal**: Allows sending any post directly into a chat thread or copying link.
  - **Post Detail / Comments Modal**: Inline commenting and discussion.

#### [MODIFY] [frontend/src/components/MediaImage.jsx](file:///d:/My%20Projects/HPX/Cosmos_web/frontend/src/components/MediaImage.jsx)

- Bulletproof image rendering with inline SVG avatar generator and vibrant gradient fallback so images never appear broken on any machine.

---

### Deployment & Git (`render.yaml`, `build.sh`, `requirements.txt`)

#### [MODIFY] [render.yaml](file:///d:/My%20Projects/HPX/Cosmos_web/render.yaml) & [build.sh](file:///d:/My%20Projects/HPX/Cosmos_web/build.sh)

- Ensure build script builds the frontend (`npm run build`) and installs Python packages cleanly.
- Keep dependencies lean and reliable.

#### Git Maintenance

- Remove deleted legacy exoplanet files from git tracking.
- Stage new Cosmos web application files.
- Commit with comprehensive message and push to GitHub `origin/main`.

---

## Verification Plan

### Automated / Build Tests

1. **Frontend Production Build**: Run `npm run build` in `frontend/` to verify zero JSX or CSS syntax errors.
2. **Backend API Tests**: Run `python -m pytest tests/` or execute API tests against `/api/v1/health`, `/api/v1/auth/login`, `/api/v1/posts`, `/api/v1/recommendations/feed`, `/api/v1/sentiment/predict`.
3. **ML Model Validation**: Verify sentiment prediction and recommendation scoring with sample texts in Python.

### Manual Verification

1. **Light / Dark Mode**: Toggle theme and verify all backgrounds, cards, text, buttons, modals, and chat bubbles have strong contrast and sleek aesthetics.
2. **Font & Icon Sizing**: Confirm text is legible (15-16px body) and icons are prominently sized (20-24px).
3. **Social Layout & Chat**: Open Messages, send a message to another user, verify real-time polling updates.
4. **Share to Chat**: Click "Share" on a post, send to a conversation, and verify post preview renders inside the chat thread.
5. **Communities & Serendipity**: Join a community, adjust serendipity slider, and inspect diverse recommendations with justified badges.
6. **Git Push**: Verify git status is clean and changes are pushed to GitHub `origin/main`.
