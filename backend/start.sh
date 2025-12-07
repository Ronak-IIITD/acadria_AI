#!/bin/bash

# Activate virtual environment (located at repo root)
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

if [ ! -d "${REPO_ROOT}/venv" ]; then
    echo "⚠️ venv not found at ${REPO_ROOT}/venv. Run 'python -m venv venv && source venv/bin/activate && pip install -r backend/requirements.txt' from repo root."
    exit 1
fi

source "${REPO_ROOT}/venv/bin/activate"

# Ensure Python can import the app package when launched outside backend dir
export PYTHONPATH="${SCRIPT_DIR}:${PYTHONPATH}"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️ .env file not found!"
    exit 1
fi

# Prefer gunicorn if available; otherwise fall back to uvicorn (dev-friendly)
if command -v gunicorn >/dev/null 2>&1; then
    echo "🚀 Starting StudySync AI Backend (Gunicorn)..."
    exec gunicorn app.main:app \
        --workers 4 \
        --worker-class uvicorn.workers.UvicornWorker \
        --bind 0.0.0.0:8000 \
        --timeout 120 \
        --access-logfile - \
        --error-logfile -
else
    echo "ℹ️ gunicorn not found; starting with uvicorn (dev mode). Run 'pip install -r backend/requirements.txt' inside venv to add gunicorn."
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
fi
