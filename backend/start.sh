#!/bin/sh
set -e

echo "[startup] Running database migrations..."
/opt/venv/bin/alembic upgrade head

echo "[startup] Starting application..."
exec /opt/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
