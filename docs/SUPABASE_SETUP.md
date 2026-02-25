# Supabase Setup Guide for Acadira AI

> Complete guide to setting up Supabase for authentication and database

---

## Prerequisites

- [ ] Supabase account (free tier works)
- [ ] Google Cloud account (for OAuth - optional)

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in the details:
   - **Organization**: Select your organization or create new
   - **Name**: `acadira-ai`
   - **Database Password**: Create a strong password (save this somewhere safe!)
   - **Region**: Choose closest to your users (e.g., Asia - Singapore)
4. Click **"Create new project"**
5. Wait ~2 minutes for setup to complete

---

## Step 2: Get Supabase Credentials

Once your project is ready:

1. Click **Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxxx-xxxxxx.supabase.co`
   - **anon public key**: Starts with `eyJ...` (click to copy)
3. Scroll down and click **"Reveal` to see the **service_role key** (keep this secret!)

---

## Step 3: Create Database Schema

Go to **SQL Editor** in the left sidebar and run this complete script:

```sql
-- =============================================
-- Acadira AI Database Schema
-- =============================================

-- Enable UUID extension for auto-generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- Mirrors Supabase auth.users for additional profile data
-- =============================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DOCUMENTS TABLE
-- Stores uploaded document metadata
-- =============================================
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_filename TEXT,
    content_type TEXT,
    file_size BIGINT,
    chunks INTEGER DEFAULT 0,
    highlights_count INTEGER DEFAULT 0,
    storage_path TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- HIGHLIGHTS TABLE (Learning Study Points)
-- Stores user highlights/annotations from documents
-- =============================================
CREATE TABLE public.highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'yellow',
    page_number INTEGER,
    position_x FLOAT,
    position_y FLOAT,
    width FLOAT,
    height FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CHAT HISTORY TABLE
-- Stores conversation history per user
-- =============================================
CREATE TABLE public.chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    messages JSONB DEFAULT '[]',
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FLASHCARDS TABLE
-- Stores spaced repetition flashcards
-- =============================================
CREATE TABLE public.flashcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    ease_factor FLOAT DEFAULT 2.5,
    interval INTEGER DEFAULT 0,
    repetitions INTEGER DEFAULT 0,
    next_review TIMESTAMPTZ,
    last_reviewed TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- QUIZZES TABLE
-- Stores generated quizzes
-- =============================================
CREATE TABLE public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    title TEXT,
    questions JSONB NOT NULL,
    score INTEGER,
    total_questions INTEGER,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_user_uploaded ON public.documents(user_id, uploaded_at DESC);

CREATE INDEX idx_highlights_user_id ON public.highlights(user_id);
CREATE INDEX idx_highlights_document_id ON public.highlights(document_id);
CREATE INDEX idx_highlights_color ON public.highlights(color);

CREATE INDEX idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX idx_chat_history_updated ON public.chat_history(updated_at DESC);

CREATE INDEX idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX idx_flashcards_next_review ON public.flashcards(next_review) WHERE next_review IS NOT NULL;

CREATE INDEX idx_quizzes_user_id ON public.quizzes(user_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can manage own profile" ON public.users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own documents" ON public.documents
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own highlights" ON public.highlights
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own chat_history" ON public.chat_history
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own flashcards" ON public.flashcards
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own quizzes" ON public.quizzes
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- STORAGE BUCKET FOR FILES
-- =============================================
-- Create a bucket for document storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    true,
    52428800,
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain', 'text/markdown', 'application/rtf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own documents" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents" ON storage.objects
    FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================
-- VIEW FOR DASHBOARD
-- =============================================
CREATE OR REPLACE VIEW public.user_dashboard AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(D.id) as total_documents,
    COUNT(DISTINCT h.id) as total_highlights,
    COUNT(DISTINCT f.id) as total_flashcards,
    MAX(D.uploaded_at) as last_upload
FROM public.users u
LEFT JOIN public.documents D ON u.id = D.user_id
LEFT JOIN public.highlights h ON u.id = h.user_id
LEFT JOIN public.flashcards f ON u.id = f.user_id
GROUP BY u.id, u.email;
```

