
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../pages/patients/firebase';
import { useAuth } from './AuthContext';
import { Role, Notification } from '../types';

interface NotificationContextType {
  notifications: Notification[];
  removeNotification: (id: number) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATION_TIMEOUT = 7000; // 7 seconds

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { userProfile } = useAuth();
    const isInitialSurgeryLoad = useRef(true);

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const newNotification = { ...notification, id: Date.now() };
        setNotifications(prev => [...prev, newNotification]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        }, NOTIFICATION_TIMEOUT);
    }, []);
    
    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Effect for New Prescription listener
    useEffect(() => {
        if (!userProfile || ![Role.Admin, Role.Pharmacist].includes(userProfile.role)) {
            return;
        }

        const prescrQuery = query(collection(db, 'prescriptions'), where('createdAt', '>', Timestamp.now()));
        
        const unsubscribe = onSnapshot(prescrQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added' && !change.doc.metadata.hasPendingWrites) {
                     const data = change.doc.data();
                     addNotification({
                        title: 'New Prescription Added',
                        message: `For drug: ${data.drug}. Patient ID: ${data.patientUid}`,
                        type: 'info',
                     });
                }
            });
        });

        return () => unsubscribe();
    }, [userProfile, addNotification]);

    // Effect for Surgery Status Change listener
    useEffect(() => {
        if (!userProfile || ![Role.Admin, Role.Surgeon, Role.Doctor, Role.Nurse].includes(userProfile.role)) {
            return;
        }

        const surgeryQuery = collection(db, 'surgeries');
        
        const unsubscribe = onSnapshot(surgeryQuery, (snapshot) => {
            if (isInitialSurgeryLoad.current) {
                isInitialSurgeryLoad.current = false;
                return;
            }
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'modified' && !change.doc.metadata.hasPendingWrites) {
                    const data = change.doc.data();
                    addNotification({
                        title: 'Surgery Status Updated',
                        message: `Procedure "${data.procedureName}" is now ${data.status}.`,
                        type: 'info',
                    });
                }
            });
        });

        return () => unsubscribe();
    }, [userProfile, addNotification]);

    const value = { notifications, removeNotification, addNotification };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};