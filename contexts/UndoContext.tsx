import React, { createContext, useState, useContext, ReactNode, useCallback, useRef } from 'react';
import { localDB } from '../services/localdb';
import { UndoRecord } from '../types';
import Dexie from 'dexie';
import { useAuth } from './AuthContext';
import { logAction } from '../services/auditLogService';

// The type for the toast state
interface ToastState {
  id: number;
  message: string;
  onUndo: () => void;
}

interface UndoContextType {
  toast: ToastState | null;
  handleUndo: () => void;
  dismissToast: () => void;
  deleteWithUndo: <T extends { id?: any; uid?: any }>(tableName: string, recordToDelete: T) => Promise<void>;
}

const UndoContext = createContext<UndoContextType | undefined>(undefined);

const UNDO_TIMEOUT = 7000; // 7 seconds

export const UndoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const { userProfile } = useAuth(); // Get user for logging

  const dismissToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setToast(null);
  }, []);

  const handleUndo = useCallback(() => {
    if (toast) {
      toast.onUndo();
      dismissToast();
    }
  }, [toast, dismissToast]);

  const deleteWithUndo = useCallback(async <T extends { id?: any; uid?: any }>(
    tableName: string,
    recordToDelete: T
  ) => {
    // Clear any existing toast
    dismissToast();

    const undoRecord: UndoRecord = {
      tableName,
      recordData: recordToDelete,
      deletedAt: new Date(),
    };
    
    // Determine the primary key ('id' for departments, 'uid' for others)
    const primaryKey = tableName === 'departments' ? recordToDelete.id : recordToDelete.uid;
    if (primaryKey === undefined) {
      throw new Error("Record must have an 'id' or 'uid' property to be deleted.");
    }

    const table = (localDB as Dexie).table(tableName);
    // FIX: Cast localDB to Dexie to access the `transaction` method.
    const undoRecordId = await (localDB as Dexie).transaction('rw', localDB.undo_records, table, localDB.deletions_queue, async () => {
      const addedId = await localDB.undo_records.add(undoRecord);
      await table.delete(primaryKey);
      await localDB.deletions_queue.add({
        collectionName: tableName,
        docId: primaryKey,
        syncStatus: 'pending'
      });
      return addedId;
    });
    
    // Log the deletion action
    const recordName = (recordToDelete as any).displayName || `${(recordToDelete as any).firstName} ${(recordToDelete as any).lastName}` || primaryKey;
    logAction(userProfile, `DELETE_${tableName.slice(0, -1).toUpperCase()}`, `Deleted ${tableName.slice(0, -1)}: ${recordName} (ID: ${primaryKey})`);


    const onUndo = async () => {
        try {
            const tableToRestore = (localDB as Dexie).table(tableName);
            // FIX: Cast localDB to Dexie to access the `transaction` method.
            await (localDB as Dexie).transaction('rw', localDB.undo_records, tableToRestore, localDB.deletions_queue, async () => {
                await tableToRestore.put(recordToDelete);
                await localDB.undo_records.delete(undoRecordId);
                const deletionMarker = await localDB.deletions_queue
                    .where({ collectionName: tableName, docId: primaryKey })
                    .first();
                if (deletionMarker && deletionMarker.id) {
                    await localDB.deletions_queue.delete(deletionMarker.id);
                }
            });
            // Log the undo action
            logAction(userProfile, `UNDO_DELETE_${tableName.slice(0, -1).toUpperCase()}`, `Restored ${tableName.slice(0, -1)}: ${recordName} (ID: ${primaryKey})`);
        } catch (error) {
            console.error("Undo failed:", error);
            // Optionally show an error message to the user
        }
    };
    
    // Set up the new toast
    const toastId = Date.now();
    const recordNameToast = tableName.endsWith('s') ? tableName.slice(0, -1) : tableName;
    setToast({
      id: toastId,
      message: `The ${recordNameToast} has been deleted.`,
      onUndo,
    });
    
    timeoutRef.current = window.setTimeout(() => {
        setToast(currentToast => currentToast?.id === toastId ? null : currentToast);
    }, UNDO_TIMEOUT);
  }, [dismissToast, userProfile]);

  const value = { toast, handleUndo, dismissToast, deleteWithUndo };

  return (
    <UndoContext.Provider value={value}>
      {children}
    </UndoContext.Provider>
  );
};

export const useUndo = () => {
  const context = useContext(UndoContext);
  if (context === undefined) {
    throw new Error('useUndo must be used within an UndoProvider');
  }
  return context;
};