Click **"Run"** to execute the SQL.

---

## Step 4: Configure Auth Providers

### Email/Password (Required)

1. Go to **Authentication** → **Providers** → **Email**
2. Enable **"Enable Email Signups"**
3. Optionally enable **"Confirm email"** for email verification

### Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Go to **APIs & Services** → **OAuth consent screen**
4. Configure:
   - **User Type**: External
   - **App name**: Acadira AI
   - **Authorized domains**: `supabase.co` (and your custom domain)
5. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
6. Create:
   - **Application type**: Web application
   - **Authorized JavaScript origins**: 
     - `http://localhost:5173` (dev)
     - `https://your-project.supabase.co` (prod)
   - **Authorized redirect URIs**:
     - `https://your-project.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**

8. Back in Supabase: **Authentication** → **Providers** → **Google**
9. Enable and paste your credentials

---

## Step 5: Environment Variables

### Backend (.env)

```env
# ===========================================
# SUPABASE CONFIGURATION
# ===========================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Remove Firebase configuration
# FIREBASE_CREDENTIALS_PATH=service-account.json

# ===========================================
# AI MODELS (Keep existing)
# ===========================================
GEMINI_API_KEY=your_gemini_api_key
GROK_API_KEY=your_grok_api_key

# ===========================================
# UPLOAD SETTINGS
# ===========================================
MAX_FILE_SIZE_MB=50
MAX_FILES_PER_REQUEST=100
MAX_DOCUMENTS_PER_USER=100

# ===========================================
# CORS
# ===========================================
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Frontend (.env.local)

```env
# ===========================================
# SUPABASE
# ===========================================
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===========================================
# GEMINI API
# ===========================================
VITE_API_KEY=your_gemini_api_key
```

---

## Step 6: Test the Setup

### Test Authentication

1. Start your frontend: `npm run dev`
2. Go to **Authentication** → **Users** in Supabase dashboard
3. Try signing up with email/password
4. You should see a new user appear

### Test Database

1. Go to **SQL Editor**
2. Run:
```sql
-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see: `users`, `documents`, `highlights`, `chat_history`, `flashcards`, `quizzes`

---

## Migration from Firebase (Optional)

If you have existing Firebase users:

### Option 1: Fresh Start (Recommended)

Delete your Firebase project or just start fresh with Supabase. New users sign up with Supabase.

### Option 2: Migrate Existing Users

```sql
-- Create a migration function
CREATE OR REPLACE FUNCTION migrate_firebase_user(
    firebase_uid TEXT,
    email TEXT,
    full_name TEXT
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Create user in auth.users (requires admin access)
    -- This is complex and typically requires Firebase Admin SDK
    -- Recommendation: Ask users to reset password or re-login
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

**Simpler approach**: Export user data from Firebase, import highlights/documents manually via SQL, but users will need to create new Supabase accounts.

---

## Troubleshooting

### "Table does not exist"

Wait a few minutes for Supabase to provision the database, then refresh.

### Auth redirect not working

Make sure the callback URL in Supabase matches your app:
- Supabase: `Authentication` → `URL Configuration` → `Site URL`
- Add: `http://localhost:5173`

### Storage upload fails

Check storage policies were created correctly:
```sql
SELECT * FROM storage.policies WHERE bucket_id = 'documents';
```

---

## Quick Reference

| Task | Location |
|------|----------|
| API Keys | Settings → API |
| Database Tables | Table Editor |
| Auth Users | Authentication → Users |
| Storage Files | Storage → Files |
| Logs | Database → Logs |

---

## Next Steps

After setup is complete:

1. [ ] Run the SQL schema in your Supabase project
2. [ ] Add environment variables to `.env` and `.env.local`
3. [ ] Update backend code to use Supabase
4. [ ] Update frontend to use Supabase Auth
5. [ ] Test the full flow

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Community**: https://github.com/supabase/supabase/discussions
- **Status**: https://status.supabase.com
