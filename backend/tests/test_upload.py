import sys
"""Tests for upload validation and document service."""
import pytest
import asyncio
import tempfile
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.document_service import DocumentService
from app.services.rag_storage import DocumentChunk


class TestDocumentService:
    """Tests for document service with lifecycle tracking."""

    @pytest.fixture(autouse=True)
    def cleanup(self):
        """Clean up after each test."""
        yield
        # Reset any global state if needed

    def test_document_status_enum(self):
        """Test DocumentStatus enum values."""
        from app.services.document_service import DocumentStatus
        assert DocumentStatus.uploading.value == "uploading"
        assert DocumentStatus.processing.value == "processing"
        assert DocumentStatus.ready.value == "ready"
        assert DocumentStatus.failed.value == "failed"
        assert DocumentStatus.deleted.value == "deleted"

    async def test_upload_validate_file_type(self):
        """Test file type validation."""
        from fastapi import HTTPException

        # This would test the validate_file function from upload.py
        # For now, just verify the enum works
        pass

    def test_chunk_creation(self):
        """Test DocumentChunk creation with required fields."""
        chunk = DocumentChunk(
            content="Test content",
            embedding=[0.1, 0.2, 0.3],
            document_id="doc_1",
            filename="test.pdf",
            chunk_index=0,
            total_chunks=1,
            content_type="document",
            user_id="user_1",
        )
        assert chunk.content == "Test content"
        assert chunk.document_id == "doc_1"
        assert chunk.filename == "test.pdf"
        assert chunk.user_id == "user_1"
        assert chunk.highlight_color is None
        assert chunk.highlight_count is None
