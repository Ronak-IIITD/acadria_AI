from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.services.document_service import DocumentService
from app.middleware.auth import get_current_user
from app.config import (
    MAX_FILE_SIZE_BYTES,
    MAX_FILES_PER_REQUEST,
    MAX_FILE_SIZE_MB,
    SUPPORTED_EXTENSIONS,
    MAX_DOCUMENTS_PER_USER,
)
from typing import List, Optional
import asyncio

router = APIRouter()
document_service = DocumentService()

upload_progress: dict = {}


def validate_file(file: UploadFile) -> None:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: .{file_extension}. Supported types: {', '.join(SUPPORTED_EXTENSIONS)}",
        )


@router.post("/upload")
async def upload_documents(
    files: List[UploadFile] = File(...), current_user: dict = Depends(get_current_user)
):
    """
    Upload one or more document files.
    Supported formats: PDF, TXT, DOCX, MD, RTF, PPTX

    Limits:
    - Max file size: 50MB per file
    - Max files per request: 100
    - Max documents per user: 100
    """
    try:
        user_id = current_user["uid"]

        if len(files) > MAX_FILES_PER_REQUEST:
            raise HTTPException(
                status_code=400,
                detail=f"Too many files. Maximum {MAX_FILES_PER_REQUEST} files per request.",
            )

        print(f"📤 User {user_id} uploading {len(files)} file(s)")

        existing_docs = await document_service.list_documents(user_id)
        if len(existing_docs) >= MAX_DOCUMENTS_PER_USER:
            raise HTTPException(
                status_code=400,
                detail=f"You've reached the maximum of {MAX_DOCUMENTS_PER_USER} documents. Please delete some to upload more.",
            )

        available_slots = MAX_DOCUMENTS_PER_USER - len(existing_docs)
        files_to_process = files[:available_slots]

        if len(files) > available_slots:
            print(
                f"⚠️ User {user_id} has {len(existing_docs)} docs, can only upload {available_slots} more"
            )

        results = []
        batch_id = f"{user_id}_{asyncio.get_event_loop().time()}"

        for idx, file in enumerate(files_to_process):
            try:
                validate_file(file)

                upload_progress[batch_id] = {
                    "user_id": user_id,
                    "total": len(files_to_process),
                    "current": idx + 1,
                    "filename": file.filename,
                    "status": "processing",
                }

                doc_id = await document_service.process_document(
                    file=file, user_id=user_id
                )

                results.append(
                    {
                        "filename": file.filename,
                        "document_id": doc_id,
                        "status": "success",
                        "chunks": await document_service.get_document_chunk_count(
                            doc_id, user_id
                        ),
                    }
                )

                upload_progress[batch_id]["status"] = "completed"

            except Exception as file_error:
                results.append(
                    {
                        "filename": file.filename if "file" in locals() else "unknown",
                        "document_id": None,
                        "status": "error",
                        "error": str(file_error),
                    }
                )
                upload_progress[batch_id]["status"] = "error"

        if batch_id in upload_progress:
            upload_progress[batch_id]["status"] = "finished"

        return {
            "documents": results,
            "total": len(results),
            "successful": len([r for r in results if r["status"] == "success"]),
            "failed": len([r for r in results if r["status"] == "error"]),
            "batch_id": batch_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/upload/progress/{batch_id}")
async def get_upload_progress(
    batch_id: str, current_user: dict = Depends(get_current_user)
):
    """Get progress for a batch upload"""
    if batch_id in upload_progress:
        progress = upload_progress[batch_id]
        if progress.get("user_id", "").split("_")[0] == current_user["uid"]:
            return progress
    return {"status": "not_found"}


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str, current_user: dict = Depends(get_current_user)
):
    """Delete a specific document from the vector store"""
    try:
        print(f"🗑️ User {current_user['uid']} deleting document {document_id}")
        await document_service.delete_document(document_id, user_id=current_user["uid"])
        return {"message": f"Document {document_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents")
async def list_documents(current_user: dict = Depends(get_current_user)):
    """List all uploaded documents"""
    try:
        print(f"📋 User {current_user['uid']} listing documents")
        documents = await document_service.list_documents(user_id=current_user["uid"])
        return {"documents": documents, "total": len(documents)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
