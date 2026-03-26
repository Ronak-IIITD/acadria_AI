import json
import os
from typing import Any, Dict, List, Literal, Optional, cast
from openai import AsyncOpenAI
from app.models.schemas import ChatResponse, ContentBlock
from app.utils.ai_validator import validate_ai_blocks


class GroqService:
    """
    Service for interacting with Groq API (Llama 3, Mixtral, etc.)
    Uses OpenAI-compatible client.
    """

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.client = None

        if self.api_key:
            self.client = AsyncOpenAI(
                api_key=self.api_key, base_url="https://api.groq.com/openai/v1"
            )
            print("✅ Groq Service initialized")
        else:
            print("⚠️ GROQ_API_KEY not set. Groq models will be unavailable.")

    async def generate_response(
        self,
        query: str,
        context: str,
        sources: List[Dict[str, Any]],
        use_web_search: bool = False,
        level_up_mode: bool = False,
        model: str = "llama3-70b-8192",
    ) -> ChatResponse:
        """
        Generate response using Groq models.
        """
        if not self.client:
            raise Exception("Groq API key not configured")

        # System prompt with JSON enforcement
        system_prompt = self._build_system_prompt(context, level_up_mode)

        try:
            print(f"🚀 Sending request to Groq ({model})...")

            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query},
                ],
                temperature=0.7,
                max_tokens=4096,
                response_format={"type": "json_object"},
            )

            if not response.choices or response.choices[0].message is None:
                raise Exception("Groq returned no choices")

            raw_content = response.choices[0].message.content or ""
            print(f"🤖 Groq Response (first 100 chars): {raw_content[:100]}")

            # Groq often returns a JSON object with {"blocks": [...]}.
            # Normalize into an array string expected by validate_ai_blocks().
            normalized_payload = raw_content
            try:
                parsed_payload = json.loads(raw_content)
                if isinstance(parsed_payload, dict) and isinstance(
                    parsed_payload.get("blocks"), list
                ):
                    normalized_payload = json.dumps(parsed_payload["blocks"])
            except Exception:
                # Keep original payload; validator will raise if malformed.
                pass

            parsed_blocks = validate_ai_blocks(normalized_payload)

            # Convert to ContentBlock objects
            content_blocks = []
            for block in parsed_blocks:
                block_type = cast(
                    Literal["text", "math", "code"], block.get("type", "text")
                )
                content_blocks.append(
                    ContentBlock(
                        type=block_type,
                        value=block.get("value", ""),
                        language=block.get("language"),
                    )
                )

            return ChatResponse(blocks=content_blocks, suggestions=[], sources=sources)

        except Exception as e:
            print(f"❌ Groq API Error: {str(e)}")
            raise e

    def _build_system_prompt(self, context: str, level_up_mode: bool) -> str:
        """Build system prompt with context and JSON instructions"""

        depth_instruction = ""
        if level_up_mode:
            depth_instruction = """
            **LEVEL UP+ MODE ACTIVATED**
            Provide deep, expert-level explanations. Include advanced concepts, edge cases, and industry best practices.
            """

        return f"""You are StudySync AI, a helpful academic assistant.
        
        **INSTRUCTIONS:**
        1. Answer the user's question based ONLY on the provided context.
        2. If the answer is not in the context, say so politely.
        3. You MUST output valid JSON.
        
        {depth_instruction}
        
        **CONTEXT:**
        {context}
        
        **JSON STRUCTURE:**
        Return a JSON object with a "blocks" array:
        {{
            "blocks": [
                {{ "type": "text", "value": "Heading\\n\\nExplanation..." }},
                {{ "type": "code", "value": "print('hello')", "language": "python" }}
            ]
        }}
        """


# Singleton instance
_groq_service = None


def get_groq_service():
    global _groq_service
    if _groq_service is None:
        _groq_service = GroqService()
    return _groq_service
