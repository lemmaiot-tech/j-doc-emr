import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Edit, Users, FileText, Stethoscope } from '../../components/icons/Icons';
import { Patient, Role, PatientStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import HealthSummaryCard from '../../components/patients/HealthSummaryCard';
import ClinicalSections, { TabKey } from '../../components/patients/ClinicalSections';
import { db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';
import DepartmentManager from '../../components/patients/DepartmentManager';

const PatientHeader: React.FC<{ 
    patient: { uid: string, firstName: string, lastName: string, status: PatientStatus, age?: number, gender: string }, 
    canEdit: boolean,
    canUpdateStatus: boolean,
    onStatusChange: (status: PatientStatus) => void
}> = ({ patient, canEdit, canUpdateStatus, onStatusChange }) => {
    const navigate = useNavigate();
    const getStatusColor = (status: PatientStatus) => {
        switch(status) {
            case PatientStatus.Active: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case PatientStatus.Inactive: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case PatientStatus.Deceased: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case PatientStatus.Archived: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };
    
    const statusSelectClasses = "text-xs font-semibold rounded-full border-none focus:ring-2 focus:ring-primary-500 transition";


    return (
        <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{patient.firstName} {patient.lastName}</h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>ID: <span className="font-mono">{patient.uid}</span></span>
                        <span>{patient.age ? `${patient.age} years old` : ''}</span>
                        <span>{patient.gender}</span>
                         {canUpdateStatus ? (
                             <select
                                value={patient.status}
                                onChange={(e) => onStatusChange(e.target.value as PatientStatus)}
                                className={`${getStatusColor(patient.status)} ${statusSelectClasses} appearance-none py-1 pl-2 pr-6`}
                            >
                                {Object.values(PatientStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                         ) : (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(patient.status)}`}>
                                {patient.status}
                            </span>
                         )}
                    </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button variant="secondary" onClick={() => navigate('/patients')}>Back to List</Button>
                    {canEdit && (
                        <Link to={`/patients/edit/${patient.uid}`}>
                            <Button>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Profile
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </Card>
    );
};

const PatientDetail: React.FC = () => {
  const { patientUid } = useParams<{ patientUid: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('vitals');
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  
  const patient = useLiveQuery(
    () => patientUid ? localDB.patients.get(patientUid) : undefined,
    [patientUid]
  );
  
  const allDepartments = useLiveQuery(() => localDB.departments.toArray(), []);

  const canEditPatient = userProfile && [Role.Admin, Role.RecordsClerk].includes(userProfile.role);
  const canUpdateStatus = userProfile && [Role.Admin, Role.Doctor].includes(userProfile.role);
  const canManageDepartments = userProfile && [Role.Admin, Role.Doctor].includes(userProfile.role);

  const handleStatusChange = async (newStatus: PatientStatus) => {
    if (!patient) return;

    const updatedPatient: Patient = { 
      ...patient, 
      status: newStatus, 
      updatedAt: new Date(), 
      syncStatus: 'pending' 
    };

    try {
        const patientDocRef = doc(db, 'patients', patient.uid);
        await updateDoc(patientDocRef, { status: newStatus, updatedAt: updatedPatient.updatedAt });
        updatedPatient.syncStatus = 'synced';
        console.log("Firestore updated successfully.");
    } catch (err) {
        console.warn("Could not update patient status in Firestore, will sync later.", err);
    } finally {
        await localDB.patients.put(updatedPatient);
    }
  };

  const handleSaveDepartments = async (selectedIds: string[]) => {
    if (!patient) return;

    const updatedPatient: Patient = {
        ...patient,
        assignedDepartments: selectedIds,
        updatedAt: new Date(),
        syncStatus: 'pending'
    };

    try {
      const patientDocRef = doc(db, 'patients', patient.uid);
      await updateDoc(patientDocRef, { assignedDepartments: selectedIds, updatedAt: updatedPatient.updatedAt });
      updatedPatient.syncStatus = 'synced';
    } catch (err) {
        console.warn("Could not update departments in Firestore, will sync later.", err);
    } finally {
        await localDB.patients.put(updatedPatient);
        setIsDeptModalOpen(false); // Close modal on success
    }
  };


  if (!patientUid) {
      return <div>No patient ID provided.</div>;
  }
  
  if (patient === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div>
      </div>
    );
  }

  if (patient === null) {
      return (
          <Card>
              <div className="text-center py-10">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Patient Not Found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">The patient with this ID could not be found.</p>
                <div className="mt-6">
                    <Button onClick={() => navigate('/patients')}>
                        Back to Patient List
                    </Button>
                </div>
            </div>
          </Card>
      );
  }

  return (
    <div className="space-y-6">
      <PatientHeader 
        patient={patient} 
        canEdit={canEditPatient} 
        canUpdateStatus={canUpdateStatus}
        onStatusChange={handleStatusChange}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
            <HealthSummaryCard patientUid={patient.uid} />

            <Card title="Assigned Departments">
                <div className="flex justify-between items-center">
                    <div className="flex flex-wrap gap-2 flex-grow">
                        {(patient.assignedDepartments && patient.assignedDepartments.length > 0) ? (
                            patient.assignedDepartments.map(deptId => {
                                const dept = allDepartments?.find(d => d.id === deptId);
                                return (
                                    <span key={deptId} className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full dark:bg-primary-900/50 dark:text-primary-300">
                                        {dept?.name || deptId}
                                    </span>
                                );
                            })
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">Not assigned to any department.</p>
                        )}
                    </div>
                    {canManageDepartments && (
                        <Button variant="ghost" size="sm" onClick={() => setIsDeptModalOpen(true)} className="ml-2 flex-shrink-0">
                            Manage
                        </Button>
                    )}
                </div>
            </Card>

            {userProfile?.role === Role.Doctor && (
              <Card title="Quick Actions">
                <div className="space-y-2">
                  <Button className="w-full justify-start pl-3" variant="ghost" onClick={() => setActiveTab('diagnoses')}>
                    <FileText className="w-4 h-4 mr-3"/>
                    Add Clinical Note
                  </Button>
                  <Button className="w-full justify-start pl-3" variant="ghost" onClick={() => setActiveTab('vitals')}>
                    <Stethoscope className="w-4 h-4 mr-3"/>
                    Record Vitals
                  </Button>
                </div>
              </Card>
            )}
        </div>
        <div className="lg:col-span-2">
            <ClinicalSections patient={patient} activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>

       {canManageDepartments && allDepartments && patient && (
        <DepartmentManager 
          isOpen={isDeptModalOpen}
          onClose={() => setIsDeptModalOpen(false)}
          onSave={handleSaveDepartments}
          patient={patient}
          allDepartments={allDepartments}
        />
      )}
    </div>
  );
};

export default PatientDetail;