import sys
import types
from pathlib import Path


# Ensure `import app...` works when running pytest from backend/
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


# Lightweight stubs for optional external dependencies so tests stay isolated.
if "openai" not in sys.modules:
    openai_stub = types.ModuleType("openai")

    class _OpenAI:
        def __init__(self, *args, **kwargs):
            pass

    class _AsyncOpenAI:
        def __init__(self, *args, **kwargs):
            pass

    setattr(openai_stub, "OpenAI", _OpenAI)
    setattr(openai_stub, "AsyncOpenAI", _AsyncOpenAI)
    sys.modules["openai"] = openai_stub


if "google.generativeai" not in sys.modules:
    google_pkg = sys.modules.get("google")
    if google_pkg is None:
        google_pkg = types.ModuleType("google")
        sys.modules["google"] = google_pkg

    generativeai_stub = types.ModuleType("google.generativeai")

    def _configure(*args, **kwargs):
        return None

    class _GenerativeModel:
        def __init__(self, *args, **kwargs):
            pass

    class _GenerationConfig:
        def __init__(self, *args, **kwargs):
            pass

    setattr(generativeai_stub, "configure", _configure)
    setattr(generativeai_stub, "GenerativeModel", _GenerativeModel)
    setattr(
        generativeai_stub,
        "types",
        types.SimpleNamespace(GenerationConfig=_GenerationConfig),
    )

    sys.modules["google.generativeai"] = generativeai_stub
    setattr(google_pkg, "generativeai", generativeai_stub)
