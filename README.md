# Acadira AI

> **Your AI-powered study companion** — Transform documents into interactive learning experiences with flashcards, quizzes, and smart summaries.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white) ![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white) ![Firebase](https://img.shields.io/badge/Firebase-12.5-FFCA28?logo=firebase&logoColor=black) ![License](https://img.shields.io/badge/License-MIT-green)

---

## What is Acadira AI?

Acadira AI is an intelligent learning platform that turns your study materials into an interactive AI-powered experience. Built as a sophomore year project, it combines modern web technologies with cutting-edge AI to help students learn more effectively.

**The Problem:** Reading PDFs and documents is passive and boring.  
**The Solution:** Upload your notes, textbooks, or papers and instantly get AI-powered chat, flashcards with spaced repetition, auto-generated quizzes, and smart summaries.

---

## Features

### Core Learning Tools
- **AI Chat with RAG** — Ask questions about your documents and get contextual answers with source citations
- **Smart Flashcards** — Auto-generate flashcards with spaced repetition algorithm (SM-2) for optimal retention
- **Quiz Generator** — Create multiple-choice, true/false, and short-answer quizzes from any document
- **Smart Summaries** — Get brief overviews, detailed explanations, or bullet-point summaries instantly
- **Key Takeaways** — Automatically extract the most important points from your materials

### Document Support
- **Multi-format Upload** — PDF, DOCX, PPTX, TXT, Markdown, and RTF files
- **Batch Processing** — Upload multiple documents at once with progress tracking
- **Cloud Storage** — All files synced securely with Firebase Storage

### User Experience
- **Keyboard-First Workflows** — Study flashcards using arrow keys and number shortcuts
- **Dark/Light Themes** — System-aware theme switching with persistent preferences
- **Smooth Animations** — 3D flip effects, scroll reveals, and polished transitions
- **Responsive Design** — Works seamlessly on desktop, tablet, and mobile
- **Firebase Auth** — Secure authentication with Google Sign-In and email/password

---

## Tech Stack

### Frontend
- **React 19** — Latest React with concurrent features
- **TypeScript** — Type-safe development
- **Vite** — Lightning-fast build tool and HMR
- **Tailwind CSS** — Utility-first styling
- **React Markdown** — Rich markdown rendering with LaTeX math support

### Backend
- **FastAPI** — High-performance Python web framework
- **Google Gemini 2.5 Flash** — State-of-the-art language model for AI features
- **Grok (xAI)** — Alternative AI model support
- **RAG Implementation** — Retrieval-Augmented Generation for context-aware responses
- **Firebase Admin SDK** — Backend authentication and storage management

### AI & Document Processing
- **PyPDF2 & PyMuPDF** — PDF text extraction and annotation handling
- **python-docx** — DOCX file processing
- **pdfjs-dist** — Client-side PDF rendering
- **Sentence Embeddings** — Document chunking and semantic search

### Infrastructure
- **Firebase Authentication** — User management
- **Firebase Firestore** — NoSQL database for user data
- **Firebase Storage** — Secure file hosting
- **CORS Middleware** — Secure cross-origin requests
- **Rate Limiting** — API protection

---

## Getting Started

### Prerequisites
- **Node.js 18+** and npm
- **Python 3.12+** (for backend)
- **Google Gemini API Key** ([Get one free](https://makersuite.google.com/app/apikey))
- **Firebase Project** (optional but recommended for auth & storage)

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/Ronak-IIITD/StudySyncAI.git
cd StudySyncAI
```

#### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local and add your API keys:
# VITE_API_KEY=your_gemini_api_key
# VITE_FIREBASE_API_KEY=your_firebase_key
# ... (see Configuration section below)
```

#### 3. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env and add:
# GEMINI_API_KEY=your_gemini_api_key
# GROK_API_KEY=your_grok_api_key (optional)
```

#### 4. Run the Application

**Terminal 1 - Frontend:**
```bash
npm run dev
```
Vite dev server starts at `http://localhost:5173`

**Terminal 2 - Backend:**
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
FastAPI server starts at `http://localhost:8000`

---

## Configuration

### Frontend Environment Variables
Create `.env.local` in the project root:

```env
# Google Gemini API
VITE_API_KEY=your_gemini_api_key_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Backend Environment Variables
Create `backend/.env`:

```env
# AI Models
GEMINI_API_KEY=your_gemini_api_key
GROK_API_KEY=your_grok_api_key  # Optional

# Firebase Admin (optional)
FIREBASE_PROJECT_ID=your-project-id

# CORS (for production)
ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:5173
```

---

## Project Structure

```
acadira-ai/
├── src/                          # Frontend source code
│   ├── components/               # React components (36 files)
│   │   ├── Dashboard.tsx         # Main app dashboard
│   │   ├── CalmChatWindow.tsx    # AI chat interface
│   │   ├── FlashcardDeck.tsx     # Flashcard study mode
│   │   ├── FlashcardGenerator.tsx
│   │   ├── QuizGenerator.tsx
│   │   ├── QuizTaker.tsx
│   │   ├── SummaryViewer.tsx
│   │   ├── KeyTakeawaysPanel.tsx
│   │   ├── FileUpload.tsx
│   │   └── ...
│   ├── services/                 # Business logic
│   │   ├── geminiService.ts      # AI integration
│   │   ├── uploadService.ts      # File handling
│   │   └── studyToolsService.ts  # Flashcard/quiz generation
│   ├── contexts/                 # React contexts
│   │   └── ThemeContext.tsx
│   ├── utils/                    # Helper functions
│   └── types/                    # TypeScript definitions
│
├── backend/                      # Python FastAPI backend
│   ├── app/
│   │   ├── main.py               # FastAPI application
│   │   ├── routes/               # API endpoints
│   │   │   ├── chat.py           # Chat with RAG
│   │   │   ├── upload.py         # Document upload
│   │   │   └── models.py         # AI model management
│   │   ├── services/             # Business logic
│   │   │   ├── rag_service.py    # RAG implementation
│   │   │   ├── embedding_service.py
│   │   │   ├── document_service.py
│   │   │   └── groq_service.py
│   │   ├── middleware/           # Custom middleware
│   │   └── models/               # Data schemas
│   └── requirements.txt
│
├── data/                         # Document storage
├── docs/                         # Documentation
├── public/                       # Static assets
└── dist/                         # Production build
```

---

## Keyboard Shortcuts

### Flashcard Study Mode
| Key | Action |
|-----|--------|
| `←` | Previous card |
| `→` | Next card (after revealing answer) |
| `↑` / `Space` / `Enter` | Flip current card |
| `↓` | Skip to next card |
| `0` - `5` | Grade your confidence (SM-2 algorithm) |

---

## Key Technical Features

### 1. RAG (Retrieval-Augmented Generation)
The backend implements a custom RAG system that:
- Chunks documents into semantic segments
- Stores embeddings for fast similarity search
- Retrieves relevant context before generating AI responses
- Provides source citations for transparency

See [`backend/app/services/rag_service.py`](backend/app/services/rag_service.py)

### 2. Spaced Repetition Algorithm (SM-2)
Flashcards use the SuperMemo SM-2 algorithm to optimize review intervals:
- Tracks difficulty, repetitions, and ease factor for each card
- Calculates optimal review dates based on performance
- Adapts to individual learning patterns

See [`src/services/studyToolsService.ts:111`](src/services/studyToolsService.ts)

### 3. Multi-Format Document Processing
Supports 6 different file formats with specialized parsers:
- **PDF**: Text extraction + annotation support
- **DOCX**: Full document structure preservation
- **PPTX**: Slide-by-slide extraction using JSZip
- **TXT/MD/RTF**: Direct text processing

See [`src/services/uploadService.ts`](src/services/uploadService.ts)

### 4. Real-Time Chat with Context
AI chat maintains conversation history and document context:
- Streaming responses for better UX
- Context-aware follow-up questions
- Markdown rendering with LaTeX math support

See [`src/components/CalmChatWindow.tsx`](src/components/CalmChatWindow.tsx)

---

## Building for Production

```bash
# Frontend build
npm run build

# Preview the production build
npm run preview

# Backend (use gunicorn for production)
cd backend
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

The frontend build outputs to `dist/` and can be hosted on:
- **Vercel** (recommended)
- **Netlify**
- **Firebase Hosting**
- Any static file host

---

## Testing

Run the test suite (Vitest):
```bash
npm test

# With UI
npm run test:ui

# With coverage
npm run test:coverage
```

---

## Roadmap

Check out our [detailed feature roadmap](docs/FEATURE_ROADMAP.md) for planned features:

**Coming Soon:**
- Mind map visualization
- Audio transcription support
- YouTube video processing
- AI-generated podcasts from documents
- Progress tracking dashboard
- Mobile apps

---

## Why I Built This

As a sophomore at IIIT-Delhi, I found myself drowning in PDFs and lecture slides. I wanted a tool that would make studying more active and engaging, not just passive reading. This project combines my interests in AI, full-stack development, and education technology.

**What I Learned:**
- Building production-ready React applications with TypeScript
- Implementing RAG systems and working with LLMs
- FastAPI and async Python patterns
- Firebase authentication and cloud storage
- Spaced repetition algorithms
- Document parsing and text processing

---

## Contributing

Contributions are welcome! Whether it's:
- Bug fixes
- New features
- Documentation improvements
- UI/UX enhancements

**Steps to contribute:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **Google Gemini** for the incredible AI capabilities
- **Firebase** for hassle-free backend infrastructure
- **Vercel** for inspiration on clean, modern UI design
- **YouLearn.ai** for feature inspiration
- All the open-source libraries that made this possible

---

## Contact & Links

- **GitHub**: [@Ronak-IIITD](https://github.com/Ronak-IIITD)
- **Repository**: [StudySyncAI](https://github.com/Ronak-IIITD/StudySyncAI)
- **Issues**: [Report a bug](https://github.com/Ronak-IIITD/StudySyncAI/issues)

---

<div align="center">

**If you find this project useful, please consider giving it a ⭐️!**

Made for Learners by a Learner ❤️

</div>
