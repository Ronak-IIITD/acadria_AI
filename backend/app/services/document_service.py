import uuid
import os
from typing import List, Dict, Any
from PyPDF2 import PdfReader
from docx import Document
import markdown
import re
from app.services.rag_service import RAGService

class DocumentService:
    """
    Document processing service.
    Extracts text from various file formats and splits into chunks.
    """
    
    def __init__(self):
        self.rag_service = RAGService()
        
        # Simple text chunking parameters
        self.chunk_size = 1000
        self.chunk_overlap = 200
        
        # Store document metadata
        self.documents: Dict[str, Dict[str, Any]] = {}
        self.storage_path = "data/documents"
        os.makedirs(self.storage_path, exist_ok=True)
    
    async def process_document(self, filename: str, content: bytes, content_type: str) -> str:
        """
        Process uploaded document and add to RAG service.
        Returns document ID.
        """
        try:
            # Generate unique document ID
            doc_id = str(uuid.uuid4())
            
            # Extract text based on file type
            text = await self._extract_text(content, filename, content_type)
            
            if not text:
                raise ValueError(f"Could not extract text from {filename}")
            
            # Split text into chunks
            chunks = self._split_text(text)
            
            # Create document chunks with metadata
            doc_chunks = [
                {
                    "content": chunk,
                    "document_id": doc_id,
                    "filename": filename,
                    "chunk_index": i,
                    "total_chunks": len(chunks)
                }
                for i, chunk in enumerate(chunks)
            ]
            
            # Add to RAG service
            self.rag_service.add_documents_to_store(doc_chunks)
            
            # Store document metadata
            self.documents[doc_id] = {
                "id": doc_id,
                "filename": filename,
                "content_type": content_type,
                "chunks": len(chunks),
                "size": len(content)
            }
            
            return doc_id
        
        except Exception as e:
            raise Exception(f"Error processing document: {str(e)}")
    
    def _split_text(self, text: str) -> List[str]:
        """
        Simple text splitting with overlap.
        Splits on paragraph boundaries when possible.
        """
        chunks = []
        paragraphs = text.split('\n\n')
        
        current_chunk = ""
        for para in paragraphs:
            if len(current_chunk) + len(para) < self.chunk_size:
                current_chunk += para + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = para + "\n\n"
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks if chunks else [text]
    
    async def _extract_text(self, content: bytes, filename: str, content_type: str) -> str:
        """Extract text from different file formats"""
        try:
            # Save file temporarily
            temp_path = os.path.join(self.storage_path, filename)
            with open(temp_path, "wb") as f:
                f.write(content)
            
            # Extract based on file type
            if filename.endswith('.pdf'):
                return self._extract_from_pdf(temp_path)
            elif filename.endswith('.docx'):
                return self._extract_from_docx(temp_path)
            elif filename.endswith('.txt'):
                return self._extract_from_txt(temp_path)
            elif filename.endswith('.md'):
                return self._extract_from_markdown(temp_path)
            elif filename.endswith('.rtf'):
                return self._extract_from_rtf(temp_path)
            else:
                raise ValueError(f"Unsupported file type: {filename}")
        
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    def _extract_from_pdf(self, filepath: str) -> str:
        """Extract text from PDF"""
        reader = PdfReader(filepath)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    
    def _extract_from_docx(self, filepath: str) -> str:
        """Extract text from DOCX"""
        doc = Document(filepath)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text
    
    def _extract_from_txt(self, filepath: str) -> str:
        """Extract text from TXT"""
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    
    def _extract_from_markdown(self, filepath: str) -> str:
        """Extract text from Markdown"""
        with open(filepath, 'r', encoding='utf-8') as f:
            md_content = f.read()
            # Convert markdown to plain text
            html = markdown.markdown(md_content)
            # Simple HTML tag removal
            text = re.sub('<[^<]+?>', '', html)
            return text
    
    def _extract_from_rtf(self, filepath: str) -> str:
        """Extract text from RTF"""
        # Basic RTF parsing (for production, use striprtf library)
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            # Remove RTF formatting codes (basic approach)
            text = re.sub(r'\\[a-z]+\d*\s?', '', content)
            text = re.sub(r'[{}]', '', text)
            return text
    
    async def delete_document(self, document_id: str):
        """Delete document from storage"""
        if document_id in self.documents:
            del self.documents[document_id]
            # Note: Would need to rebuild in-memory store to fully remove
            # For now, just remove from metadata
    
    async def list_documents(self) -> List[Dict[str, Any]]:
        """List all uploaded documents"""
        return list(self.documents.values())
