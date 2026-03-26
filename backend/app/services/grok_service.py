"""
Grok Service - xAI's Grok model integration
Uses OpenAI-compatible API for Grok (grok-beta model)
"""

import os
from typing import List, Dict, Any, Optional
from openai import OpenAI
from app.models.schemas import ChatResponse, ContentBlock


class GrokService:
    """
    Service for interacting with xAI's Grok model.
    Grok uses OpenAI-compatible SDK with custom base URL.
    """

    def __init__(self):
        """Initialize Grok client"""
        api_key = os.getenv("GROK_API_KEY")
        if api_key:
            try:
                # Grok uses OpenAI-compatible API with different base URL
                self.client = OpenAI(api_key=api_key, base_url="https://api.x.ai/v1")
                print("✅ Grok service initialized")
            except Exception as e:
                print(f"⚠️  WARNING: Failed to initialize Grok client: {str(e)}")
                print("⚠️  Grok model will not be available. Gemini will still work.")
                self.client = None
        else:
            print("⚠️  WARNING: GROK_API_KEY not set. Grok calls will fail.")
            self.client = None

        # Chat history (partitioned by user_id)
        # Format: {user_id: [{"role": "user", "content": "msg"}, ...]}
        self.chat_history: Dict[str, List[Dict[str, str]]] = {}

    async def generate_response(
        self,
        query: str,
        context: str,
        sources: List[Dict[str, Any]],
        user_id: str,
        use_web_search: bool = False,
        level_up_mode: bool = False,
    ) -> ChatResponse:
        """
        Generate AI response using Grok model with retrieved context.

        Args:
            query: User's question
            context: Retrieved document context
            sources: Source documents
            use_web_search: Whether to use web search (not yet implemented)
            level_up_mode: Enable Level Up+ mode for enhanced, detailed responses

        Returns:
            ChatResponse with structured blocks
        """
        if not self.client:
            error_block = ContentBlock(
                type="text",
                value="Grok API key not configured. Please check backend/.env file.",
            )
            return ChatResponse(blocks=[error_block], suggestions=[], sources=[])

        try:
            # Build prompt with structured JSON instruction
            prompt = self._build_prompt(
                query, context, user_id, use_web_search, level_up_mode
            )

            # Adjust temperature and max_tokens for Level Up+ mode
            temperature = 0.8 if level_up_mode else 0.7
            max_tokens = 3000 if level_up_mode else 2000

            # Call Grok API
            response = self.client.chat.completions.create(
                model="grok-beta",
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful AI assistant that provides accurate, well-structured answers based on provided context."
                        + (
                            " In Level Up+ mode, provide comprehensive, expert-level explanations with deep insights."
                            if level_up_mode
                            else ""
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )

            raw_answer = response.choices[0].message.content or ""
            print(f"🤖 GROK RAW RESPONSE (first 500 chars): {raw_answer[:500]}")

            # Parse structured response
            try:
                blocks = self._parse_response(raw_answer)
                print(f"✅ Parsed {len(blocks)} blocks from Grok")
            except Exception as e:
                print(f"⚠️  Failed to parse Grok response: {e}")
                # Fallback: treat as plain text
                blocks = [ContentBlock(type="text", value=raw_answer)]

            # Add to chat history
            combined_text = " ".join([b.value for b in blocks if b.type == "text"])

            if user_id not in self.chat_history:
                self.chat_history[user_id] = []

            self.chat_history[user_id].append({"role": "user", "content": query})
            self.chat_history[user_id].append(
                {"role": "assistant", "content": combined_text}
            )

            # Generate suggestions
            suggestions = self._generate_suggestions(query, combined_text)

            return ChatResponse(blocks=blocks, suggestions=suggestions, sources=sources)

        except Exception as e:
            print(f"❌ Error generating Grok response: {str(e)}")
            error_block = ContentBlock(
                type="text", value=f"Error generating response with Grok: {str(e)}"
            )
            return ChatResponse(blocks=[error_block], suggestions=[], sources=[])

    def _build_prompt(
        self,
        query: str,
        context: str,
        user_id: str,
        use_web_search: bool,
        level_up_mode: bool = False,
    ) -> str:
        """Build prompt with context and instructions"""

        # Level Up+ mode instruction
        depth_instruction = ""
        if level_up_mode:
            depth_instruction = """
**🚀 LEVEL UP+ MODE ACTIVATED**
Provide ENHANCED responses with:
- Deeper explanations of underlying principles
- Multiple detailed examples (2-3+)
- Expert insights and best practices
- Advanced tips and common pitfalls
- Industry context and real-world applications
- Related topics for further learning
"""

        level_up_rule = ""
        if level_up_mode:
            level_up_rule = (
                "5. LEVEL UP+ MODE: Provide comprehensive coverage with 5-7 key points, "
                "multiple examples, and expert insights"
            )

        grounding_block = ""
        if not context:
            grounding_block = (
                "- **NO CONTEXT AVAILABLE:** The user has not uploaded any documents yet. "
                "You MUST respond with: \"I don't have any documents to reference. "
                "Please upload your study materials (PDFs, notes, etc.) so I can help you "
                'with specific content from them."'
            )
        else:
            grounding_block = (
                "- **USE ONLY THE CONTEXT ABOVE:** Base your ENTIRE answer on the document context provided above\n"
                "- **NEVER USE EXTERNAL KNOWLEDGE:** Do not invent, assume, or recall information not present in the context\n"
                "- **IF INFORMATION IS MISSING:** If the context does not contain information to answer the question, respond with: "
                "\"I don't have that specific information in your uploaded documents. The context I found discusses [briefly mention what "
                "the context contains], but doesn't cover [what the user asked about]. Please try rephrasing your question or upload "
                'additional materials."\n'
                "- **CITE YOUR SOURCES:** Reference specific parts of the documents when answering\n"
                "- **STAY GROUNDED:** Every statement must be traceable back to the provided context"
            )

        level_up_grounding = ""
        if level_up_mode:
            level_up_grounding = (
                "- **LEVEL UP+ MODE:** Go beyond basics - explain WHY, provide multiple approaches, "
                "discuss trade-offs, and suggest next learning steps"
            )

        prompt = f"""You are StudySync AI — a calm, knowledgeable, and helpful academic assistant for students.

**🚨 CRITICAL GROUNDING RULE - YOU MUST FOLLOW THIS:**
You answer questions using ONLY the content provided in the uploaded documents below.
Do NOT hallucinate or invent facts. Do NOT use external knowledge.
If the answer is not found in the context below, you MUST politely say: "I don't have that information in your uploaded notes. Please upload relevant documents or rephrase your question."

You are an assistant that outputs structured responses. ALWAYS return valid JSON.
{depth_instruction}
**FORMAT REQUIREMENT:**
Return a JSON array of content blocks:
[
  {{"type":"text", "value":"plain text explanation"}},
  {{"type":"math", "value":"PURE_LATEX_EXPRESSION (no $, no $$, no HTML)"}}
]

**STRICT RULES:**
1. Math blocks contain ONLY LaTeX (e.g., \\int_0^1 x^2 \\,dx = \\frac{{1}}{{3}})
2. NO HTML tags, NO markdown markers, NO dollar signs in math blocks
3. If explanation + equation: return TWO blocks (text first, then math)
4. Use \\frac{{}}{{}}, \\sqrt{{}}, ^{{}}, _{{}} for LaTeX formatting
{level_up_rule}

**📚 UPLOADED DOCUMENT CONTEXT (YOUR ONLY SOURCE OF INFORMATION):**
{context if context else "⚠️ NO DOCUMENTS UPLOADED - User needs to upload study materials first."}

**Chat History:**
{self._format_chat_history(user_id)}

**Student's Question:**
{query}

**🚨 CRITICAL GROUNDING INSTRUCTIONS - READ CAREFULLY:**
{grounding_block}
{level_up_grounding}

Output ONLY the JSON array. No additional text."""

        return prompt

    def _parse_response(self, raw_answer: str) -> List[ContentBlock]:
        """Parse Grok's response into structured blocks"""
        import json

        # Try to extract JSON from response
        try:
            # Remove markdown code fences if present
            content = raw_answer.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            # Parse JSON
            blocks_data = json.loads(content)

            # Grok with response_format=json_object may return {"blocks": [...]}.
            if isinstance(blocks_data, dict):
                blocks_data = blocks_data.get("blocks", [])

            # Convert to ContentBlock objects
            blocks = [ContentBlock(**block) for block in blocks_data]
            return blocks

        except Exception as e:
            print(f"⚠️  JSON parsing failed: {e}")
            # Fallback: return as text block
            return [ContentBlock(type="text", value=raw_answer)]

    def _format_chat_history(self, user_id: str) -> str:
        """Format chat history for prompt"""
        user_history = self.chat_history.get(user_id, [])
        if not user_history:
            return "No previous conversation."

        formatted = []
        for msg in user_history[-6:]:  # Last 3 exchanges
            role = "Student" if msg["role"] == "user" else "AI"
            formatted.append(f"{role}: {msg['content']}")

        return "\n".join(formatted)

    def _generate_suggestions(self, query: str, answer: str) -> List[Dict[str, str]]:
        """Generate follow-up question suggestions"""
        suggestions: List[Dict[str, str]] = [
            {
                "displayText": "Explain simpler",
                "query": "Can you explain this in simpler terms?",
            },
            {
                "displayText": "Show an example",
                "query": "Can you provide an example?",
            },
            {
                "displayText": "Key points",
                "query": "What are the key points I should remember?",
            },
        ]

        # Add context-aware suggestions
        if "how" in query.lower():
            suggestions.append(
                {
                    "displayText": "Step-by-step",
                    "query": "Can you show me the step-by-step process?",
                }
            )
        elif "what" in query.lower():
            suggestions.append(
                {
                    "displayText": "Practical usage",
                    "query": "How is this used in practice?",
                }
            )
        elif "why" in query.lower():
            suggestions.append(
                {
                    "displayText": "Real-world use",
                    "query": "What are some real-world applications?",
                }
            )

        return suggestions[:3]

    def clear_history(self, user_id: Optional[str] = None):
        """Clear chat history for a user"""
        if user_id:
            if user_id in self.chat_history:
                self.chat_history[user_id] = []
                print(f"🧹 Cleared Grok chat history for user {user_id}")
        else:
            self.chat_history = {}
            print("🧹 Cleared ALL Grok chat history")


# Global instance for reuse
_grok_service_instance = None


def get_grok_service() -> GrokService:
    """Get singleton instance of GrokService"""
    global _grok_service_instance
    if _grok_service_instance is None:
        _grok_service_instance = GrokService()
    return _grok_service_instance
