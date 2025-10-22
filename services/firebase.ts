
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBLUAM6msHGNZv5JyBq_M9fXgWLiWZZ5Qg",
  authDomain: "check-medical-mission-app.firebaseapp.com",
  projectId: "check-medical-mission-app",
  storageBucket: "check-medical-mission-app.firebasestorage.app",
  messagingSenderId: "800216034775",
  appId: "1:800216034775:web:8a4aaaae12d6ab9acdef92",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
