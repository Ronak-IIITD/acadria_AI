# Firebase Setup Guide for StudySync AI

## Current Issue
You're seeing: **"Firebase authentication is not configured. Please set up Firebase credentials in .env.local file."**

## Quick Solution Options

### Option 1: Set Up Firebase (Recommended - 10 minutes)

#### Step 1: Create/Select Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project" or select existing project
3. Enter project name (e.g., "StudySync AI")
4. Disable Google Analytics (optional)
5. Click "Create project"

#### Step 2: Enable Authentication
1. In Firebase Console, click "Authentication" in left sidebar
2. Click "Get started"
3. Click "Sign-in method" tab
4. Enable **Google** provider:
   - Click "Google"
   - Toggle "Enable"
   - Add support email
   - Click "Save"
5. Enable **Email/Password** (optional):
   - Click "Email/Password"
   - Toggle "Enable"
   - Click "Save"

#### Step 3: Register Web App
1. Click Settings icon (⚙️) → "Project settings"
2. Scroll to "Your apps" section
3. Click "</>" (Web) icon
4. Enter app nickname: "StudySync Web"
5. Check "Also set up Firebase Hosting" (optional)
6. Click "Register app"
7. You'll see a config object like:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

#### Step 4: Add Authorized Domains
1. Go to Authentication → Settings → Authorized domains
2. Make sure these are added:
   - `localhost`
   - `127.0.0.1`
   - Your production domain (if deploying)

#### Step 5: Update .env.local
Open `.env.local` and fill in the values:

```env
# Frontend Gemini API Key (for fallback)
VITE_API_KEY=your_gemini_api_key_here

# Backend URL
VITE_BACKEND_URL=http://localhost:8000

# ============================================
# FIREBASE CONFIGURATION
# ============================================
VITE_FIREBASE_API_KEY=AIza...  # from firebaseConfig.apiKey
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

#### Step 6: Restart Dev Server
```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

The error should be gone and you can now sign in!

---

### Option 2: Development Mode (Quick Testing - No Auth)

If you want to test without Firebase, we can disable authentication temporarily:

#### Modify Backend for Dev Mode

**File: `backend/app/middleware/auth.py`**

Add this at the top after imports:
```python
import os
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"
```

Then modify `verify_firebase_token`:
```python
async def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    """Verify Firebase ID token and return decoded token."""
    
    # DEV MODE: Skip auth if enabled
    if DEV_MODE:
        logger.warning("⚠️ DEV_MODE enabled - Skipping authentication!")
        return {
            "uid": "dev-user-123",
            "email": "dev@localhost",
            "name": "Dev User"
        }
    
    # ... rest of the existing code
```

**File: `backend/.env`**

Add:
```env
DEV_MODE=true
```

**⚠️ WARNING**: Never use DEV_MODE in production! Remove it before deploying.

---

## Troubleshooting

### "Popup blocked" Error
- Allow popups in browser settings
- Try different browser (Chrome works best)

### "Unauthorized domain" Error
- Add your domain to Firebase Console → Authentication → Authorized domains
- For localhost, add both "localhost" and "127.0.0.1"

### "Invalid API key" Error
- Double-check VITE_FIREBASE_API_KEY in .env.local
- Make sure there are no extra spaces
- Restart dev server after changing .env.local

### CSP Font Errors (Already Fixed)
✅ We already fixed the Content Security Policy to allow KaTeX fonts from cdn.jsdelivr.net

---

## Recommended: Option 1 (Firebase Setup)
Takes 10 minutes but gives you:
- ✅ Real authentication
- ✅ User management
- ✅ Secure production-ready auth
- ✅ Google Sign-In
- ✅ Email/Password auth

## Quick Testing: Option 2 (Dev Mode)
- ⚠️ No real security
- ⚠️ Only for local testing
- ⚠️ Must disable before production

---

## Next Steps After Setup

1. Restart your dev server
2. Try signing in with Google
3. Test the chat and upload features
4. Everything should work with authentication now!

## Need Help?

- Firebase Docs: https://firebase.google.com/docs/auth/web/start
- Firebase Console: https://console.firebase.google.com
