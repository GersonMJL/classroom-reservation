FROM python:3.14-slim
WORKDIR /app

# Create a non-root user for running the app (will be overridden by docker-compose user mapping)
RUN groupadd -r appuser && useradd -r -g appuser appuser

ENV UV_LINK_MODE=copy
ENV UV_CACHE_DIR=/app/.cache
ENV PYTHONPATH=/app
RUN pip install uv --break-system-packages
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

COPY --chown=appuser:appuser . .

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Note: USER directive is intentionally omitted to allow docker-compose user mapping to work
# The user will be set via docker-compose.yml

ENTRYPOINT ["/entrypoint.sh"]
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
