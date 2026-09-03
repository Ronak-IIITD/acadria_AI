"""
Document service for processing uploaded files.
Handles text extraction, chunking, and document lifecycle management.
"""

import os
import json
import base64
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path


# Configuration from environment variables
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
MAX_FILES_PER_REQUEST = int(os.getenv("MAX_FILES_PER_REQUEST", "100"))
MAX_DOCUMENTS_PER_USER = int(os.getenv("MAX_DOCUMENTS_PER_USER", "100"))
MAX_CHUNK_SIZE_CHARS = int(os.getenv("MAX_CHUNK_SIZE_CHARS", "2000"))
MAX_CONTEXT_CHARS = int(os.getenv("MAX_CONTEXT_CHARS", "50000"))

# Supported file types
SUPPORTED_FILE_TYPES = [
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/markdown",
    "application/rtf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]

SUPPORTED_EXTENSIONS = ["pdf", "txt", "docx", "md", "rtf", "pptx"]


class DocumentService:
    """Service for document processing and lifecycle management."""

    def __init__(self):
        self.chunk_size = MAX_CHUNK_SIZE_CHARS
        self.chunk_overlap = MAX_CHUNK_SIZE_CHARS // 5

    def process_document(self, file_data: bytes, filename: str, user_id: str) -> Dict[str, Any]:
        """
        Process an uploaded document.
        
        Args:
            file_data: Raw file bytes
            filename: Original filename
            user_id: User ID
            
        Returns:
            Document processing result with status and metadata
        """
        try:
            self._validate_file(filename, file_data)
            
            text = self._extract_text(file_data, filename)
            
            if not text.strip():
                return {
                    "status": "failed",
                    "error": "No text could be extracted from the document",
                    "chunks": 0,
                }
            
            chunks = self._chunk_text(text)
            
            return {
                "status": "ready",
                "chunks": len(chunks),
                "filename": filename,
                "text_length": len(text),
            }
            
        except Exception as e:
            raise Exception(f"Error processing document: {str(e)}")

    def _validate_file(self, filename: str, file_data: bytes) -> None:
        """Validate file type and size."""
        ext = Path(filename).suffix.lower()
        
        if ext not in SUPPORTED_EXTENSIONS:
            raise ValueError(f"Invalid file type: {ext}")
        
        if len(file_data) > MAX_FILE_SIZE_BYTES:
            raise ValueError(f"File too large: {len(file_data) / (1024 * 1024):.1f}MB. Max: {MAX_FILE_SIZE_MB}MB")

    def _extract_text(self, file_data: bytes, filename: str) -> str:
        """Extract text from uploaded file based on type."""
        ext = Path(filename).suffix.lower()
        
        if ext in ('.txt', '.md'):
            return file_data.decode('utf-8', errors='replace')
        elif ext == '.rtf':
            return file_data.decode('latin-1', errors='replace') if file_data else ""
        elif ext == '.pdf':
            return file_data[:1000].decode('utf-8', errors='replace') if file_data else ""
        elif ext == '.docx':
            return file_data[:1000].decode('utf-8', errors='replace') if file_data else ""
        elif ext == '.pptx':
            return file_data[:1000].decode('utf-8', errors='replace') if file_data else ""
        else:
            return file_data.decode('utf-8', errors='replace') if file_data else ""

    def _chunk_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks."""
        if not text or not text.strip():
            return []
        
        chunk_size = self.chunk_size
        overlap = self.chunk_overlap
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end].strip()
            
            if chunk:
                chunks.append(chunk)
            
            start = end - overlap
            if start <= 0:
                start = end
                if start >= len(text):
                    break
        
        return chunks

    def get_document_status(self, document_id: str, user_id: str) -> Dict[str, Any]:
        """Get document processing status."""
        return {
            "document_id": document_id,
            "status": "unknown",
            "chunks": 0,
            "user_id": user_id,
        }

    def list_user_documents(self, user_id: str) -> List[Dict[str, Any]]:
        """List all documents for a user."""
        return []
