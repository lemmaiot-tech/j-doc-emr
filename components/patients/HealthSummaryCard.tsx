import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import Card from '../ui/Card';

interface HealthSummaryCardProps {
  patientUid: string;
}

const HealthSummaryCard: React.FC<HealthSummaryCardProps> = ({ patientUid }) => {
  const latestVital = useLiveQuery(
    () => localDB.vitals.where('patientUid').equals(patientUid).reverse().sortBy('createdAt'),
    [patientUid]
  )?.[0];

  const latestDiagnosis = useLiveQuery(
    () => localDB.medicalHistory.where('patientUid').equals(patientUid).reverse().sortBy('date'),
    [patientUid]
  )?.[0];

  return (
    <Card title="Health Summary" className="h-full">
        <div className="space-y-6">
            {/* Latest Vitals Section */}
            <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Latest Vitals</h4>
                {latestVital ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                            <p className="font-medium text-gray-500 dark:text-gray-400">BP</p>
                            <p>{latestVital.bloodPressure}</p>
                        </div>
                         <div>
                            <p className="font-medium text-gray-500 dark:text-gray-400">Heart Rate</p>
                            <p>{latestVital.heartRate ? `${latestVital.heartRate} bpm` : 'N/A'}</p>
                        </div>
                         <div>
                            <p className="font-medium text-gray-500 dark:text-gray-400">Temp</p>
                            <p>{latestVital.temperature ? `${latestVital.temperature}°C` : 'N/A'}</p>
                        </div>
                         <div>
                            <p className="font-medium text-gray-500 dark:text-gray-400">BMI</p>
                            <p>{latestVital.bmi ?? 'N/A'}</p>
                        </div>
                        <div className="col-span-2 text-xs text-gray-400 pt-1">
                            Recorded on {latestVital.createdAt.toLocaleDateString()}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No vital signs have been recorded yet.</p>
                )}
            </div>

            <hr className="dark:border-gray-700" />
            
            {/* Latest Diagnosis Section */}
            <div>
                 <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Latest Diagnosis</h4>
                {latestDiagnosis ? (
                     <div className="space-y-2 text-sm">
                        <div>
                            <p className="font-medium text-gray-500 dark:text-gray-400">Diagnosis</p>
                            <p className="font-semibold text-primary-700 dark:text-primary-400">{latestDiagnosis.diagnosis}</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-500 dark:text-gray-400">Speciality</p>
                            <p>{latestDiagnosis.speciality}</p>
                        </div>
                        <div className="text-xs text-gray-400 pt-1">
                            Recorded on {new Date(latestDiagnosis.date).toLocaleDateString()}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No clinical notes or diagnoses found.</p>
                )}
            </div>
        </div>
    </Card>
  );
};

export default HealthSummaryCard;
