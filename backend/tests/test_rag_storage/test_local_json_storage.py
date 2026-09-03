import pytest
import os
import json
import tempfile
from pathlib import Path

# Add backend to path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.rag_storage import (
    LocalJSONStorage, DocumentChunk, get_rag_storage_instance,
    get_rag_storage, RAGStorage
)


class TestLocalJSONStorage:
    """Tests for LocalJSONStorage backend."""

    def setup_method(self):
        """Set up a fresh storage instance for each test."""
        # Use a temp file to avoid polluting the real data file
        self.temp_file = tempfile.mktemp(suffix=".json")
        self.storage = LocalJSONStorage(storage_file=self.temp_file)

    def teardown_method(self):
        """Clean up after each test."""
        if os.path.exists(self.temp_file):
            os.remove(self.temp_file)

    def test_add_and_get_chunks(self):
        """Test adding chunks and retrieving them."""
        import asyncio

        async def _test():
            chunks = [
                DocumentChunk(
                    content="Machine learning is a subset of AI.",
                    embedding=[0.1, 0.2, 0.3],
                    document_id="doc_1",
                    filename="ml.pdf",
                    chunk_index=0,
                    total_chunks=1,
                    content_type="document",
                    user_id="user_1",
                ),
                DocumentChunk(
                    content="Deep learning uses neural networks.",
                    embedding=[0.4, 0.5, 0.6],
                    document_id="doc_1",
                    filename="ml.pdf",
                    chunk_index=1,
                    total_chunks=2,
                    content_type="document",
                    user_id="user_1",
                ),
            ]

            await self.storage.add_chunks(chunks, "user_1")
            retrieved = await self.storage.get_chunks("user_1")

            assert len(retrieved) == 2
            assert retrieved[0].content == "Machine learning is a subset of AI."
            assert retrieved[1].content == "Deep learning uses neural networks."

        asyncio.run(_test())

    def test_remove_document_chunks(self):
        """Test removing chunks for a specific document."""
        import asyncio

        async def _test():
            # Add chunks for doc_1
            chunks = [
                DocumentChunk(
                    content="Chunk 1 for doc 1.",
                    embedding=[0.1],
                    document_id="doc_1",
                    filename="doc1.pdf",
                    chunk_index=0,
                    total_chunks=2,
                    content_type="document",
                    user_id="user_1",
                ),
                DocumentChunk(
                    content="Chunk 2 for doc 1.",
                    embedding=[0.2],
                    document_id="doc_1",
                    filename="doc1.pdf",
                    chunk_index=1,
                    total_chunks=2,
                    content_type="document",
                    user_id="user_1",
                ),
                DocumentChunk(
                    content="Chunk for doc 2.",
                    embedding=[0.3],
                    document_id="doc_2",
                    filename="doc2.pdf",
                    chunk_index=0,
                    total_chunks=1,
                    content_type="document",
                    user_id="user_1",
                ),
            ]

            await self.storage.add_chunks(chunks, "user_1")

            # Remove doc_1 chunks
            removed = await self.storage.remove_document_chunks("doc_1", "user_1")
            assert removed == 2

            # Should only have doc_2 chunks remaining
            remaining = await self.storage.get_chunks("user_1")
            assert len(remaining) == 1
            assert remaining[0].document_id == "doc_2"

        asyncio.run(_test())

    def test_user_isolation(self):
        """Test that users have isolated storage."""
        import asyncio

        async def _test():
            # Add chunks for user_1
            chunks = [
                DocumentChunk(
                    content="User 1 data.",
                    embedding=[0.1],
                    document_id="doc_1",
                    filename="doc1.pdf",
                    chunk_index=0,
                    total_chunks=1,
                    content_type="document",
                    user_id="user_1",
                ),
            ]
            await self.storage.add_chunks(chunks, "user_1")

            # Add different chunks for user_2
            chunks2 = [
                DocumentChunk(
                    content="User 2 data.",
                    embedding=[0.2],
                    document_id="doc_2",
                    filename="doc2.pdf",
                    chunk_index=0,
                    total_chunks=1,
                    content_type="document",
                    user_id="user_2",
                ),
            ]
            await self.storage.add_chunks(chunks2, "user_2")

            # Verify isolation
            user1_chunks = await self.storage.get_chunks("user_1")
            user2_chunks = await self.storage.get_chunks("user_2")

            assert len(user1_chunks) == 1
            assert len(user2_chunks) == 1
            assert user1_chunks[0].user_id == "user_1"
            assert user2_chunks[0].user_id == "user_2"

        asyncio.run(_test())

    def test_clear_user_chunks(self):
        """Test clearing all chunks for a user."""
        import asyncio

        async def _test():
            chunks = [
                DocumentChunk(
                    content="Chunk 1.",
                    embedding=[0.1],
                    document_id="doc_1",
                    filename="doc1.pdf",
                    chunk_index=0,
                    total_chunks=1,
                    content_type="document",
                    user_id="user_1",
                ),
                DocumentChunk(
                    content="Chunk 2.",
                    embedding=[0.2],
                    document_id="doc_1",
                    filename="doc1.pdf",
                    chunk_index=1,
                    total_chunks=1,
                    content_type="document",
                    user_id="user_1",
                ),
            ]
            await self.storage.add_chunks(chunks, "user_1")

            assert await self.storage.get_chunk_count("user_1") == 2

            await self.storage.clear_user_chunks("user_1")

            assert await self.storage.get_chunk_count("user_1") == 0

        asyncio.run(_test())

    def test_get_document_info(self):
        """Test getting document info."""
        import asyncio

        async def _test():
            chunks = [
                DocumentChunk(
                    content="Content A.",
                    embedding=[0.1],
                    document_id="doc_1",
                    filename="file1.pdf",
                    chunk_index=0,
                    total_chunks=2,
                    content_type="document",
                    user_id="user_1",
                ),
                DocumentChunk(
                    content="Content B.",
                    embedding=[0.2],
                    document_id="doc_1",
                    filename="file1.pdf",
                    chunk_index=1,
                    total_chunks=2,
                    content_type="document",
                    user_id="user_1",
                ),
                DocumentChunk(
                    content="Content C.",
                    embedding=[0.3],
                    document_id="doc_2",
                    filename="file2.pdf",
                    chunk_index=0,
                    total_chunks=1,
                    content_type="highlight",
                    user_id="user_1",
                ),
            ]
            await self.storage.add_chunks(chunks, "user_1")

            info = await self.storage.get_document_info("user_1")

            assert info["total"] == 3
            assert len(info["files"]) == 2
            file_names = {f["filename"] for f in info["files"]}
            assert "file1.pdf" in file_names
            assert "file2.pdf" in file_names

        asyncio.run(_test())

    def test_storage_persistence(self):
        """Test that state is persisted to disk."""
        import asyncio

        async def _test():
            chunks = [
                DocumentChunk(
                    content="Persistent data.",
                    embedding=[0.1],
                    document_id="doc_1",
                    filename="test.pdf",
                    chunk_index=0,
                    total_chunks=1,
                    content_type="document",
                    user_id="user_1",
                ),
            ]
            await self.storage.add_chunks(chunks, "user_1")

            # Verify file was created
            assert os.path.exists(self.temp_file)

            # Read the file directly and verify content
            with open(self.temp_file, 'r') as f:
                state = json.load(f)

            assert "documents" in state
            user_docs = state["documents"].get("user_1", [])
            assert len(user_docs) == 1
            assert user_docs[0]["content"] == "Persistent data."

        asyncio.run(_test())
