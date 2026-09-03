# Acadira AI - Technical Architecture

> Deep dive into the technical implementation, design decisions, and system architecture.

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [RAG Implementation](#rag-implementation)
5. [AI Integration](#ai-integration)
6. [Data Flow](#data-flow)
7. [Security](#security)
8. [Performance Optimizations](#performance-optimizations)

---

## System Overview

Acadira AI is a full-stack web application built with a **React frontend** and **FastAPI backend**, connected through RESTful APIs. The system uses **RAG (Retrieval-Augmented Generation)** to provide context-aware AI responses.

### High-Level Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  React Frontend │◄───────►│  FastAPI Backend │◄───────►│  Google Gemini  │
│  (TypeScript)   │  REST   │     (Python)     │   API   │      AI         │
│                 │         │                  │         │                 │
└────────┬────────┘         └────────┬─────────┘         └─────────────────┘
         │                           │
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌──────────────────┐
│                 │         │                  │
│    Firebase     │         │   RAG Storage    │
│  (Auth/Storage) │         │  (JSON/Memory)   │
│                 │         │                  │
└─────────────────┘         └──────────────────┘
```

### Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS |
| **Backend** | FastAPI, Python 3.12, Uvicorn |
| **AI/ML** | Google Gemini 2.5 Flash, Grok (xAI) |
| **Storage** | Local JSON (dev) / Postgres vector (prod) via `rag_storage.py` |
| **Auth** | Clerk JWT verification |
| **Database** | Convex (optional - highlights metadata) |
| **Document Processing** | PyPDF2, PyMuPDF, python-docx, pdfjs-dist |

---

## Frontend Architecture

### Component Hierarchy

```
App.tsx
├── ErrorBoundary
├── ThemeProvider
├── AnimatedGradientBackground
├── Header
├── LandingPage
│   ├── Hero
│   ├── Features
│   ├── WhyThisWorks
│   ├── About
│   └── Footer
└── Dashboard
    ├── FileUpload
    ├── FileList
    ├── CalmChatWindow
    │   ├── ChatHeader
    │   ├── AiMessageRenderer
    │   └── ChatInput
    ├── FlashcardGenerator
    ├── FlashcardDeck
    │   └── Flashcard (3D flip animations)
    ├── QuizGenerator
    ├── QuizTaker
    ├── SummaryViewer
    ├── KeyTakeawaysPanel
    └── SettingsPanel
```

### Key Design Patterns

#### 1. **Service Layer Pattern**
All business logic is separated into service files:
- `geminiService.ts` - AI interactions
- `uploadService.ts` - File processing
- `studyToolsService.ts` - Flashcard/quiz generation

```typescript
// Example: geminiService.ts
export const generateFlashcards = async (
  content: string,
  count: number = 10
): Promise<Flashcard[]> => {
  const prompt = `Generate ${count} flashcards from this content...`;
  const response = await model.generateContent(prompt);
  return parseFlashcards(response.text());
};
```

#### 2. **Context API for State Management**
Uses React Context for theme management:

```typescript
// ThemeContext.tsx
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    // Persist to localStorage
    // Apply to document.documentElement
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

#### 3. **Custom Hooks**
Reusable hooks for common operations:

```typescript
// Example usage in components
const useScrollReveal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(/* ... */);
    // Intersection Observer logic
  }, []);
  
  return [ref, isVisible];
};
```

### Document Processing Pipeline (Frontend)

```
User Uploads File
      ↓
File Validation (type, size)
      ↓
Read File as ArrayBuffer/Text
      ↓
┌─────────────┬──────────────┬─────────────┐
│    PDF      │    DOCX      │   PPTX      │
│  (pdfjs)    │  (mammoth)   │  (JSZip)    │
└─────────────┴──────────────┴─────────────┘
      ↓              ↓               ↓
Extract Text    Extract Text    Extract Slides
      └──────────────┴───────────────┘
                     ↓
          Combine into Document Object
                     ↓
Upload to Cloud Storage
                      ↓
           Send metadata to Backend API
```

For complex state (documents, chat history, flashcards), we use:
1. **Local Component State** - UI-specific state
2. **Clerk JWT** - Auth state verified on each request
3. **Convex** (optional) - Highlights metadata
4. **Context API** - Global theme state

RAG persistence via `rag_storage.py` abstraction (Local JSON / Postgres)

---

## Backend Architecture

### API Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app initialization
│   ├── config.py                  # Environment variables
│   ├── routes/
│   │   ├── chat.py                # POST /api/chat
│   │   ├── upload.py              # POST /api/upload
│   │   └── models.py              # GET /api/models
│   ├── services/
│   │   ├── rag_service.py         # RAG implementation
│   │   ├── embedding_service.py   # Text embeddings
│   │   ├── document_service.py    # Document processing
│   │   ├── groq_service.py        # Grok AI integration
│   │   └── grok_service.py        # Alternative Grok service
│   ├── middleware/
│   │   ├── auth.py                # Firebase token verification
│   │   └── rate_limit.py          # API rate limiting
│   └── models/
│       └── schemas.py             # Pydantic models
```

### API Endpoints

#### 1. **Chat Endpoint** (`POST /api/chat`)

```python
@router.post("/chat")
async def chat(request: ChatRequest, user_id: str = Depends(verify_token)):
    # 1. Retrieve relevant document chunks using RAG
    context = await rag_service.get_relevant_context(
        query=request.message,
        user_id=user_id,
        top_k=5
    )
    
    # 2. Build prompt with context
    prompt = build_rag_prompt(request.message, context)
    
    # 3. Generate AI response
    response = await gemini_service.generate_response(prompt)
    
    # 4. Return with source citations
    return ChatResponse(
        message=response,
        sources=context.sources,
        model="gemini-2.5-flash"
    )
```

#### 2. **Upload Endpoint** (`POST /api/upload`)

```python
@router.post("/upload")
async def upload_document(
    file: UploadFile,
    user_id: str = Depends(verify_token)
):
    # 1. Validate file type and size
    validate_file(file)
    
    # 2. Extract text content
    text = await document_service.extract_text(file)
    
    # 3. Chunk document for RAG
    chunks = await rag_service.chunk_document(text)
    
    # 4. Generate embeddings for each chunk
    embeddings = await embedding_service.embed_chunks(chunks)
    
    # 5. Store in RAG database
    document_id = await rag_service.store_document(
        user_id=user_id,
        filename=file.filename,
        chunks=chunks,
        embeddings=embeddings
    )
    
    return {"document_id": document_id, "chunks": len(chunks)}
```

#### 3. **Models Endpoint** (`GET /api/models`)

```python
@router.get("/models")
async def get_available_models():
    return {
        "models": [
            {
                "id": "gemini-2.5-flash",
                "name": "Gemini 2.5 Flash",
                "provider": "Google",
                "capabilities": ["chat", "embeddings", "vision"]
            },
            {
                "id": "grok-beta",
                "name": "Grok",
                "provider": "xAI",
                "capabilities": ["chat"]
            }
        ]
    }
```

### Middleware

#### Rate Limiting
Prevents API abuse by limiting requests per user:

```python
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, calls: int = 100, period: int = 60):
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.cache = {}  # In-memory cache (use Redis in production)
    
    async def dispatch(self, request, call_next):
        client_id = get_client_id(request)
        
        if self.is_rate_limited(client_id):
            return JSONResponse(
                status_code=429,
                content={"error": "Too many requests"}
            )
        
        self.increment_count(client_id)
        return await call_next(request)
```

#### CORS Configuration
Allows frontend access from specified origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://your-production-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
```

---

## RAG Implementation

### What is RAG?

**Retrieval-Augmented Generation** combines:
1. **Retrieval** - Find relevant information from documents
2. **Augmentation** - Add context to user queries
3. **Generation** - Use AI to produce informed responses

### Our RAG Pipeline

```
User Question: "What is the capital of France?"
       ↓
1. EMBED QUERY
   └─> [0.23, -0.45, 0.78, ...] (vector representation)
       ↓
2. SIMILARITY SEARCH
   └─> Find top 5 most similar document chunks
       ↓
3. RETRIEVE CONTEXT
   └─> "France is a country in Europe... Paris is the capital..."
       ↓
4. AUGMENT PROMPT
   └─> "Given this context: [chunks], answer: What is the capital of France?"
       ↓
5. GENERATE RESPONSE
   └─> "Based on the documents, the capital of France is Paris."
```

### Implementation Details

#### Document Chunking

```python
def chunk_document(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """
    Split document into overlapping chunks for better context preservation.
    
    Args:
        text: Full document text
        chunk_size: Max characters per chunk
        overlap: Characters to overlap between chunks
    
    Returns:
        List of text chunks
    """
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        
        # Try to break at sentence boundary
        if end < len(text):
            last_period = chunk.rfind('.')
            if last_period > chunk_size * 0.7:  # At least 70% through
                end = start + last_period + 1
        
        chunks.append(text[start:end])
        start = end - overlap
    
    return chunks
```

#### Embedding Generation

Currently using Gemini API for embeddings (lightweight alternative to sentence-transformers):

```python
async def generate_embeddings(text: str) -> List[float]:
    """Generate embedding vector for text using Gemini."""
    # Note: Simplified version, actual implementation uses Gemini Embedding API
    result = await genai.embed_content(
        model="models/embedding-001",
        content=text
    )
    return result['embedding']
```

#### Similarity Search

```python
def find_similar_chunks(
    query_embedding: List[float],
    document_embeddings: List[Dict],
    top_k: int = 5
) -> List[Dict]:
    """
    Find most similar document chunks using cosine similarity.
    """
    similarities = []
    
    for doc in document_embeddings:
        similarity = cosine_similarity(query_embedding, doc['embedding'])
        similarities.append({
            'text': doc['text'],
            'source': doc['source'],
            'score': similarity
        })
    
    # Sort by similarity and return top K
    similarities.sort(key=lambda x: x['score'], reverse=True)
    return similarities[:top_k]
```

#### RAG Storage

We use a storage abstraction layer via `rag_storage.py`:

**Local JSON (development):**
```json
{
  "user_123": {
    "documents": {
      "doc_456": {
        "filename": "machine_learning.pdf",
        "uploaded_at": "2024-01-13T10:00:00Z",
        "chunks": [
          {
            "id": "chunk_1",
            "text": "Machine learning is a subset of AI...",
            "embedding": [0.23, -0.45, 0.78, ...],
            "page": 1
          }
        ]
      }
    }
  }
}
```

**Postgres Vector (production):**
Stored in Postgres via `pgvector` extension. Uses `DATABASE_URL` environment variable. See `rag_storage.py` for the abstraction interface.

```python
storage = get_rag_storage_instance()
# Use storage.get_documents(user_id), storage.store_document(), etc.
```

---

## AI Integration

### Google Gemini 2.5 Flash

Primary AI model for:
- Chat responses
- Flashcard generation
- Quiz creation
- Summarization
- Key takeaways extraction

#### Configuration

```python
import google.generativeai as genai

genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

model = genai.GenerativeModel(
    model_name='gemini-2.5-flash',
    generation_config={
        'temperature': 0.7,
        'top_p': 0.9,
        'top_k': 40,
        'max_output_tokens': 2048,
    },
    safety_settings=[
        {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        },
        # ... other safety settings
    ]
)
```

#### Prompt Engineering

Example prompt for flashcard generation:

```python
FLASHCARD_PROMPT = """
You are an expert educator creating study flashcards.

CONTENT:
{content}

Generate exactly {count} flashcards from this content.

RULES:
1. Each flashcard should test a single concept
2. Front should be a clear question
3. Back should be a concise answer (2-3 sentences max)
4. Cover the most important concepts first
5. Output ONLY valid JSON, no markdown or extra text

OUTPUT FORMAT:
[
  {
    "front": "What is...",
    "back": "It is...",
    "difficulty": 3
  }
]

Generate the flashcards now:
"""
```

### Grok (xAI) Integration

Alternative model using OpenAI-compatible API:

```python
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv('GROK_API_KEY'),
    base_url="https://api.x.ai/v1"
)

response = client.chat.completions.create(
    model="grok-beta",
    messages=[
        {"role": "system", "content": "You are a helpful study assistant."},
        {"role": "user", "content": prompt}
    ]
)
```

---

## Data Flow

### Document Upload Flow

```
[Frontend]                    [Backend]
    │                             │                           │
    │─────Upload File────────────>│                           │
    │                             │                           │
    │                             │──Extract Text────>        │
    │                             │<─────────────────         │
    │                             │                           │
    │                             │──Chunk Document──>        │
    │                             │<─────────────────         │
    │                             │                           │
    │                             │──Generate Embeddings─>    │
    │                             │<────────────────────      │
    │                             │────Store in RAG DB──>       │
    │                             │<──────────────────        │
    │<────Success Response────────│                           │
```

### Chat with RAG Flow

```
[User Input] → [Frontend] → [Backend]
                              │
                              ├─> Embed Query
                              ├─> Similarity Search
                              ├─> Retrieve Top 5 Chunks
                              ├─> Build RAG Prompt
                              ├─> Call Gemini API
                              ├─> Parse Response
                              └─> Add Citations
                              │
[Display Response] ← [Frontend] ← [Backend]
```

---

## Security

### Authentication Flow

```
[User] ──Sign In──> [Firebase Auth] ──Token──> [Frontend]
                                                    │
                                                    │
[Backend] <──API Request (+ Token)─────────────────┘
    │
    ├─> Verify Token with Firebase Admin SDK
    ├─> Extract user_id
    └─> Proceed with request
```

### Security Measures

1. **Clerk JWT Verification**
   ```python
   async def verify_clerk_jwt(token: str = Depends(oauth2_scheme)):
       try:
           decoded_token = await clerk_auth.verify_jwt(token)
           return decoded_token
       except:
           raise HTTPException(status_code=401, detail="Invalid token")
   ```

2. **Rate Limiting**
   - 100 requests per minute per user
   - Prevents API abuse

3. **File Upload Validation**
   ```python
   ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.pptx', '.txt', '.md', '.rtf'}
   MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
   
   def validate_file(file: UploadFile):
       # Check extension
       ext = Path(file.filename).suffix.lower()
       if ext not in ALLOWED_EXTENSIONS:
           raise HTTPException(400, "Invalid file type")
       
       # Check size
       if file.size > MAX_FILE_SIZE:
           raise HTTPException(400, "File too large")
   ```

4. **CORS Configuration**
   - Whitelist specific origins
   - No wildcard in production

5. **Environment Variables**
   - All API keys in `.env` files
   - Never committed to Git
   - Clerk JWT config: `CLERK_JWT_ISSUER`, `CLERK_JWT_AUDIENCE`, `CLERK_JWT_SECRET`

---

## Performance Optimizations

### Frontend

1. **Code Splitting**
   ```typescript
   const Dashboard = lazy(() => import('./components/Dashboard'));
   ```

2. **React 19 Concurrent Features**
   - Automatic batching
   - Transitions for better UX
   - Suspense boundaries

3. **Vite Build Optimizations**
   ```typescript
   export default defineConfig({
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             'react-vendor': ['react', 'react-dom'],
             'firebase': ['firebase/app', 'firebase/auth'],
             'pdf': ['pdfjs-dist']
           }
         }
       }
     }
   });
   ```

4. **Image Optimization**
   - SVG icons for scalability
   - Lazy loading for images
   - No large assets in repo

### Backend

1. **Async I/O**
   ```python
   @router.post("/upload")
   async def upload(file: UploadFile):
       content = await file.read()  # Non-blocking
       result = await process_async(content)
       return result
   ```

2. **Connection Pooling**
   - Reuse HTTP connections to Firebase
   - Keep-alive for Gemini API

3. **Caching**
   ```python
   from functools import lru_cache
   
   @lru_cache(maxsize=100)
   def get_embeddings(text: str) -> List[float]:
       # Cache embeddings for frequently queried text
       return generate_embeddings(text)
   ```

4. **Uvicorn Workers**
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

### Database

1. **Efficient Queries**
   - Index on user_id and document_id
   - Batch writes to Firestore

2. **Lazy Loading**
   - Load documents on-demand
   - Paginate chat history

---

## Future Improvements

### Scalability
- [ ] Move from JSON to Postgres/FAISS vector database
- [ ] Implement Redis for caching
- [ ] Add WebSocket for real-time chat streaming
- [ ] Horizontal scaling with load balancer

### Features
- [ ] Add FAISS for faster similarity search
- [ ] Implement semantic caching
- [ ] Add audio transcription support
- [ ] Multi-modal RAG (images + text)
- [ ] RAG storage migration: JSON → Postgres

### DevOps
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Automated testing
- [ ] Monitoring and logging (Sentry, LogRocket)

---

## Code Quality

### Testing Strategy

```bash
# Frontend tests
npm test                 # Unit tests with Vitest
npm run test:ui          # Interactive test UI
npm run test:coverage    # Coverage report

# Backend tests
pytest tests/            # Unit tests
pytest --cov             # Coverage

# RAG storage tests
# Verify LocalJSONStorage and PostgresVectorStorage correctness
python -m pytest tests/test_rag_storage/  # RAG storage tests
```

### Linting & Formatting

```json
// Frontend ESLint config
{
  "extends": ["react-app", "react-app/jest"],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

---

## Contributing to Architecture

When proposing architectural changes:

1. Open an issue describing the problem
2. Propose solution with trade-offs
3. Create proof-of-concept if needed
4. Update this document after approval

---

**Last Updated**: September 2026  
**Author**: Ronak Anand  
**Version**: 2.0 (Production Release)
