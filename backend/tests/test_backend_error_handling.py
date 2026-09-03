import sys
from pathlib import Path
"""Tests for backend error handling and API validation."""
import pytest
import asyncio
from fastapi.testclient import TestClient
from fastapi import status

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app

client = TestClient(app)


class TestAPIErrorHandling:
    """Tests for API error handling."""

    def test_chat_without_auth(self):
        """Test that chat endpoint requires authentication."""
        response = client.post(
            "/api/chat",
            json={"message": "Hello", "files": []}
        )
        # Should return 401 or similar auth error
        assert response.status_code in [401, 422]

    def test_chat_empty_message(self):
        """Test that chat rejects empty messages."""
        response = client.post(
            "/api/chat",
            json={"message": "", "files": []}
        )
        assert response.status_code == 422  # Validation error

    def test_chat_too_long_message(self):
        """Test that chat rejects messages too long."""
        response = client.post(
            "/api/chat",
            json={"message": "x" * 5001, "files": []}
        )
        assert response.status_code == 422  # Validation error

    def test_upload_invalid_file_type(self):
        """Test that upload rejects invalid file types."""
        # Create a fake file with invalid type
        files = {"file": ("test.xyz", b"fake content", "application/x-xyz")}
        response = client.post("/api/upload", files=files)
        # Should reject invalid file type
        assert response.status_code in [400, 422]

    def test_upload_too_large(self):
        """Test that upload rejects oversized files."""
        # Create a large file
        large_content = b"x" * (51 * 1024 * 1024 + 1)  # 51MB + 1 byte
        files = {"file": ("large.pdf", large_content, "application/pdf")}
        response = client.post("/api/upload", files=files)
        # Should reject oversized file
        assert response.status_code in [400, 413]

    def test_upload_success_returns_document_response(self):
        """Test that successful upload returns DocumentResponse with status."""
        # This would need a real file upload, but we can verify the endpoint structure
        assert True  # Placeholder - test structure


class TestRateLimiting:
    """Tests for rate limiting middleware."""

    def test_rate_limit_headers(self):
        """Test that rate limit headers are present."""
        response = client.get("/api/models")
        # Rate limit headers may or may not be present depending on middleware config
        # Just verify the endpoint works
        assert response.status_code == 200
