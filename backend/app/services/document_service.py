import uuid
import os
from typing import List, Dict, Any, Tuple, Optional
from PyPDF2 import PdfReader
from docx import Document
import markdown
import re
import fitz  # PyMuPDF for annotation extraction
from app.services.rag_service import get_rag_service
from app.services.embedding_service import get_embedding_service

class DocumentService:
    """
    Document processing service.
    Extracts text from various file formats and splits into chunks.
    Now includes embedding generation for semantic search.
    """

    def __init__(self):
        # Use singleton RAG service to share document store across modules
        self.rag_service = get_rag_service()
        self.embedding_service = get_embedding_service()
        
        # Simple text chunking parameters
        self.chunk_size = 1000
        self.chunk_overlap = 200
        
        # Store document metadata
        self.documents: Dict[str, Dict[str, Any]] = {}
        self.storage_path = "data/documents"
        os.makedirs(self.storage_path, exist_ok=True)
    
    async def process_document(self, filename: str, content: bytes, content_type: str, user_id: str) -> str:
        """
        Process uploaded document and add to RAG service.
        For PDFs, also extracts existing highlights with color information.
        Returns document ID.
        """
        try:
            # Generate unique document ID
            doc_id = str(uuid.uuid4())

            # Save file temporarily for processing
            temp_path = os.path.join(self.storage_path, filename)
            with open(temp_path, "wb") as f:
                f.write(content)

            # Extract text based on file type
            text = await self._extract_text(content, filename, content_type)

            if not text:
                raise ValueError(f"Could not extract text from {filename}")

            # Split text into chunks
            chunks = self._split_text(text)

            print(f"📄 Generating embeddings for {len(chunks)} chunks from {filename}...")

            # Generate embeddings for all chunks
            embeddings = self.embedding_service.batch_generate_embeddings(chunks)

            # Create document chunks with metadata AND embeddings
            doc_chunks = [
                {
                    "content": chunk,
                    "embedding": embedding,
                    "document_id": doc_id,
                    "filename": filename,
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "content_type": "document",  # Regular document content
                    "user_id": user_id
                }
                for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
            ]

            if self.embedding_service.is_available():
                print(f"✅ Generated {len([e for e in embeddings if e is not None])} embeddings for {filename}")
            else:
                print(f"ℹ️ Embedding service unavailable - will use keyword fallback for {filename}")

            # FOR PDFs: Extract highlights with colors
            highlight_chunks = []
            if filename.endswith('.pdf'):
                highlights = self._extract_pdf_highlights(temp_path)

                if highlights:
                    print(f"🎨 Processing {len(highlights)} highlights from PDF...")

                    # Group highlights by color
                    highlights_by_color = {}
                    for hl in highlights:
                        color = hl['color']
                        if color not in highlights_by_color:
                            highlights_by_color[color] = []
                        highlights_by_color[color].append(hl)

                    # Create separate chunks for each color group
                    for color, color_highlights in highlights_by_color.items():
                        # Combine all highlights of this color into one text
                        highlight_text = "\n\n".join([
                            f"[Page {hl['page']}] {hl['text']}"
                            for hl in color_highlights
                        ])

                        # Generate embedding for this color group
                        highlight_embedding = self.embedding_service.generate_embedding(highlight_text)

                        highlight_chunks.append({
                            "content": highlight_text,
                            "embedding": highlight_embedding,
                            "document_id": doc_id,
                            "filename": filename,
                            "document_id": doc_id,
                            "filename": filename,
                            "content_type": "highlight",
                            "highlight_color": color,
                            "highlight_count": len(color_highlights),
                            "user_id": user_id
                        })

                    print(f"✅ Processed highlights: {', '.join([f'{count} {color}' for color, highlights in highlights_by_color.items() for count in [len(highlights)]])}")

            # Add both regular chunks and highlight chunks to RAG service
            all_chunks = doc_chunks + highlight_chunks
            self.rag_service.add_documents_to_store(all_chunks, user_id)

            # Store document metadata
            self.documents[doc_id] = {
                "id": doc_id,
                "filename": filename,
                "content_type": content_type,
                "chunks": len(chunks),
                "highlights": len(highlight_chunks),
                "chunks": len(chunks),
                "highlights": len(highlight_chunks),
                "size": len(content),
                "user_id": user_id
            }

            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)

            return doc_id

        except Exception as e:
            # Clean up temp file on error
            temp_path = os.path.join(self.storage_path, filename)
            if os.path.exists(temp_path):
                os.remove(temp_path)
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

    def _extract_pdf_highlights(self, filepath: str) -> List[Dict[str, Any]]:
        """
        Extract highlighted text and annotations from PDF with color information.
        Returns list of highlights with their text, color, and page number.
        """
        highlights = []

        try:
            # Open PDF with PyMuPDF for annotation extraction
            pdf_document = fitz.open(filepath)

            for page_num, page in enumerate(pdf_document, start=1):
                # Get all annotations on the page
                annotations = page.annots()

                if annotations is None:
                    continue

                for annot in annotations:
                    # Check if it's a highlight annotation (subtype 8)
                    if annot.type[0] == 8:  # Highlight annotation
                        try:
                            # Get highlighted text
                            # Get the rectangles covered by the annotation
                            quads = annot.vertices

                            # Extract text within the highlighted area
                            highlight_text = ""
                            if quads:
                                # Get bounding rectangle
                                rect = annot.rect
                                # Extract text in the highlighted region
                                words = page.get_text("words", clip=rect)
                                highlight_text = " ".join([w[4] for w in words])

                            # Get annotation color (RGB values 0-1)
                            color_values = annot.colors.get("stroke", None) or annot.colors.get("fill", None)

                            if color_values:
                                # Convert RGB to color name
                                color_name = self._rgb_to_color_name(color_values)
                            else:
                                color_name = "yellow"  # Default highlight color

                            if highlight_text.strip():
                                highlights.append({
                                    "text": highlight_text.strip(),
                                    "color": color_name,
                                    "page": page_num,
                                    "type": "highlight"
                                })
                        except Exception as e:
                            print(f"⚠️  Error extracting annotation on page {page_num}: {e}")
                            continue

            pdf_document.close()
            print(f"✅ Extracted {len(highlights)} highlights from PDF")

        except Exception as e:
            print(f"❌ Error extracting highlights: {e}")

        return highlights

    def _rgb_to_color_name(self, rgb: Tuple[float, float, float]) -> str:
        """
        Convert RGB values (0-1 range) to color name.
        Handles common highlight colors: yellow, green, red, blue, orange, pink, purple.
        """
        r, g, b = rgb[0] * 255, rgb[1] * 255, rgb[2] * 255

        # Define color ranges
        color_ranges = {
            "yellow": lambda r, g, b: g > 200 and r > 200 and b < 100,
            "green": lambda r, g, b: g > 150 and r < 150 and b < 150,
            "red": lambda r, g, b: r > 200 and g < 100 and b < 100,
            "blue": lambda r, g, b: b > 150 and r < 150 and g < 150,
            "orange": lambda r, g, b: r > 200 and 100 < g < 200 and b < 100,
            "pink": lambda r, g, b: r > 200 and g < 150 and b > 150,
            "purple": lambda r, g, b: r > 150 and g < 150 and b > 150,
        }

        for color_name, condition in color_ranges.items():
            if condition(r, g, b):
                return color_name

        # Default to yellow if no match
        return "yellow"
    
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
    
    async def delete_document(self, document_id: str, user_id: str):
        """Delete document from storage and RAG store"""
        if document_id in self.documents:
            # Check ownership
            doc = self.documents[document_id]
            if doc.get("user_id") != user_id:
                print(f"⚠️ User {user_id} attempted to delete document {document_id} owned by {doc.get('user_id')}")
                raise ValueError("Document not found or access denied")

            # Remove from metadata
            del self.documents[document_id]
            # Remove chunks from RAG service
            self.rag_service.remove_document_by_id(document_id, user_id)
            print(f"✅ Deleted document {document_id} from metadata and RAG store")
        else:
            print(f"⚠️ Document {document_id} not found in metadata")
    
    async def list_documents(self, user_id: str) -> List[Dict[str, Any]]:
        """List all uploaded documents for a specific user"""
        return [doc for doc in self.documents.values() if doc.get("user_id") == user_id]
