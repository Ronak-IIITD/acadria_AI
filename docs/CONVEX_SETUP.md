# Convex + Clerk Setup Guide for Acadira AI

> Complete guide to setting up Convex database + Clerk auth

---

## 1. Create Convex Project

1. Go to [convex.dev](https://convex.dev) and sign in
2. Create a new project
3. Copy your **Deployment URL** from the Convex dashboard

---

## 2. Create Clerk Project

1. Go to [clerk.com](https://clerk.com) and sign in
2. Create a new project
3. Enable **Google OAuth** in Clerk dashboard
4. Copy your **Publishable Key**
5. Go to **JWT Templates** and create one named `convex`
6. Copy **Issuer**, **Audience**, and **Signing Key**

---

## 3. Environment Variables

### Frontend (`.env.local`)

```env
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx

# Convex
VITE_CONVEX_URL=https://your-project.convex.cloud

# Backend
VITE_BACKEND_URL=http://localhost:8000

# AI
VITE_API_KEY=your_gemini_api_key
```

### Backend (`backend/.env`)

```env
# Clerk JWT Verification
CLERK_JWT_ISSUER=https://your-clerk-issuer
CLERK_JWT_AUDIENCE=your-clerk-audience
CLERK_JWT_SECRET=your-clerk-jwt-secret

# Upload
MAX_FILE_SIZE_MB=50
MAX_FILES_PER_REQUEST=100
MAX_DOCUMENTS_PER_USER=100

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## 4. Run Convex Locally

```bash
npx convex dev
```

This generates:
```
convex/_generated
```

---

## 5. Run the App

### Frontend
```bash
npm run dev
```

### Backend
```bash
cd backend
uvicorn app.main:app --reload
```

---

## 6. Production

1. Deploy Convex
2. Add Convex URL to frontend env
3. Deploy FastAPI backend
4. Add Clerk JWT secrets to backend

---

## Notes

- Documents are stored locally (fast, safe for large PDFs)
- Convex stores highlights and metadata
- Clerk handles auth and user profiles

---

Need help? Ping me anytime 🚀
