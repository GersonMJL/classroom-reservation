from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.core.cache import cache_delete, cache_get, cache_set, distributed_lock
from app.core.redis import check_redis_health
from app.main import app


def test_redis_health_fallback():
    """Verify check_redis_health returns valid structure even if redis is unavailable."""
    with patch("app.core.redis.get_redis", return_value=None):
        result = check_redis_health()
        assert "status" in result
        assert "healthy" in result


def test_cache_graceful_degradation():
    """Verify cache helpers do not raise exceptions when Redis is down."""
    with patch("app.core.cache.get_redis", return_value=None):
        assert cache_get("test:key") is None
        assert cache_set("test:key", {"foo": "bar"}) is False
        assert cache_delete("test:key") is False


def test_distributed_lock_fallback():
    """Verify distributed lock falls back gracefully when Redis is unavailable."""
    with patch("app.core.cache.get_redis", return_value=None):
        with distributed_lock("test:resource") as acquired:
            assert acquired is True


def test_deep_healthcheck_endpoint():
    """Verify GET /health returns structured response with components."""
    client = TestClient(app)
    response = client.get("/health")
    # Health endpoint can return 200 (or 503 if real DB is not running in local test runner)
    assert response.status_code in (200, 503)
    data = response.json()
    assert "status" in data
    assert "components" in data
    assert "database" in data["components"]
    assert "redis" in data["components"]
    assert "scheduler" in data["components"]
