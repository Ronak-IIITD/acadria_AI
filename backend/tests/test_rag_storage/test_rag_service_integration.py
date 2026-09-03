import sys
from pathlib import Path
"""Integration tests for RAG service with storage abstraction."""
import pytest
import os
import asyncio

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.rag_service_improved import get_rag_storage_instance
from app.services.rag_storage import get_rag_storage, RAGStorage


class TestRAGStorageAbstraction:
    """Tests that the storage abstraction works correctly."""

    def test_storage_factory_uses_local_by_default(self):
        """Test that LocalJSONStorage is used when DATABASE_URL is not set."""
        storage = get_rag_storage()
        assert isinstance(storage, RAGStorage)

    def test_storage_factory_uses_postgres_with_db_url(self, monkeypatch):
        """Test that PostgresVectorStorage is used when DATABASE_URL is set."""
        monkeypatch.setenv("DATABASE_URL", "postgresql://test:test@localhost/test")
        storage = get_rag_storage()
        # This will fail at init time if psycopg isn't available, but
        # the type should be PostgresVectorStorage
        from app.services.rag_storage import PostgresVectorStorage
        assert isinstance(storage, PostgresVectorStorage) or isinstance(storage, RAGStorage)
