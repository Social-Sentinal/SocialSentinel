# Database migrations
Production uses PostgreSQL. The application currently creates compatible tables on first startup for backwards compatibility; the SQLAlchemy metadata is the source of truth. For controlled schema evolution, use Alembic/Flask-Migrate (`flask db migrate`, `flask db upgrade`) after installing Flask-Migrate.
