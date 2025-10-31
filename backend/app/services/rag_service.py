import os
import json
from typing import List, Dict, Any
import google.generativeai as genai
from app.models.schemas import ChatResponse

class RAGService:
    """
    Lightweight RAG service using Gemini API directly.
    Stores document chunks in memory (for now).
    TODO: Add FAISS vector store when more disk space available.
    """
    
    def __init__(self):
        # Initialize Gemini
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        else:
            print("WARNING: GEMINI_API_KEY not set. API calls will fail.")
            self.model = None
        
        # In-memory storage for document chunks
        self.documents: List[Dict[str, Any]] = []
        
        # Chat history
        self.chat_history: List[Dict[str, str]] = []
    
    async def generate_response(self, query: str, use_web_search: bool = False) -> ChatResponse:
        """
        Generate AI response using retrieved context.
        Simple keyword-based retrieval for now (no embeddings).
        """
        try:
            # Get relevant context using keyword search
            context, sources = self._retrieve_context(query)
            
            # Build prompt with context
            prompt = self._build_prompt(query, context, use_web_search)
            
            # Generate response
            response = self.model.generate_content(prompt)
            answer = response.text
            
            # Add to chat history
            self.chat_history.append({"role": "user", "content": query})
            self.chat_history.append({"role": "assistant", "content": answer})
            
            # Generate follow-up suggestions
            suggestions = self._generate_suggestions(query, answer)
            
            return ChatResponse(
                text=answer,
                model="gemini-2.0-flash-exp",
                sources=sources,
                suggestions=suggestions
            )
        
        except Exception as e:
            raise Exception(f"Error generating response: {str(e)}")
    
    def _retrieve_context(self, query: str, top_k: int = 3) -> tuple[str, List[Dict[str, Any]]]:
        """
        Simple keyword-based retrieval.
        Returns relevant document chunks and their sources.
        """
        if not self.documents:
            return "", []
        
        # Simple keyword matching (case-insensitive)
        query_lower = query.lower()
        query_words = set(query_lower.split())
        
        # Score each document chunk
        scored_docs = []
        for doc in self.documents:
            content_lower = doc["content"].lower()
            content_words = set(content_lower.split())
            
            # Calculate simple overlap score
            common_words = query_words.intersection(content_words)
            score = len(common_words)
            
            if score > 0:
                scored_docs.append((score, doc))
        
        # Sort by score and take top_k
        scored_docs.sort(reverse=True, key=lambda x: x[0])
        top_docs = [doc for _, doc in scored_docs[:top_k]]
        
        # Build context string
        context = "\n\n".join([doc["content"] for doc in top_docs])
        
        # Build sources list
        sources = [
            {
                "title": doc["filename"],
                "page": doc.get("chunk_index", 0) + 1
            }
            for doc in top_docs
        ]
        
        return context, sources
    
    def _build_prompt(self, query: str, context: str, use_web_search: bool) -> str:
        """Build prompt with context and instructions"""
        prompt = f"""You are StudySync AI, an intelligent study assistant. Your goal is to help students learn effectively.

**Context from uploaded documents:**
{context if context else "No relevant documents found."}

**Chat History:**
{self._format_chat_history()}

**Student's Question:**
{query}

**Instructions:**
- Provide accurate, helpful answers based on the context provided
- If the context doesn't contain relevant information, say so clearly
- Use examples and explanations appropriate for students
- Break down complex topics into understandable parts
- If asked to explain, provide step-by-step explanations
- Cite specific parts of the documents when possible

Please answer the student's question:"""
        
        return prompt
    
    def _format_chat_history(self) -> str:
        """Format chat history for prompt"""
        if not self.chat_history:
            return "No previous conversation."
        
        formatted = []
        for msg in self.chat_history[-6:]:  # Last 3 exchanges
            role = "Student" if msg["role"] == "user" else "AI"
            formatted.append(f"{role}: {msg['content']}")
        
        return "\n".join(formatted)
    
    def _generate_suggestions(self, query: str, answer: str) -> List[str]:
        """Generate follow-up question suggestions"""
        suggestions = [
            "Can you explain this in simpler terms?",
            "Can you provide an example?",
            "What are the key points I should remember?"
        ]
        
        # Add context-aware suggestions based on query
        if "how" in query.lower():
            suggestions.append("Can you show me the step-by-step process?")
        elif "what" in query.lower():
            suggestions.append("How is this used in practice?")
        elif "why" in query.lower():
            suggestions.append("What are some real-world applications?")
        
        return suggestions[:3]
    
    def clear_history(self):
        """Clear chat history"""
        self.chat_history = []
    
    def add_documents_to_store(self, chunks: List[Dict[str, Any]]):
        """
        Add document chunks to in-memory store.
        Each chunk should have: content, filename, chunk_index, etc.
        """
        self.documents.extend(chunks)
    
    def clear_documents(self):
        """Clear all stored documents"""
        self.documents = []
