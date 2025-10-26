
import { initializeApp, getApps, getApp } from '@firebase/app';
import { getAuth } from '@firebase/auth';
import { getFirestore } from '@firebase/firestore';
import { getStorage } from '@firebase/storage';
import { getMessaging } from '@firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBLUAM6msHGNZv5JyBq_M9fXgWLiWZZ5Qg",
  authDomain: "check-medical-mission-app.firebaseapp.com",
  projectId: "check-medical-mission-app",
  storageBucket: "check-medical-mission-app.firebasestorage.app",
  messagingSenderId: "800216034775",
  appId: "1:800216034775:web:8a4aaaae12d6ab9acdef92",
};

// Initialize Firebase app only if it hasn't been initialized yet.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

// IMPORTANT: Replace this with your actual VAPID key from the Firebase console.
// Go to Project settings > Cloud Messaging > Web configuration > Generate key pair.
// Push notifications will NOT work without a valid key.
export const VAPID_KEY = 'YOUR_PUBLIC_VAPID_KEY_FROM_FIREBASE_CONSOLE';


export default app;