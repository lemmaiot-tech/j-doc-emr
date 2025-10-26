// This file must be in the public root folder.

// Use the same CDN version as the main app for consistency
import { initializeApp } from 'https://aistudiocdn.com/firebase@^12.4.0/app';
import { getMessaging, onBackgroundMessage } from 'https://aistudiocdn.com/firebase@^12.4.0/messaging-sw';

const firebaseConfig = {
  apiKey: "AIzaSyBLUAM6msHGNZv5JyBq_M9fXgWLiWZZ5Qg",
  authDomain: "check-medical-mission-app.firebaseapp.com",
  projectId: "check-medical-mission-app",
  storageBucket: "check-medical-mission-app.firebasestorage.app",
  messagingSenderId: "800216034775",
  appId: "1:800216034775:web:8a4aaaae12d6ab9acdef92",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  const notificationTitle = payload.notification?.title || 'J DOC EMR';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification.',
    icon: '/images/j-doc.png' 
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});