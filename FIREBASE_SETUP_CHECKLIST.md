# Firebase Google Sign-In Setup Checklist

## ✅ Configuration Issues Fixed

1. **Environment Variables** - Now properly configured in `.env`
2. **Firebase Initialization** - Using correct `VITE_` prefixed variables
3. **Better Error Handling** - Added detailed error messages for debugging

## 🔧 Firebase Console Setup Required

To enable Google Sign-In, you MUST complete these steps in Firebase Console:

### 1. Enable Google Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **studysync-ai-19ff7**
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Toggle **Enable**
6. Add a support email (your email)
7. Click **Save**

### 2. Add Authorized Domains
1. In Firebase Console → **Authentication** → **Settings** tab
2. Scroll to **Authorized domains**
3. Add these domains:
   - `localhost` (for local development)
   - `127.0.0.1` (alternative localhost)
   - Your production domain (if deployed)

**Current domains you need to add:**
- `localhost`
- `127.0.0.1`
- Any custom domain where you deploy the app

### 3. Verify OAuth 2.0 Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select the same project
3. Navigate to **APIs & Services** → **Credentials**
4. Find the OAuth 2.0 Client ID created by Firebase
5. Under **Authorized JavaScript origins**, verify these are listed:
   - `http://localhost:3000`
   - `http://localhost:3001`
   - `http://localhost:3002`
   - `http://127.0.0.1:3000`
   - Your production domain
6. Under **Authorized redirect URIs**, verify:
   - `https://studysync-ai-19ff7.firebaseapp.com/__/auth/handler`

## 🧪 Testing the Fix

1. **Restart your development server:**
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

2. **Open browser console** (F12) and check for:
   - Firebase configuration validation messages
   - Any error codes when clicking "Continue with Google"

3. **Common Error Codes & Solutions:**

   - **`auth/unauthorized-domain`**
     → Add your domain to Firebase Console authorized domains

   - **`auth/popup-blocked`**
     → Allow popups in your browser or use redirect flow

   - **`auth/configuration-not-found`**
     → Enable Google sign-in method in Firebase Console

   - **`auth/invalid-api-key`**
     → Check your `.env` file has correct Firebase API key

## 📝 Current Configuration

Your `.env` file contains:
```
VITE_FIREBASE_API_KEY=AIzaSyDDYKXFSa7Y2iwUjq6ZX48OryXqVkP4Ryk
VITE_FIREBASE_AUTH_DOMAIN=studysync-ai-19ff7.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=studysync-ai-19ff7
VITE_FIREBASE_STORAGE_BUCKET=studysync-ai-19ff7.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=102043753135
VITE_FIREBASE_APP_ID=1:102043753135:web:fb507efa818352ad8a525a
```

✅ These credentials look correct!

## 🚀 Next Steps

1. Complete the Firebase Console setup (steps above)
2. Restart your dev server
3. Try Google sign-in
4. Check browser console for any remaining errors
5. If issues persist, share the error code with me

## 💡 Additional Tips

- **Clear browser cache** if you had previous failed attempts
- **Try incognito/private mode** to rule out browser extensions
- **Check browser popup settings** - ensure popups are allowed for localhost
- **Use different Google account** to test if account-specific issue

---

**Need help?** Share the error message you see in the browser console!
