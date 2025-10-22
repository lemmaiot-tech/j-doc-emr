import Dexie, { Table } from 'dexie';
import { UserProfile, Patient, Department, Prescription, SurgicalProcedure, VitalSign, MedicalHistoryEntry, DentalProcedure, UndoRecord } from '../types';

export class JDocDexie extends Dexie {
  users!: Table<UserProfile, string>; // PK is uid (string)
  patients!: Table<Patient, number>; // PK is auto-incrementing id
  departments!: Table<Department, string>; // PK is id (string)
  prescriptions!: Table<Prescription, number>; // PK is auto-incrementing id
  surgeries!: Table<SurgicalProcedure, number>; // PK is auto-incrementing id
  vitals!: Table<VitalSign, number>; // PK is auto-incrementing id
  medicalHistory!: Table<MedicalHistoryEntry, number>; // PK is auto-incrementing id
  dentalProcedures!: Table<DentalProcedure, number>; // PK is auto-incrementing id
  undo_records!: Table<UndoRecord, number>; // PK is auto-incrementing id

  constructor() {
    super('jdoc_emr_db');
    // Bump schema version to 4 to add the undo_records table.
    // Dexie will handle the migration automatically for existing databases.
    (this as Dexie).version(4).stores({
      users: 'uid, email, role',
      patients: '++id, &uid, lastName, firstName',
      departments: 'id, name',
      prescriptions: '++id, &uid, patientUid, status',
      surgeries: '++id, &uid, patientUid, status',
      vitals: '++id, &uid, patientUid, createdAt',
      medicalHistory: '++id, &uid, patientUid, date',
      dentalProcedures: '++id, &uid, patientUid, status',
      undo_records: '++id, deletedAt',
    });
  }
}

export const localDB = new JDocDexie();