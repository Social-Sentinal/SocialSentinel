# 🛡️ SocialSentinel — AI-Powered Social Intelligence Network

SocialSentinel is a production-oriented AI social intelligence network built as a Next.js App Router modular monolith backed by Supabase PostgreSQL, featuring real-time direct messaging, native explainable recommendations, zero-API-cost sentiment and emotion analysis, dark/light themes, and strict database Row Level Security (RLS).

---

## 🌟 Key Features

1. **Intelligent Hybrid Recommendations**:
   - Multi-signal ranking algorithm combining content TF-IDF cosine similarity, collaborative engagement weights (like: 4, save: 5, share: 4, comment: 3), creator affinity, following graphs, and recency decay.
   - **Diversity & Serendipity Engine**: Prevents echo chambers with an adjustable discovery slider to surface novel, high-signal topics.
   - **Explainable AI**: Transparent rationale badges on every post (e.g., `🎯 88% Match · Based on your #AI interest`).

2. **Native Zero-Cost Sentiment & Emotion Analysis**:
   - High-performance, zero-latency TypeScript NLP engine matching Scikit-Learn TF-IDF preprocessing with lexicon polarity scoring.
   - Real-time tone preview during post authoring, network-wide sentiment pulse analytics, and interactive AI Studio inspector.
   - Emotion classification across 7 dimensions (`joy`, `curiosity`, `wonder`, `inspiration`, `empathy`, `concern`, `sadness`).

3. **Direct Messaging & One-Click Post Sharing**:
   - Dedicated direct messenger with live Supabase Realtime WebSocket channels, conversation switcher, and user search.
   - One-click "Share to Chat" modal allowing instant sharing of any post into conversation threads with live previews.

4. **Topic Communities & Community Pulse**:
   - Topic hubs including *AI & Tech*, *Cybersecurity & Privacy*, *Web Engineering*, *Creative Tech & Design*, and *Digital Wellbeing*.
   - Community Pulse dashboard displaying aggregated discussion sentiment, emotion distribution, and topic velocity.

5. **Security & Row Level Security (RLS)**:
   - Database-enforced Row Level Security on all tables (`profiles`, `posts`, `comments`, `likes`, `bookmarks`, `follows`, `messages`, `reports`).
   - Secure HTTP-only cookie authentication via `@supabase/ssr` (zero tokens in `localStorage`).
   - Reporting and content moderation workflows with moderator review capabilities.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) + TypeScript | React Server Components, Server Actions, Route Handlers, edge-ready performance. |
| **Styling** | Tailwind CSS + CSS Custom Properties | Utility styling paired with unified dark/light theme CSS custom properties. |
| **Database & Auth** | Supabase PostgreSQL + `@supabase/ssr` | UUID primary keys, atomic PostgreSQL triggers, RLS policies, HTTP-only cookie auth. |
| **Realtime** | Supabase Realtime (WebSockets) | Live updates for direct messaging and notifications. |
| **Testing** | Vitest + React Testing Library | Fast unit and integration tests for recommendation, sentiment, emotion, and validation engines. |
| **Python Service** | Flask + Scikit-Learn (Optional) | Standalone microservice in `app/` for high-throughput batch ML jobs. |

---

## 📁 Repository Structure

```
SocialSentinel/
├── .env                  # Single unified environment configuration
├── .env.example          # Environment configuration template
├── docs/                 # Project documentation
│   ├── architecture.md   # Modular monolith architecture specification
│   ├── deployment.md     # Production deployment guide (Vercel & Supabase)
│   └── security.md       # Security, threat model & RLS specifications
├── src/                  # Next.js App Router codebase
│   ├── app/              # App Router pages, layouts, and route handlers
│   ├── components/       # UI components (Feed, Layout, Modals, Posts)
│   ├── lib/              # Supabase clients (SSR, browser, action) & validation
│   ├── modules/          # Business domains (AI, Auth, Posts, Messaging, Moderation)
│   └── types/            # Database entity definitions & PostgreSQL types
├── supabase/
│   ├── migrations/       # Production PostgreSQL schema, triggers & RLS policies
│   └── seed.sql          # Synthetic profiles, posts, and interaction seed data
├── scripts/
│   └── seed.mjs          # Programmatic database verification & seed runner
├── app/                  # Optional standalone Python Flask service
└── frontend/             # Standalone React/Vite SPA bundle
```

---

## 🚀 Quickstart

### Prerequisites
- Node.js 18+ (Node.js 20+ recommended)
- Python 3.11+ (optional, only if running legacy Flask service)

### 1. Environment Configuration

Copy the template to create your `.env` file:
```bash
cp .env.example .env
```

Open `.env` and configure your Supabase credentials:
```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_LOCAL_AI=true
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Test Suite

```bash
npm run test
```
Executes Vitest unit tests verifying the recommendation engine, sentiment inference, emotion pattern matching, and input validations (24/24 tests).

### 5. Production Build

```bash
npm run build
```
Generates an optimized, statically typed Next.js production build ready for deployment.

---

## 🧪 Database Setup & Seeding

1. **Apply Migrations**:
   Run [`supabase/migrations/20261015000000_init_socialsentinel.sql`](supabase/migrations/20261015000000_init_socialsentinel.sql) in your [Supabase SQL Editor](https://supabase.com/dashboard).
2. **Apply Seed Data**:
   Run [`supabase/seed.sql`](supabase/seed.sql) in your Supabase SQL Editor to populate 35 synthetic creators and 120+ posts.
3. **Verify Communities**:
   ```bash
   npm run db:seed
   ```

---

## 📚 Documentation Links

- [System Architecture Specification](docs/architecture.md)
- [Production Deployment Guide (Vercel & Supabase)](docs/deployment.md)
- [Security & Compliance Architecture](docs/security.md)