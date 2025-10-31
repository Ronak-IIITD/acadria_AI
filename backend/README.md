# StudySync AI Backend

Python FastAPI backend for StudySync AI with RAG (Retrieval-Augmented Generation) implementation.

## Features

- RESTful API endpoints
- Document upload and storage
- RAG-based chat with vector embeddings
- Support for multiple LLM models (GPT4All, LLaMA2, Gemini)
- FAISS vector database for similarity search
- Firebase authentication integration

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set environment variables in `.env` file (copy from `.env.example`)

4. Run the server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

- `POST /api/upload` - Upload document files
- `POST /api/chat` - Send chat messages with RAG
- `GET /api/models` - Get available AI models
- `GET /api/health` - Health check

## Development

The backend uses:
- **FastAPI** - Modern Python web framework
- **FAISS** - Vector similarity search
- **Sentence Transformers** - Text embeddings
- **PyPDF2** - PDF processing
- **python-docx** - DOCX processing
