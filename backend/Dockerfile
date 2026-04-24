FROM python:3.14-slim

WORKDIR /app

ENV PYTHONPATH=/app
ENV UV_LINK_MODE=copy
ENV UV_CACHE_DIR=/app/.cache

# Install uv
RUN pip install uv

# Copy application code
COPY . .

CMD ["sh", "-c", "uv sync --frozen && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000"]
