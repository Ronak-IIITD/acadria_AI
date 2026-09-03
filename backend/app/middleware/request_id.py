"""
Request ID middleware for distributed tracing and debugging.
 Adds a unique request ID to each API request, propagated in response headers.
"""

import uuid
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds a unique X-Request-ID header to each response.
    Also tracks request duration for performance monitoring.
    """
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # Generate or inherit request ID
        # Check if there's an existing X-Request-ID (for distributed tracing)
        existing_id = request.headers.get("X-Request-ID")
        request_id = existing_id or str(uuid.uuid4())
        
        # Process request
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time
        
        # Add response headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Request-Duration-MS"] = str(int(duration * 1000))
        
        return response
