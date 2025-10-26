import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import { DepartmentNote, Role } from '../../types';
import Card from '../ui/Card';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../ui/Input';

interface DepartmentNotesSectionProps {
  patientUid: string;
  departmentId: string;
}

const DepartmentNotesSection: React.FC<DepartmentNotesSectionProps> = ({ patientUid, departmentId }) => {
  const { userProfile } = useAuth();
  
  const [clinicalFinding, setClinicalFinding] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [management, setManagement] = useState('');
  const [drugPrescription, setDrugPrescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const department = useLiveQuery(
    () => localDB.departments.get(departmentId),
    [departmentId]
  );
  
  const departmentHistory = useLiveQuery(
    () => localDB.departmentNotes
      .where({ patientUid, departmentId })
      .reverse()
      .sortBy('createdAt'),
    [patientUid, departmentId],
    []
  );

  const users = useLiveQuery(() => localDB.users.toArray(), []);
  const userMap = useMemo(() => {
    if (!users) return new Map();
    return new Map(users.map(u => [u.uid, u.displayName]));
  }, [users]);

  const canAddNote = userProfile && [Role.Doctor, Role.Surgeon, Role.Dentist, Role.Physiotherapist, Role.Nurse].includes(userProfile.role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicalFinding.trim() || !userProfile) {
      setError('Clinical Finding content cannot be empty.');
      return;
    }
    setLoading(true);
    setError('');

    const newRecord: DepartmentNote = {
      uid: `dnote_${Date.now()}`,
      patientUid,
      departmentId,
      clinicalFinding,
      diagnosis,
      management,
      drugPrescription,
      recordedBy: userProfile.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
    };

    try {
      await localDB.departmentNotes.put(newRecord);
      // Reset form
      setClinicalFinding('');
      setDiagnosis('');
      setManagement('');
      setDrugPrescription('');
    } catch (err) {
      console.error("Failed to save department note:", err);
      setError('Failed to save note.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={`${department?.name || 'Department'} Notes`}>
      {canAddNote && (
        <form onSubmit={handleSubmit} className="mb-6 border-b pb-6 dark:border-gray-700">
          <div className="space-y-4">
             <Textarea
              label="Clinical Finding"
              value={clinicalFinding}
              onChange={(e) => setClinicalFinding(e.target.value)}
              rows={4}
              required
            />
            <Input
              label="Diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
             <Textarea
              label="Management"
              value={management}
              onChange={(e) => setManagement(e.target.value)}
              rows={3}
            />
            <Textarea
              label="Drugs Prescription"
              value={drugPrescription}
              onChange={(e) => setDrugPrescription(e.target.value)}
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Note'}
            </Button>
          </div>
        </form>
      )}

      <div>
        <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">History</h4>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {departmentHistory && departmentHistory.length > 0 ? (
            departmentHistory.map(record => (
              <div key={record.uid} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md text-sm">
                <div className="font-semibold text-gray-600 dark:text-gray-300">Clinical Finding:</div>
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-2">{record.clinicalFinding}</p>
                
                {record.diagnosis && <>
                    <div className="font-semibold text-gray-600 dark:text-gray-300">Diagnosis:</div>
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-2">{record.diagnosis}</p>
                </>}
                 {record.management && <>
                    <div className="font-semibold text-gray-600 dark:text-gray-300">Management:</div>
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-2">{record.management}</p>
                </>}
                 {record.drugPrescription && <>
                    <div className="font-semibold text-gray-600 dark:text-gray-300">Prescription:</div>
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-2">{record.drugPrescription}</p>
                </>}

                <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-2">
                  - {userMap.get(record.recordedBy) || 'Unknown User'} on {record.createdAt.toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No notes for this department yet.</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DepartmentNotesSection;