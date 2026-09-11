# Deployment
Render: connect repository, use `render.yaml`, provide PostgreSQL `DATABASE_URL`. Build: `bash build.sh`. Start: `gunicorn --workers 2 --threads 4 --timeout 120 run:app`. Health: `/health`; readiness: `/ready`. Do not commit secrets. Ollama should run outside the Render web process and be configured with `OLLAMA_BASE_URL` if remote access is available.
