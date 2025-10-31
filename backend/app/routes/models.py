from fastapi import APIRouter
from app.models.schemas import ModelInfo
from typing import List

router = APIRouter()

# Available AI models
AVAILABLE_MODELS = [
    {
        "id": "gemini-2.5-flash",
        "name": "Gemini 2.5 Flash",
        "description": "Google's latest fast AI model",
        "is_local": False
    },
    {
        "id": "gpt4all",
        "name": "GPT4All",
        "description": "Local open-source LLM",
        "is_local": True
    },
    {
        "id": "llama2",
        "name": "LLaMA 2",
        "description": "Meta's open-source LLM",
        "is_local": True
    }
]

@router.get("/models", response_model=List[ModelInfo])
async def get_models():
    """Get list of available AI models"""
    return AVAILABLE_MODELS

@router.get("/models/{model_id}")
async def get_model_info(model_id: str):
    """Get information about a specific model"""
    model = next((m for m in AVAILABLE_MODELS if m["id"] == model_id), None)
    if not model:
        return {"error": "Model not found"}, 404
    return model
