import Dexie, { Table } from 'dexie';
import { UserProfile, Patient, Department, Prescription, SurgicalProcedure, VitalSign, MedicalHistoryEntry, DentalProcedure, UndoRecord } from '../types';

export interface DeletionRecord {
  id?: number;
  collectionName: string;
  docId: string;
  syncStatus: 'pending';
}

export class JDocDexie extends Dexie {
  users!: Table<UserProfile, string>; // PK is uid (string)
  patients!: Table<Patient, string>; // PK is uid (string)
  departments!: Table<Department, string>; // PK is id (string)
  prescriptions!: Table<Prescription, string>; // PK is uid (string)
  surgeries!: Table<SurgicalProcedure, string>; // PK is uid (string)
  vitals!: Table<VitalSign, string>; // PK is uid (string)
  medicalHistory!: Table<MedicalHistoryEntry, string>; // PK is uid (string)
  dentalProcedures!: Table<DentalProcedure, string>; // PK is uid (string)
  undo_records!: Table<UndoRecord, number>; // PK is auto-incrementing id
  deletions_queue!: Table<DeletionRecord, number>; // PK is auto-incrementing id for deletion sync

  constructor() {
    super('jdoc_emr_db_v2');
    
    // Schema version 1 (existing)
    // FIX: Cast `this` to Dexie to access inherited methods like `version`.
    (this as Dexie).version(1).stores({
      users: 'uid, email, role',
      patients: 'uid, lastName, firstName, syncStatus',
      departments: 'id, name',
      prescriptions: 'uid, patientUid, status, createdAt, syncStatus',
      surgeries: 'uid, patientUid, status, createdAt, syncStatus',
      vitals: 'uid, patientUid, createdAt, syncStatus',
      medicalHistory: 'uid, patientUid, date, syncStatus',
      dentalProcedures: 'uid, patientUid, status, createdAt, syncStatus',
      undo_records: '++id, deletedAt',
    });

    // Schema version 2 (upgrade) - Adds the deletions queue
    // FIX: Cast `this` to Dexie to access inherited methods like `version`.
    (this as Dexie).version(2).stores({
        deletions_queue: '++id, docId, syncStatus'
    });
  }

  async clearAllData() {
    await Promise.all(
      // FIX: Cast `this` to Dexie to access inherited properties like `tables`.
      (this as Dexie).tables.map(table => table.clear())
    );
  }
}

export const localDB = new JDocDexie();