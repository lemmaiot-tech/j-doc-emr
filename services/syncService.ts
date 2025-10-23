import { db } from '../pages/patients/firebase';
import { localDB } from './localdb';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
// Fix: Import Dexie to enable casting for dynamic table access.
import Dexie from 'dexie';
import { Patient, Prescription, SurgicalProcedure, VitalSign, MedicalHistoryEntry, DentalProcedure } from '../types';

// Add 'medicalHistory' and 'dentalProcedures' to the list of syncable tables
type SyncableTable = 'patients' | 'prescriptions' | 'surgeries' | 'vitals' | 'medicalHistory' | 'dentalProcedures';

// Fix: Improved generic constraint to include syncStatus for better type safety.
async function syncTable<T extends { uid: string; id?: number; syncStatus: 'synced' | 'pending' }>(
  tableName: SyncableTable,
  collectionName: string
) {
  // Fix: Cast `localDB` to `Dexie` to correctly access the generic `table()` method.
  // Also, cast the result of toArray() to T[] to align with the improved generic constraint.
  const pendingItems = (await (localDB as Dexie)
    .table(tableName)
    .where('syncStatus')
    .equals('pending')
    .toArray()) as T[];

  if (pendingItems.length === 0) {
    console.log(`No pending changes for ${tableName}.`);
    return { success: true, synced: 0 };
  }

  console.log(`Syncing ${pendingItems.length} items from ${tableName}...`);

  const batch = writeBatch(db);
  const successfullySyncedPks: (string | number)[] = [];

  for (const item of pendingItems) {
    // We delete the local `id` and `syncStatus` before sending to Firestore
    const { id, syncStatus, ...firestoreData } = item;
    const docRef = doc(db, collectionName, item.uid);
    batch.set(docRef, firestoreData, { merge: true });

    // Use the primary key (id for auto-incrementing tables, uid otherwise)
    const primaryKey = item.id ?? item.uid;
    successfullySyncedPks.push(primaryKey);
  }

  try {
    await batch.commit();
    console.log(
      `Successfully synced ${successfullySyncedPks.length} items to Firestore collection '${collectionName}'.`
    );

    // Update syncStatus for synced items in localDB
    // Fix: Cast `localDB` to `Dexie` to correctly access the generic `table()` method.
    await (localDB as Dexie)
      .table(tableName)
      .where(':id')
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

export const syncAllData = async () => {
  console.log('Starting background sync...');
  const results = await Promise.all([
    syncTable<Patient>('patients', 'patients'),
    syncTable<Prescription>('prescriptions', 'prescriptions'),
    syncTable<SurgicalProcedure>('surgeries', 'surgeries'),
    syncTable<VitalSign>('vitals', 'vitals'),
    syncTable<MedicalHistoryEntry>('medicalHistory', 'medicalHistory'),
    syncTable<DentalProcedure>('dentalProcedures', 'dentalProcedures'),
  ]);

  const allSucceeded = results.every((r) => r.success);
  const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);

  console.log(
    `Sync finished. Total items synced: ${totalSynced}. Success: ${allSucceeded}`
  );

  if (!allSucceeded) {
    throw new Error('One or more sync operations failed.');
  }

  return {
    success: allSucceeded,
    totalSynced,
  };
};