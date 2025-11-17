# 🔥 Firebase Setup Guide for StudySync AI

## Step 1: Create Firebase Project

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create New Project:**
   - Click "Add project"
   - Project name: `studysync-ai` (or any name you want)
   - Click "Continue"
   - Disable Google Analytics (optional, you can enable later)
   - Click "Create project"
   - Wait for project creation (30 seconds)
   - Click "Continue"

## Step 2: Add Web App

1. **Register Web App:**
   - In Firebase Console, click the **Web icon** (</>)
   - App nickname: `StudySync AI Web`
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

2. **Copy Configuration:**
   - You'll see code like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "studysync-ai.firebaseapp.com",
     projectId: "studysync-ai",
     storageBucket: "studysync-ai.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```
   - **SAVE THIS - You'll need it in Step 4!**

## Step 3: Enable Authentication

1. **Go to Authentication:**
   - In left sidebar, click "Build" → "Authentication"
   - Click "Get started"

2. **Enable Email/Password:**
   - Click "Sign-in method" tab
   - Click "Email/Password"
   - Toggle "Enable" ON
   - Click "Save"

3. **Enable Google Sign-In:**
   - Click "Add new provider"
   - Select "Google"
   - Toggle "Enable" ON
   - Project support email: (your email)
   - Click "Save"

4. **Add Authorized Domain:**
   - Click "Settings" tab
   - Scroll to "Authorized domains"
   - Add: `localhost` (should already be there)
   - If deploying, add your domain later

## Step 4: Update Environment Variables

1. **Open `.env.local` file in your project root**

2. **Replace the placeholders with your Firebase config:**
   ```bash
   # Frontend API Key (for fallback)
   VITE_API_KEY=your_gemini_api_key_here

   # Backend URL
   VITE_BACKEND_URL=http://localhost:8000

   # Firebase Configuration (REPLACE WITH YOUR VALUES)
   VITE_FIREBASE_API_KEY=AIza...  # From firebaseConfig.apiKey
   VITE_FIREBASE_AUTH_DOMAIN=studysync-ai.firebaseapp.com  # From firebaseConfig.authDomain
   VITE_FIREBASE_PROJECT_ID=studysync-ai  # From firebaseConfig.projectId
   VITE_FIREBASE_STORAGE_BUCKET=studysync-ai.appspot.com  # From firebaseConfig.storageBucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789  # From firebaseConfig.messagingSenderId
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123  # From firebaseConfig.appId
   ```

3. **Save the file**

## Step 5: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Step 6: Test Authentication

1. **Open:** http://localhost:3001/
2. **Click:** "Start Learning Free"
3. **Try:**
   - Google Sign-In (popup should work)
   - Email/Password Sign-Up

## Troubleshooting

### "auth/unauthorized-domain" Error
**Fix:** Add your domain to Firebase Console → Authentication → Settings → Authorized domains

### "auth/popup-blocked" Error
**Fix:** Allow popups in your browser for localhost

### "auth/invalid-api-key" Error
**Fix:** Double-check your `VITE_FIREBASE_API_KEY` in `.env.local`

### Firebase Not Initializing
**Fix:** Make sure all VITE_FIREBASE_* variables are set in `.env.local`

---

## Quick Copy Template

Copy this to `.env.local` and replace values:

```bash
VITE_API_KEY=your_gemini_api_key_here
VITE_BACKEND_URL=http://localhost:8000

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

**Need help?** Check the Firebase Console logs: https://console.firebase.google.com/
