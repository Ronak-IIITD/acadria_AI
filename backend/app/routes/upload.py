import uuid
import os
import re
import logging
from typing import List, Optional, BinaryIO
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.services.document_service import DocumentService
from app.middleware.auth import get_current_user
from app.models.schemas import DocumentResponse, DocumentStatus
from app.config import (
    MAX_FILE_SIZE_BYTES,
    MAX_FILES_PER_REQUEST,
    MAX_FILE_SIZE_MB,
    MAX_DOCUMENTS_PER_USER,
    MAX_CHUNK_SIZE_CHARS,
    MAX_CONTEXT_CHARS,
    MAX_PAGES_PER_DOCUMENT,
    MAX_EXTRACTION_CHARS_PER_PAGE,
    MAX_TOTAL_EXTRACTION_CHARS,
    SUPPORTED_EXTENSIONS,
    SUPPORTED_FILE_TYPES,
    FILE_SIGNATURES,
)
import asyncio
import hashlib

logger = logging.getLogger(__name__)

router = APIRouter()
document_service = DocumentService()

# Track upload progress per user (in-memory, reset on server restart)
# In production, use Redis or durable storage
upload_progress: dict = {}


def validate_file_signature(file: UploadFile) -> None:
    """
    Validate file magic bytes/signature to prevent MIME/type spoofing.
    Reads only the first few bytes (no need to read entire file).
    """
    # Read first 8 bytes for signature check
    initial_bytes = file.file.read(8)
    file.file.seek(0)  # Reset cursor

    file_extension = file.filename.split(".")[-1].lower() if file.filename else ""

    if file_extension in FILE_SIGNATURES:
        expected_sig = FILE_SIGNATURES[file_extension]
        if len(initial_bytes) >= len(expected_sig):
            if initial_bytes[: len(expected_sig)] != expected_sig:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file signature: expected {file_extension.upper()} magic bytes, got different content. "
                    "File may be corrupted or mislabeled.",
                )


