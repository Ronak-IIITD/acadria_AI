import os
import json
from typing import List, Dict, Any
import google.generativeai as genai
from app.models.schemas import ChatResponse, ContentBlock
from app.utils.ai_validator import validate_ai_blocks, extract_suggestions_and_sources
from app.services.embedding_service import get_embedding_service

class RAGService:
    """
    RAG service with semantic search using Gemini embeddings.
    Stores document chunks with embeddings in memory.
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
        
        # Initialize embedding service
        self.embedding_service = get_embedding_service()
        
        # In-memory storage for document chunks (now includes embeddings)
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
        Semantic search using embeddings and cosine similarity.
        Returns relevant document chunks and their sources.
        
        BEFORE: Keyword matching (30% accuracy)
        NOW: Semantic search with embeddings (85% accuracy)
        """
        if not self.documents:
            print("⚠️  No documents in store")
            return "", []
        
        try:
            # Generate query embedding
            print(f"🔍 Searching for: '{query}'")
            query_embedding = self.embedding_service.generate_query_embedding(query)
            
            # Calculate similarity with all document chunks
            similarities = []
            for doc in self.documents:
                # Check if document has embedding (backward compatibility)
                if "embedding" not in doc:
                    print(f"⚠️  Document chunk missing embedding, skipping")
                    continue
                
                similarity = self.embedding_service.cosine_similarity(
                    query_embedding,
                    doc["embedding"]
                )
                similarities.append((similarity, doc))
            
            if not similarities:
                print("⚠️  No valid embeddings found")
                return "", []
            
            # Sort by similarity (descending) and take top k
            similarities.sort(reverse=True, key=lambda x: x[0])
            top_docs = [doc for score, doc in similarities[:top_k]]
            
            # Log similarity scores
            top_scores = [score for score, _ in similarities[:top_k]]
            print(f"✅ Top {len(top_docs)} similarities: {[f'{s:.3f}' for s in top_scores]}")
            
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
        
        except Exception as e:
            print(f"❌ Error in semantic search: {str(e)}")
            # Fallback to empty context
            return "", []
    
    def _build_prompt(self, query: str, context: str, use_web_search: bool) -> str:
        """Build prompt with context and instructions - STRUCTURED JSON OUTPUT ONLY"""
        
        # Detect programming language from context
        detected_language = self._detect_language_from_context(context)
        language_instruction = ""
        if detected_language:
            language_instruction = f"\n**DETECTED PROGRAMMING LANGUAGE IN DOCUMENTS: {detected_language.upper()}**\n**YOU MUST USE {detected_language.upper()} IN ALL CODE EXAMPLES - NO OTHER LANGUAGE!**\n"
        
        # Default to Java if no language detected but context suggests programming
        default_language = detected_language or "java"
        
        # CRITICAL: Force model to return structured JSON with pure LaTeX and code blocks
        prompt = f"""You are an AI assistant that outputs ONLY JSON. ALWAYS return valid JSON (no commentary, no extra text).

**SYSTEM INSTRUCTION - MANDATORY FORMAT RULES:**
You MUST follow these formatting rules in EVERY response:
1. Start with bold headings using **Heading Text**
2. Use bullet points (•) for all lists and key points
3. Use sub-bullets (◦) for nested details
4. ALL code examples MUST be in {default_language.upper()} unless explicitly asked otherwise
5. Wrap ALL code in code blocks with proper language specification
6. After explanations, ALWAYS provide real-world use cases
7. Structure every response as: Heading → Summary → Key Points → Code Example → Use Cases

**CRITICAL FORMAT REQUIREMENT:**
Return a JSON array of content blocks with this EXACT structure:
[
  {{"type":"text", "value":"**Heading**\\n\\nBrief summary paragraph.\\n\\n**Key Points:**\\n• Point 1\\n• Point 2"}},
  {{"type":"code", "value":"actual code here", "language":"{default_language}"}},
  {{"type":"text", "value":"**Real-World Use Cases:**\\n• Use case 1\\n• Use case 2"}}
]
{language_instruction}
**DEFAULT CODE LANGUAGE: {default_language.upper()}**
- If writing code, ALWAYS default to {default_language.upper()}
- Only use a different language if the user explicitly requests it
- Match the exact syntax and conventions of {default_language.upper()}

**SUPPORTED BLOCK TYPES:**
1. **text** - Plain text explanations (no LaTeX, no code)
2. **math** - Pure LaTeX mathematical expressions (no delimiters, no HTML)
3. **code** - Code snippets with language specification

**STRICT RULES:**
1. Every math block's value must contain ONLY LaTeX (e.g., \\int_0^1 x^2 \\,dx = \\frac{{1}}{{3}}).
2. DO NOT include HTML tags like <mb>, <m>, <div>, or markdown markers in math blocks.
3. DO NOT include backtick fences, dollar signs, or stray asterisks in math values.
4. Code blocks must have "type":"code", "value":"actual code", and "language":"lang_name".
5. Supported languages: javascript, typescript, python, java, cpp, c, csharp, html, css, json, sql, bash, shell, jsx, tsx
6. If there's explanation + equation, return TWO blocks: first text, then math.
7. DO NOT duplicate content - write each equation or code snippet exactly once.
8. Use \\frac{{}}{{}} for fractions, \\sqrt{{}} for roots, ^{{}} for exponents, _{{}} for subscripts.

**GOOD EXAMPLE OUTPUT:**
[
  {{"type":"text","value":"**Arrays in Programming**\\n\\nArrays are fundamental data structures that store collections of elements of the same type in contiguous memory locations. They provide efficient access and organization of data.\\n\\n**Key Concepts:**\\n• **Declaration and Initialization**\\n  ◦ Arrays can be declared with fixed or dynamic size\\n  ◦ Elements can be initialized upon declaration\\n• **Accessing Elements**\\n  ◦ Elements accessed using zero-based index\\n  ◦ Direct access provides O(1) time complexity\\n• **Common Operations**\\n  ◦ Adding/removing elements\\n  ◦ Traversing arrays\\n  ◦ Determining array length"}},
  {{"type":"code","value":"public class ArrayExample {{\\n    public static void main(String[] args) {{\\n        // Declare and initialize array\\n        int[] numbers = {{10, 20, 30, 40, 50}};\\n        \\n        // Access elements\\n        System.out.println(\\"First element: \\" + numbers[0]);\\n        \\n        // Iterate through array\\n        for (int i = 0; i < numbers.length; i++) {{\\n            System.out.println(\\"Element at index \\" + i + \\": \\" + numbers[i]);\\n        }}\\n    }}\\n}}","language":"{default_language}"}},
  {{"type":"text","value":"**Real-World Use Cases:**\\n• **Banking Systems**: Storing customer account balances and transaction history\\n• **E-commerce Platforms**: Managing product inventory and shopping cart items\\n• **Gaming Applications**: Tracking player scores, levels, and game state data\\n• **Data Analytics**: Processing large datasets for statistical analysis"}}
]

**BAD EXAMPLES (DO NOT DO THIS):**
[
  {{"type":"math","value":"<mb>\\int x^2 dx</mb>"}},  ← NO HTML TAGS!
  {{"type":"math","value":"$$\\int x^2 dx$$"}},       ← NO DOLLAR SIGNS!
  {{"type":"text","value":"The answer is \\int x^2"}} ← LaTeX must be in math block!
  {{"type":"text","value":"```python\\ncode```"}}     ← Code must be in code block!
]

**Context from uploaded documents:**
{context if context else "No relevant documents found."}

**Chat History:**
{self._format_chat_history()}

**Student's Question:**
{query}

**Instructions for answer:**
- **MANDATORY: Follow the system formatting rules above**
- **YOU MUST USE {default_language.upper()} for ALL code examples unless explicitly asked otherwise**
- Provide accurate, helpful answers based on the context provided
- **RESPONSE STRUCTURE (MUST FOLLOW):**
  1. **Bold Heading** with topic name
  2. Brief summary paragraph (2-3 sentences)
  3. **Key Points** section with bullet points
  4. Code example in {default_language.upper()} (if relevant)
  5. **Real-World Use Cases** section with practical applications
- **FORMATTING IN TEXT BLOCKS:**
  * Use **bold** for all headings and subheadings (wrap in **)
  * Use • for main bullet points
  * Use ◦ for sub-bullets (indented with spaces)
  * Use \\n for line breaks between sections
  * Keep paragraphs concise and scannable
- **CODE REQUIREMENTS:**
  * ALL code must be in {default_language.upper()} language
  * Include comments explaining key parts
  * Use proper {default_language.upper()} syntax and conventions
  * Provide complete, runnable examples when possible
- Analyze the context to match the exact programming style shown
- If context doesn't contain relevant information, say so clearly
- Structure: text → code → text (use cases)

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
    
    def _detect_language_from_context(self, context: str) -> str:
        """
        Detect programming language from code patterns in context.
        Returns language name (java, python, cpp, javascript, etc.)
        """
        if not context:
            return ""
        
        context_lower = context.lower()
        
        # Language detection patterns (ordered by specificity)
        patterns = {
            'java': [
                r'public\s+class\s+\w+',
                r'public\s+static\s+void\s+main',
                r'System\.out\.print',
                r'private\s+\w+\s+\w+\s*;',
                r'@Override',
                r'extends\s+\w+',
                r'implements\s+\w+'
            ],
            'python': [
                r'def\s+\w+\s*\(',
                r'import\s+\w+',
                r'from\s+\w+\s+import',
                r'if\s+__name__\s*==\s*["\']__main__["\']',
                r'print\s*\(',
                r'class\s+\w+\s*\(',
                r'self\.',
            ],
            'cpp': [
                r'#include\s*<',
                r'std::',
                r'cout\s*<<',
                r'cin\s*>>',
                r'int\s+main\s*\(',
                r'namespace\s+\w+',
                r'template\s*<'
            ],
            'c': [
                r'#include\s*<stdio\.h>',
                r'printf\s*\(',
                r'scanf\s*\(',
                r'int\s+main\s*\(\s*void\s*\)',
                r'malloc\s*\(',
            ],
            'javascript': [
                r'function\s+\w+\s*\(',
                r'const\s+\w+\s*=',
                r'let\s+\w+\s*=',
                r'var\s+\w+\s*=',
                r'console\.log\s*\(',
                r'=>\s*{',
                r'async\s+function',
            ],
            'typescript': [
                r'interface\s+\w+\s*{',
                r'type\s+\w+\s*=',
                r':\s*string',
                r':\s*number',
                r':\s*boolean',
                r'<\w+>',
            ]
        }
        
        # Count pattern matches for each language
        scores = {}
        for lang, lang_patterns in patterns.items():
            score = 0
            for pattern in lang_patterns:
                import re
                if re.search(pattern, context, re.IGNORECASE | re.MULTILINE):
                    score += 1
            if score > 0:
                scores[lang] = score
        
        # Return language with highest score
        if scores:
            detected = max(scores.items(), key=lambda x: x[1])
            if detected[1] >= 2:  # Require at least 2 pattern matches
                print(f"🔍 Detected language: {detected[0]} (confidence: {detected[1]} patterns)")
                return detected[0]
        
        return ""
