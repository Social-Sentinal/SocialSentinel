# SocialSentinel: Production Deployment Guide (Vercel)

**Deployment Target:** Vercel (Static Frontend CDN + Serverless Python Flask API)  
**Target Environment:** Production Ready  

---

## 1. Architecture Overview

SocialSentinel uses a clean, decoupled architecture optimized for Vercel:
- **Frontend:** Built with Vite + React, served directly from Vercel's global Edge Network (CDN) with client-side SPA routing.
- **Backend API:** Python Flask application running inside Vercel Serverless Functions (`api/index.py`), handling all `/api/*`, `/health`, and `/ready` endpoints.
- **Database:** Can connect to any cloud PostgreSQL provider (e.g. Supabase, Neon, AWS RDS) via `DATABASE_URL`, with automatic serverless `/tmp` SQLite fallback.

```mermaid
flowchart LR
    Git[GitHub Repository] -->|Push to main| Vercel[Vercel CI/CD Build]
    Vercel -->|Deploy Frontend| Edge[Vercel Edge Network / Static Assets]
    Vercel -->|Provision Functions| Lambda[Vercel Python Serverless Functions /api]
    Edge -->|User Browsing| Client[Browser]
    Client -->|API Requests /api/...| Lambda
    Lambda --> DB[(PostgreSQL Database)]
```

---

## 2. Configuration Files

### `vercel.json`
Located at the root of the project:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.py"
    },
    {
      "source": "/health",
      "destination": "/api/index.py"
    },
    {
      "source": "/ready",
      "destination": "/api/index.py"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### `api/index.py`
The serverless entrypoint discovering the Flask WSGI instance:
```python
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
```

---

## 3. Environment Variables

Configure these in the **Vercel Dashboard -> Project Settings -> Environment Variables**:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `SECRET_KEY` | Flask secret key for sessions | Random 32+ character string |
| `JWT_SECRET_KEY` | Secret key for signing JWT tokens | Random 32+ character string |
| `DATABASE_URL` | Production PostgreSQL connection URL | `postgresql://user:pass@host:5432/dbname` |
| `CORS_ORIGINS` | Allowed origins for CORS | `*` or `https://your-domain.vercel.app` |
| `JWT_ACCESS_MINUTES` | Access token lifespan in minutes | `30` |
| `JWT_REFRESH_DAYS` | Refresh token lifespan in days | `30` |

---

## 4. Step-by-Step Vercel Deployment

1. **Push Changes to GitHub**:
   Ensure all changes are pushed to your `main` branch.

2. **Import Project to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Authorize GitHub and select the `SocialSentinel` repository.

3. **Configure Build Settings**:
   - Vercel automatically reads `vercel.json`.
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`

4. **Add Environment Variables**:
   - Set `SECRET_KEY`, `JWT_SECRET_KEY`, and optional `DATABASE_URL`.

5. **Deploy**:
   - Click **Deploy**. Vercel will build the frontend assets, bundle the Python serverless function, and provide your live URL.
