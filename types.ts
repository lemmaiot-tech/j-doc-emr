export enum Role {
  Admin = 'Admin',
  Doctor = 'Doctor',
  Nurse = 'Nurse',
  Pharmacist = 'Pharmacist',
  LabTechnician = 'Lab Technician',
  Surgeon = 'Surgeon',
  Dentist = 'Dentist',
  Physiotherapist = 'Physiotherapist',
}

export enum DepartmentId {
  Pharmacy = 'pharmacy',
  Surgery = 'surgery',
  Dental = 'dental',
  Laboratory = 'laboratory',
  Physiotherapy = 'physiotherapy',
  Nursing = 'nursing',
}

export interface Department {
  id: string; // Corresponds to DepartmentId, but can be custom
  name: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  departments: string[]; // array of department ids
}

export interface Patient {
  id?: number;
  uid: string; // Unique patient identifier
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  phoneNumber: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'synced' | 'pending';
}

export enum PrescriptionStatus {
  Pending = 'Pending',
  Dispensed = 'Dispensed',
  NotAvailable = 'Not Available',
}

export interface Prescription {
  id?: number;
  uid: string;
  patientUid: string;
  drug: string;
  dosage: string;
  notes: string;
  prescribedBy: string; // User UID
  status: PrescriptionStatus;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'synced' | 'pending';
}

export enum SurgeryStatus {
  Scheduled = 'Scheduled',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export interface SurgicalProcedure {
  id?: number;
  uid: string;
  patientUid: string;
  procedureName: string;
  surgeonUid: string; // User UID
  status: SurgeryStatus;
  consentSigned: boolean;
  consentSignature?: string; // base64 data URL of signature
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'synced' | 'pending';
}

export interface VitalSign {
  id?: number;
  uid: string; // Unique vital sign record identifier
  patientUid: string;
  bloodPressure: string; // e.g., "120/80"
  heartRate: number; // beats per minute
  temperature: number; // Celsius
  respiratoryRate: number; // breaths per minute
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'synced' | 'pending';
}

export enum MedicalHistoryType {
  Illness = 'Illness',
  Surgery = 'Surgery',
  Allergy = 'Allergy',
  Medication = 'Medication',
}

export interface MedicalHistoryEntry {
  id?: number;
  uid: string; // Unique entry identifier
  patientUid: string;
  date: string; // YYYY-MM-DD
  type: MedicalHistoryType;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'synced' | 'pending';
}

export enum DentalProcedureStatus {
    Scheduled = 'Scheduled',
    InProgress = 'In Progress',
    Completed = 'Completed',
    Cancelled = 'Cancelled',
}

export interface DentalProcedure {
    id?: number;
    uid: string;
    patientUid: string;
    procedureName: string;
    dentistUid: string; // User UID
    status: DentalProcedureStatus;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    syncStatus: 'synced' | 'pending';
}

// Defines the structure for a temporarily deleted record for the Undo feature
export interface UndoRecord {
  id?: number;
  tableName: string;
  recordData: any; // The full data of the deleted record
  deletedAt: Date;
}