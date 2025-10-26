import { collection, getDocs, writeBatch, doc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../pages/patients/firebase';
import { localDB } from './localdb';
import { SyncStatus } from '../types';
import Dexie from 'dexie';

// This file contains the logic for synchronizing data between the local Dexie database and the remote Firestore database.

// Configuration for each table that needs to be synced.
export const SYNC_CONFIG = [
  { tableName: 'users', collectionName: 'users', pk: 'uid' },
  { tableName: 'patients', collectionName: 'patients', pk: 'uid' },
  { tableName: 'departments', collectionName: 'departments', pk: 'id' },
  { tableName: 'prescriptions', collectionName: 'prescriptions', pk: 'uid' },
  { tableName: 'surgeries', collectionName: 'surgeries', pk: 'uid' },
  { tableName: 'vitals', collectionName: 'vitals', pk: 'uid' },
  { tableName: 'medicalHistory', collectionName: 'medical_history', pk: 'uid' },
  { tableName: 'departmentNotes', collectionName: 'department_notes', pk: 'uid' },
  { tableName: 'dentalProcedures', collectionName: 'dental_procedures', pk: 'uid' },
  { tableName: 'medications', collectionName: 'medications', pk: 'uid' },
  { tableName: 'audit_logs', collectionName: 'audit_logs', pk: 'uid' },
];

/**
 * Pushes pending local changes (creations, updates) to Firestore.
 */
const pushChanges = async () => {
  for (const { tableName, collectionName, pk } of SYNC_CONFIG) {
    const table = (localDB as Dexie).table(tableName);
    const pendingItems = await table.where('syncStatus').equals('pending').toArray();

    if (pendingItems.length > 0) {
      const batch = writeBatch(db);
      pendingItems.forEach(item => {
        const { syncStatus, ...dataToSync } = item;
        const docId = item[pk];
        if (!docId) {
          console.error(`Missing primary key ('${pk}') for item in ${tableName}`, item);
          return;
        }
        const docRef = doc(db, collectionName, docId);
        batch.set(docRef, dataToSync, { merge: true });
      });

      await batch.commit();

      // Update local status to 'synced'
      await table.bulkPut(pendingItems.map(item => ({ ...item, syncStatus: 'synced' })));
    }
  }
};

/**
 * Pushes pending local deletions to Firestore.
 */
const pushDeletions = async () => {
    const pendingDeletions = await localDB.deletions_queue.where('syncStatus').equals('pending').toArray();
    
    if (pendingDeletions.length > 0) {
        const batch = writeBatch(db);
        pendingDeletions.forEach(deletion => {
            const docRef = doc(db, deletion.collectionName, deletion.docId);
            batch.delete(docRef);
        });
        
        await batch.commit();

        // Remove from queue after successful deletion in Firestore
        await localDB.deletions_queue.bulkDelete(pendingDeletions.map(d => d.id!));
    }
};

/**
 * Fetches all data from Firestore and seeds the local Dexie database.
 * This is typically called on initial login to ensure the local DB is up to date.
 */
export const fetchAllDataAndSeedLocalDB = async () => {
    console.log("Fetching all data from cloud and seeding local DB...");
    try {
        await Promise.all(SYNC_CONFIG.map(async ({ tableName, collectionName, pk }) => {
            const table = (localDB as Dexie).table(tableName);
            const querySnapshot = await getDocs(collection(db, collectionName));
            
            if (!querySnapshot.empty) {
                const items = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    // Convert any Firestore Timestamps to JS Dates
                    Object.keys(data).forEach(key => {
                        if (data[key] instanceof Timestamp) {
                            data[key] = data[key].toDate();
                        }
                    });
                    return { ...data, [pk]: doc.id, syncStatus: 'synced' as SyncStatus };
                });
                await table.bulkPut(items);
            }
        }));
        console.log("Local DB seeded successfully.");
    } catch (error) {
        console.error("Error seeding local DB:", error);
    }
};


/**
 * Runs the full synchronization process: pushing deletions, then creations/updates.
 */
export const syncAllData = async () => {
    try {
        await pushDeletions();
        await pushChanges();
    } catch (error) {
        console.error("Synchronization failed:", error);
        throw error;
    }
};