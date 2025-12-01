"""
Rate limiting middleware for API endpoints.
Protects against abuse and excessive requests.
"""
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from datetime import datetime, timedelta
import time
from typing import Dict, Tuple


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiting middleware.
    
    Limits:
    - 100 requests per minute per IP for general endpoints
    - 20 requests per minute per IP for chat endpoint
    - 10 requests per minute per IP for upload endpoint
    """
    
    def __init__(self, app):
        super().__init__(app)
        # Store: {ip_address: [(timestamp, endpoint), ...]}
        self.request_history: Dict[str, list] = defaultdict(list)
        
        # Rate limits per endpoint pattern (requests per minute)
        self.limits = {
            "/api/chat": 20,
            "/api/upload": 10,
            "default": 100
        }
        
        # Cleanup interval (seconds)
        self.last_cleanup = time.time()
        self.cleanup_interval = 60  # Clean old records every 60 seconds
    
    async def dispatch(self, request: Request, call_next):
        """Process request and enforce rate limits"""
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Skip rate limiting for health checks
        if request.url.path in ["/", "/api/health"]:
            return await call_next(request)
        
        # Determine rate limit for this endpoint
        limit = self._get_limit_for_path(request.url.path)
        
        # Check rate limit
        current_time = datetime.now()
        if not self._check_rate_limit(client_ip, request.url.path, current_time, limit):
            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limit_exceeded",
                    "message": f"Rate limit exceeded. Maximum {limit} requests per minute allowed.",
                    "retry_after": 60
                }
            )
        
        # Record this request
        self.request_history[client_ip].append((current_time, request.url.path))
        
        # Periodic cleanup
        if time.time() - self.last_cleanup > self.cleanup_interval:
            self._cleanup_old_records()
        
        # Process request
        response = await call_next(request)
        return response
    
    def _get_limit_for_path(self, path: str) -> int:
        """Get rate limit for a specific path"""
        for pattern, limit in self.limits.items():
            if pattern != "default" and path.startswith(pattern):
                return limit
        return self.limits["default"]
    
    def _check_rate_limit(self, ip: str, path: str, current_time: datetime, limit: int) -> bool:
        """
        Check if request is within rate limit.
        
        Returns True if allowed, False if limit exceeded.
        """
        if ip not in self.request_history:
            return True
        
        # Filter requests from last minute
        one_minute_ago = current_time - timedelta(minutes=1)
        recent_requests = [
            (timestamp, endpoint) 
            for timestamp, endpoint in self.request_history[ip]
            if timestamp > one_minute_ago
        ]
        
        # Update history with only recent requests
        self.request_history[ip] = recent_requests
        
        # Count requests to this endpoint in last minute
        endpoint_requests = sum(1 for _, endpoint in recent_requests if endpoint == path)
        
        return endpoint_requests < limit
    
    def _cleanup_old_records(self):
        """Remove records older than 2 minutes to save memory"""
        current_time = datetime.now()
        two_minutes_ago = current_time - timedelta(minutes=2)
        
        for ip in list(self.request_history.keys()):
            # Filter out old requests
            self.request_history[ip] = [
                (timestamp, endpoint)
                for timestamp, endpoint in self.request_history[ip]
                if timestamp > two_minutes_ago
            ]
            
            # Remove IP if no recent requests
            if not self.request_history[ip]:
                del self.request_history[ip]
        
        self.last_cleanup = time.time()
        print(f"🧹 Rate limiter cleanup: {len(self.request_history)} active IPs")
