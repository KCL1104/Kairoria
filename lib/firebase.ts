import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAhRdvJH4DYO5-dPtWnvPTxZQ0cHFezLNg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "kairoria-2bb81.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "kairoria-2bb81",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "kairoria-2bb81.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "214730833865",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:214730833865:web:ecb8a75625454eed84f218",
  measurementId: "G-3Z75Q9XBPY"
};

// Check if all required Firebase environment variables are present
const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
);

// Initialize Firebase only if properly configured and not already initialized
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured && typeof window !== 'undefined') {
  // Only initialize in the browser and if not already initialized
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  } else {
    app = getApps()[0];
    auth = getAuth(app);
  }
}

export { auth, RecaptchaVerifier, signInWithPhoneNumber, isFirebaseConfigured }; 