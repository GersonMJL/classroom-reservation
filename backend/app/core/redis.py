import logging
from typing import Any

from app.core.config import get_settings

try:
    import redis
    _HAS_REDIS = True
except ImportError:
    redis = None  # type: ignore
    _HAS_REDIS = False

logger = logging.getLogger("app.redis")
settings = get_settings()

_redis_pool: Any = None
_redis_client: Any = None


def get_redis_pool() -> Any:
    global _redis_pool
    if not settings.redis_enabled or not _HAS_REDIS:
        return None

    if _redis_pool is None:
        try:
            _redis_pool = redis.ConnectionPool.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_timeout=settings.redis_timeout_seconds,
                socket_connect_timeout=settings.redis_timeout_seconds,
                max_connections=50,
            )
        except Exception as exc:
            logger.warning(f"[redis] Failed to initialize connection pool: {exc}")
            _redis_pool = None

    return _redis_pool


def get_redis() -> Any:
    global _redis_client
    if not settings.redis_enabled or not _HAS_REDIS:
        return None

    pool = get_redis_pool()
    if pool is None:
        return None

    if _redis_client is None:
        try:
            _redis_client = redis.Redis(connection_pool=pool)
        except Exception as exc:
            logger.warning(f"[redis] Failed to initialize client: {exc}")
            return None

    return _redis_client


def check_redis_health() -> dict[str, Any]:
    """Check connectivity and latency to Redis server."""
    if not settings.redis_enabled:
        return {"status": "disabled", "healthy": True}

    if not _HAS_REDIS:
        return {"status": "not_installed", "healthy": True, "note": "Redis client library not installed"}

    client = get_redis()
    if client is None:
        return {"status": "unavailable", "healthy": False, "error": "Client not initialized"}

    try:
        import time
        start = time.perf_counter()
        pong = client.ping()
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        if pong:
            return {"status": "healthy", "healthy": True, "latency_ms": latency_ms}
        return {"status": "unhealthy", "healthy": False, "error": "Ping failed"}
    except Exception as exc:
        return {"status": "unhealthy", "healthy": False, "error": str(exc)}
