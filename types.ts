// This file defines the core data structures and types used throughout the application.

// Sync status for local records, indicating their state relative to the cloud database.
export type SyncStatus = 'synced' | 'pending' | 'error';

// Defines the user roles within the system.
export enum Role {
  Admin = 'Admin',
  Doctor = 'Doctor',
  Nurse = 'Nurse',
  Pharmacist = 'Pharmacist',
  LabTechnician = 'Lab Technician',
  Surgeon = 'Surgeon',
  Dentist = 'Dentist',
  Physiotherapist = 'Physiotherapist',
  RecordsClerk = 'Records Clerk',
}

// Unique identifiers for each clinical department.
export enum DepartmentId {
  GeneralConsultation = 'general_consultation',
  Physiotherapy = 'physiotherapy',
  EyeENT = 'eye_ent',
  Surgery = 'surgery',
  Laboratory = 'laboratory',
  Dental = 'dental',
  Paediatrics = 'paediatrics',
  OAndG = 'o_and_g',
  Pharmacy = 'pharmacy',
}

// Represents a clinical department.
export interface Department {
  id: DepartmentId | string; // Allow string for flexibility
  name: string;
  syncStatus: SyncStatus;
}

// Represents a user's profile and permissions.
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  departments: string[]; // Array of DepartmentId
  syncStatus: SyncStatus;
  fcmToken?: string; // For push notifications
}

// Represents the status of a patient.
export enum PatientStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Deceased = 'Deceased',
  Archived = 'Archived',
}

// Represents a patient's record.
export interface Patient {
  uid: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  age?: number;
  gender: 'Male' | 'Female' | 'Other';
  phoneNumber: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  assignedDepartments: string[];
  occupation?: string;
  religion?: string;
  tribe?: string;
  maritalStatus?: 'Single' | 'Married' | 'Widow/Widower' | 'Separated' | 'Divorced' | 'Other';
  status: PatientStatus;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
}

// Represents the status of a prescription.
export enum PrescriptionStatus {
  Pending = 'Pending',
  Dispensed = 'Dispensed',
  NotAvailable = 'Not Available',
}

// Represents a medication prescription.
export interface Prescription {
  uid: string;
  patientUid: string;
  drug: string;
  dosage: string;
  notes?: string;
  prescribedBy: string; // User UID
  status: PrescriptionStatus;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
}

// Represents the status of a surgical procedure.
export enum SurgeryStatus {
  Scheduled = 'Scheduled',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

// Represents a scheduled surgical procedure.
export interface SurgicalProcedure {
  uid: string;
  patientUid: string;
  procedureName: string;
  surgeonUid: string;
  status: SurgeryStatus;
  consentSigned: boolean;
  consentSignature?: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
}

// Represents a set of vital signs recorded for a patient.
export interface VitalSign {
  uid: string;
  patientUid: string;
  bloodPressure: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
}

// Represents a clinical note or diagnosis in a patient's medical history.
export interface MedicalHistoryRecord {
    uid: string;
    patientUid: string;
    date: string;
    speciality: string;
    diagnosis: string;
    notes?: string;
    recordedBy: string; // User UID
    createdAt: Date;
    updatedAt: Date;
    syncStatus: SyncStatus;
}

// Represents a department-specific clinical note for a patient.
// This is used for departments like Surgery, Dental, Physiotherapy, Eye/ENT.
export interface DepartmentNote {
  uid: string;
  patientUid: string;
  departmentId: string;
  clinicalFinding: string;
  diagnosis?: string;
  management?: string;
  drugPrescription?: string;
  recordedBy: string; // User UID
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
}

// Represents a laboratory result for a patient.
export interface LaboratoryResult {
  uid: string;
  patientUid: string;
  fastingBloodSugar?: string;
  hepatitisB?: 'Negative' | 'Positive';
  rvs?: 'Negative' | 'Positive';
  urinalysis?: string;
  others?: string;
  recordedBy: string; // User UID
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
}

// Represents an Obstetrics & Gynaecology record for a patient.
export interface OAndGHistory {
    uid: string;
    patientUid: string;
    // History
    lmnp?: string;
    ketamania?: string;
    menarche?: string;
    coitarche?: string;
    dysmenorrhea?: string;
    menorrhagia?: string;
    vaginalDischarge?: string;
    familyPlanning?: string;
    parity?: string;
    lastConfinement?: string;
    // Clinical Note part
    clinicalFinding: string;
    diagnosis?: string;
    management?: string;
    drugPrescription?: string;
    recordedBy: string; // User UID
    createdAt: Date;
    updatedAt: Date;
    syncStatus: SyncStatus;
}

// Represents a Paediatric record for a patient.
export interface PaediatricHistory {
    uid: string;
    patientUid: string;
    // History
    pregnancyBirthNeonatalHistory?: string;
    immunizationHistory?: string;
    nutritionalHistory?: string;
    developmentalMilestones?: string;
    familyAndSocialHistory?: string;
    drugAllergies?: string;
    pastMedicalHistory?: string;
    // Clinical Note part
    clinicalFinding: string;
    diagnosis?: string;
    management?: string;
    drugPrescription?: string;
    recordedBy: string; // User UID
    createdAt: Date;
    updatedAt: Date;
    syncStatus: SyncStatus;
}

// Represents a patient's medication record.
export interface Medication {
  uid: string;
  patientUid: string;
  drugName: string;
  dosage: string;
  frequency: string;
  startDate: string; // ISO Date string for simplicity with date inputs
  endDate?: string; // Optional
  notes?: string;
  prescribedBy: string; // User UID
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
}


// Represents the status of a dental procedure.
export enum DentalProcedureStatus {
    Scheduled = 'Scheduled',
    InProgress = 'In Progress',
    Completed = 'Completed',
    Cancelled = 'Cancelled',
}

// Represents a dental procedure.
export interface DentalProcedure {
    uid: string;
    patientUid: string;
    procedureName: string;
    dentistUid: string;
    status: DentalProcedureStatus;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    syncStatus: SyncStatus;
}

// Record for the undo functionality.
export interface UndoRecord {
  id?: number;
  tableName: string;
  recordData: any;
  deletedAt: Date;
}

// Marker for documents to be deleted from Firestore.
export interface DeletionMarker {
    id?: number;
    collectionName: string;
    docId: string;
    syncStatus: SyncStatus;
}

// Represents an entry in the audit log.
export interface AuditLog {
    id?: number; // Auto-incremented primary key for Dexie
    uid: string; // Unique ID for Firestore
    timestamp: Date;
    userUid: string;
    userDisplayName: string;
    action: string;
    details: string;
    syncStatus: SyncStatus;
}

// Defines the structure for a notification.
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}