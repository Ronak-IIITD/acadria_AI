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
  // CRITICAL: No mock auth - Firebase MUST be configured for SaaS mode
  console.error('❌ Firebase configuration is missing!');
  console.error('❌ This application requires Firebase authentication to function.');
  console.error('❌ Please set the following environment variables in .env.local:');
  console.error('   - VITE_FIREBASE_API_KEY');
  console.error('   - VITE_FIREBASE_AUTH_DOMAIN');
  console.error('   - VITE_FIREBASE_PROJECT_ID');
  console.error('   - VITE_FIREBASE_STORAGE_BUCKET');
  console.error('   - VITE_FIREBASE_MESSAGING_SENDER_ID');
  console.error('   - VITE_FIREBASE_APP_ID');
  console.error('');
  console.error('💡 Get these values from your Firebase Console > Project Settings');
  
  // Throw error to prevent app from running without auth
  throw new Error(
    'Firebase Authentication Required\n\n' +
    'This application cannot function without Firebase authentication.\n' +
    'Please contact support if you see this message.'
  );
}

export { auth, googleProvider, db, storage };
export default app;
