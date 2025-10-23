import { db } from '../pages/patients/firebase';
import { localDB } from './localdb';
import Dexie from 'dexie';
import { Patient, Prescription, SurgicalProcedure, VitalSign, MedicalHistoryEntry, DentalProcedure, UserProfile, Department } from '../types';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';

type SyncableTable = 'patients' | 'prescriptions' | 'surgeries' | 'vitals' | 'medicalHistory' | 'dentalProcedures' | 'users' | 'departments';

export const SYNC_CONFIG: { tableName: SyncableTable, collectionName: string, pk: 'uid' | 'id' }[] = [
    { tableName: 'users', collectionName: 'users', pk: 'uid' },
    { tableName: 'departments', collectionName: 'departments', pk: 'id' },
    { tableName: 'patients', collectionName: 'patients', pk: 'uid' },
    { tableName: 'prescriptions', collectionName: 'prescriptions', pk: 'uid' },
    { tableName: 'surgeries', collectionName: 'surgeries', pk: 'uid' },
    { tableName: 'vitals', collectionName: 'vitals', pk: 'uid' },
    { tableName: 'medicalHistory', collectionName: 'medicalHistory', pk: 'uid' },
    { tableName: 'dentalProcedures', collectionName: 'dentalProcedures', pk: 'uid' },
];

async function syncTable<T extends { uid?: string; id?: any; syncStatus: 'synced' | 'pending' }>(
  tableName: SyncableTable,
  collectionName: string,
  pk: 'uid' | 'id'
) {
  const pendingItems = (await (localDB as Dexie)
    .table(tableName)
    .where('syncStatus')
    .equals('pending')
    .toArray()) as T[];

  if (pendingItems.length === 0) {
    return { success: true, synced: 0 };
  }

  console.log(`Syncing ${pendingItems.length} pending items from ${tableName}...`);

  const batch = writeBatch(db);
  const successfullySyncedPks: (string | number)[] = [];

  for (const item of pendingItems) {
    const docId = item[pk];
    if (!docId) {
        console.error(`Item in ${tableName} is missing primary key for sync.`, item);
        continue;
    }
    const { id, uid, syncStatus, ...firestoreData } = item;
    const docRef = doc(db, collectionName, docId);
    batch.set(docRef, firestoreData, { merge: true });

    successfullySyncedPks.push(docId);
  }

  try {
    await batch.commit();
    console.log(`Successfully synced ${successfullySyncedPks.length} items to Firestore collection '${collectionName}'.`);

    const table = (localDB as Dexie).table(tableName);

    await table
      .where(pk)
      .anyOf(successfullySyncedPks)
      .modify({
        syncStatus: 'synced',
        updatedAt: new Date(),
      });

    return { success: true, synced: successfullySyncedPks.length };
  } catch (error) {
    console.error(`Error syncing ${tableName} to Firestore:`, error);
    return { success: false, synced: 0, error };
  }
}

async function syncDeletions() {
    const pendingDeletions = await localDB.deletions_queue.where('syncStatus').equals('pending').toArray();
    if (pendingDeletions.length === 0) {
        return { success: true, deleted: 0 };
    }

    console.log(`Syncing ${pendingDeletions.length} pending deletions...`);

    const batch = writeBatch(db);
    pendingDeletions.forEach(d => {
        const docRef = doc(db, d.collectionName, d.docId);
        batch.delete(docRef);
    });

    try {
        await batch.commit();
        const successfullyDeletedIds = pendingDeletions.map(d => d.id!);
        await localDB.deletions_queue.bulkDelete(successfullyDeletedIds);
        console.log(`Successfully synced ${pendingDeletions.length} deletions to Firestore.`);
        return { success: true, deleted: pendingDeletions.length };
    } catch (error) {
        console.error(`Error syncing deletions to Firestore:`, error);
        return { success: false, deleted: 0, error };
    }
}

export const syncAllData = async () => {
  console.log('Starting background data push...');
  const tableSyncPromises = SYNC_CONFIG.map(config => 
      syncTable(config.tableName, config.collectionName, config.pk)
  );

  const [deletionResult, ...tableSyncResults] = await Promise.all([
    syncDeletions(),
    ...tableSyncPromises
  ]);

  const allSucceeded = tableSyncResults.every((r) => r.success) && deletionResult.success;
  const totalSynced = tableSyncResults.reduce((sum, r) => sum + r.synced, 0);

  console.log(`Push sync finished. Total items synced: ${totalSynced}. Total deletions: ${deletionResult.deleted}. Success: ${allSucceeded}`);

  if (!allSucceeded) {
    throw new Error('One or more push sync operations failed.');
  }

  return { success: allSucceeded, totalSynced };
};


export const fetchAllDataAndSeedLocalDB = async () => {
    console.log('Starting data pull from Firestore to seed local DB...');
    try {
        for (const config of SYNC_CONFIG) {
            const { tableName, collectionName, pk } = config;
            const querySnapshot = await getDocs(collection(db, collectionName));
            
            const dataFromFirestore = querySnapshot.docs.map(doc => {
                const data = doc.data();
                // Convert any Firestore Timestamps to JavaScript Date objects
                for (const key in data) {
                    if (data[key]?.toDate instanceof Function) {
                        data[key] = data[key].toDate();
                    }
                }
                
                return {
                    ...data,
                    [pk]: doc.id,
                };
            });

            if (dataFromFirestore.length > 0) {
                // Use bulkPut to add or update records
                await (localDB as Dexie).table(tableName).bulkPut(dataFromFirestore);
                console.log(`Successfully seeded ${dataFromFirestore.length} records into local table '${tableName}'.`);
            } else {
                 console.log(`No records found in Firestore for '${collectionName}' to seed.`);
            }
        }
    } catch (error) {
        console.error("Failed to fetch and seed data from Firestore:", error);
        throw error;
    }
};