def validate_file(file: UploadFile) -> None:
    """
    Comprehensive file validation including:
    - Filename presence
    - Extension validation
    - MIME type validation
    - File size enforcement during streaming
    - File signature/magic bytes check
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: .{file_extension}. Supported types: {', '.join(SUPPORTED_EXTENSIONS)}",
        )

    # Validate MIME type if available
    if file.content_type and file.content_type not in SUPPORTED_FILE_TYPES:
        logger.warning(
            f"MIME type mismatch: filename extension .{file_extension} "
            f"but content_type={file.content_type}"
        )
        # Note: We allow the extension-based check to pass but log the mismatch

    # Validate file signature to prevent spoofing
    try:
        validate_file_signature(file)
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"File signature validation error: {e}")
        # Don't block upload on signature error, just warn


async def enforce_file_size_streaming(
    file: UploadFile, max_bytes: int
) -> tuple[UploadFile, bool]:
    """
    Enforce maximum file size while streaming.
    Returns the file and a flag indicating if it exceeded the limit.
    """
    file_size = 0
    chunk_size = 1024 * 1024  # 1MB chunks

    # We need to read the file to check size, but also pass it to processing
    # Read in chunks and track size
    chunks = []
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        file_size += len(chunk)
        if file_size > max_bytes:
            # File too large - close and reject
            await file.close()
            return None, False
        chunks.append(chunk)

    # Reset file cursor - combine chunks into a new file-like object
    combined = b"".join(chunks)
    file.file = __import__("io").BytesIO(combined)
    return file, True


@router.post("/upload")
async def upload_documents(
    files: List[UploadFile] = File(...), current_user: dict = Depends(get_current_user)
):
    """
    Upload one or more document files with enhanced security.
    Supported formats: PDF, TXT, DOCX, MD, RTF, PPTX

    Limits:
    - Max file size: 50MB per file (enforced during streaming)
    - Max files per request: 100
    - Max documents per user: 100
    - Max pages per document: 500 (prevent OOM)
    - Max total extraction chars: 200000
    """
    try:
        user_id = current_user["uid"]

        if len(files) > MAX_FILES_PER_REQUEST:
            raise HTTPException(
                status_code=400,
                detail=f"Too many files. Maximum {MAX_FILES_PER_REQUEST} files per request.",
            )

        logger.info(f"User {user_id} uploading {len(files)} file(s)")

        existing_docs = await document_service.list_documents(user_id)
        if len(existing_docs) >= MAX_DOCUMENTS_PER_USER:
            raise HTTPException(
                status_code=400,
                detail=f"You've reached the maximum of {MAX_DOCUMENTS_PER_USER} documents. Please delete some to upload more.",
            )

        available_slots = MAX_DOCUMENTS_PER_USER - len(existing_docs)
        files_to_process = files[:available_slots]

        if len(files) > available_slots:
            logger.warning(
                f"User {user_id} has {len(existing_docs)} docs, can only upload {available_slots} more"
            )

        results = []
        batch_id = f"{user_id}_{asyncio.get_event_loop().time()}"

        for idx, file in enumerate(files_to_process):
            try:
                validate_file(file)

                # Enforce file size during streaming
                file, size_ok = await enforce_file_size_streaming(
                    file, MAX_FILE_SIZE_BYTES
                )
                if not size_ok:
                    results.append(
                        {
                            "filename": file.filename if file else "unknown",
                            "document_id": None,
                            "status": "error",
                            "error": f"File exceeds maximum size of {MAX_FILE_SIZE_MB}MB",
                        }
                    )
                    upload_progress[batch_id]["status"] = "error"
                    continue

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

                # Get document metadata including status
                doc_meta = document_service.documents.get(doc_id, {})
                doc_status = doc_meta.get("status", "ready")

                results.append(
                    {
                        "filename": file.filename,
                        "document_id": doc_id,
                        "status": "success" if doc_status == "ready" else doc_status,
                        "chunks": await document_service.get_document_chunk_count(
                            doc_id, user_id
                        ),
                        "document_status": doc_status,
                    }
                )

                upload_progress[batch_id]["status"] = "completed"

            except HTTPException:
                raise
            except Exception as file_error:
                results.append(
                    {
                        "filename": file.filename if "file" in locals() else "unknown",
                        "document_id": None,
                        "status": "error",
                        "error": "File processing failed. Please see logs for details.",
                    }
                )
                upload_progress[batch_id]["status"] = "error"
                logger.error(
                    f"Upload error for {file.filename if 'file' in locals() else 'unknown'}: {file_error}"
                )

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
        logger.error(f"Unexpected upload error: {e}")
        raise HTTPException(status_code=500, detail="Upload failed. Please try again.")


@router.get("/upload/progress/{batch_id}")
async def get_upload_progress(
    batch_id: str, current_user: dict = Depends(get_current_user)
):
    """Get progress for a batch upload"""
    if batch_id in upload_progress:
        progress = upload_progress[batch_id]
        # Check ownership - user_id is now stored in progress payload
        if progress.get("user_id") == current_user["uid"]:
            return progress
    return {"status": "not_found"}


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str, current_user: dict = Depends(get_current_user)
):
    """Delete a specific document from the vector store"""
    try:
        logger.info(
            f"User {current_user['uid']} deleting document {document_id}"
        )
        await document_service.delete_document(document_id, user_id=current_user["uid"])
        return {"message": f"Document {document_id} deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Delete error: {e}")
        raise HTTPException(status_code=500, detail="Delete failed. Please try again.")


@router.get("/documents")
async def list_documents(current_user: dict = Depends(get_current_user)):
    """List all uploaded documents"""
    try:
        logger.info(f"User {current_user['uid']} listing documents")
        documents = await document_service.list_documents(user_id=current_user["uid"])
        
        # Convert to DocumentResponse objects
        doc_responses = [
            DocumentResponse(
                id=doc["id"],
                filename=doc.get("original_filename", doc["filename"]),
                status=DocumentStatus(doc.get("status", "ready")),
                chunks=doc.get("chunks", 0),
                highlights=doc.get("highlights", 0),
                size=doc.get("size", 0),
                created_at=doc.get("created_at"),
                error=doc.get("error"),
            )
            for doc in documents
        ]
        
        return {"documents": doc_responses, "total": len(doc_responses)}
    except Exception as e:
        logger.error(f"List documents error: {e}")
        raise HTTPException(status_code=500, detail="Failed to list documents.")
