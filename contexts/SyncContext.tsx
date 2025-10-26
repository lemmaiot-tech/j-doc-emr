import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../services/localdb';
import { syncAllData } from '../services/syncService';
import { useAuth } from './AuthContext';
// FIX: Import Dexie to enable casting for generic table access.
import Dexie from 'dexie';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface SyncContextType {
  status: SyncStatus;
  lastSync: Date | null;
  isOnline: boolean;
  pendingChangesCount: number;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

const SYNC_INTERVAL = 30000; // 30 seconds

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const pendingChangesCount = useLiveQuery(async () => {
    if (!user) return 0;

    // These are the tables that have a `syncStatus` field for pending changes.
    const syncableTableNames = [
      'patients',
      'prescriptions',
      'surgeries',
      'vitals',
      'medicalHistory',
      'dentalProcedures',
    ];

    try {
      const counts = await Promise.all(
        syncableTableNames.map(tableName =>
          // FIX: Cast localDB to Dexie to access the generic `table()` method.
          (localDB as Dexie).table(tableName).where('syncStatus').equals('pending').count()
        )
      );
      return counts.reduce((sum, count) => sum + count, 0);
    } catch (e) {
      console.error("Could not query for pending changes count", e);
      return 0; // Return 0 on error to avoid breaking the UI
    }
  }, [user], 0); // Re-run when user logs in/out, default to 0


  const triggerSync = useCallback(async () => {
    // Prevent multiple syncs at the same time or when offline
    if (status === 'syncing' || !navigator.onLine) return;

    setStatus('syncing');
    try {
      await syncAllData();
      setLastSync(new Date());
      setStatus('synced');
    } catch (error) {
      console.error("Sync failed:", error);
      setStatus('error');
    }
  }, [status]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Automatically trigger a sync when connection is restored
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync]);

  useEffect(() => {
    let intervalId: number | undefined;

    if (user && isOnline) {
      // Initial sync on login or when coming online
      triggerSync();

      // Set up periodic sync
      intervalId = window.setInterval(() => {
        triggerSync();
      }, SYNC_INTERVAL);
    }

    // Cleanup on logout or component unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, isOnline, triggerSync]); // Rerun effect if user, online status, or triggerSync function changes

  const value = { status, lastSync, isOnline, pendingChangesCount: pendingChangesCount ?? 0, triggerSync };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
