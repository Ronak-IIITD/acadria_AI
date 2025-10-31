# 🚀 StudySync AI - Setup Guide

## Required API Keys & Credentials

### 1️⃣ Google Gemini API Key (REQUIRED)

**What it's for:** AI chat, flashcard generation, quiz creation, summarization

**Get your key:**
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

**Add to `.env` file:**
```bash
VITE_API_KEY=AIzaSy...your_actual_key_here
```

---

### 2️⃣ Firebase Setup (REQUIRED)

**What it's for:** User authentication (Google Sign-In, Email/Password)

**Steps:**

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Sign in with Google

2. **Create/Select Project:**
   - Click "Add project" or select existing
   - Name: `studysync-ai` (or your choice)
   - Disable Google Analytics (optional)
   - Click "Create project"

3. **Enable Authentication:**
   - In Firebase Console, go to **Build** → **Authentication**
   - Click "Get started"
   - Enable **Google** provider
   - Enable **Email/Password** provider
   - Save

4. **Get Web App Credentials:**
   - Go to **Project Settings** (⚙️ icon)
   - Scroll to "Your apps" section
   - Click **Web** icon (</>)
   - Register app name: `StudySync AI`
   - Copy the `firebaseConfig` object

5. **Add to `.env` file:**
```bash
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## 📁 Complete .env File Template

Create `/home/ronak-anand/Desktop/studysync-ai/.env`:

```bash
# ============================================
# GEMINI AI API KEY
# ============================================
# Get your key: https://makersuite.google.com/app/apikey
VITE_API_KEY=your_gemini_api_key_here

# ============================================
# FIREBASE CONFIGURATION
# ============================================
# Get from: https://console.firebase.google.com/
# Project Settings > Your apps > Web app config
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 🔧 Backend Setup (Optional - for Advanced Features)

### Backend .env Configuration

Edit `/home/ronak-anand/Desktop/studysync-ai/backend/.env`:

```bash
# Backend API Configuration
PORT=8000
HOST=0.0.0.0

# Gemini AI API Key (same as frontend)
GEMINI_API_KEY=your_gemini_api_key_here

# CORS Allowed Origins
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Start Backend Server

```bash
cd /home/ronak-anand/Desktop/studysync-ai/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run on: http://localhost:8000

---

## 🚀 Starting the Application

### 1. Start Frontend (Always Required)
```bash
cd /home/ronak-anand/Desktop/studysync-ai
npm run dev
```
Frontend runs on: http://localhost:3000

### 2. Start Backend (Optional - for flashcard generation via backend)
```bash
cd /home/ronak-anand/Desktop/studysync-ai/backend
source venv/bin/activate
uvicorn app.main:app --reload
```
Backend runs on: http://localhost:8000

---

## ✅ Verification Checklist

### Without API Keys (Limited Mode):
- ✅ Landing page loads
- ✅ Theme toggle works
- ✅ Sign in button works
- ❌ Authentication fails (need Firebase)
- ❌ AI chat disabled (need Gemini API)
- ❌ Flashcard generation disabled

### With Gemini API Key Only:
- ✅ All above features
- ✅ AI chat works
- ✅ Flashcard generation works (frontend)
- ✅ Quiz generation works
- ✅ Summarization works
- ❌ Authentication still disabled (need Firebase)

### With All Credentials (Full Mode):
- ✅ **Everything works!**
- ✅ Google Sign-In
- ✅ Email/Password login
- ✅ AI chat with document context
- ✅ Flashcard generation with spaced repetition
- ✅ Quiz creation
- ✅ Smart summarization
- ✅ Persistent storage (localStorage + Firebase)

---

## 🧪 Testing

### Test Authentication:
1. Open http://localhost:3000
2. Click "Sign In" or "Get Started For Free"
3. Try Google Sign-In
4. Try Email/Password signup

### Test AI Features:
1. Sign in to the app
2. Upload a PDF/DOCX document
3. Ask a question in the chat
4. Click ✨ (sparkles) icon to generate flashcards
5. Click 📖 (book) icon to study flashcards

---

## 🐛 Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Check Firebase credentials in `.env`
- Ensure Authentication is enabled in Firebase Console
- Restart dev server: `npm run dev`

### "AI features not working"
- Check `VITE_API_KEY` in `.env`
- Verify API key is valid at https://makersuite.google.com/app/apikey
- Check browser console for errors (F12)
- Restart dev server

### "Cannot read properties of undefined"
- Make sure `.env` file exists
- Check all `VITE_` prefixes are correct
- Run: `cat .env` to verify file contents

### "Backend connection refused"
- Backend is optional for frontend-only features
- To use backend: `cd backend && source venv/bin/activate && uvicorn app.main:app --reload`

---

## 📚 Feature Overview

### ✨ What Works Without Backend:
- Landing page
- Authentication (with Firebase)
- Document upload (PDF, DOCX, TXT, MD, RTF)
- AI chat with documents
- **Flashcard generation** (uses frontend Gemini API)
- Flashcard study sessions with SM-2 spaced repetition
- Quiz generation
- Smart summarization
- Dark/Light theme

### 🚀 What Requires Backend:
- Advanced RAG (Retrieval-Augmented Generation)
- Backend-side flashcard generation (alternative to frontend)
- Future: Collaborative features, cloud sync

---

## 💡 Quick Start (TL;DR)

```bash
# 1. Get Gemini API key
# Visit: https://makersuite.google.com/app/apikey

# 2. Create .env file
cat > .env << EOF
VITE_API_KEY=your_gemini_key_here
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
EOF

# 3. Start dev server
npm run dev

# 4. Open browser
# http://localhost:3000
```

---

## 📞 Support

If you encounter issues:
1. Check browser console (F12 → Console)
2. Check terminal output for errors
3. Verify all credentials are correct
4. Restart dev server after changing `.env`

**Environment Variables Must Start with `VITE_`** for Vite to expose them to the frontend!
