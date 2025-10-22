import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { syncAllData } from '../services/syncService';
import { useAuth } from './AuthContext';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface SyncContextType {
  status: SyncStatus;
  lastSync: Date | null;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

const SYNC_INTERVAL = 30000; // 30 seconds

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const triggerSync = useCallback(async () => {
    // Prevent multiple syncs at the same time
    if (status === 'syncing') return;

    setStatus('syncing');
    try {
      await syncAllData();
      setLastSync(new Date());
      setStatus('synced');
    } catch (error) {
      console.error("Sync failed:", error);
      setStatus('error');
    }
  }, [status]); // Dependency on status to prevent concurrent runs

  useEffect(() => {
    let intervalId: number | undefined;

    if (user) {
      // Initial sync on login
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
  }, [user, triggerSync]); // Rerun effect if user or triggerSync function changes

  const value = { status, lastSync, triggerSync };

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
