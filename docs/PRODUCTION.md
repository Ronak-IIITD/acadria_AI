# Production Deployment Guide

This guide covers how to deploy Acadira AI to production.

---

## Prerequisites

- Node.js 18+
- Python 3.12+
- Convex account
- Clerk account

---

## Environment Variables

### Frontend (.env.local)

```env
# Clerk (Auth)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx

# Convex (Database)
VITE_CONVEX_URL=https://your-project.convex.cloud

# Backend URL
VITE_BACKEND_URL=https://your-backend-api.com

# AI
VITE_API_KEY=your_gemini_api_key
```

### Backend (.env)

```env
# Clerk JWT Verification
CLERK_JWT_ISSUER=https://your-clerk-issuer
CLERK_JWT_AUDIENCE=your-clerk-audience
CLERK_JWT_SECRET=your-clerk-jwt-secret

# AI
GEMINI_API_KEY=your_gemini_api_key
GROK_API_KEY=your_grok_api_key

# Upload
MAX_FILE_SIZE_MB=50
MAX_FILES_PER_REQUEST=100
MAX_DOCUMENTS_PER_USER=100

# CORS
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

---

## Build for Production

### Frontend

```bash
# Install dependencies
npm install

# Build
npm run build

# Preview production build
npm run preview
```

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run with gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

---

## Deployment Options

### Vercel (Frontend)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Railway/Render (Backend)

1. Connect GitHub repo
2. Set environment variables
3. Deploy

### Convex (Database)

1. Create Convex project
2. Configure Clerk JWT template (name: `convex`)
3. Run `npx convex dev`

---

## Production Checklist

- [ ] Set up Supabase project and run schema
- [ ] Configure all environment variables
- [ ] Build frontend: `npm run build`
- [ ] Test backend: `cd backend && uvicorn app.main:app --reload`
- [ ] Set up custom domain (optional)
- [ ] Enable HTTPS
- [ ] Configure CORS with production domains

---

## Troubleshooting

### CORS Errors
Ensure your production domain is in `ALLOWED_ORIGINS` in backend `.env`

### Auth Issues
- Check Supabase/Firebase credentials
- Verify `SUPABASE_URL` matches your project
- Ensure auth redirect URLs are configured

### Upload Failures
- Check file size limits
- Verify storage bucket permissions

---

## Support

For issues, check the GitHub repository or create an issue.
