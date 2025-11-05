from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatMessage, ChatResponse
from app.services.rag_service import RAGService
from app.services.grok_service import get_grok_service
from typing import List

router = APIRouter()
rag_service = RAGService()
grok_service = get_grok_service()

@router.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """
    Chat endpoint with RAG capabilities and model selection.
    Supports Gemini (default) and Grok models.
    Retrieves relevant document chunks using semantic search and generates AI response.
    """
    try:
        # Determine which model to use
        model = message.model if hasattr(message, 'model') and message.model else "gemini"
        
        print(f"🤖 Using model: {model}")
        
        if model == "grok":
            # Use Grok service
            # First retrieve context using RAG service (semantic search)
            context, sources = rag_service._retrieve_context(message.text)
            
            # Then generate response with Grok
            response = await grok_service.generate_response(
                query=message.text,
                context=context,
                sources=sources,
                use_web_search=message.use_web_search
            )
        else:
            # Use Gemini service (default)
            response = await rag_service.generate_response(
                query=message.text,
                use_web_search=message.use_web_search
            )
        
        return response
    except Exception as e:
        print(f"❌ Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/chat/history")
async def clear_history():
    """Clear chat history for the current session"""
    try:
        rag_service.clear_history()
        grok_service.clear_history()
        return {"message": "Chat history cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
