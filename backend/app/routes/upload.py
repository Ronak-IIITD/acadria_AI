from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.services.document_service import DocumentService
from app.middleware.auth import get_current_user
from app.config import (
    MAX_FILE_SIZE_BYTES,
    MAX_FILES_PER_REQUEST,
    MAX_FILE_SIZE_MB,
    SUPPORTED_EXTENSIONS
)
from typing import List
import base64

router = APIRouter()
document_service = DocumentService()


def validate_file(file: UploadFile) -> None:
    """
    Validate uploaded file for size and type.

    Raises:
        HTTPException: If validation fails
    """
    # Check file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: .{file_extension}. Supported types: {', '.join(SUPPORTED_EXTENSIONS)}"
        )

    # Note: file.size is not available in FastAPI's UploadFile
    # We'll check size after reading the content

@router.post("/upload")
async def upload_documents(files: List[UploadFile] = File(...), current_user: dict = Depends(get_current_user)):
    """
    Upload one or more document files.
    Supported formats: PDF, TXT, DOCX, MD, RTF, PPTX

    Limits:
    - Max file size: 50MB per file
    - Max files per request: 10
    """
    try:
        # Validate number of files
        if len(files) > MAX_FILES_PER_REQUEST:
            raise HTTPException(
                status_code=400,
                detail=f"Too many files. Maximum {MAX_FILES_PER_REQUEST} files per request."
            )

        print(f"📤 User {current_user['uid']} uploading {len(files)} file(s)")
        results = []

        for file in files:
            # Validate file type
            validate_file(file)

            # Read file content
            content = await file.read()

            # Validate file size
            file_size_mb = len(content) / (1024 * 1024)
            if len(content) > MAX_FILE_SIZE_BYTES:
                results.append({
                    "filename": file.filename,
                    "status": "error",
                    "error": f"File too large: {file_size_mb:.2f}MB. Maximum: {MAX_FILE_SIZE_MB}MB"
                })
                continue

            print(f"  📄 {file.filename} ({file_size_mb:.2f}MB)")
            
            # Process document
            doc_id = await document_service.process_document(
                filename=file.filename,
                content=content,
                content_type=file.content_type,
                user_id=current_user['uid']
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
async def delete_document(document_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a specific document from the vector store"""
    try:
        print(f"🗑️ User {current_user['uid']} deleting document {document_id}")
        await document_service.delete_document(document_id, user_id=current_user['uid'])
        return {"message": f"Document {document_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents")
async def list_documents(current_user: dict = Depends(get_current_user)):
    """List all uploaded documents"""
    try:
        print(f"📋 User {current_user['uid']} listing documents")
        documents = await document_service.list_documents(user_id=current_user['uid'])
        return {"documents": documents, "total": len(documents)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
