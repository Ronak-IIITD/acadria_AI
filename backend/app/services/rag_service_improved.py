import os
import json
import time
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from app.models.schemas import ChatResponse, ContentBlock
from app.utils.ai_validator import validate_ai_blocks, extract_suggestions_and_sources
from app.services.embedding_service import get_embedding_service
from app.config import MAX_RETRIES, INITIAL_RETRY_DELAY, MAX_RETRY_DELAY, FALLBACK_MODEL


class RAGServiceImproved:
    """
    IMPROVED RAG service with better context retrieval and AI grounding.

    KEY IMPROVEMENTS:
    1. Better semantic search with dynamic threshold
    2. Hybrid search (semantic + keyword) for better recall
    3. Improved prompt engineering for grounded responses
    4. Better fallback mechanisms when context is low quality
    5. Context quality scoring and filtering
    """

    def __init__(self):
        # Initialize Gemini
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("gemini-2.0-flash-exp")
            self.model_name = "gemini-2.0-flash-exp"
        else:
            print("WARNING: GEMINI_API_KEY not set. API calls will fail.")
            self.model = None
            self.model_name = None

        # Initialize embedding service
        self.embedding_service = get_embedding_service()

        # In-memory storage (partitioned by user_id)
        self.documents: Dict[str, List[Dict[str, Any]]] = {}
        self.chat_history: Dict[str, List[Dict[str, str]]] = {}

        # Persistence
        self.storage_file = "data/rag_storage.json"
        self._load_state()

        # Context retrieval settings
        self.min_similarity_threshold = 0.3  # Minimum similarity score to consider
        self.high_similarity_threshold = 0.7  # High quality context threshold

    def set_model(self, model_name: str):
        """Switch between Gemini models dynamically"""
        model_mapping = {
            "gemini-1.5-flash": "gemini-1.5-flash-latest",
            "gemini-1.5-pro": "gemini-1.5-pro-latest",
            "gemini-flash": "gemini-1.5-flash-latest",
            "gemini-2.0-flash-exp": "gemini-2.0-flash-exp",
            "gemini-2.5-flash": "gemini-2.5-flash-latest",
            "gemini-2.5-pro": "gemini-2.5-pro-latest",
            "gemini-3-pro": "gemini-3-pro-preview",
        }

        actual_model = model_mapping.get(model_name, model_name)

        try:
            self.model = genai.GenerativeModel(actual_model)
            self.model_name = actual_model
            print(f"✅ Switched to model: {actual_model}")
        except Exception as e:
            print(f"⚠️  Error switching model: {e}, keeping current model")

    async def generate_response(
        self,
        query: str,
        user_id: str,
        use_web_search: bool = False,
        level_up_mode: bool = False,
    ) -> ChatResponse:
        """
        Generate AI response with IMPROVED context retrieval and grounding.

        IMPROVEMENTS:
        - Hybrid search (semantic + keyword)
        - Context quality scoring
        - Better fallback mechanisms
        - Stricter grounding prompts
        """
        try:
            # STEP 1: Retrieve context with hybrid search
            top_k = 5 if level_up_mode else 3
            context, sources, context_quality = self._retrieve_context_hybrid(
                query, user_id, top_k=top_k
            )

            # STEP 2: Log context retrieval
            print(f"📖 Context retrieved: {len(context)} chars")
            print(f"📊 Context quality: {context_quality:.2f} (0.0-1.0)")
            print(f"📄 Sources: {[s['title'] for s in sources]}")

            # STEP 3: Check if we have sufficient context
            if not context or context_quality < self.min_similarity_threshold:
                print(
                    f"⚠️  Low quality context ({context_quality:.2f}). Prompting user to upload more relevant documents."
                )
                return ChatResponse(
                    blocks=[
                        ContentBlock(
                            type="text",
                            value=f"I couldn't find relevant information in your uploaded documents to answer this question. The available documents don't seem to cover this topic.\n\n**Suggestions:**\n• Upload documents that specifically cover **{query[:100]}**\n• Try rephrasing your question\n• Check if you've uploaded the right materials for this topic",
                        )
                    ],
                    suggestions=[
                        {
                            "displayText": "Upload more documents",
                            "query": "help me upload documents",
                        },
                        {
                            "displayText": "Rephrase question",
                            "query": f"Can you explain {query[:50]}... differently?",
                        },
                    ],
                    sources=[],
                )

            # STEP 4: Build improved prompt with strict grounding
            prompt = self._build_improved_prompt(
                query, context, context_quality, user_id, use_web_search, level_up_mode
            )

            # STEP 5: Generate response with retry logic
            retry_delay = INITIAL_RETRY_DELAY
            original_model = self.model_name
            raw_answer = None
            last_error = None

            for attempt in range(MAX_RETRIES):
                try:
                    print(
                        f"🤖 Generating response with {self.model_name} (attempt {attempt + 1}/{MAX_RETRIES})"
                    )

                    response = self.model.generate_content(
                        prompt,
                        generation_config=genai.types.GenerationConfig(
                            response_mime_type="application/json",
                            response_schema={
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "type": {"type": "string"},
                                        "value": {"type": "string"},
                                        "language": {"type": "string"},
                                    },
                                    "required": ["type", "value"],
                                },
                            },
                            temperature=0.3,  # Lower temperature for more grounded responses
                            top_p=0.8,
                            top_k=40,
                        ),
                    )
                    raw_answer = response.text

                    if self.model_name != original_model:
                        print(
                            f"✅ Successfully generated response using fallback model: {self.model_name}"
                        )

                    break  # Success

                except Exception as e:
                    error_str = str(e).lower()
                    status_code = getattr(e, "code", getattr(e, "status_code", None))

                    is_retryable = status_code in [503, 429, 500] or any(
                        kw in error_str
                        for kw in [
                            "503",
                            "unavailable",
                            "overloaded",
                            "quota",
                            "rate",
                            "resource_exhausted",
                            "too many requests",
                        ]
                    )

                    if is_retryable and attempt < MAX_RETRIES - 1:
                        print(
                            f"⚠️  Model error (attempt {attempt + 1}/{MAX_RETRIES}): {str(e)[:200]}"
                        )
                        print(f"⏳ Retrying in {retry_delay} seconds...")
                        time.sleep(retry_delay)
                        retry_delay = min(retry_delay * 2, MAX_RETRY_DELAY)

                        if attempt == 1 and self.model_name != FALLBACK_MODEL:
                            print(f"🔄 Switching to fallback model: {FALLBACK_MODEL}")
                            try:
                                self.set_model(FALLBACK_MODEL)
                            except:
                                pass
                        continue
                    else:
                        last_error = e
                        if is_retryable:
                            raise Exception(
                                f"All AI models are currently busy after {MAX_RETRIES} attempts. Please try again in a few moments."
                            )
                        else:
                            raise

            if raw_answer is None:
                raise Exception(
                    f"Failed to generate response after {MAX_RETRIES} attempts"
                )

            print(f"🤖 RAW AI RESPONSE (first 500 chars): {raw_answer[:500]}")

            # STEP 6: Validate and sanitize response
            try:
                blocks = validate_ai_blocks(raw_answer)
                print(f"✅ Validated {len(blocks)} blocks successfully")
            except ValueError as e:
                print(f"⚠️  JSON validation failed: {e}")
                blocks = [
                    {
                        "type": "text",
                        "value": f"Sorry, I received an invalid response format. Please try rephrasing your question.",
                    }
                ]

            # Convert to ContentBlock models
            content_blocks = [ContentBlock(**block) for block in blocks]

            # Update chat history
            combined_text = " ".join(
                [b.value for b in content_blocks if b.type == "text"]
            )

            if user_id not in self.chat_history:
                self.chat_history[user_id] = []

            self.chat_history[user_id].append({"role": "user", "content": query})
            self.chat_history[user_id].append(
                {"role": "assistant", "content": combined_text}
            )

            self._save_state()

            # Generate contextual suggestions
            suggestions = self._generate_smart_suggestions(
                query, combined_text, context_quality
            )

            return ChatResponse(
                blocks=content_blocks, suggestions=suggestions, sources=sources
            )

        except Exception as e:
            error_msg = str(e).lower()
            print(f"❌ Error generating response: {str(e)}")

            # User-friendly error messages
            if (
                "503" in error_msg
                or "unavailable" in error_msg
                or "overloaded" in error_msg
            ):
                user_message = "🔄 The AI service is temporarily busy. Please try again in a moment or switch to a different model."
            elif "quota" in error_msg or "rate" in error_msg:
                user_message = "⚠️ API rate limit reached. Please wait a minute before trying again."
            elif "api_key" in error_msg or "authentication" in error_msg:
                user_message = (
                    "🔑 API key issue detected. Please check your configuration."
                )
            else:
                user_message = f"Sorry, I encountered an error. Please try again. (Error: {str(e)[:100]})"

            error_block = ContentBlock(type="text", value=user_message)
            return ChatResponse(
                blocks=[error_block],
                suggestions=[
                    {"displayText": "Try again", "query": query},
                    {"displayText": "Switch model", "query": "help me switch models"},
                ],
                sources=[],
            )

    def _retrieve_context_hybrid(
        self, query: str, user_id: str, top_k: int = 3
    ) -> tuple[str, List[Dict[str, Any]], float]:
        """
        HYBRID context retrieval: Semantic search + keyword fallback.
        Returns (context, sources, quality_score)

        IMPROVEMENTS:
        - Uses both semantic and keyword matching
        - Scores context quality
        - Better handling of edge cases
        """
        user_docs = self.documents.get(user_id, [])
        if not user_docs:
            print(f"⚠️  No documents in store for user {user_id}")
            return "", [], 0.0

        try:
            query_lower = query.lower()

            # Detect highlight queries
            highlight_keywords = [
                "highlight",
                "highlighted",
                "annotation",
                "annotate",
                "marked",
            ]
            is_highlight_query = any(kw in query_lower for kw in highlight_keywords)

            highlight_colors = [
                "yellow",
                "green",
                "red",
                "blue",
                "orange",
                "pink",
                "purple",
            ]
            requested_color = next(
                (color for color in highlight_colors if color in query_lower), None
            )

            print(f"🔍 Hybrid search for: '{query}'")
            if is_highlight_query:
                print(f"🎨 Highlight query detected: {requested_color or 'any color'}")

            # SEMANTIC SEARCH
            semantic_results = []
            if self.embedding_service.is_available():
                query_embedding = self.embedding_service.generate_query_embedding(query)

                if query_embedding:
                    for doc in user_docs:
                        doc_embedding = doc.get("embedding")
                        if doc_embedding is None:
                            continue

                        content_type = doc.get("content_type", "document")

                        # Filter highlights if needed
                        if is_highlight_query:
                            if requested_color:
                                if not (
                                    content_type == "highlight"
                                    and doc.get("highlight_color") == requested_color
                                ):
                                    continue
                            else:
                                if content_type != "highlight":
                                    continue

                        similarity = self.embedding_service.cosine_similarity(
                            query_embedding, doc_embedding
                        )

                        # Boost highlights
                        if content_type == "highlight":
                            similarity *= 1.2

                        semantic_results.append((similarity, doc, "semantic"))

                    semantic_results.sort(reverse=True, key=lambda x: x[0])
                    print(f"📊 Semantic search: found {len(semantic_results)} results")

                    if semantic_results:
                        top_scores = [score for score, _, _ in semantic_results[:top_k]]
                        print(
                            f"   Top {len(top_scores)} scores: {[f'{s:.3f}' for s in top_scores]}"
                        )

            # KEYWORD SEARCH (as supplement)
            keyword_results = self._keyword_search_improved(
                query_lower, user_docs, is_highlight_query, requested_color
            )

            # MERGE RESULTS: Prioritize high-scoring semantic, supplement with keywords
            final_results = []
            seen_doc_ids = set()

            # Add high-quality semantic results first (score > 0.5)
            for score, doc, source in semantic_results:
                if score > 0.5:
                    doc_id = id(doc)
                    if doc_id not in seen_doc_ids:
                        final_results.append((score, doc))
                        seen_doc_ids.add(doc_id)

            # Fill remaining slots with lower semantic results or keywords
            for score, doc, source in semantic_results + keyword_results:
                if len(final_results) >= top_k:
                    break
                doc_id = id(doc)
                if doc_id not in seen_doc_ids:
                    final_results.append((score, doc))
                    seen_doc_ids.add(doc_id)

            # Fallback: if still not enough, just take first docs
            if len(final_results) < top_k and user_docs:
                for doc in user_docs:
                    if len(final_results) >= top_k:
                        break
                    doc_id = id(doc)
                    if doc_id not in seen_doc_ids:
                        final_results.append((0.3, doc))  # Low score for fallback
                        seen_doc_ids.add(doc_id)

            if not final_results:
                print("⚠️  No results from hybrid search")
                return "", [], 0.0

            # Calculate average quality score
            avg_quality = sum(score for score, _ in final_results) / len(final_results)

            # Build context
            top_docs = [doc for _, doc in final_results]
            context, sources = self._build_context_from_docs(top_docs)

            print(
                f"✅ Hybrid search: {len(final_results)} documents, avg quality: {avg_quality:.3f}"
            )

            return context, sources, avg_quality

        except Exception as e:
            print(f"❌ Error in hybrid search: {str(e)}")
            # Last resort fallback
            if user_docs:
                fallback_docs = user_docs[:top_k]
                context, sources = self._build_context_from_docs(fallback_docs)
                return context, sources, 0.3
            return "", [], 0.0

    def _retrieve_context(
        self, query: str, user_id: str, top_k: int = 3
    ) -> tuple[str, List[Dict[str, Any]]]:
        """
        Compatibility wrapper for Grok/Groq services.

        This method maintains the same signature as the original RAG service
        but uses the improved hybrid search internally.

        Returns: (context, sources) tuple
        """
        context, sources, _ = self._retrieve_context_hybrid(query, user_id, top_k)
        return context, sources

    def _keyword_search_improved(
        self,
        query_lower: str,
        user_docs: List[Dict],
        is_highlight_query: bool,
        requested_color: Optional[str],
    ) -> List[tuple[float, Dict, str]]:
        """Improved keyword search with better scoring"""
        stop_words = {
            "what",
            "when",
            "where",
            "who",
            "why",
            "how",
            "is",
            "are",
            "the",
            "and",
            "a",
            "an",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "with",
            "by",
            "from",
            "about",
            "as",
            "can",
            "could",
            "would",
            "should",
            "do",
            "does",
            "did",
            "have",
            "has",
            "had",
            "be",
            "been",
            "being",
            "was",
            "were",
            "your",
            "my",
            "their",
            "his",
            "her",
            "its",
            "our",
        }

        keywords = [
            word
            for word in query_lower.replace("-", " ").split()
            if len(word) > 2 and word not in stop_words
        ]

        if not keywords:
            return []

        scored_docs = []
        for doc in user_docs:
            content_type = doc.get("content_type", "document")

            # Filter highlights
            if is_highlight_query:
                if requested_color:
                    if not (
                        content_type == "highlight"
                        and doc.get("highlight_color") == requested_color
                    ):
                        continue
                else:
                    if content_type != "highlight":
                        continue

            text = doc.get("content", "").lower()

            # Scoring based on keyword matches
            score = 0.0
            for keyword in keywords:
                # Exact word match
                if f" {keyword} " in f" {text} ":
                    score += 0.1
                # Substring match
                elif keyword in text:
                    score += 0.05

            # Boost for chunk position
            chunk_index = doc.get("chunk_index", 0)
            if chunk_index < 3:
                score += 0.05 * (3 - chunk_index)

            if score > 0:
                scored_docs.append((score, doc, "keyword"))

        scored_docs.sort(reverse=True, key=lambda x: x[0])

        if scored_docs:
            print(f"📊 Keyword search: found {len(scored_docs)} results")

        return scored_docs

    def _build_context_from_docs(
        self, docs: List[Dict[str, Any]]
    ) -> tuple[str, List[Dict[str, Any]]]:
        """Build context string and metadata from selected documents"""
        if not docs:
            return "", []

        context_parts = []
        for doc in docs:
            if doc.get("content_type") == "highlight":
                color = doc.get("highlight_color", "unknown")
                count = doc.get("highlight_count", 0)
                context_parts.append(
                    f"**{color.upper()} HIGHLIGHTS ({count} sections):**\n{doc['content']}"
                )
            else:
                context_parts.append(doc["content"])

        context = "\n\n---\n\n".join(context_parts)

        sources = [
            {"title": doc["filename"], "page": doc.get("chunk_index", 0) + 1}
            for doc in docs
        ]

        return context, sources

    def _build_improved_prompt(
        self,
        query: str,
        context: str,
        context_quality: float,
        user_id: str,
        use_web_search: bool,
        level_up_mode: bool,
    ) -> str:
        """
        Build IMPROVED prompt with strict grounding rules.

        IMPROVEMENTS:
        - Stricter grounding instructions
        - Quality-aware prompting
        - Better examples
        - Clearer formatting rules
        """

        # Detect programming language
        detected_language = self._detect_language_from_context(context)
        default_language = detected_language or "java"

        # Quality-based instructions
        if context_quality > self.high_similarity_threshold:
            quality_note = "**HIGH QUALITY CONTEXT**: You have excellent relevant information. Provide a detailed, comprehensive answer."
        elif context_quality > self.min_similarity_threshold:
            quality_note = "**MODERATE QUALITY CONTEXT**: You have some relevant information. Answer what you can and indicate if you need more details."
        else:
            quality_note = "**LOW QUALITY CONTEXT**: The context may not fully answer the question. Be honest about limitations."

        # Level Up+ mode
        depth_instruction = ""
        if level_up_mode:
            depth_instruction = """
**🚀 LEVEL UP+ MODE**
Provide enhanced, detailed responses with:
• Deeper explanations of concepts and principles
• Multiple examples showing different approaches
• Best practices and common pitfalls
• Real-world applications and industry context
• Related topics for further learning
"""

        prompt = f"""You are StudySync AI — an expert academic assistant that ALWAYS bases answers on uploaded documents.

{quality_note}

**🚨 CRITICAL GROUNDING RULES - FOLLOW STRICTLY:**
1. **ONLY use information from the DOCUMENT CONTEXT below**
2. **NEVER invent facts or use external knowledge**
3. **If the context doesn't contain the answer, SAY SO CLEARLY**
4. **Quote or reference specific parts of the documents**
5. **If context is incomplete, ask for more specific documents**

{depth_instruction}

**OUTPUT FORMAT:**
Return ONLY a JSON array of content blocks:
[
  {{"type":"text", "value":"**Heading**\\n\\nExplanation with bullet points"}},
  {{"type":"code", "value":"code here", "language":"{default_language}"}},
  {{"type":"math", "value":"pure LaTeX without delimiters"}}
]

**BLOCK TYPES:**
- **text**: Plain explanations, use **bold** for headings, • for bullets, ◦ for sub-bullets
- **code**: Code snippets with language ({default_language} by default)
- **math**: Pure LaTeX math (no $, $$, or HTML tags)

**FORMATTING REQUIREMENTS:**
1. Start responses with **Bold Heading**
2. Use bullet points • for main points
3. Use sub-bullets ◦ for details  
4. Default code language: {default_language}
5. Include real-world use cases
6. Structure: Heading → Summary → Key Points → Code/Math → Use Cases

**DOCUMENT CONTEXT (YOUR ONLY SOURCE):**
```
{context}
```

**Chat History:**
{self._format_chat_history(user_id)}

**Student Question:**
{query}

**CRITICAL INSTRUCTIONS:**
- Base EVERY statement on the context above
- If context lacks information, respond: "The documents I have don't contain information about [specific topic]. The available content covers [what you found], but not [what's missing]. Please upload documents specifically about [topic] or rephrase your question."
- Reference document sections when answering
- Use {default_language} for ALL code examples unless specified otherwise
- Be honest about context limitations
- Follow the exact JSON format specified above

**Remember:** You MUST ONLY use information from the uploaded documents. Cite sources. Be transparent about gaps.

Output the JSON array now:"""

        return prompt

    def _format_chat_history(self, user_id: str) -> str:
        """Format recent chat history"""
        user_history = self.chat_history.get(user_id, [])
        if not user_history:
            return "No previous conversation."

        formatted = []
        for msg in user_history[-6:]:  # Last 3 exchanges
            role = "Student" if msg["role"] == "user" else "AI"
            formatted.append(
                f"{role}: {msg['content'][:200]}"
            )  # Truncate long messages

        return "\n".join(formatted)

    def _generate_smart_suggestions(
        self, query: str, answer: str, context_quality: float
    ) -> List[Dict[str, str]]:
        """Generate contextual follow-up suggestions"""
        suggestions = []

        # Quality-based suggestions
        if context_quality < 0.5:
            suggestions.append(
                {
                    "displayText": "Upload more relevant documents",
                    "query": "How do I upload more documents?",
                }
            )

        # Query-based suggestions
        query_lower = query.lower()
        if "what" in query_lower or "definition" in query_lower:
            suggestions.append(
                {
                    "displayText": "Show me examples",
                    "query": "Can you provide examples?",
                }
            )
            suggestions.append(
                {
                    "displayText": "How does it work?",
                    "query": "How does this work in practice?",
                }
            )
        elif "how" in query_lower:
            suggestions.append(
                {
                    "displayText": "Show step-by-step",
                    "query": "Can you break this down step-by-step?",
                }
            )
            suggestions.append(
                {
                    "displayText": "Common mistakes?",
                    "query": "What are common mistakes to avoid?",
                }
            )
        elif "why" in query_lower:
            suggestions.append(
                {
                    "displayText": "Real-world usage",
                    "query": "How is this used in practice?",
                }
            )
            suggestions.append(
                {
                    "displayText": "Alternatives?",
                    "query": "What are alternative approaches?",
                }
            )
        else:
            suggestions.append(
                {
                    "displayText": "Explain simpler",
                    "query": "Can you explain this in simpler terms?",
                }
            )
            suggestions.append(
                {
                    "displayText": "Key takeaways",
                    "query": "What are the key points to remember?",
                }
            )

        return suggestions[:3]

    def _detect_language_from_context(self, context: str) -> str:
        """Detect programming language from code patterns"""
        if not context:
            return ""

        import re

        context_lower = context.lower()

        patterns = {
            "java": [
                r"public\s+class\s+\w+",
                r"public\s+static\s+void\s+main",
                r"System\.out\.print",
                r"@Override",
                r"extends\s+\w+",
            ],
            "python": [
                r"def\s+\w+\s*\(",
                r"import\s+\w+",
                r"from\s+\w+\s+import",
                r"if\s+__name__\s*==",
                r"print\s*\(",
            ],
            "cpp": [r"#include\s*<", r"std::", r"cout\s*<<", r"int\s+main\s*\("],
            "javascript": [
                r"function\s+\w+\s*\(",
                r"const\s+\w+\s*=",
                r"console\.log\s*\(",
                r"=>\s*{",
            ],
        }

        scores = {}
        for lang, lang_patterns in patterns.items():
            score = sum(
                1
                for pattern in lang_patterns
                if re.search(pattern, context, re.IGNORECASE)
            )
            if score > 0:
                scores[lang] = score

        if scores:
            detected = max(scores.items(), key=lambda x: x[1])
            if detected[1] >= 2:
                print(f"🔍 Detected language: {detected[0]}")
                return detected[0]

        return ""

    def clear_history(self, user_id: str = None):
        """Clear chat history"""
        if user_id:
            if user_id in self.chat_history:
                self.chat_history[user_id] = []
                print(f"🧹 Cleared chat history for user {user_id}")
        else:
            self.chat_history = {}
            print("🧹 Cleared ALL chat history")
        self._save_state()

    def add_documents_to_store(self, chunks: List[Dict[str, Any]], user_id: str):
        """Add document chunks to store"""
        if not chunks:
            print("⚠️  Warning: Attempted to add empty chunks")
            return

        if user_id not in self.documents:
            self.documents[user_id] = []

        self.documents[user_id].extend(chunks)
        print(
            f"📚 Added {len(chunks)} chunks for user {user_id}. Total: {len(self.documents[user_id])}"
        )

        self._save_state()

    def get_document_count(self, user_id: str = None) -> int:
        """Get document count"""
        if user_id:
            return len(self.documents.get(user_id, []))
        return sum(len(docs) for docs in self.documents.values())

    def get_document_info(self, user_id: str = None) -> Dict[str, Any]:
        """Get document info for debugging"""
        if user_id:
            docs_to_check = self.documents.get(user_id, [])
        else:
            docs_to_check = [
                doc for user_docs in self.documents.values() for doc in user_docs
            ]

        if not docs_to_check:
            return {"total": 0, "files": []}

        files = {}
        for doc in docs_to_check:
            filename = doc.get("filename", "unknown")
            if filename not in files:
                files[filename] = {
                    "filename": filename,
                    "chunks": 0,
                    "has_embeddings": 0,
                    "content_types": {},
                }
            files[filename]["chunks"] += 1
            if doc.get("embedding") is not None:
                files[filename]["has_embeddings"] += 1
            content_type = doc.get("content_type", "document")
            files[filename]["content_types"][content_type] = (
                files[filename]["content_types"].get(content_type, 0) + 1
            )

        return {"total": len(docs_to_check), "files": list(files.values())}

    def _save_state(self):
        """Save to disk"""
        try:
            os.makedirs(os.path.dirname(self.storage_file), exist_ok=True)
            state = {"documents": self.documents, "chat_history": self.chat_history}
            temp_file = f"{self.storage_file}.tmp"
            with open(temp_file, "w") as f:
                json.dump(state, f)
            os.replace(temp_file, self.storage_file)
            print("💾 RAG state saved")
        except Exception as e:
            print(f"❌ Failed to save state: {e}")

    def _load_state(self):
        """Load from disk"""
        if not os.path.exists(self.storage_file):
            return

        try:
            with open(self.storage_file, "r") as f:
                state = json.load(f)

            self.documents = state.get("documents", {})
            self.chat_history = state.get("chat_history", {})

            total_docs = sum(len(docs) for docs in self.documents.values())
            print(
                f"📂 Loaded RAG state: {total_docs} chunks, {len(self.chat_history)} sessions"
            )
        except Exception as e:
            print(f"❌ Failed to load state: {e}")

    def clear_documents(self, user_id: str = None):
        """Clear documents"""
        if user_id:
            if user_id in self.documents:
                self.documents[user_id] = []
                print(f"🧹 Cleared documents for user {user_id}")
        else:
            self.documents = {}
            print("🧹 Cleared ALL documents")

    def remove_document_by_id(self, document_id: str, user_id: str) -> int:
        """Remove document chunks by ID"""
        if user_id not in self.documents:
            return 0

        user_docs = self.documents[user_id]
        initial_count = len(user_docs)
        self.documents[user_id] = [
            doc for doc in user_docs if doc.get("document_id") != document_id
        ]
        removed_count = initial_count - len(self.documents[user_id])

        if removed_count > 0:
            print(f"🗑️  Removed {removed_count} chunks for document {document_id}")

        return removed_count


# Singleton instance
_rag_service_improved_instance = None


def get_rag_service_improved() -> RAGServiceImproved:
    """Get singleton instance"""
    global _rag_service_improved_instance
    if _rag_service_improved_instance is None:
        _rag_service_improved_instance = RAGServiceImproved()
        print("✅ Created improved RAG service singleton")
    return _rag_service_improved_instance
