from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatMessage, ChatResponse
from app.services.rag_service import RAGService
from typing import List

router = APIRouter()
rag_service = RAGService()

@router.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """
    Chat endpoint with RAG capabilities.
    Retrieves relevant document chunks and generates AI response.
    """
    try:
        response = await rag_service.generate_response(
            query=message.text,
            use_web_search=message.use_web_search
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/chat/history")
async def clear_history():
    """Clear chat history for the current session"""
    try:
        rag_service.clear_history()
        return {"message": "Chat history cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
