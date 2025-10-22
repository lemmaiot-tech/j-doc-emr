
import { Department, DepartmentId, Role } from './types';

export const ALL_ROLES: Role[] = Object.values(Role);

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: DepartmentId.Pharmacy, name: 'Pharmacy' },
  { id: DepartmentId.Surgery, name: 'Surgery' },
  { id: DepartmentId.Dental, name: 'Dental' },
  { id: DepartmentId.Laboratory, name: 'Laboratory' },
  { id: DepartmentId.Physiotherapy, name: 'Physiotherapy' },
  { id: DepartmentId.Nursing, name: 'Nursing' },
];
