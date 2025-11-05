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

// Validate Firebase config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('🔥 Firebase configuration is missing! Check your .env file.');
} else {
  console.log('✅ Firebase configuration loaded successfully');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Set persistence to keep user logged in across page refreshes
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('✅ Auth persistence set to browserLocalPersistence');
  })
  .catch((error) => {
    console.error('❌ Error setting auth persistence:', error);
  });

// Configure Google Provider
export const googleProvider = new GoogleAuthProvider();

// Configure for better popup experience
googleProvider.setCustomParameters({
  prompt: 'select_account' // Always show account selection
});

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
