"""
RAG Storage Abstraction Layer

Provides a unified interface for RAG document storage with multiple backends:
- LocalJSONStorage: Development/local testing (uses JSON file)
- PostgresVectorStorage: Production (uses PostgreSQL + pgvector)

This allows the same RAG service code to work in both environments.
"""

import os
import json
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class DocumentChunk:
    """Represents a document chunk with embedding."""
    content: str
    embedding: Optional[List[float]]
    document_id: str
    filename: str
    chunk_index: int
    total_chunks: int
    content_type: str  # "document" or "highlight"
    user_id: str
    # Optional highlight-specific fields
    highlight_color: Optional[str] = None
    highlight_count: Optional[int] = None


@dataclass
class ChatMessage:
    """Represents a chat message."""
    role: str  # "user" or "assistant"
    content: str
    timestamp: float


class RAGStorage(ABC):
    """Abstract base class for RAG storage backends."""

    @abstractmethod
    async def add_chunks(self, chunks: List[DocumentChunk], user_id: str) -> None:
        """Add document chunks to storage."""
        pass

    @abstractmethod
    async def get_chunks(self, user_id: str) -> List[DocumentChunk]:
        """Get all chunks for a user."""
        pass

    @abstractmethod
    async def remove_document_chunks(self, document_id: str, user_id: str) -> int:
        """Remove all chunks for a document. Returns count removed."""
        pass

    @abstractmethod
    async def clear_user_chunks(self, user_id: str) -> None:
        """Clear all chunks for a user."""
        pass

    @abstractmethod
    async def get_chunk_count(self, user_id: str) -> int:
        """Get total chunk count for a user."""
        pass

    @abstractmethod
    async def get_document_info(self, user_id: str) -> Dict[str, Any]:
        """Get document info for debugging."""
        pass

    # Chat history methods
    @abstractmethod
    async def add_chat_messages(self, messages: List[ChatMessage], user_id: str) -> None:
        """Add chat messages to history."""
        pass

    @abstractmethod
    async def get_chat_history(self, user_id: str, limit: int = 6) -> List[ChatMessage]:
        """Get recent chat history for a user."""
        pass

    @abstractmethod
    async def clear_chat_history(self, user_id: str) -> None:
        """Clear chat history for a user."""
        pass


class LocalJSONStorage(RAGStorage):
    """
    Local JSON file storage for development.
    Not suitable for production (no concurrency, no vector search).
    """

    def __init__(self, storage_file: str = "data/rag_storage.json"):
        self.storage_file = storage_file
        self._documents: Dict[str, List[DocumentChunk]] = {}
        self._chat_history: Dict[str, List[ChatMessage]] = {}
        self._load_state()

    def _load_state(self) -> None:
        """Load state from JSON file."""
        if not os.path.exists(self.storage_file):
            return

        try:
            with open(self.storage_file, 'r') as f:
                state = json.load(f)

            # Load documents
            docs_data = state.get("documents", {})
            for user_id, chunks_data in docs_data.items():
                self._documents[user_id] = [
                    DocumentChunk(**chunk) for chunk in chunks_data
                ]

            # Load chat history
            chat_data = state.get("chat_history", {})
            for user_id, messages_data in chat_data.items():
                self._chat_history[user_id] = [
                    ChatMessage(**msg) for msg in messages_data
                ]

            total_chunks = sum(len(chunks) for chunks in self._documents.values())
            logger.info(f"Loaded RAG state: {total_chunks} chunks, {len(self._chat_history)} chat sessions")
        except Exception as e:
            logger.error(f"Failed to load RAG state: {e}")

    def _save_state(self) -> None:
        """Save state to JSON file (atomic write)."""
        try:
            os.makedirs(os.path.dirname(self.storage_file), exist_ok=True)
            state = {
                "documents": {
                    user_id: [chunk.__dict__ for chunk in chunks]
                    for user_id, chunks in self._documents.items()
                },
                "chat_history": {
                    user_id: [msg.__dict__ for msg in messages]
                    for user_id, messages in self._chat_history.items()
                }
            }
            temp_file = f"{self.storage_file}.tmp"
            with open(temp_file, 'w') as f:
                json.dump(state, f)
            os.replace(temp_file, self.storage_file)
            logger.debug("RAG state saved to disk")
        except Exception as e:
            logger.error(f"Failed to save RAG state: {e}")

    async def add_chunks(self, chunks: List[DocumentChunk], user_id: str) -> None:
        if not chunks:
            logger.warning("Attempted to add empty chunks list")
            return

        if user_id not in self._documents:
            self._documents[user_id] = []

        self._documents[user_id].extend(chunks)
        logger.info(f"Added {len(chunks)} chunks for user {user_id}. Total: {len(self._documents[user_id])}")
        self._save_state()

    async def get_chunks(self, user_id: str) -> List[DocumentChunk]:
        return self._documents.get(user_id, [])

    async def remove_document_chunks(self, document_id: str, user_id: str) -> int:
        if user_id not in self._documents:
            return 0

        user_chunks = self._documents[user_id]
        initial_count = len(user_chunks)
        self._documents[user_id] = [
            chunk for chunk in user_chunks if chunk.document_id != document_id
        ]
        removed_count = initial_count - len(self._documents[user_id])

        if removed_count > 0:
            logger.info(f"Removed {removed_count} chunks for document {document_id}")
            self._save_state()
        else:
            logger.warning(f"No chunks found for document {document_id}")

        return removed_count

    async def clear_user_chunks(self, user_id: str) -> None:
        if user_id in self._documents:
            self._documents[user_id] = []
            logger.info(f"Cleared documents for user {user_id}")
            self._save_state()

    async def get_chunk_count(self, user_id: str) -> int:
        return len(self._documents.get(user_id, []))

    async def get_document_info(self, user_id: str) -> Dict[str, Any]:
        docs_to_check = self._documents.get(user_id, [])

        if not docs_to_check:
            return {"total": 0, "files": []}

        files = {}
        for chunk in docs_to_check:
            filename = chunk.filename
            if filename not in files:
                files[filename] = {
                    "filename": filename,
                    "chunks": 0,
                    "has_embeddings": 0,
                    "content_types": {}
                }
            files[filename]["chunks"] += 1
            if chunk.embedding is not None:
                files[filename]["has_embeddings"] += 1
            content_type = chunk.content_type
            files[filename]["content_types"][content_type] = \
                files[filename]["content_types"].get(content_type, 0) + 1

        return {
            "total": len(docs_to_check),
            "files": list(files.values())
        }

    async def add_chat_messages(self, messages: List[ChatMessage], user_id: str) -> None:
        if user_id not in self._chat_history:
            self._chat_history[user_id] = []
        self._chat_history[user_id].extend(messages)
        self._save_state()

    async def get_chat_history(self, user_id: str, limit: int = 6) -> List[ChatMessage]:
        history = self._chat_history.get(user_id, [])
        return history[-limit:] if history else []

    async def clear_chat_history(self, user_id: str) -> None:
        if user_id in self._chat_history:
            self._chat_history[user_id] = []
            logger.info(f"Cleared chat history for user {user_id}")
            self._save_state()


