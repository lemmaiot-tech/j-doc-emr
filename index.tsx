
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './pages/patients/firebase'; // Initialize Firebase

// Register Firebase Service Worker for Push Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // FIX: Removed leading slash. This makes the path relative to the current URL,
    // which can be more reliable in some development server setups than a root-relative path.
    navigator.serviceWorker.register('firebase-messaging-sw.js')
      .then(registration => {
        // console.log('FCM Service Worker registration successful with scope: ', registration.scope);
      })
      .catch(err => {
        console.log('FCM Service Worker registration failed: ', err);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);