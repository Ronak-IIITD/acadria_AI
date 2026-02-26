# Production Deployment Guide

This guide covers how to deploy Acadira AI to production.

---

## Prerequisites

- Node.js 18+
- Python 3.12+
- Supabase account (recommended) or Firebase account

---

## Environment Variables

### Frontend (.env.local)

```env
# Supabase (recommended for production)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Or Firebase (fallback)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Backend URL
VITE_BACKEND_URL=https://your-backend-api.com

# AI
VITE_API_KEY=your_gemini_api_key
```

### Backend (.env)

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

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

### Supabase (Database)

1. Create Supabase project
2. Run SQL from `docs/SUPABASE_SETUP.md`
3. Configure auth providers

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
