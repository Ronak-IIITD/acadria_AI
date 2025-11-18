import os
from pathlib import Path
from dotenv import load_dotenv

# ⚠️ CRITICAL: Load environment variables FIRST, before any other imports!
# This ensures API keys are available when services initialize
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)
print(f"🔧 Loaded .env from: {env_path}")
print(f"✅ GEMINI_API_KEY present: {bool(os.getenv('GEMINI_API_KEY'))}")
print(f"✅ GROK_API_KEY present: {bool(os.getenv('GROK_API_KEY'))}")

# Now import the rest after env vars are loaded
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import chat, upload, models
import uvicorn

app = FastAPI(
    title="StudySync AI API",
    description="Backend API for StudySync AI with RAG capabilities",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(models.router, prefix="/api", tags=["models"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to StudySync AI API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "models_loaded": 1
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
