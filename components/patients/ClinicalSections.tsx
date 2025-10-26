import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
// FIX: Imported Department type for useMemo explicit typing.
import { Patient, DepartmentId, Department } from '../../types';
import VitalSigns from '../../pages/patients/VitalSigns';
import MedicalHistory from '../../pages/patients/MedicalHistory';
import DepartmentNotesSection from './DepartmentNotesSection';
import LaboratoryResults from './LabResults';
import OAndGHistory from './OgHistory';
import PaediatricHistorySection from './PaediatricHistory';
import MedicationHistory from './MedicationHistory';


// The tab key can now be any string, allowing for dynamic department IDs
export type TabKey = string;

interface ClinicalSectionsProps {
  patient: Patient;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}


const ClinicalSections: React.FC<ClinicalSectionsProps> = ({ patient, activeTab, setActiveTab }) => {
  const allDepartments = useLiveQuery(() => localDB.departments.toArray(), []);

  // FIX: Explicitly typed `departmentMap` to resolve type inference issue.
  const departmentMap = React.useMemo<Map<string, Department>>(() => {
    if (!allDepartments) return new Map();
    return new Map(allDepartments.map(d => [d.id, d]));
  }, [allDepartments]);
  
  const getDepartmentComponent = (deptId: string): React.ReactNode => {
    switch (deptId) {
        case DepartmentId.Laboratory:
            return <LaboratoryResults patientUid={patient.uid} />;
        case DepartmentId.OAndG:
            return <OAndGHistory patientUid={patient.uid} />;
        case DepartmentId.Paediatrics:
            return <PaediatricHistorySection patientUid={patient.uid} />;
        case DepartmentId.Surgery:
        case DepartmentId.Dental:
        case DepartmentId.Physiotherapy:
        case DepartmentId.EyeENT:
        case DepartmentId.GeneralConsultation:
            return <DepartmentNotesSection patientUid={patient.uid} departmentId={deptId} />;
        default:
            // Generic fallback for any other/new department
            return <DepartmentNotesSection patientUid={patient.uid} departmentId={deptId} />;
    }
  };


  const assignedDepts = patient.assignedDepartments || [];

  const staticTabs = [
    { key: 'vitals', label: 'Vital Signs', component: <VitalSigns patientUid={patient.uid} /> },
    { key: 'diagnoses', label: 'Diagnoses & Notes', component: <MedicalHistory patientUid={patient.uid} /> },
    { key: 'medications', label: 'Medications', component: <MedicationHistory patientUid={patient.uid} /> },
  ];

  const dynamicTabs = assignedDepts
    .map(deptId => {
      const dept = departmentMap.get(deptId);
      if (!dept) return null;
      return {
        key: dept.id,
        label: dept.name,
        component: getDepartmentComponent(dept.id)
      };
    })
    .filter((tab): tab is { key: string; label: string; component: React.ReactNode } => tab !== null);

  const availableTabs = [...staticTabs, ...dynamicTabs];
  
  // If the currently active tab is for a department that the patient is no longer assigned to,
  // default back to the first available tab.
  React.useEffect(() => {
    const isCurrentTabAvailable = availableTabs.some(tab => tab.key === activeTab);
    if (!isCurrentTabAvailable && availableTabs.length > 0) {
      setActiveTab(availableTabs[0].key);
    }
  }, [availableTabs, activeTab, setActiveTab]);


  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="px-4 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
          {availableTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.key
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                }`
              }
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-4">
        {availableTabs.map(tab => (
            <div key={tab.key} style={{ display: activeTab === tab.key ? 'block' : 'none' }}>
                {tab.component}
            </div>
        ))}
      </div>
    </div>
  );
};

export default ClinicalSections;