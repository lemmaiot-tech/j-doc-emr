import React, { createContext, useState, useContext, ReactNode, useCallback, useRef } from 'react';
import { localDB } from '../services/localdb';
import { UndoRecord } from '../types';
// Fix: Import Dexie to enable casting for transaction method.
import Dexie from 'dexie';

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

    const primaryKey = recordToDelete.id ?? recordToDelete.uid;
    if (primaryKey === undefined) {
      throw new Error("Record must have an 'id' or 'uid' property to be deleted.");
    }

    // Perform the "delete" (move to undo table) in a transaction
    // Fix: Cast localDB to Dexie to access the 'transaction' method and use the generic `table()` method.
    const table = (localDB as Dexie).table(tableName);
    const undoRecordId = await (localDB as Dexie).transaction('rw', localDB.undo_records, table, async () => {
      const addedId = await localDB.undo_records.add(undoRecord);
      await table.delete(primaryKey);
      return addedId;
    });

    const onUndo = async () => {
        try {
            // Restore the record in a transaction
            // Fix: Cast localDB to Dexie to access the 'transaction' method and use the generic `table()` method.
            const tableToRestore = (localDB as Dexie).table(tableName);
            await (localDB as Dexie).transaction('rw', localDB.undo_records, tableToRestore, async () => {
                await tableToRestore.add(recordToDelete);
                await localDB.undo_records.delete(undoRecordId);
            });
        } catch (error) {
            console.error("Undo failed:", error);
            // Optionally show an error message to the user
        }
    };
    
    // Set up the new toast
    const toastId = Date.now();
    setToast({
      id: toastId,
      message: `${tableName.slice(0, -1)} has been deleted.`,
      onUndo,
    });
    
    // Set a timeout to automatically dismiss the toast
    timeoutRef.current = window.setTimeout(() => {
        // Only dismiss if it's still the same toast
        setToast(currentToast => currentToast?.id === toastId ? null : currentToast);
    }, UNDO_TIMEOUT);
  }, [dismissToast]);

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