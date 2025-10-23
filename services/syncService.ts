import { db } from '../pages/patients/firebase';
import { localDB } from './localdb';
import { collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import Dexie from 'dexie';
import { Patient, Prescription, SurgicalProcedure, VitalSign, MedicalHistoryEntry, DentalProcedure, UserProfile, Department } from '../types';

type SyncableTable = 'patients' | 'prescriptions' | 'surgeries' | 'vitals' | 'medicalHistory' | 'dentalProcedures' | 'users' | 'departments';

const SYNC_CONFIG: { tableName: SyncableTable, collectionName: string }[] = [
    { tableName: 'users', collectionName: 'users' },
    { tableName: 'departments', collectionName: 'departments' },
    { tableName: 'patients', collectionName: 'patients' },
    { tableName: 'prescriptions', collectionName: 'prescriptions' },
    { tableName: 'surgeries', collectionName: 'surgeries' },
    { tableName: 'vitals', collectionName: 'vitals' },
    { tableName: 'medicalHistory', collectionName: 'medicalHistory' },
    { tableName: 'dentalProcedures', collectionName: 'dentalProcedures' },
];

async function syncTable<T extends { uid: string; id?: any; syncStatus: 'synced' | 'pending' }>(
  tableName: SyncableTable,
  collectionName: string
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
    const { id, syncStatus, ...firestoreData } = item;
    const docRef = doc(db, collectionName, item.uid);
    batch.set(docRef, firestoreData, { merge: true });

    const primaryKey = item.id ?? item.uid;
    successfullySyncedPks.push(primaryKey);
  }

  try {
    await batch.commit();
    console.log(`Successfully synced ${successfullySyncedPks.length} items to Firestore collection '${collectionName}'.`);

    const table = (localDB as Dexie).table(tableName);
    const keyPath = table.schema.primKey.keyPath;

    await table
      .where(keyPath)
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
  console.log('Starting background data push...');
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

  console.log(`Push sync finished. Total items synced: ${totalSynced}. Success: ${allSucceeded}`);

  if (!allSucceeded) {
    throw new Error('One or more push sync operations failed.');
  }

  return { success: allSucceeded, totalSynced };
};


export const fetchAllDataAndSeedLocalDB = async () => {
    console.log('Starting data pull from Firestore to seed local DB...');
    try {
        for (const config of SYNC_CONFIG) {
            const { tableName, collectionName } = config;
            const querySnapshot = await getDocs(collection(db, collectionName));
            
            const dataFromFirestore = querySnapshot.docs.map(doc => {
                const data = doc.data();
                // Convert any Firestore Timestamps to JavaScript Date objects
                for (const key in data) {
                    if (data[key]?.toDate instanceof Function) {
                        data[key] = data[key].toDate();
                    }
                }
                return data;
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