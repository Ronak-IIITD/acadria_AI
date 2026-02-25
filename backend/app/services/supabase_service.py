"""
Supabase client service for database operations.
Provides easy access to Supabase tables and authentication.
"""

import os
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

_supabase_client: Optional[Client] = None
_supabase_admin: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Get Supabase client for authenticated user operations.
    Uses anon key for public operations.
    """
    global _supabase_client

    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise ValueError(
                "Supabase configuration not set. Check SUPABASE_URL and SUPABASE_ANON_KEY in .env"
            )

        _supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    return _supabase_client


def get_supabase_admin() -> Client:
    """
    Get Supabase admin client for privileged operations.
    Uses service role key for backend operations.
    """
    global _supabase_admin

    if _supabase_admin is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError(
                "Supabase service role not configured. Check SUPABASE_SERVICE_ROLE_KEY in .env"
            )

        _supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    return _supabase_admin


class SupabaseService:
    """Database service for Supabase operations"""

    def __init__(self, is_admin: bool = False):
        self.client = get_supabase_admin() if is_admin else get_supabase_client()

    # ==================== DOCUMENTS ====================

    async def create_document(
        self, user_id: str, filename: str, **kwargs
    ) -> Dict[str, Any]:
        """Create a new document record"""
        data = {"user_id": user_id, "filename": filename, **kwargs}
        return self.client.table("documents").insert(data).execute()

    async def get_documents(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all documents for a user"""
        return (
            self.client.table("documents")
            .select("*")
            .eq("user_id", user_id)
            .execute()
            .data
        )

    async def get_document(
        self, document_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get a specific document"""
        result = (
            self.client.table("documents")
            .select("*")
            .eq("id", document_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def update_document(
        self, document_id: str, user_id: str, **kwargs
    ) -> Dict[str, Any]:
        """Update document metadata"""
        return (
            self.client.table("documents")
            .update(kwargs)
            .eq("id", document_id)
            .eq("user_id", user_id)
            .execute()
        )

    async def delete_document(self, document_id: str, user_id: str) -> Dict[str, Any]:
        """Delete a document"""
        return (
            self.client.table("documents")
            .delete()
            .eq("id", document_id)
            .eq("user_id", user_id)
            .execute()
        )

    # ==================== HIGHLIGHTS ====================

    async def create_highlight(
        self,
        user_id: str,
        document_id: str,
        content: str,
        color: str = "yellow",
        **kwargs,
    ) -> Dict[str, Any]:
        """Create a new highlight"""
        data = {
            "user_id": user_id,
            "document_id": document_id,
            "content": content,
            "color": color,
            **kwargs,
        }
        return self.client.table("highlights").insert(data).execute()

    async def get_highlights(
        self, user_id: str, document_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get highlights for a user, optionally filtered by document"""
        query = self.client.table("highlights").select("*").eq("user_id", user_id)

        if document_id:
            query = query.eq("document_id", document_id)

        return query.order("created_at", desc=True).execute().data

    async def delete_highlight(self, highlight_id: str, user_id: str) -> Dict[str, Any]:
        """Delete a highlight"""
        return (
            self.client.table("highlights")
            .delete()
            .eq("id", highlight_id)
            .eq("user_id", user_id)
            .execute()
        )

    async def get_highlights_summary(
        self, user_id: str, document_id: str
    ) -> List[Dict[str, Any]]:
        """Get highlights grouped by color"""
        result = (
            self.client.table("highlights")
            .select("*")
            .eq("user_id", user_id)
            .eq("document_id", document_id)
            .execute()
        )
        return result.data

    # ==================== CHAT HISTORY ====================

    async def create_chat_session(
        self, user_id: str, title: str = "New Chat", document_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new chat session"""
        data = {
            "user_id": user_id,
            "document_id": document_id,
            "title": title,
            "messages": [],
        }
        return self.client.table("chat_history").insert(data).execute()

    async def get_chat_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all chat sessions for a user"""
        return (
            self.client.table("chat_history")
            .select("*")
            .eq("user_id", user_id)
            .order("updated_at", desc=True)
            .execute()
            .data
        )

    async def get_chat_session(
        self, session_id: str, user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get a specific chat session"""
        result = (
            self.client.table("chat_history")
            .select("*")
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def update_chat_session(
        self,
        session_id: str,
        user_id: str,
        messages: List[Dict[str, str]],
        title: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Update chat session messages"""
        data = {"messages": messages, "updated_at": "now()"}
        if title:
            data["title"] = title

        return (
            self.client.table("chat_history")
            .update(data)
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )

    async def delete_chat_session(
        self, session_id: str, user_id: str
    ) -> Dict[str, Any]:
        """Delete a chat session"""
        return (
            self.client.table("chat_history")
            .delete()
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )

    # ==================== FLASHCARDS ====================

    async def create_flashcard(
        self,
        user_id: str,
        front: str,
        back: str,
        document_id: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """Create a new flashcard"""
        data = {
            "user_id": user_id,
            "document_id": document_id,
            "front": front,
            "back": back,
            **kwargs,
        }
        return self.client.table("flashcards").insert(data).execute()

    async def get_flashcards(
        self, user_id: str, document_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get flashcards for a user"""
        query = self.client.table("flashcards").select("*").eq("user_id", user_id)

        if document_id:
            query = query.eq("document_id", document_id)

        return query.execute().data

    async def update_flashcard(
        self, flashcard_id: str, user_id: str, **kwargs
    ) -> Dict[str, Any]:
        """Update flashcard (for spaced repetition)"""
        return (
            self.client.table("flashcards")
            .update(kwargs)
            .eq("id", flashcard_id)
            .eq("user_id", user_id)
            .execute()
        )

    async def delete_flashcard(self, flashcard_id: str, user_id: str) -> Dict[str, Any]:
        """Delete a flashcard"""
        return (
            self.client.table("flashcards")
            .delete()
            .eq("id", flashcard_id)
            .eq("user_id", user_id)
            .execute()
        )

    async def get_due_flashcards(self, user_id: str) -> List[Dict[str, Any]]:
        """Get flashcards due for review"""
        return (
            self.client.table("flashcards")
            .select("*")
            .eq("user_id", user_id)
            .lte("next_review", "now()")
            .execute()
            .data
        )

    # ==================== QUIZZES ====================

    async def create_quiz(
        self,
        user_id: str,
        questions: List[Dict[str, Any]],
        title: str,
        document_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a new quiz"""
        data = {
            "user_id": user_id,
            "document_id": document_id,
            "title": title,
            "questions": questions,
            "total_questions": len(questions),
        }
        return self.client.table("quizzes").insert(data).execute()

    async def get_quizzes(
        self, user_id: str, document_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get quizzes for a user"""
        query = self.client.table("quizzes").select("*").eq("user_id", user_id)

        if document_id:
            query = query.eq("document_id", document_id)

        return query.order("created_at", desc=True).execute().data

    async def complete_quiz(
        self, quiz_id: str, user_id: str, score: int
    ) -> Dict[str, Any]:
        """Mark quiz as completed"""
        return (
            self.client.table("quizzes")
            .update({"score": score, "completed_at": "now()"})
            .eq("id", quiz_id)
            .eq("user_id", user_id)
            .execute()
        )

    # ==================== USER ====================

    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile"""
        result = self.client.table("users").select("*").eq("id", user_id).execute()
        return result.data[0] if result.data else None

    async def update_user_profile(self, user_id: str, **kwargs) -> Dict[str, Any]:
        """Update user profile"""
        kwargs["updated_at"] = "now()"
        return self.client.table("users").update(kwargs).eq("id", user_id).execute()


def get_supabase_service(is_admin: bool = False) -> SupabaseService:
    """Get Supabase service instance"""
    return SupabaseService(is_admin=is_admin)
