from collections.abc import Generator
from contextlib import contextmanager
import json
import logging
import time
from typing import Any

from app.core.redis import get_redis

logger = logging.getLogger("app.cache")


def cache_get(key: str) -> Any | None:
    """Retrieve and deserialize a JSON cached value."""
    redis_client = get_redis()
    if redis_client is None:
        return None

    try:
        data = redis_client.get(key)
        if data is None:
            return None
        return json.loads(data)
    except Exception as exc:
        logger.debug(f"[cache] Error reading key '{key}': {exc}")
        return None


def cache_set(key: str, value: Any, ttl_seconds: int = 300) -> bool:
    """Serialize and store a JSON value in cache with TTL."""
    redis_client = get_redis()
    if redis_client is None:
        return False

    try:
        serialized = json.dumps(value, default=str)
        return bool(redis_client.setex(key, ttl_seconds, serialized))
    except Exception as exc:
        logger.debug(f"[cache] Error writing key '{key}': {exc}")
        return False


def cache_delete(key: str) -> bool:
    """Delete a key from cache."""
    redis_client = get_redis()
    if redis_client is None:
        return False

    try:
        return bool(redis_client.delete(key))
    except Exception as exc:
        logger.debug(f"[cache] Error deleting key '{key}': {exc}")
        return False


def cache_delete_pattern(pattern: str) -> int:
    """Delete all keys matching a glob pattern."""
    redis_client = get_redis()
    if redis_client is None:
        return 0

    try:
        keys = list(redis_client.scan_iter(match=pattern, count=100))
        if keys:
            return redis_client.delete(*keys)
        return 0
    except Exception as exc:
        logger.debug(f"[cache] Error deleting pattern '{pattern}': {exc}")
        return 0


@contextmanager
def distributed_lock(
    lock_key: str,
    timeout_seconds: int = 5,
    blocking_timeout_seconds: float = 3.0,
    retry_interval_seconds: float = 0.05,
) -> Generator[bool, None, None]:
    """
    Context manager for Redis distributed locking with auto-release and retry.
    Yields True if acquired, False if fallback or timeout.
    """
    redis_client = get_redis()
    if redis_client is None:
        # Graceful fallback: yield True so caller can proceed with DB-level lock
        yield True
        return

    full_lock_key = f"lock:{lock_key}"
    token = f"{time.time()}:{time.perf_counter()}"
    acquired = False
    start_time = time.monotonic()

    try:
        while time.monotonic() - start_time < blocking_timeout_seconds:
            # Set key if not exists (NX) with expiration in seconds (EX)
            if redis_client.set(full_lock_key, token, nx=True, ex=timeout_seconds):
                acquired = True
                break
            time.sleep(retry_interval_seconds)

        yield acquired
    finally:
        if acquired:
            try:
                # Release lock only if token matches using Lua script for atomicity
                lua_release = """
                if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                else
                    return 0
                end
                """
                redis_client.eval(lua_release, 1, full_lock_key, token)
            except Exception as exc:
                logger.warning(f"[lock] Error releasing lock '{full_lock_key}': {exc}")
