import { localDB } from './localdb';
import { AuditLog, UserProfile } from '../types';
import { db } from '../pages/patients/firebase';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Logs a user action to the local database and attempts to sync it to Firestore.
 * @param user The user profile of the user performing the action.
 * @param action A short, standardized string representing the action (e.g., 'CREATE_PATIENT').
 * @param details A human-readable description of the action.
 */
export const logAction = async (user: UserProfile | null, action: string, details: string) => {
  if (!user) {
    console.warn("Attempted to log action without a user.", { action, details });
    return;
  }
  
  const newLog: AuditLog = {
    uid: `log_${Date.now()}_${user.uid}`,
    timestamp: new Date(),
    userUid: user.uid,
    userDisplayName: user.displayName,
    action,
    details,
    syncStatus: 'pending',
  };

  try {
    const { syncStatus, ...firestoreData } = newLog;
    // Attempt to write to Firestore immediately for faster cloud logging
    await setDoc(doc(db, 'audit_logs', newLog.uid), firestoreData);
    newLog.syncStatus = 'synced';
  } catch (err) {
    console.warn('Could not write audit log to Firestore, saving as pending.', err);
    // syncStatus remains 'pending'
  } finally {
    // Always write to the local DB
    await localDB.audit_logs.put(newLog);
  }
};
