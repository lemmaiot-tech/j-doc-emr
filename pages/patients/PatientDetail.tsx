import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import NotFound from '../NotFound';
import VitalSigns from './VitalSigns';
import MedicalHistory from './MedicalHistory';

const PatientDetail: React.FC = () => {
  const { patientUid } = useParams<{ patientUid: string }>();

  const patient = useLiveQuery(
    () => (patientUid ? localDB.patients.where('uid').equals(patientUid).first() : undefined),
    [patientUid]
  );

  const isLoading = patient === undefined && patientUid;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div>
      </div>
    );
  }

  if (!patient) {
    return <NotFound />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {patient.firstName} {patient.lastName}
        </h1>
        <Link to="/patients">
            <Button variant="secondary">Back to Patient List</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Personal Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 dark:border-gray-700">Personal Information</h3>
                    <div className="text-sm">
                        <p className="font-medium text-gray-500 dark:text-gray-400">Patient ID</p>
                        <p className="font-mono">{patient.uid}</p>
                    </div>
                    <div className="text-sm">
                        <p className="font-medium text-gray-500 dark:text-gray-400">Date of Birth</p>
                        <p>{patient.dateOfBirth}</p>
                    </div>
                    <div className="text-sm">
                        <p className="font-medium text-gray-500 dark:text-gray-400">Gender</p>
                        <p>{patient.gender}</p>
                    </div>
                    <div className="text-sm">
                        <p className="font-medium text-gray-500 dark:text-gray-400">Phone Number</p>
                        <p>{patient.phoneNumber || 'N/A'}</p>
                    </div>
                     <div className="text-sm">
                        <p className="font-medium text-gray-500 dark:text-gray-400">Address</p>
                        <p className="whitespace-pre-wrap">{patient.address || 'N/A'}</p>
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 dark:border-gray-700">Emergency Contact</h3>
                    <div className="text-sm">
                        <p className="font-medium text-gray-500 dark:text-gray-400">Name</p>
                        <p>{patient.emergencyContactName || 'N/A'}</p>
                    </div>
                    <div className="text-sm">
                        <p className="font-medium text-gray-500 dark:text-gray-400">Phone Number</p>
                        <p>{patient.emergencyContactPhone || 'N/A'}</p>
                    </div>
                </div>

                {/* System Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 dark:border-gray-700">System Information</h3>
                    <div className="text-sm">
                        <p className="font-medium text-gray-500 dark:text-gray-400">Record Created</p>
                        <p>{patient.createdAt.toLocaleString()}</p>
                    </div>
                    <div className="text-sm">
                        <p className="font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
                        <p>{patient.updatedAt.toLocaleString()}</p>
                    </div>
                    <div className="text-sm">
                        <p className="font-medium text-gray-500 dark:text-gray-400">Sync Status</p>
                        <p>
                            {patient.syncStatus === 'synced' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Synced</span>
                            ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VitalSigns patientUid={patient.uid} />
        <MedicalHistory patientUid={patient.uid} />
      </div>

    </div>
  );
};

export default PatientDetail;