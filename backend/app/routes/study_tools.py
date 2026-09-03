"""
Study Tools API endpoints for flashcards, quizzes, summaries, and takeaways.
All AI generation is done server-side using extracted document text.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from app.middleware.auth import get_current_user
from app.services.document_service import DocumentService
from app.services.rag_service_improved import get_rag_service_improved
import google.generativeai as genai
import os
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/study", tags=["study-tools"])
document_service = DocumentService()
rag_service = get_rag_service_improved()

# Initialize Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)


class FlashcardRequest(BaseModel):
    document_id: str
    count: int = Field(default=10, ge=1, le=50)


class FlashcardResponse(BaseModel):
    front: str
    back: str
    tags: List[str] = []


class QuizRequest(BaseModel):
    document_id: str
    question_count: int = Field(default=5, ge=1, le=20)
    difficulty: Literal["easy", "medium", "hard", "mixed"] = "mixed"


class QuizQuestionResponse(BaseModel):
    type: Literal["multiple-choice", "true-false", "short-answer"]
    question: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str
    difficulty: str


class SummaryRequest(BaseModel):
    document_id: str
    mode: Literal["brief", "detailed", "bullets"] = "detailed"


class TakeawaysRequest(BaseModel):
    document_id: str
    count: int = Field(default=5, ge=1, le=15)


def get_document_text(document_id: str, user_id: str) -> str:
    """Get extracted text for a document from RAG storage."""
    # Get chunks from RAG storage
    import asyncio
    chunks = asyncio.run(rag_service.storage.get_chunks(user_id))
    
    # Filter chunks for this document
    doc_chunks = [c for c in chunks if c.document_id == document_id and c.content_type == "document"]
    doc_chunks.sort(key=lambda x: x.chunk_index)
    
    if not doc_chunks:
        raise HTTPException(status_code=404, detail="Document not found or no text content")
    
    # Combine chunk texts
    return "\n\n".join([chunk.content for chunk in doc_chunks])


def generate_structured_response(prompt: str, model_name: str = "gemini-1.5-flash") -> dict:
    """Generate structured JSON response from Gemini."""
    model = genai.GenerativeModel(model_name)
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            response_mime_type="application/json",
        ),
    )
    return json.loads(response.text)


@router.post("/flashcards", response_model=List[FlashcardResponse])
async def generate_flashcards(
    request: FlashcardRequest, current_user: dict = Depends(get_current_user)
):
    """Generate flashcards from a document."""
    try:
        # Get document text
        text = get_document_text(request.document_id, current_user["uid"])
        
        prompt = f"""You are a study assistant helping students learn. Generate {request.count} high-quality flashcards from the following document content.

**Document Content:**
{text}

**Instructions:**
1. Create exactly {request.count} flashcards covering the most important concepts
2. Each flashcard should have:
   - Front: A clear, concise question or prompt
   - Back: A comprehensive answer with explanation
3. Vary difficulty levels (some easy recall, some deeper understanding)
4. Focus on key concepts, definitions, processes, and relationships
5. Make questions specific and unambiguous

**Format your response as a JSON array:**
[
  {{
    "front": "Question or prompt text",
    "back": "Answer with explanation",
    "tags": ["concept1", "concept2"]
  }}
]

Return ONLY the JSON array, no additional text or markdown code blocks."""

        flashcards_data = generate_structured_response(prompt)
        
        return [
            FlashcardResponse(
                front=fc["front"],
                back=fc["back"],
                tags=fc.get("tags", [])
            )
            for fc in flashcards_data
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Flashcard generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate flashcards")


@router.post("/quiz", response_model=List[QuizQuestionResponse])
async def generate_quiz(
    request: QuizRequest, current_user: dict = Depends(get_current_user)
):
    """Generate a quiz from a document."""
    try:
        # Get document text
        text = get_document_text(request.document_id, current_user["uid"])
        
        prompt = f"""You are a study assistant creating a quiz. Generate {request.question_count} quiz questions from the following document content.

**Document Content:**
{text}

**Instructions:**
1. Create exactly {request.question_count} questions
2. Difficulty level: {request.difficulty}
3. Mix question types:
   - Multiple choice (4 options, 1 correct)
   - True/False
   - Short answer
4. Include explanations for correct answers
5. Cover different topics from the document

**Format your response as a JSON array:**
[
  {{
    "type": "multiple-choice" | "true-false" | "short-answer",
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"], // only for multiple-choice
    "correct_answer": "The correct answer",
    "explanation": "Why this is correct and what concept it tests",
    "difficulty": "easy" | "medium" | "hard"
  }}
]

Return ONLY the JSON array, no additional text."""

        quiz_data = generate_structured_response(prompt)
        
        return [
            QuizQuestionResponse(
                type=q["type"],
                question=q["question"],
                options=q.get("options"),
                correct_answer=q["correct_answer"],
                explanation=q["explanation"],
                difficulty=q.get("difficulty", request.difficulty)
            )
            for q in quiz_data
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quiz generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate quiz")


@router.post("/summary")
async def generate_summary(
    request: SummaryRequest, current_user: dict = Depends(get_current_user)
):
    """Generate a summary of a document."""
    try:
        # Get document text
        text = get_document_text(request.document_id, current_user["uid"])
        
        if request.mode == "brief":
            prompt = f"""Provide a brief 2-3 sentence summary of the following content. Focus on the absolute main points only.

**Content:**
{text}

**Summary:**"""
        elif request.mode == "bullets":
            prompt = f"""Extract the key takeaways from the following content as a bulleted list. Include 5-10 main points.

**Content:**
{text}

**Key Takeaways:**
• """
        else:  # detailed
            prompt = f"""Provide a comprehensive summary of the following content. Include:
1. Main topic/thesis
2. Key concepts and their relationships
3. Important details and examples
4. Conclusions or implications

**Content:**
{text}

**Detailed Summary:**"""

        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        
        return {"summary": response.text, "mode": request.mode}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Summary generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate summary")


@router.post("/takeaways", response_model=List[str])
async def generate_takeaways(
    request: TakeawaysRequest, current_user: dict = Depends(get_current_user)
):
    """Extract key takeaways from a document."""
    try:
        # Get document text
        text = get_document_text(request.document_id, current_user["uid"])
        
        prompt = f"""Extract the {request.count} most important key takeaways from the following content. Each takeaway should be a single, clear statement.

**Content:**
{text}

**Format:**
Return ONLY a JSON array of strings:
["Takeaway 1", "Takeaway 2", "Takeaway 3", ...]

No additional text or formatting."""

        takeaways = generate_structured_response(prompt)
        return takeaways
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Takeaways generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate key takeaways")