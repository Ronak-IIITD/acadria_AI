from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.document_service import DocumentService
from typing import List
import base64

router = APIRouter()
document_service = DocumentService()

@router.post("/upload")
async def upload_documents(files: List[UploadFile] = File(...)):
    """
    Upload one or more document files.
    Supported formats: PDF, TXT, DOCX, MD, RTF
    """
    try:
        results = []
        for file in files:
            # Read file content
            content = await file.read()
            
            # Process document
            doc_id = await document_service.process_document(
                filename=file.filename,
                content=content,
                content_type=file.content_type
            )
            
            results.append({
                "filename": file.filename,
                "document_id": doc_id,
                "status": "success"
            })
        
        return {"documents": results, "total": len(results)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a specific document from the vector store"""
    try:
        await document_service.delete_document(document_id)
        return {"message": f"Document {document_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents")
async def list_documents():
    """List all uploaded documents"""
    try:
        documents = await document_service.list_documents()
        return {"documents": documents, "total": len(documents)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
