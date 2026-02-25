from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.middleware.auth import get_current_user
from app.services.supabase_service import get_supabase_service

router = APIRouter()


class HighlightCreate(BaseModel):
    document_id: str
    content: str
    color: str = "yellow"
    page_number: Optional[int] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None


class HighlightResponse(BaseModel):
    id: str
    document_id: str
    content: str
    color: str
    page_number: Optional[int]
    created_at: str


@router.post("/highlights", response_model=HighlightResponse)
async def create_highlight(
    highlight: HighlightCreate, current_user: dict = Depends(get_current_user)
):
    """Create a new highlight for a document"""
    try:
        supabase = get_supabase_service()

        result = supabase.create_highlight(
            user_id=current_user["uid"],
            document_id=highlight.document_id,
            content=highlight.content,
            color=highlight.color,
            page_number=highlight.page_number,
            position_x=highlight.position_x,
            position_y=highlight.position_y,
            width=highlight.width,
            height=highlight.height,
        )

        if result.data:
            return result.data[0]
        raise HTTPException(status_code=500, detail="Failed to create highlight")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/highlights", response_model=List[HighlightResponse])
async def get_highlights(
    document_id: Optional[str] = None, current_user: dict = Depends(get_current_user)
):
    """Get all highlights for the user, optionally filtered by document"""
    try:
        supabase = get_supabase_service()
        highlights = supabase.get_highlights(
            user_id=current_user["uid"], document_id=document_id
        )

        return [
            HighlightResponse(
                id=h["id"],
                document_id=h["document_id"],
                content=h["content"],
                color=h["color"],
                page_number=h.get("page_number"),
                created_at=h["created_at"],
            )
            for h in highlights
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/highlights/summary")
async def get_highlights_summary(
    document_id: str, current_user: dict = Depends(get_current_user)
):
    """Get highlights grouped by color for a document"""
    try:
        supabase = get_supabase_service()
        highlights = supabase.get_highlights_summary(
            user_id=current_user["uid"], document_id=document_id
        )

        # Group by color
        by_color = {}
        for h in highlights:
            color = h.get("color", "yellow")
            if color not in by_color:
                by_color[color] = []
            by_color[color].append(
                {
                    "id": h["id"],
                    "content": h["content"],
                    "page_number": h.get("page_number"),
                    "created_at": h["created_at"],
                }
            )

        return {"total": len(highlights), "by_color": by_color}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/highlights/{highlight_id}")
async def delete_highlight(
    highlight_id: str, current_user: dict = Depends(get_current_user)
):
    """Delete a highlight"""
    try:
        supabase = get_supabase_service()
        supabase.delete_highlight(
            highlight_id=highlight_id, user_id=current_user["uid"]
        )

        return {"message": "Highlight deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
