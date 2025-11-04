from pydantic import BaseModel
from typing import List, Optional, Literal
from enum import Enum

class FileType(str, Enum):
    PDF = "PDF"
    TXT = "TXT"
    DOCX = "DOCX"
    MD = "MD"
    RTF = "RTF"

class DocumentUpload(BaseModel):
    filename: str
    content: str  # Base64 encoded
    file_type: FileType

class ChatMessage(BaseModel):
    text: str
    use_web_search: bool = False

class ContentBlock(BaseModel):
    """Structured content block from AI response"""
    type: Literal["text", "math", "code"]
    value: str
    language: Optional[str] = None  # For code blocks
    filename: Optional[str] = None  # Optional filename for code blocks

class ChatResponse(BaseModel):
    blocks: List[ContentBlock]  # Structured blocks instead of plain text
    suggestions: List[dict] = []
    sources: List[str] = []

class ModelInfo(BaseModel):
    id: str
    name: str
    description: str
    is_local: bool

class HealthResponse(BaseModel):
    status: str
    version: str
    models_loaded: int
