import Dexie, { Table } from 'dexie';
import { UserProfile, Patient, Department, Prescription, SurgicalProcedure, VitalSign, MedicalHistoryEntry, DentalProcedure, UndoRecord } from '../types';

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

  constructor() {
    super('jdoc_emr_db');
    // Bump schema version to 5 to change primary keys to 'uid' for syncable tables.
    // This is a critical change for robust synchronization.
    (this as Dexie).version(5).stores({
      users: 'uid, email, role',
      patients: 'uid, lastName, firstName',
      departments: 'id, name',
      prescriptions: 'uid, patientUid, status',
      surgeries: 'uid, patientUid, status',
      vitals: 'uid, patientUid, createdAt',
      medicalHistory: 'uid, patientUid, date',
      dentalProcedures: 'uid, patientUid, status',
      undo_records: '++id, deletedAt',
    });
  }

  async clearAllData() {
    await Promise.all([
      this.users.clear(),
      this.patients.clear(),
      this.departments.clear(),
      this.prescriptions.clear(),
      this.surgeries.clear(),
      this.vitals.clear(),
      this.medicalHistory.clear(),
      this.dentalProcedures.clear(),
      this.undo_records.clear(),
    ]);
  }
}

export const localDB = new JDocDexie();