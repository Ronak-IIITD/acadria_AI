#!/bin/bash

# Activate virtual environment
source venv/bin/activate

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️ .env file not found!"
    exit 1
fi

# Start Gunicorn with Uvicorn workers
# -w 4: 4 worker processes (adjust based on CPU cores)
# -k uvicorn.workers.UvicornWorker: Use Uvicorn for async handling
# --bind 0.0.0.0:8000: Listen on all interfaces
echo "🚀 Starting StudySync AI Backend (Production Mode)..."
exec gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
