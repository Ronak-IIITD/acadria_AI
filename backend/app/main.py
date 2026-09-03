import os
from pathlib import Path
from dotenv import load_dotenv

# ⚠️ CRITICAL: Load environment variables FIRST, before any other imports!
# This ensures API keys are available when services initialize
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)
print(f"🔧 Loaded .env from: {env_path}")
print(f"✅ GEMINI_API_KEY present: {bool(os.getenv('GEMINI_API_KEY'))}")
print(f"✅ GROK_API_KEY present: {bool(os.getenv('GROK_API_KEY'))}")

# Now import the rest after env vars are loaded
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.routes import chat, upload, models, admin, study_tools
from app.middleware.rate_limit import RateLimitMiddleware
import uvicorn

app = FastAPI(
    title="StudySync AI API",
    description="Backend API for StudySync AI with RAG capabilities",
    version="1.0.0",
)

# Add request ID middleware (for distributed tracing)
from app.middleware.request_id import RequestIDMiddleware

# Add request ID middleware
app.add_middleware(RequestIDMiddleware)

# Add rate limiting middleware (before CORS)
app.add_middleware(RateLimitMiddleware)



@app.middleware('http')
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # Content Security Policy
    response.headers['Content-Security-Policy'] = "default-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'"
    # X-Content-Type-Options
    response.headers['X-Content-Type-Options'] = 'nosniff'
    # X-Frame-Options
    response.headers['X-Frame-Options'] = 'DENY'
    # Referrer-Policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    # Strict-Transport-Security (for HTTPS)
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# CORS configuration - Allow production origins via environment variable
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

# Include routers
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(models.router, prefix="/api", tags=["models"])
app.include_router(admin.router, prefix="/api", tags=["admin"])
app.include_router(study_tools.router, prefix="/api", tags=["study-tools"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to StudySync AI API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0", "models_loaded": 1}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