class PostgresVectorStorage(RAGStorage):
    """
    PostgreSQL + pgvector storage for production.
    Requires: pip install asyncpg pgvector
    Environment variables: DATABASE_URL or PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
    """

    def __init__(self):
        self._pool = None
        self._initialized = False

    async def _get_pool(self):
        """Get or create connection pool."""
        if self._pool is None:
            import asyncpg
            database_url = os.getenv("DATABASE_URL")
            if not database_url:
                raise RuntimeError("DATABASE_URL environment variable required for PostgresVectorStorage")
            self._pool = await asyncpg.create_pool(database_url)
            await self._init_schema()
        return self._pool

    async def _init_schema(self) -> None:
        """Initialize database schema with pgvector."""
        if self._initialized:
            return

        pool = await self._get_pool()
        async with pool.acquire() as conn:
            # Enable pgvector extension
            await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")

            # Create documents table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS rag_documents (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id TEXT NOT NULL,
                    document_id TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    chunk_index INT NOT NULL,
                    total_chunks INT NOT NULL,
                    content_type TEXT NOT NULL,
                    content TEXT NOT NULL,
                    embedding VECTOR(768),
                    highlight_color TEXT,
                    highlight_count INT,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(document_id, chunk_index)
                )
            """)

            # Create index for user lookups
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_rag_documents_user_id
                ON rag_documents(user_id)
            """)

            # Create index for document lookups
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_rag_documents_document_id
                ON rag_documents(document_id)
            """)

            # Create chat history table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS rag_chat_history (
                    id BIGSERIAL PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp DOUBLE PRECISION NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)

            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_rag_chat_history_user_id
                ON rag_chat_history(user_id)
            """)

        self._initialized = True
        logger.info("PostgreSQL RAG schema initialized")

    async def add_chunks(self, chunks: List[DocumentChunk], user_id: str) -> None:
        if not chunks:
            return

        pool = await self._get_pool()
        async with pool.acquire() as conn:
            async with conn.transaction():
                for chunk in chunks:
                    await conn.execute("""
                        INSERT INTO rag_documents
                        (user_id, document_id, filename, chunk_index, total_chunks,
                         content_type, content, embedding, highlight_color, highlight_count)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        ON CONFLICT (document_id, chunk_index) DO UPDATE SET
                            content = EXCLUDED.content,
                            embedding = EXCLUDED.embedding,
                            highlight_color = EXCLUDED.highlight_color,
                            highlight_count = EXCLUDED.highlight_count
                    """,
                        user_id,
                        chunk.document_id,
                        chunk.filename,
                        chunk.chunk_index,
                        chunk.total_chunks,
                        chunk.content_type,
                        chunk.content,
                        chunk.embedding,
                        chunk.highlight_color,
                        chunk.highlight_count
                    )

        logger.info(f"Added {len(chunks)} chunks to PostgreSQL for user {user_id}")

    async def get_chunks(self, user_id: str) -> List[DocumentChunk]:
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT document_id, filename, chunk_index, total_chunks,
                       content_type, content, embedding, highlight_color, highlight_count
                FROM rag_documents
                WHERE user_id = $1
                ORDER BY document_id, chunk_index
            """, user_id)

        return [
            DocumentChunk(
                content=row["content"],
                embedding=list(row["embedding"]) if row["embedding"] else None,
                document_id=row["document_id"],
                filename=row["filename"],
                chunk_index=row["chunk_index"],
                total_chunks=row["total_chunks"],
                content_type=row["content_type"],
                user_id=user_id,
                highlight_color=row["highlight_color"],
                highlight_count=row["highlight_count"]
            )
            for row in rows
        ]

    async def remove_document_chunks(self, document_id: str, user_id: str) -> int:
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            result = await conn.execute("""
                DELETE FROM rag_documents
                WHERE document_id = $1 AND user_id = $2
            """, document_id, user_id)

            # Extract count from "DELETE N" result
            removed = int(result.split()[-1]) if result else 0

        if removed > 0:
            logger.info(f"Removed {removed} chunks for document {document_id}")
        return removed

    async def clear_user_chunks(self, user_id: str) -> None:
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            await conn.execute("DELETE FROM rag_documents WHERE user_id = $1", user_id)
        logger.info(f"Cleared documents for user {user_id}")

    async def get_chunk_count(self, user_id: str) -> int:
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            count = await conn.fetchval(
                "SELECT COUNT(*) FROM rag_documents WHERE user_id = $1", user_id
            )
        return count or 0

    async def get_document_info(self, user_id: str) -> Dict[str, Any]:
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT filename, COUNT(*) as chunks,
                       COUNT(embedding) as has_embeddings,
                       content_type
                FROM rag_documents
                WHERE user_id = $1
                GROUP BY filename, content_type
            """, user_id)

        files = {}
        for row in rows:
            filename = row["filename"]
            if filename not in files:
                files[filename] = {
                    "filename": filename,
                    "chunks": 0,
                    "has_embeddings": 0,
                    "content_types": {}
                }
            files[filename]["chunks"] += row["chunks"]
            files[filename]["has_embeddings"] += row["has_embeddings"]
            content_type = row["content_type"]
            files[filename]["content_types"][content_type] = \
                files[filename]["content_types"].get(content_type, 0) + row["chunks"]

        return {
            "total": sum(f["chunks"] for f in files.values()),
            "files": list(files.values())
        }

    async def add_chat_messages(self, messages: List[ChatMessage], user_id: str) -> None:
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            async with conn.transaction():
                for msg in messages:
                    await conn.execute("""
                        INSERT INTO rag_chat_history (user_id, role, content, timestamp)
                        VALUES ($1, $2, $3, $4)
                    """, user_id, msg.role, msg.content, msg.timestamp)

    async def get_chat_history(self, user_id: str, limit: int = 6) -> List[ChatMessage]:
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT role, content, timestamp
                FROM rag_chat_history
                WHERE user_id = $1
                ORDER BY timestamp DESC
                LIMIT $2
            """, user_id, limit)

        return [
            ChatMessage(role=row["role"], content=row["content"], timestamp=row["timestamp"])
            for row in reversed(rows)  # Return in chronological order
        ]

    async def clear_chat_history(self, user_id: str) -> None:
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            await conn.execute("DELETE FROM rag_chat_history WHERE user_id = $1", user_id)
        logger.info(f"Cleared chat history for user {user_id}")

    async def close(self) -> None:
        """Close connection pool."""
        if self._pool:
            await self._pool.close()
            self._pool = None


# Factory function to get the appropriate storage backend
def get_rag_storage() -> RAGStorage:
    """
    Get the appropriate RAG storage backend based on environment.
    Uses PostgresVectorStorage if DATABASE_URL is set, otherwise LocalJSONStorage.
    """
    if os.getenv("DATABASE_URL"):
        logger.info("Using PostgreSQL + pgvector for RAG storage")
        return PostgresVectorStorage()
    else:
        logger.info("Using local JSON storage for RAG (development mode)")
        return LocalJSONStorage()


# Singleton instance
_rag_storage_instance: Optional[RAGStorage] = None


def get_rag_storage_instance() -> RAGStorage:
    """Get singleton RAG storage instance."""
    global _rag_storage_instance
    if _rag_storage_instance is None:
        _rag_storage_instance = get_rag_storage()
    return _rag_storage_instance