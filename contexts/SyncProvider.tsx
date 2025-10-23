import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../services/localdb';
import { syncAllData, SYNC_CONFIG } from '../services/syncService';
import { useAuth } from './AuthContext';
import Dexie from 'dexie';
import { db } from '../pages/patients/firebase';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';


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
    
    const syncableTableNames = SYNC_CONFIG.map(c => c.tableName);

    try {
      const counts = await Promise.all(
        syncableTableNames.map(tableName =>
          (localDB as Dexie).table(tableName).where('syncStatus').equals('pending').count()
        )
      );
      const deletionCount = await localDB.deletions_queue.where('syncStatus').equals('pending').count();
      return counts.reduce((sum, count) => sum + count, 0) + deletionCount;
    } catch (e) {
      console.error("Could not query for pending changes count", e);
      return 0;
    }
  }, [user], 0);


  const triggerSync = useCallback(async () => {
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
  
  // Set up real-time listeners for cloud changes
  useEffect(() => {
    if (!user || !isOnline) return;

    console.log('Setting up real-time Firestore listeners...');

    const unsubscribes = SYNC_CONFIG.map(({ tableName, collectionName, pk }) => {
        const q = query(collection(db, collectionName));
        return onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.doc.metadata.hasPendingWrites) {
                    return; // Ignore local changes
                }

                // FIX: Cast localDB to Dexie to access the generic `table()` method.
                const table = (localDB as Dexie).table(tableName);
                const docId = change.doc.id;

                if (change.type === "added" || change.type === "modified") {
                    console.log(`Real-time update (${change.type}) for ${tableName}:`, docId);
                    const docData = change.doc.data();
                     // Convert Timestamps
                    Object.keys(docData).forEach(key => {
                        if (docData[key] instanceof Timestamp) {
                            docData[key] = docData[key].toDate();
                        }
                    });
                    const record = { ...docData, [pk]: docId, syncStatus: 'synced' };
                    await table.put(record);
                } else if (change.type === "removed") {
                    console.log(`Real-time delete for ${tableName}:`, docId);
                    await table.delete(docId);
                }
            });
        }, (error) => {
            console.error(`Listener error on ${collectionName}:`, error);
        });
    });

    return () => {
        console.log('Cleaning up Firestore listeners.');
        unsubscribes.forEach(unsub => unsub());
    };
  }, [user, isOnline]);


  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
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
      triggerSync();
      intervalId = window.setInterval(triggerSync, SYNC_INTERVAL);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, isOnline, triggerSync]);

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