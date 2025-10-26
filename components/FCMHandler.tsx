
import React, { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { messaging, VAPID_KEY, db } from '../pages/patients/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { localDB } from '../services/localdb';

const FCMHandler: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!user || !userProfile) return;

    const requestPermissionAndToken = async () => {
      try {
        if (typeof Notification === 'undefined' || !('requestPermission' in Notification)) {
            console.warn('Push Notifications are not supported in this browser.');
            return;
        }
        
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
          if (currentToken) {
            // Save token if it's new or different
            if (userProfile.fcmToken !== currentToken) {
              const userDocRef = doc(db, 'users', user.uid);
              await setDoc(userDocRef, { fcmToken: currentToken }, { merge: true });
              await localDB.users.update(user.uid, { fcmToken: currentToken });
            }
          } else {
            console.warn('No registration token available. Request permission to generate one.');
          }
        } else {
          console.warn('Unable to get permission to notify.');
        }
      } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
      }
    };

    requestPermissionAndToken();
  }, [user, userProfile]);

  useEffect(() => {
    // Handle foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      addNotification({
        title: payload.notification?.title || 'New Notification',
        message: payload.notification?.body || '',
        type: 'info',
      });
    });
    return () => unsubscribe();
  }, [addNotification]);

  return null; // This component doesn't render anything
};

export default FCMHandler;