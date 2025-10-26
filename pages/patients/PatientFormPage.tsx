import React from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import PatientForm from './PatientForm';

const PatientFormPage: React.FC = () => {
    const { patientUid } = useParams<{ patientUid?: string }>();
    
    // Fetch patient data only if in edit mode (patientUid exists)
    const patientToEdit = useLiveQuery(
        () => patientUid ? localDB.patients.get(patientUid) : undefined,
        [patientUid]
    );

    // Show a loading state while fetching the patient for editing
    if (patientUid && patientToEdit === undefined) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <PatientForm patientToEdit={patientToEdit} />
        </div>
    );
};

export default PatientFormPage;
