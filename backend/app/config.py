"""
Configuration settings for the StudySync AI backend.
"""
import os
from typing import List

# File Upload Limits
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "50"))  # 50 MB default
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
MAX_FILES_PER_REQUEST = int(os.getenv("MAX_FILES_PER_REQUEST", "10"))  # 10 files max
MAX_DOCUMENTS_PER_USER = int(os.getenv("MAX_DOCUMENTS_PER_USER", "100"))  # 100 docs per user

# Supported file types
SUPPORTED_FILE_TYPES = [
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
    "text/markdown",
    "application/rtf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",  # .pptx
]

SUPPORTED_EXTENSIONS = ["pdf", "txt", "docx", "md", "rtf", "pptx"]

# Query Validation
MAX_QUERY_LENGTH = int(os.getenv("MAX_QUERY_LENGTH", "5000"))  # 5000 chars
MIN_QUERY_LENGTH = int(os.getenv("MIN_QUERY_LENGTH", "1"))

# API Configuration
BACKEND_PORT = int(os.getenv("PORT", "8000"))
BACKEND_HOST = os.getenv("HOST", "0.0.0.0")
