import Dexie, { Table } from 'dexie';
import { 
    UserProfile, 
    Patient, 
    Department,
    Prescription,
    SurgicalProcedure,
    VitalSign,
    MedicalHistoryRecord,
    DepartmentNote,
    DentalProcedure,
    UndoRecord,
    DeletionMarker,
    AuditLog,
    LaboratoryResult,
    OAndGHistory,
    PaediatricHistory,
    Medication
} from '../types';

// This file defines the local database using Dexie.js.
// It sets up all the tables, their schemas, and indexes needed for offline functionality.

export class LocalDB extends Dexie {
  // Define tables
  users!: Table<UserProfile, string>;
  patients!: Table<Patient, string>;
  departments!: Table<Department, string>;
  prescriptions!: Table<Prescription, string>;
  surgeries!: Table<SurgicalProcedure, string>;
  vitals!: Table<VitalSign, string>;
  medicalHistory!: Table<MedicalHistoryRecord, string>;
  departmentNotes!: Table<DepartmentNote, string>;
  dentalProcedures!: Table<DentalProcedure, string>;
  laboratoryResults!: Table<LaboratoryResult, string>;
  oAndGHistory!: Table<OAndGHistory, string>;
  paediatricHistory!: Table<PaediatricHistory, string>;
  medications!: Table<Medication, string>;

  // Internal tables for sync and undo functionality
  undo_records!: Table<UndoRecord, number>;
  deletions_queue!: Table<DeletionMarker, number>;
  audit_logs!: Table<AuditLog, number>;

  constructor() {
    super('JDocEMR-DB');
    // FIX: Explicitly cast 'this' to Dexie to resolve type inference issue
    // where TypeScript fails to recognize inherited methods like 'version'.
    (this as Dexie).version(4).stores({
      // Schema definition
      // 'uid' is the primary key for most tables.
      // '++id' is an auto-incrementing primary key.
      // Other fields are indexes for faster queries.
      users: 'uid, email, role, syncStatus',
      patients: 'uid, lastName, firstName, syncStatus',
      departments: 'id, syncStatus',
      prescriptions: 'uid, patientUid, status, syncStatus, createdAt',
      surgeries: 'uid, patientUid, status, syncStatus, createdAt',
      vitals: 'uid, patientUid, syncStatus, createdAt',
      medicalHistory: 'uid, patientUid, syncStatus, date',
      departmentNotes: 'uid, patientUid, departmentId, syncStatus, createdAt',
      dentalProcedures: 'uid, patientUid, status, syncStatus, createdAt',
      laboratoryResults: 'uid, patientUid, syncStatus, createdAt',
      oAndGHistory: 'uid, patientUid, syncStatus, createdAt',
      paediatricHistory: 'uid, patientUid, syncStatus, createdAt',
      medications: 'uid, patientUid, syncStatus, startDate',
      
      // Internal tables
      undo_records: '++id',
      deletions_queue: '++id, collectionName, docId, syncStatus',
      audit_logs: '++id, uid, timestamp, userUid, action, syncStatus',
    });

    // Version 5: Add multi-entry indexes for department assignments to support dashboard queries.
    (this as Dexie).version(5).stores({
        users: 'uid, email, role, syncStatus, *departments',
        patients: 'uid, lastName, firstName, syncStatus, *assignedDepartments'
    });
  }
  
  // Method to clear all data, typically used on logout
  async clearAllData() {
    // FIX: Explicitly cast 'this' to Dexie to resolve type inference issue
    // where TypeScript fails to recognize inherited properties like 'tables'.
    await Promise.all((this as Dexie).tables.map(table => table.clear()));
  }
}

// Instantiate the database
export const localDB = new LocalDB();