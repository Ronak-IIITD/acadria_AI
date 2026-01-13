# Acadira AI Backend

FastAPI backend for Acadira AI with RAG (Retrieval-Augmented Generation) implementation.

## Features

- **RESTful API** - FastAPI with automatic OpenAPI docs
- **RAG System** - Context-aware AI responses using document embeddings
- **Multi-Model Support** - Google Gemini 2.5 Flash & Grok (xAI)
- **Document Processing** - PDF, DOCX, TXT, MD, RTF support
- **Firebase Integration** - Authentication and storage
- **Rate Limiting** - API protection middleware
- **CORS Security** - Configurable cross-origin policies

## Quick Start

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# AI Models
GEMINI_API_KEY=your_gemini_api_key_here
GROK_API_KEY=your_grok_api_key_here  # Optional

# Firebase (optional, for auth verification)
FIREBASE_PROJECT_ID=your-project-id

# CORS (comma-separated origins)
ALLOWED_ORIGINS=http://localhost:5173,https://your-production-domain.com
```

### 4. Run Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs (interactive Swagger UI)
- **ReDoc**: http://localhost:8000/redoc (alternative docs)

## API Endpoints

### Document Management
- **POST** `/api/upload` - Upload and process documents
  - Supports: PDF, DOCX, PPTX, TXT, MD, RTF
  - Returns: Document ID and chunk count
  - Auth: Required (Firebase token)

### Chat & RAG
- **POST** `/api/chat` - Chat with RAG-powered AI
  - Body: `{ "message": "Your question", "model": "gemini-2.5-flash" }`
  - Returns: AI response with source citations
  - Auth: Required

### Models
- **GET** `/api/models` - List available AI models
  - Returns: Model capabilities and providers
  - Auth: Not required

### Health
- **GET** `/api/health` - Server health check
  - Returns: Status and uptime

## Project Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app + CORS setup
│   ├── config.py                  # Environment variables
│   │
│   ├── routes/                    # API endpoints
│   │   ├── chat.py                # Chat with RAG
│   │   ├── upload.py              # Document upload
│   │   └── models.py              # Model management
│   │
│   ├── services/                  # Business logic
│   │   ├── rag_service.py         # RAG implementation
│   │   ├── embedding_service.py   # Text embeddings
│   │   ├── document_service.py    # Document processing
│   │   ├── groq_service.py        # Groq AI client
│   │   └── grok_service.py        # Grok (xAI) client
│   │
│   ├── middleware/                # Custom middleware
│   │   ├── auth.py                # Firebase token verification
│   │   └── rate_limit.py          # Rate limiting
│   │
│   └── models/                    # Data schemas
│       └── schemas.py             # Pydantic models
│
├── data/                          # Document storage
│   ├── documents/                 # Uploaded files
│   └── rag_storage.json           # RAG database (JSON)
│
├── requirements.txt               # Python dependencies
└── README.md                      # This file
```

## Development

### Tech Stack
- **FastAPI** - High-performance async web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **Google Generative AI** - Gemini API client
- **OpenAI SDK** - For Grok (xAI) compatibility
- **PyPDF2 & PyMuPDF** - PDF text extraction
- **python-docx** - DOCX processing
- **Firebase Admin SDK** - Auth verification

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests (when implemented)
pytest tests/
```

### Production Deployment

Use Gunicorn with Uvicorn workers for production:

```bash
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `GROK_API_KEY` | xAI Grok API key | No |
| `FIREBASE_PROJECT_ID` | Firebase project for auth | No |
| `ALLOWED_ORIGINS` | CORS allowed origins | Yes |

## RAG Implementation

The backend implements a custom RAG system:

1. **Document Upload** → Text extraction → Chunking → Embedding generation → Storage
2. **User Query** → Query embedding → Similarity search → Context retrieval → AI response

**Storage Format**: JSON-based (can be upgraded to FAISS or Pinecone for scale)

See [`ARCHITECTURE.md`](../ARCHITECTURE.md) for detailed technical documentation.

## Security

- **Firebase Token Verification** - All protected endpoints require valid Firebase ID token
- **Rate Limiting** - 100 requests per minute per user
- **CORS** - Whitelist specific origins only
- **File Validation** - Type and size checks on uploads
- **Environment Isolation** - Secrets in `.env` files

## Troubleshooting

### Common Issues

**Import Error: No module named 'app'**
```bash
# Make sure you're in the backend/ directory
cd backend
uvicorn app.main:app --reload
```

**API Key Not Found**
```bash
# Verify .env file exists and is loaded
cat .env
# Should show GEMINI_API_KEY=...
```

**CORS Error**
```bash
# Add your frontend URL to ALLOWED_ORIGINS in .env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Port Already in Use**
```bash
# Use a different port
uvicorn app.main:app --reload --port 8001
```

## Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - See [LICENSE](../LICENSE) for details.
