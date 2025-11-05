"""
Grok Service - xAI's Grok model integration
Uses OpenAI-compatible API for Grok (grok-beta model)
"""

import os
from typing import List, Dict, Any
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
            # Grok uses OpenAI-compatible API with different base URL
            self.client = OpenAI(
                api_key=api_key,
                base_url="https://api.x.ai/v1"
            )
            print("✅ Grok service initialized")
        else:
            print("⚠️  WARNING: GROK_API_KEY not set. Grok calls will fail.")
            self.client = None
        
        # Chat history
        self.chat_history: List[Dict[str, str]] = []
    
    async def generate_response(
        self,
        query: str,
        context: str,
        sources: List[Dict[str, Any]],
        use_web_search: bool = False
    ) -> ChatResponse:
        """
        Generate AI response using Grok model with retrieved context.
        
        Args:
            query: User's question
            context: Retrieved document context
            sources: Source documents
            use_web_search: Whether to use web search (not yet implemented)
        
        Returns:
            ChatResponse with structured blocks
        """
        if not self.client:
            error_block = ContentBlock(
                type="text",
                value="Grok API key not configured. Please check backend/.env file."
            )
            return ChatResponse(blocks=[error_block], suggestions=[], sources=[])
        
        try:
            # Build prompt with structured JSON instruction
            prompt = self._build_prompt(query, context, use_web_search)
            
            # Call Grok API
            response = self.client.chat.completions.create(
                model="grok-4",  # Grok's latest model with 2M token context
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant that provides accurate, well-structured answers based on provided context."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            raw_answer = response.choices[0].message.content
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
            self.chat_history.append({"role": "user", "content": query})
            self.chat_history.append({"role": "assistant", "content": combined_text})
            
            # Generate suggestions
            suggestions = self._generate_suggestions(query, combined_text)
            
            return ChatResponse(
                blocks=blocks,
                suggestions=suggestions,
                sources=sources
            )
        
        except Exception as e:
            print(f"❌ Error generating Grok response: {str(e)}")
            error_block = ContentBlock(
                type="text",
                value=f"Error generating response with Grok: {str(e)}"
            )
            return ChatResponse(
                blocks=[error_block],
                suggestions=[],
                sources=[]
            )
    
    def _build_prompt(self, query: str, context: str, use_web_search: bool) -> str:
        """Build prompt with context and instructions"""
        
        prompt = f"""You are an assistant that outputs structured responses. ALWAYS return valid JSON.

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

**Context from uploaded documents:**
{context if context else "No relevant documents found."}

**Chat History:**
{self._format_chat_history()}

**Student's Question:**
{query}

**Instructions:**
- Provide accurate answers based on the context
- If context doesn't have info, say so clearly
- Use examples appropriate for students
- Cite specific parts of documents when relevant

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
            
            # Convert to ContentBlock objects
            blocks = [ContentBlock(**block) for block in blocks_data]
            return blocks
        
        except Exception as e:
            print(f"⚠️  JSON parsing failed: {e}")
            # Fallback: return as text block
            return [ContentBlock(type="text", value=raw_answer)]
    
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
        
        # Add context-aware suggestions
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


# Global instance for reuse
_grok_service_instance = None

def get_grok_service() -> GrokService:
    """Get singleton instance of GrokService"""
    global _grok_service_instance
    if _grok_service_instance is None:
        _grok_service_instance = GrokService()
    return _grok_service_instance
