from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.middleware.auth import get_current_user
from app.routes import chat as chat_routes


class _FakeHistoryService:
    def __init__(self):
        self.chat_history = {
            "user_a": [{"role": "user", "content": "hello a"}],
            "user_b": [{"role": "user", "content": "hello b"}],
        }

    def clear_history(self, user_id=None):
        if user_id:
            if user_id in self.chat_history:
                self.chat_history[user_id] = []
        else:
            self.chat_history = {}


def test_clear_history_clears_only_current_user(monkeypatch):
    fake_rag = _FakeHistoryService()
    fake_grok = _FakeHistoryService()

    monkeypatch.setattr(chat_routes, "rag_service", fake_rag)
    monkeypatch.setattr(chat_routes, "grok_service", fake_grok)

    app = FastAPI()
    app.include_router(chat_routes.router, prefix="/api")

    async def _override_user():
        return {"uid": "user_a", "email": "a@example.com"}

    app.dependency_overrides[get_current_user] = _override_user
    client = TestClient(app)

    response = client.delete("/api/chat/history")

    assert response.status_code == 200
    assert fake_rag.chat_history["user_a"] == []
    assert fake_grok.chat_history["user_a"] == []

    # Ensure other users are untouched (not globally cleared).
    assert fake_rag.chat_history["user_b"] == [{"role": "user", "content": "hello b"}]
    assert fake_grok.chat_history["user_b"] == [{"role": "user", "content": "hello b"}]
