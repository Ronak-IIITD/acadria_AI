from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import ChatMessage, ChatResponse
from app.services.rag_service_improved import get_rag_service_improved
from app.services.grok_service import get_grok_service
from app.services.groq_service import get_groq_service
from app.middleware.auth import get_current_user
from typing import List

router = APIRouter()
# Use singleton RAG service (improved version) to share document store across modules
rag_service = get_rag_service_improved()
grok_service = get_grok_service()
groq_service = get_groq_service()


@router.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage, current_user: dict = Depends(get_current_user)):
    """
    Chat endpoint with RAG capabilities and model selection.
    Supports Gemini (default), Grok, and Groq models.
    Retrieves relevant document chunks using semantic search and generates AI response.
    """
    try:
        # Log authenticated user
        print(
            f"👤 User {current_user['uid']} ({current_user.get('email', 'N/A')}) initiated chat"
        )

        # Determine which model to use
        model = (
            message.model
            if hasattr(message, "model") and message.model
            else "gemini-flash"
        )
        level_up_mode = (
            message.level_up_mode if hasattr(message, "level_up_mode") else False
        )

        print(f"🤖 Using model: {model}")
        if level_up_mode:
            print(f"🚀 Level Up+ mode ENABLED - Enhanced response quality")

        # Route to appropriate service based on model
        if model == "grok":
            # Use Grok 4 service
            context, sources = rag_service._retrieve_context(
                message.text,
                user_id=current_user["uid"],
                top_k=5 if level_up_mode else 3,
            )
            response = await grok_service.generate_response(
                query=message.text,
                context=context,
                sources=sources,
                user_id=current_user["uid"],
                use_web_search=message.use_web_search,
                level_up_mode=level_up_mode,
            )
        elif (
            model.startswith("llama3")
            or model.startswith("mixtral")
            or model.startswith("gemma")
        ):
            # Use Groq Service (Llama 3, Mixtral, Gemma)
            context, sources = rag_service._retrieve_context(
                message.text,
                user_id=current_user["uid"],
                top_k=5 if level_up_mode else 3,
            )
            response = await groq_service.generate_response(
                query=message.text,
                context=context,
                sources=sources,
                use_web_search=message.use_web_search,
                level_up_mode=level_up_mode,
                model=model,
            )
        elif model == "gemini-pro":
            # Use Gemini 1.5 Pro
            rag_service.set_model("gemini-1.5-pro")
            response = await rag_service.generate_response(
                query=message.text,
                user_id=current_user["uid"],
                use_web_search=message.use_web_search,
                level_up_mode=level_up_mode,
            )
        elif model == "gemini-2.0-flash-exp":
            # Use Gemini 2.0 Flash Experimental
            rag_service.set_model("gemini-2.0-flash-exp")
            response = await rag_service.generate_response(
                query=message.text,
                user_id=current_user["uid"],
                use_web_search=message.use_web_search,
                level_up_mode=level_up_mode,
            )
        elif model in ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-3-pro"]:
            # Use Gemini 2.5/3.0 models
            rag_service.set_model(model)
            response = await rag_service.generate_response(
                query=message.text,
                user_id=current_user["uid"],
                use_web_search=message.use_web_search,
                level_up_mode=level_up_mode,
            )
        else:
            # Use Gemini 1.5 Flash (default)
            rag_service.set_model("gemini-1.5-flash")
            response = await rag_service.generate_response(
                query=message.text,
                user_id=current_user["uid"],
                use_web_search=message.use_web_search,
                level_up_mode=level_up_mode,
            )

        return response
    except Exception as e:
        error_str = str(e).lower()
        print(f"❌ Chat error: {str(e)}")

        # Determine appropriate status code and message based on error type
        if any(
            keyword in error_str
            for keyword in ["503", "unavailable", "overloaded", "busy", "quota", "rate"]
        ):
            # Model overload or rate limit errors
            status_code = 503
            detail = {
                "error": "model_overload",
                "message": str(e),
                "retry_after": 30,  # Suggest retry after 30 seconds
                "suggestion": "The AI model is temporarily busy. Please try again in a moment or switch to a different model.",
            }
        elif "api_key" in error_str or "authentication" in error_str:
            status_code = 401
            detail = {
                "error": "authentication",
                "message": str(e),
                "suggestion": "Please check your API key configuration.",
            }
        else:
            status_code = 500
            detail = {
                "error": "internal_error",
                "message": str(e),
                "suggestion": "An unexpected error occurred. Please try again.",
            }

        raise HTTPException(status_code=status_code, detail=detail)


@router.delete("/chat/history")
async def clear_history(current_user: dict = Depends(get_current_user)):
    """Clear chat history for the current session"""
    try:
        print(f"🗑️ User {current_user['uid']} cleared chat history")
        rag_service.clear_history(user_id=current_user["uid"])
        grok_service.clear_history(user_id=current_user["uid"])
        # groq_service doesn't have history yet, but good to keep consistent
        return {"message": "Chat history cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rag/debug")
async def rag_debug(current_user: dict = Depends(get_current_user)):
    """Debug endpoint to check RAG store status"""
    try:
        info = rag_service.get_document_info(user_id=current_user["uid"])
        return {
            "document_count": rag_service.get_document_count(
                user_id=current_user["uid"]
            ),
            "details": info,
            "embedding_service_available": rag_service.embedding_service.is_available(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
