FROM python:3.14-slim
WORKDIR /app
ENV UV_LINK_MODE=copy
RUN pip install uv --break-system-packages
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen
COPY . .
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
