#!/bin/sh
set -e

echo "[startup] Running database migrations..."
if [ -f "/app/.venv/bin/alembic" ]; then
    /app/.venv/bin/alembic upgrade head
elif [ -f "/opt/venv/bin/alembic" ]; then
    /opt/venv/bin/alembic upgrade head
else
    alembic upgrade head
fi

echo "[startup] Starting application with uvicorn..."
if [ -f "/app/.venv/bin/uvicorn" ]; then
    exec /app/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${WEB_CONCURRENCY:-2}
elif [ -f "/opt/venv/bin/uvicorn" ]; then
    exec /opt/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${WEB_CONCURRENCY:-2}
else
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${WEB_CONCURRENCY:-2}
fi
