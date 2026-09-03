from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal
from enum import Enum
from app.config import MAX_QUERY_LENGTH, MIN_QUERY_LENGTH


class FileType(str, Enum):
    PDF = "PDF"
    TXT = "TXT"
    DOCX = "DOCX"
    MD = "MD"
    RTF = "RTF"


class DocumentStatus(str, Enum):
    """Document processing status."""
    UPLOADING = "uploading"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"
    DELETED = "deleted"


class DocumentUpload(BaseModel):
    filename: str
    content: str  # Base64 encoded
    file_type: FileType


class DocumentResponse(BaseModel):
    """Document metadata response."""
    id: str
    filename: str
    status: DocumentStatus
    chunks: int
    highlights: int
    size: int
    created_at: Optional[str] = None
    error: Optional[str] = None


class ChatMessage(BaseModel):
    text: str = Field(..., min_length=MIN_QUERY_LENGTH, max_length=MAX_QUERY_LENGTH)
    use_web_search: bool = False
    model: Optional[str] = "gemini"  # "gemini" or "grok"
    level_up_mode: bool = False  # Level Up+ mode for enhanced responses

    @field_validator('text')
    @classmethod
    def validate_text(cls, v: str) -> str:
        """Validate query text length and content"""
        if not v or not v.strip():
            raise ValueError('Query text cannot be empty or whitespace only')
        if len(v) > MAX_QUERY_LENGTH:
            raise ValueError(f'Query text exceeds maximum length of {MAX_QUERY_LENGTH} characters')
        if len(v) < MIN_QUERY_LENGTH:
            raise ValueError(f'Query text must be at least {MIN_QUERY_LENGTH} character(s)')
        return v.strip()


class ContentBlock(BaseModel):
    """Structured content block from AI response"""
    type: Literal["text", "math", "code"]
    value: str
    language: Optional[str] = None  # For code blocks
    filename: Optional[str] = None  # Optional filename for code blocks


class ChatResponse(BaseModel):
    blocks: List[ContentBlock]  # Structured blocks instead of plain text
    suggestions: List[dict] = []
    sources: List[dict] = []


class ModelInfo(BaseModel):
    id: str
    name: str
    description: str
    is_local: bool


class HealthResponse(BaseModel):
    status: str
    version: str
    models_loaded: int
