import json
import logging
import time
import uuid
from collections.abc import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("app.access")


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        start_time = time.perf_counter()

        # Inject request_id into state for downstream handlers
        request.state.request_id = request_id

        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as exc:
            status_code = 500
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
            log_data = {
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": status_code,
                "latency_ms": latency_ms,
                "client_ip": request.client.host if request.client else "unknown",
                "error": str(exc),
            }
            logger.error(json.dumps(log_data))
            raise exc

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = request_id

        # Skip noisy logging for repeated health checks unless error
        if request.url.path != "/health" or status_code >= 400:
            log_data = {
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": status_code,
                "latency_ms": latency_ms,
                "client_ip": request.client.host if request.client else "unknown",
            }
            logger.info(json.dumps(log_data))

        return response
