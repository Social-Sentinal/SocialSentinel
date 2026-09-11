# Migration to SocialSentinel 3.0

The new app defaults to `data/socialsentinel_v3.db` so the old SQLite schema cannot silently corrupt the new schema. For production, set `DATABASE_URL` to PostgreSQL.

Existing CSV datasets remain available under `data/` for retraining/experimentation. The old pickle models remain under `models/` as baseline research artifacts; the application no longer depends on the broken collaborative pickle pipeline.
