import asyncio

from app.services.grok_service import GrokService
from app.services.groq_service import GroqService


class _FakeAsyncGroqCompletions:
    def __init__(self, content: str):
        self._content = content

    async def create(self, **kwargs):
        class _Message:
            def __init__(self, content: str):
                self.content = content

        class _Choice:
            def __init__(self, content: str):
                self.message = _Message(content)

        class _Response:
            def __init__(self, content: str):
                self.choices = [_Choice(content)]

        return _Response(self._content)


class _FakeSyncGrokCompletions:
    def __init__(self, content: str):
        self._content = content

    def create(self, **kwargs):
        class _Message:
            def __init__(self, content: str):
                self.content = content

        class _Choice:
            def __init__(self, content: str):
                self.message = _Message(content)

        class _Response:
            def __init__(self, content: str):
                self.choices = [_Choice(content)]

        return _Response(self._content)


def test_groq_accepts_object_payload_with_blocks(monkeypatch):
    service = GroqService()

    fake_content = '{"blocks": [{"type": "text", "value": "Normalized from object"}]}'
    service.client = type(
        "_FakeClient",
        (),
        {
            "chat": type(
                "_FakeChat",
                (),
                {"completions": _FakeAsyncGroqCompletions(fake_content)},
            )()
        },
    )()

    response = asyncio.run(
        service.generate_response(
            query="What is normalization?",
            context="Some context",
            sources=[{"title": "Doc 1"}],
            model="llama3-70b-8192",
        )
    )

    assert len(response.blocks) == 1
    assert response.blocks[0].type == "text"
    assert response.blocks[0].value == "Normalized from object"


def test_grok_returns_schema_compatible_suggestions(monkeypatch):
    service = GrokService()

    # Response in object form to validate parser path + suggestions generation.
    fake_content = '{"blocks": [{"type": "text", "value": "Here is your answer."}]}'
    service.client = type(
        "_FakeClient",
        (),
        {
            "chat": type(
                "_FakeChat",
                (),
                {"completions": _FakeSyncGrokCompletions(fake_content)},
            )()
        },
    )()

    response = asyncio.run(
        service.generate_response(
            query="What is recursion?",
            context="Recursion is when a function calls itself.",
            sources=[{"title": "Recursion Notes"}],
            user_id="user_123",
        )
    )

    assert response.suggestions
    assert isinstance(response.suggestions, list)
    for item in response.suggestions:
        assert isinstance(item, dict)
        assert "displayText" in item
        assert "query" in item
        assert isinstance(item["displayText"], str)
        assert isinstance(item["query"], str)
