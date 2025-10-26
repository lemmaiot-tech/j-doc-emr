
import { Department, DepartmentId, Role } from './types';

export const ALL_ROLES: Role[] = Object.values(Role);

export const INITIAL_DEPARTMENTS: Department[] = [
  // FIX: Updated department list as per user request.
  { id: DepartmentId.GeneralConsultation, name: 'General Consultation', syncStatus: 'synced' },
  { id: DepartmentId.Physiotherapy, name: 'Physiotherapy', syncStatus: 'synced' },
  { id: DepartmentId.EyeENT, name: 'Eye/ ENT', syncStatus: 'synced' },
  { id: DepartmentId.Surgery, name: 'Surgery', syncStatus: 'synced' },
  { id: DepartmentId.Laboratory, name: 'Laboratory', syncStatus: 'synced' },
  { id: DepartmentId.Dental, name: 'Dental', syncStatus: 'synced' },
  { id: DepartmentId.Paediatrics, name: 'Paediatrician', syncStatus: 'synced' },
  { id: DepartmentId.OAndG, name: 'O and G', syncStatus: 'synced' },
  { id: DepartmentId.Pharmacy, name: 'Pharmacy', syncStatus: 'synced' },
];
