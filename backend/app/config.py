"""
Configuration settings for the StudySync AI backend.
"""

import os
from typing import List

# File Upload Limits
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "50"))  # 50 MB default
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024  # Derived from MB env var
MAX_FILES_PER_REQUEST = int(os.getenv("MAX_FILES_PER_REQUEST", "100"))  # 100 files max
MAX_DOCUMENTS_PER_USER = int(os.getenv("MAX_DOCUMENTS_PER_USER", "100"))  # 100 docs per user
MAX_CHUNK_SIZE_CHARS = int(os.getenv("MAX_CHUNK_SIZE_CHARS", "2000"))  # Max chunk size for RAG
MAX_CONTEXT_CHARS = int(os.getenv("MAX_CONTEXT_CHARS", "50000"))  # Max context sent to AI

# Supported file types (MIME types)
SUPPORTED_FILE_TYPES = [
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
    "text/markdown",
    "application/rtf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",  # .pptx
]

SUPPORTED_EXTENSIONS = ["pdf", "txt", "docx", "md", "rtf", "pptx"]

# Magic bytes for file signature validation (first 4-8 bytes)
# PDF starts with %PNG, DOCX starts with "PK", TXT/MD/RTF have no specific magic bytes
FILE_SIGNATURES = {
    "pdf": b"%PDF",
    "docx": b"PK\x03\x04",  # Office Open XML signature
}

# Query Validation
MAX_QUERY_LENGTH = int(os.getenv("MAX_QUERY_LENGTH", "5000"))  # 5000 chars
MIN_QUERY_LENGTH = int(os.getenv("MIN_QUERY_LENGTH", "1"))

# API Configuration
BACKEND_PORT = int(os.getenv("PORT", "8000"))
BACKEND_HOST = os.getenv("HOST", "0.0.0.0")

# Clerk Configuration
CLERK_JWT_ISSUER = os.getenv("CLERK_JWT_ISSUER", "")
CLERK_JWT_AUDIENCE = os.getenv("CLERK_JWT_AUDIENCE", "")
CLERK_JWT_SECRET = os.getenv("CLERK_JWT_SECRET", "")

# AI Model Retry Configuration
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))  # Max retry attempts for model errors
INITIAL_RETRY_DELAY = int(os.getenv("INITIAL_RETRY_DELAY", "2"))  # Initial delay in seconds
MAX_RETRY_DELAY = int(os.getenv("MAX_RETRY_DELAY", "10"))  # Maximum delay in seconds
FALLBACK_MODEL = os.getenv("FALLBACK_MODEL", "gemini-1.5-pro")  # Fallback model when primary fails

# Document Processing Limits
MAX_PAGES_PER_DOCUMENT = int(os.getenv("MAX_PAGES_PER_DOCUMENT", "500"))  # Prevent OOM on huge PDFs
MAX_EXTRACTION_CHARS_PER_PAGE = int(os.getenv("MAX_EXTRACTION_CHARS_PER_PAGE", "5000"))  # Per-page limit
MAX_TOTAL_EXTRACTION_CHARS = int(os.getenv("MAX_TOTAL_EXTRACTION_CHARS", "200000"))  # Total doc extraction limit
