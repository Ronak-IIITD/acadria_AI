import os
import json
from typing import List, Dict, Any
import google.generativeai as genai
from app.models.schemas import ChatResponse, ContentBlock
from app.utils.ai_validator import validate_ai_blocks, extract_suggestions_and_sources

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
        Returns structured JSON blocks with validated LaTeX.
        """
        try:
            # Get relevant context using keyword search
            context, sources = self._retrieve_context(query)
            
            # Build prompt with structured JSON instruction
            prompt = self._build_prompt(query, context, use_web_search)
            
            # Generate response
            response = self.model.generate_content(prompt)
            raw_answer = response.text
            
            print(f"🤖 RAW AI RESPONSE (first 500 chars): {raw_answer[:500]}")
            
            # Validate and sanitize the structured JSON response
            try:
                blocks = validate_ai_blocks(raw_answer)
                print(f"✅ Validated {len(blocks)} blocks successfully")
            except ValueError as e:
                print(f"⚠️  JSON validation failed: {e}")
                # Fallback: return error block
                blocks = [
                    {
                        "type": "text",
                        "value": f"Sorry, I received an invalid response format. Please try rephrasing your question. (Error: {str(e)})"
                    }
                ]
            
            # Convert dict blocks to ContentBlock models
            content_blocks = [ContentBlock(**block) for block in blocks]
            
            # Add to chat history (for now, join blocks for history)
            combined_text = " ".join([b.value for b in content_blocks if b.type == "text"])
            self.chat_history.append({"role": "user", "content": query})
            self.chat_history.append({"role": "assistant", "content": combined_text})
            
            # Generate follow-up suggestions
            suggestions = self._generate_suggestions(query, combined_text)
            
            return ChatResponse(
                blocks=content_blocks,
                suggestions=suggestions,
                sources=sources
            )
        
        except Exception as e:
            print(f"❌ Error generating response: {str(e)}")
            # Return error block
            error_block = ContentBlock(
                type="text",
                value=f"Error generating response: {str(e)}"
            )
            return ChatResponse(
                blocks=[error_block],
                suggestions=[],
                sources=[]
            )
    
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
        """Build prompt with context and instructions - STRUCTURED JSON OUTPUT ONLY"""
        
        # CRITICAL: Force model to return structured JSON with pure LaTeX
        prompt = f"""You are an assistant that outputs ONLY JSON. ALWAYS return valid JSON (no commentary, no extra text).

**CRITICAL FORMAT REQUIREMENT:**
Return a JSON array of content blocks with this EXACT structure:
[
  {{"type":"text", "value":"plain text explanation (no LaTeX)"}},
  {{"type":"math", "value":"PURE_LATEX_EXPRESSION (no $, no $$, no HTML)"}}
]

**STRICT RULES:**
1. Every math block's value must contain ONLY LaTeX (e.g., \\int_0^1 x^2 \\,dx = \\frac{{1}}{{3}}).
2. DO NOT include HTML tags like <mb>, <m>, <div>, or markdown markers in math blocks.
3. DO NOT include backtick fences, dollar signs, or stray asterisks in math values.
4. If there's both explanation and equation, return TWO blocks: first text, then math.
5. DO NOT duplicate content - write each equation exactly once.
6. Use \\frac{{}}{{}} for fractions, \\sqrt{{}} for roots, ^{{}} for exponents, _{{}} for subscripts.

**GOOD EXAMPLE OUTPUT:**
[
  {{"type":"text","value":"The definite integral evaluates to:"}},
  {{"type":"math","value":"\\int_0^1 x^2 \\, dx = \\frac{{1}}{{3}}"}},
  {{"type":"text","value":"This follows from the power rule of integration."}}
]

**BAD EXAMPLES (DO NOT DO THIS):**
[
  {{"type":"math","value":"<mb>\\int x^2 dx</mb>"}},  ← NO HTML TAGS!
  {{"type":"math","value":"$$\\int x^2 dx$$"}},       ← NO DOLLAR SIGNS!
  {{"type":"text","value":"The answer is \\int x^2"}} ← LaTeX must be in math block!
]

**Context from uploaded documents:**
{context if context else "No relevant documents found."}

**Chat History:**
{self._format_chat_history()}

**Student's Question:**
{query}

**Instructions for answer:**
- Provide accurate, helpful answers based on the context provided
- If context doesn't contain relevant information, say so clearly in a text block
- Use examples and explanations appropriate for students
- Break down complex topics: use text blocks for explanation, math blocks for equations
- Cite specific parts of documents in text blocks

If you cannot produce JSON exactly as specified, output an error object:
{{"error":"reason for failure"}}

REMEMBER: Output ONLY the JSON array. No additional text before or after."""
        
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
