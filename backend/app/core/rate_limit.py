import logging
from collections.abc import Callable

from fastapi import HTTPException, Request, status

from app.core.config import get_settings
from app.core.redis import get_redis

logger = logging.getLogger("app.ratelimit")
settings = get_settings()


def rate_limit(
    max_requests: int | None = None,
    window_seconds: int = 60,
    key_prefix: str = "rl",
) -> Callable:
    """
    FastAPI dependency for distributed Redis rate limiting.
    Falls back gracefully if Redis is unavailable.
    """
    async def dependency(request: Request) -> None:
        if not settings.rate_limit_enabled:
            return

        limit = max_requests or settings.rate_limit_requests_per_minute
        client_ip = request.client.host if request.client else "127.0.0.1"

        # Check for Authorization token to rate limit per user if authenticated
        auth_header = request.headers.get("Authorization", "")
        identifier = f"{client_ip}:{auth_header[-16:]}" if len(auth_header) > 20 else client_ip
        key = f"{key_prefix}:{request.url.path}:{identifier}"

        redis_client = get_redis()
        if redis_client is None:
            # Graceful degradation: don't block traffic if Redis is down
            return

        try:
            # Simple atomic counter with expiration
            current_count = redis_client.incr(key)
            if current_count == 1:
                redis_client.expire(key, window_seconds)

            if current_count > limit:
                ttl = redis_client.ttl(key)
                headers = {"Retry-After": str(max(ttl, 1))}
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Limite de requisições excedido. Tente novamente em {max(ttl, 1)} segundos.",
                    headers=headers,
                )
        except HTTPException:
            raise
        except Exception as exc:
            logger.warning(f"[ratelimit] Redis error during rate check: {exc}")
            return

    return dependency
