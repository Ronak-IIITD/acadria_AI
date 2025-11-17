from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import ChatMessage, ChatResponse
from app.services.rag_service import get_rag_service
from app.services.grok_service import get_grok_service
from app.middleware.auth import get_current_user
from typing import List

router = APIRouter()
# Use singleton RAG service to share document store across modules
rag_service = get_rag_service()
grok_service = get_grok_service()

@router.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage, current_user: dict = Depends(get_current_user)):
    """
    Chat endpoint with RAG capabilities and model selection.
    Supports Gemini (default) and Grok models.
    Retrieves relevant document chunks using semantic search and generates AI response.
    """
    try:
        # Log authenticated user
        print(f"👤 User {current_user['uid']} ({current_user.get('email', 'N/A')}) initiated chat")

        # Determine which model to use
        model = message.model if hasattr(message, 'model') and message.model else "gemini-flash"
        level_up_mode = message.level_up_mode if hasattr(message, 'level_up_mode') else False

        print(f"🤖 Using model: {model}")
        if level_up_mode:
            print(f"🚀 Level Up+ mode ENABLED - Enhanced response quality")
        
        # Route to appropriate service based on model
        if model == "grok":
            # Use Grok 4 service
            # First retrieve context using RAG service (semantic search)
            context, sources = rag_service._retrieve_context(message.text, top_k=5 if level_up_mode else 3)
            
            # Then generate response with Grok 4
            response = await grok_service.generate_response(
                query=message.text,
                context=context,
                sources=sources,
                use_web_search=message.use_web_search,
                level_up_mode=level_up_mode
            )
        elif model == "gemini-pro":
            # Use Gemini 1.5 Pro
            rag_service.set_model('gemini-1.5-pro')
            response = await rag_service.generate_response(
                query=message.text,
                use_web_search=message.use_web_search,
                level_up_mode=level_up_mode
            )
        else:
            # Use Gemini 1.5 Flash (default)
            rag_service.set_model('gemini-1.5-flash')
            response = await rag_service.generate_response(
                query=message.text,
                use_web_search=message.use_web_search,
                level_up_mode=level_up_mode
            )
        
        return response
    except Exception as e:
        error_str = str(e).lower()
        print(f"❌ Chat error: {str(e)}")

        # Determine appropriate status code and message based on error type
        if any(keyword in error_str for keyword in ['503', 'unavailable', 'overloaded', 'busy', 'quota', 'rate']):
            # Model overload or rate limit errors
            status_code = 503
            detail = {
                "error": "model_overload",
                "message": str(e),
                "retry_after": 30,  # Suggest retry after 30 seconds
                "suggestion": "The AI model is temporarily busy. Please try again in a moment or switch to a different model."
            }
        elif 'api_key' in error_str or 'authentication' in error_str:
            status_code = 401
            detail = {
                "error": "authentication",
                "message": str(e),
                "suggestion": "Please check your API key configuration."
            }
        else:
            status_code = 500
            detail = {
                "error": "internal_error",
                "message": str(e),
                "suggestion": "An unexpected error occurred. Please try again."
            }

        raise HTTPException(status_code=status_code, detail=detail)

@router.delete("/chat/history")
async def clear_history(current_user: dict = Depends(get_current_user)):
    """Clear chat history for the current session"""
    try:
        print(f"🗑️ User {current_user['uid']} cleared chat history")
        rag_service.clear_history()
        grok_service.clear_history()
        return {"message": "Chat history cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
