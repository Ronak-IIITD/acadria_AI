import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if Firebase is configured
const isFirebaseConfigured = firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('your-') &&
  !firebaseConfig.apiKey.includes('placeholder');

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let googleProvider: any = null;

if (isFirebaseConfigured) {
  try {
    console.log('✅ Firebase configuration loaded, initializing...');

    // Initialize Firebase
    app = initializeApp(firebaseConfig);

    // Initialize Firebase Auth
    auth = getAuth(app);

    // Set persistence to keep user logged in across page refreshes
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('✅ Auth persistence set to browserLocalPersistence');
      })
      .catch((error) => {
        console.error('❌ Error setting auth persistence:', error);
      });

    // Configure Google Provider
    googleProvider = new GoogleAuthProvider();

    // Configure for better popup experience
    googleProvider.setCustomParameters({
      prompt: 'select_account' // Always show account selection
    });

    db = getFirestore(app);
    storage = getStorage(app);

  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    console.warn('⚠️  App will run without Firebase authentication');
  }
} else {
  console.warn('⚠️  Firebase not configured. Using mock auth for development.');
  console.warn('⚠️  Set VITE_FIREBASE_* environment variables in .env.local to enable Firebase.');

  // Create mock auth object for development - with proper methods
  auth = {
    currentUser: null,
    signOut: async () => {
      console.log('🔧 Mock signOut called');
    },
    // Mock onAuthStateChanged - returns no user
    onAuthStateChanged: (callback: any) => {
      // Immediately call with no user
      setTimeout(() => callback(null), 0);
      // Return unsubscribe function
      return () => {};
    }
  } as any;

  googleProvider = null;
}

export { auth, googleProvider, db, storage };
export default app;
