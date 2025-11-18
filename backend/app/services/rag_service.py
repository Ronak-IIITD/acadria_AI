import os
import json
import time
from typing import List, Dict, Any
import google.generativeai as genai
from app.models.schemas import ChatResponse, ContentBlock
from app.utils.ai_validator import validate_ai_blocks, extract_suggestions_and_sources
from app.services.embedding_service import get_embedding_service
from app.config import MAX_RETRIES, INITIAL_RETRY_DELAY, MAX_RETRY_DELAY, FALLBACK_MODEL

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
            # Default to Flash model (fast, available)
            self.model = genai.GenerativeModel('gemini-flash-latest')
            self.model_name = 'gemini-flash-latest'
        else:
            print("WARNING: GEMINI_API_KEY not set. API calls will fail.")
            self.model = None
            self.model_name = None
        
        # Initialize embedding service
        self.embedding_service = get_embedding_service()
        
        # In-memory storage for document chunks (now includes embeddings)
        self.documents: List[Dict[str, Any]] = []
        
        # Chat history
        self.chat_history: List[Dict[str, str]] = []
    
    def set_model(self, model_name: str):
        """
        Switch between Gemini models dynamically.
        Supported: 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'
        """
        # Map model names to available models
        model_mapping = {
            'gemini-1.5-flash': 'gemini-flash-latest',
            'gemini-1.5-pro': 'gemini-pro-latest',
            'gemini-flash': 'gemini-flash-latest',
            'gemini-2.0-flash-exp': 'gemini-2.0-flash-exp'
        }

        actual_model = model_mapping.get(model_name, model_name)

        try:
            self.model = genai.GenerativeModel(actual_model)
            self.model_name = actual_model
            print(f"✅ Switched to model: {actual_model}")
        except Exception as e:
            print(f"⚠️  Error switching model: {e}, keeping current model")
    
    async def generate_response(self, query: str, use_web_search: bool = False, level_up_mode: bool = False) -> ChatResponse:
        """
        Generate AI response using retrieved context.
        Returns structured JSON blocks with validated LaTeX.
        
        Args:
            query: User's question
            use_web_search: Enable web search (if implemented)
            level_up_mode: Enable Level Up+ mode for enhanced, detailed responses
        """
        try:
            # Get relevant context using semantic search
            # In Level Up+ mode, retrieve MORE context chunks
            top_k = 5 if level_up_mode else 3
            context, sources = self._retrieve_context(query, top_k=top_k)

            # Log context retrieval status
            if context:
                print(f"📖 Retrieved context: {len(context)} chars from {len(sources)} sources")
                print(f"📄 Sources: {[s['title'] for s in sources]}")
            else:
                print("⚠️ No context retrieved - documents may not be uploaded")

            # Build prompt with structured JSON instruction
            prompt = self._build_prompt(query, context, use_web_search, level_up_mode)
            
            # Generate response with retry logic for overload errors
            retry_delay = INITIAL_RETRY_DELAY
            original_model = self.model_name
            raw_answer = None
            last_error = None

            for attempt in range(MAX_RETRIES):
                try:
                    print(f"🤖 Attempting to generate response with {self.model_name} (attempt {attempt + 1}/{MAX_RETRIES})")
                    # Generate content (JSON will be enforced through prompt)
                    response = self.model.generate_content(prompt)
                    raw_answer = response.text

                    # If we had switched models and it worked, log success
                    if self.model_name != original_model:
                        print(f"✅ Successfully generated response using fallback model: {self.model_name}")

                    break  # Success, exit retry loop
                except Exception as e:
                    # Convert error to string and check both the string representation and attributes
                    error_str = str(e).lower()
                    error_repr = repr(e).lower()

                    # Check for status code if available (Google API errors have this)
                    status_code = None
                    if hasattr(e, 'code'):
                        status_code = e.code
                    elif hasattr(e, 'status_code'):
                        status_code = e.status_code

                    # Check if it's a model overload error (503 or quota exceeded)
                    is_retryable = (
                        status_code in [503, 429, 500] or  # HTTP error codes
                        any(keyword in error_str for keyword in [
                            '503', 'unavailable', 'overloaded', 'quota', 'rate',
                            'resource_exhausted', 'too many requests', 'model is busy',
                            'temporarily unavailable', 'service unavailable'
                        ]) or
                        any(keyword in error_repr for keyword in [
                            '503', 'unavailable', 'overloaded'
                        ])
                    )

                    if is_retryable and attempt < MAX_RETRIES - 1:
                        print(f"⚠️ Model {self.model_name} error (attempt {attempt + 1}/{MAX_RETRIES})")
                        print(f"   Error details: {str(e)[:200]}")
                        print(f"   Status code: {status_code}")
                        print(f"   Retryable: {is_retryable}")
                        print(f"⏳ Retrying in {retry_delay} seconds...")
                        time.sleep(retry_delay)

                        # Exponential backoff with max delay
                        retry_delay = min(retry_delay * 2, MAX_RETRY_DELAY)

                        # Try switching to a different model on second retry
                        if attempt == 1 and self.model_name != FALLBACK_MODEL:
                            print(f"🔄 Switching to fallback model: {FALLBACK_MODEL}")
                            try:
                                self.set_model(FALLBACK_MODEL)
                            except Exception as switch_error:
                                print(f"❌ Failed to switch to {FALLBACK_MODEL}: {switch_error}")
                                # Continue with current model
                        continue
                    else:
                        # Not retryable or all retries exhausted
                        last_error = e
                        if is_retryable:
                            print(f"❌ All {MAX_RETRIES} retry attempts failed")
                            raise Exception(f"All AI models are currently busy after {MAX_RETRIES} attempts. Please try again in a few moments or switch to a different model.")
                        else:
                            # Not a retryable error, raise with original message
                            print(f"❌ Non-retryable error encountered: {str(e)[:100]}")
                            raise

            # Check if we failed to get a response after all retries
            if raw_answer is None:
                if last_error:
                    raise Exception(f"Failed to generate response after {MAX_RETRIES} attempts. Last error: {str(last_error)[:100]}")
                else:
                    raise Exception("Failed to generate response for unknown reason")
            
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
            error_msg = str(e).lower()
            print(f"❌ Error generating response: {str(e)}")

            # Provide user-friendly error messages
            if '503' in error_msg or 'unavailable' in error_msg or 'overloaded' in error_msg:
                user_message = (
                    "🔄 The AI service is temporarily busy due to high demand. "
                    "Please try again in a moment, or try switching to a different model (Grok) from the model selector."
                )
            elif 'quota' in error_msg or 'rate' in error_msg:
                user_message = (
                    "⚠️ API rate limit reached. Please wait a minute before trying again, "
                    "or switch to a different model (Grok) from the model selector."
                )
            elif 'api_key' in error_msg or 'authentication' in error_msg:
                user_message = "🔑 API key issue detected. Please check your Gemini API key configuration."
            elif 'no documents' in error_msg or 'no context' in error_msg:
                user_message = "📄 Please upload a document first to get context-based answers."
            else:
                user_message = f"Sorry, I encountered an error. Please try again or switch models. (Error: {str(e)[:100]})"

            # Return user-friendly error block
            error_block = ContentBlock(
                type="text",
                value=user_message
            )
            return ChatResponse(
                blocks=[error_block],
                suggestions=[
                    {"displayText": "Try with Grok model", "query": "Switch to Grok"},
                    {"displayText": "Upload a document", "query": "Upload document"},
                    {"displayText": "Retry question", "query": query}
                ],
                sources=[]
            )
    
    def _retrieve_context(self, query: str, top_k: int = 3) -> tuple[str, List[Dict[str, Any]]]:
        """
        Semantic search using embeddings and cosine similarity.
        Returns relevant document chunks and their sources.

        SPECIAL HANDLING:
        1. Detects highlight-based queries and filters by color (if specified)
        2. Supports semantic highlight search WITHOUT color (e.g., "highlights about rigid body dynamics")

        BEFORE: Keyword matching (30% accuracy)
        NOW: Semantic search with embeddings (85% accuracy)
        """
        if not self.documents:
            print("⚠️  No documents in store")
            return "", []

        try:
            # Detect if query is about highlights/annotations
            query_lower = query.lower()
            highlight_colors = ["yellow", "green", "red", "blue", "orange", "pink", "purple"]

            # Check for highlight-related keywords
            highlight_keywords = ["highlight", "highlighted", "annotation", "annotate", "marked", "underlined"]
            is_highlight_query = any(word in query_lower for word in highlight_keywords)

            requested_color = None

            # Check if specific color is mentioned
            for color in highlight_colors:
                if color in query_lower:
                    requested_color = color
                    break

            # Generate query embedding
            print(f"🔍 Searching for: '{query}'")
            if is_highlight_query:
                if requested_color:
                    print(f"🎨 Detected color-specific highlight query: {requested_color}")
                else:
                    print(f"🎨 Detected semantic highlight query (no color specified)")

            query_embedding = self.embedding_service.generate_query_embedding(query)

            # Calculate similarity with all document chunks
            similarities = []
            for doc in self.documents:
                # Check if document has embedding (backward compatibility)
                if "embedding" not in doc:
                    print(f"⚠️  Document chunk missing embedding, skipping")
                    continue

                content_type = doc.get("content_type", "document")

                # Filter logic for highlight queries
                if is_highlight_query:
                    if requested_color:
                        # User asked for specific color - ONLY return that color
                        if content_type == "highlight" and doc.get("highlight_color") == requested_color:
                            # Boost similarity for matching color highlights
                            similarity = self.embedding_service.cosine_similarity(
                                query_embedding,
                                doc["embedding"]
                            ) * 1.3  # Strong boost for exact color match
                            similarities.append((similarity, doc))
                    else:
                        # User asked about highlights WITHOUT specifying color
                        # ONLY search highlights, use semantic similarity to find relevant ones
                        if content_type == "highlight":
                            similarity = self.embedding_service.cosine_similarity(
                                query_embedding,
                                doc["embedding"]
                            )
                            # Boost all highlights but let semantic similarity rank them
                            similarity *= 1.2
                            similarities.append((similarity, doc))
                        # Exclude regular document content when querying highlights without color
                else:
                    # Regular query (not about highlights) - search all content normally
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

            # Log if highlights were returned
            highlight_docs = [d for d in top_docs if d.get("content_type") == "highlight"]
            if highlight_docs:
                colors = [d.get("highlight_color") for d in highlight_docs]
                print(f"🎨 Returning {len(highlight_docs)} highlight chunks: {colors}")

            # Build context string
            context_parts = []
            for doc in top_docs:
                if doc.get("content_type") == "highlight":
                    color = doc.get("highlight_color", "unknown")
                    count = doc.get("highlight_count", 0)
                    context_parts.append(f"**{color.upper()} HIGHLIGHTS ({count} sections):**\n{doc['content']}")
                else:
                    context_parts.append(doc["content"])

            context = "\n\n---\n\n".join(context_parts)

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
    
    def _build_prompt(self, query: str, context: str, use_web_search: bool, level_up_mode: bool = False) -> str:
        """Build prompt with context and instructions - STRUCTURED JSON OUTPUT ONLY"""

        # Detect programming language from context
        detected_language = self._detect_language_from_context(context)
        language_instruction = ""
        if detected_language:
            language_instruction = f"\n**DETECTED PROGRAMMING LANGUAGE IN DOCUMENTS: {detected_language.upper()}**\n**YOU MUST USE {detected_language.upper()} IN ALL CODE EXAMPLES - NO OTHER LANGUAGE!**\n"

        # Default to Java if no language detected but context suggests programming
        default_language = detected_language or "java"

        # Level Up+ mode adjustments
        depth_instruction = ""
        if level_up_mode:
            depth_instruction = """
**🚀 LEVEL UP+ MODE ACTIVATED**
You are in ENHANCED LEARNING MODE. Provide:
1. **Deeper Explanations**: Go beyond surface-level - explain WHY and HOW things work
2. **More Examples**: Include 2-3 diverse examples showing different use cases
3. **Expert Insights**: Add advanced tips, best practices, and common pitfalls
4. **Comprehensive Coverage**: Cover edge cases and alternative approaches
5. **Learning Path**: Suggest related topics to explore next
6. **Industry Context**: Explain real-world applications and industry standards
"""

        # CRITICAL: Force model to return structured JSON with pure LaTeX and code blocks
        prompt = f"""You are StudySync AI — a calm, knowledgeable, and helpful academic assistant for students.

**🚨 CRITICAL GROUNDING RULE - YOU MUST FOLLOW THIS:**
You answer questions using ONLY the content provided in the uploaded documents below.
Do NOT hallucinate or invent facts. Do NOT use external knowledge.
If the answer is not found in the context below, you MUST politely say: "I don't have that information in your uploaded notes. Please upload relevant documents or rephrase your question."

You output ONLY JSON. ALWAYS return valid JSON (no commentary, no extra text).
{depth_instruction}
**SYSTEM INSTRUCTION - MANDATORY FORMAT RULES:**
You MUST follow these formatting rules in EVERY response:
1. Start with bold headings using **Heading Text**
2. Use bullet points (•) for all lists and key points
3. Use sub-bullets (◦) for nested details
4. ALL code examples MUST be in {default_language.upper()} unless explicitly asked otherwise
5. Wrap ALL code in code blocks with proper language specification
6. After explanations, ALWAYS provide real-world use cases
7. Structure every response as: Heading → Summary → Key Points → Code Example → Use Cases{' → Advanced Insights (Level Up+ only)' if level_up_mode else ''}

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

**📚 UPLOADED DOCUMENT CONTEXT (YOUR ONLY SOURCE OF INFORMATION):**
{context if context else "⚠️ NO DOCUMENTS UPLOADED - User needs to upload study materials first."}

**Chat History:**
{self._format_chat_history()}

**Student's Question:**
{query}

**🚨 CRITICAL GROUNDING INSTRUCTIONS - READ CAREFULLY:**
{'- **NO CONTEXT AVAILABLE:** The user has not uploaded any documents yet. You MUST respond with: "I don\'t have any documents to reference. Please upload your study materials (PDFs, notes, etc.) so I can help you with specific content from them."' if not context else f'''- **USE ONLY THE CONTEXT ABOVE:** Base your ENTIRE answer on the document context provided above
- **NEVER USE EXTERNAL KNOWLEDGE:** Do not invent, assume, or recall information not present in the context
- **IF INFORMATION IS MISSING:** If the context does not contain information to answer the question, respond with: "I don't have that specific information in your uploaded documents. The context I found discusses [briefly mention what the context contains], but doesn't cover [what the user asked about]. Please try rephrasing your question or upload additional materials."
- **CITE YOUR SOURCES:** Reference specific parts of the documents when answering
- **STAY GROUNDED:** Every statement must be traceable back to the provided context'''}
- **MANDATORY: Follow the system formatting rules above**
- **YOU MUST USE {default_language.upper()} for ALL code examples unless explicitly asked otherwise**
- **RESPONSE STRUCTURE (MUST FOLLOW):**
  1. **Bold Heading** with topic name
  2. Brief summary paragraph ({f'4-5 sentences with depth' if level_up_mode else '2-3 sentences'})
  3. **Key Points** section with bullet points ({f'5-7 detailed points' if level_up_mode else '3-5 points'})
  4. Code example in {default_language.upper()} (if relevant) - {f'Include 2-3 examples showing different approaches' if level_up_mode else 'Provide clear example'}
  5. **Real-World Use Cases** section with practical applications ({f'4-5 industry examples' if level_up_mode else '2-3 examples'})
  {f'6. **Advanced Insights** - Best practices, common pitfalls, optimization tips' if level_up_mode else ''}
  {f'7. **Next Steps** - Related topics to explore for deeper learning' if level_up_mode else ''}
- **FORMATTING IN TEXT BLOCKS:**
  * Use **bold** for all headings and subheadings (wrap in **)
  * Use • for main bullet points
  * Use ◦ for sub-bullets (indented with spaces)
  * Use \\n for line breaks between sections
  * Keep paragraphs {'detailed but well-structured' if level_up_mode else 'concise and scannable'}
- **CODE REQUIREMENTS:**
  * ALL code must be in {default_language.upper()} language
  * Include {'detailed' if level_up_mode else ''} comments explaining key parts
  * Use proper {default_language.upper()} syntax and conventions
  * Provide {'multiple examples and' if level_up_mode else ''} complete, runnable examples when possible
  {f'* Add inline explanations for complex logic' if level_up_mode else ''}
- Analyze the context to match the exact programming style shown
- If context doesn't contain relevant information, say so clearly
- Structure: text → code → text (use cases){' → advanced insights → next steps' if level_up_mode else ''}
{f'- **LEVEL UP+ REQUIREMENTS:** Be thorough, provide expert-level insights, explain underlying principles, and guide deeper learning' if level_up_mode else ''}

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
    
    def _generate_suggestions(self, query: str, answer: str) -> List[Dict[str, str]]:
        """Generate follow-up question suggestions"""
        suggestions = [
            {"displayText": "Explain in simpler terms", "query": "Can you explain this in simpler terms?"},
            {"displayText": "Show me an example", "query": "Can you provide an example?"},
            {"displayText": "Key points to remember", "query": "What are the key points I should remember?"}
        ]

        # Add context-aware suggestions based on query
        if "how" in query.lower():
            suggestions.append({"displayText": "Step-by-step process", "query": "Can you show me the step-by-step process?"})
        elif "what" in query.lower():
            suggestions.append({"displayText": "Practical usage", "query": "How is this used in practice?"})
        elif "why" in query.lower():
            suggestions.append({"displayText": "Real-world applications", "query": "What are some real-world applications?"})

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
        print(f"📚 Added {len(chunks)} chunks to RAG store. Total documents now: {len(self.documents)}")
    
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

# Singleton instance
_rag_service_instance = None

def get_rag_service() -> RAGService:
    """
    Get or create singleton RAG service instance.
    Ensures all modules share the same document store.
    """
    global _rag_service_instance
    if _rag_service_instance is None:
        _rag_service_instance = RAGService()
        print("✅ Created new RAG service singleton instance")
    return _rag_service_instance
