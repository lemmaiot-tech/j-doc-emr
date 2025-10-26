import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import { MedicalHistoryRecord, Role } from '../../types';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import Select from '../../components/ui/Select';

interface MedicalHistoryProps {
  patientUid: string;
}

const MedicalHistory: React.FC<MedicalHistoryProps> = ({ patientUid }) => {
  const { userProfile } = useAuth();
  const departments = useLiveQuery(() => localDB.departments.toArray(), []);

  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const history = useLiveQuery(
    () => localDB.medicalHistory.where('patientUid').equals(patientUid).reverse().sortBy('date'),
    [patientUid],
    []
  );

  const canAddNote = userProfile && [
    Role.Doctor, Role.Surgeon, Role.Dentist, Role.Physiotherapist
  ].includes(userProfile.role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis || !speciality || !userProfile) {
      setError('Diagnosis and speciality are required.');
      return;
    }
    setLoading(true);
    setError('');

    const newRecord: MedicalHistoryRecord = {
      uid: `mh_${Date.now()}`,
      patientUid,
      date: new Date().toISOString(),
      speciality,
      diagnosis,
      notes,
      recordedBy: userProfile.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
    };

    try {
      await localDB.medicalHistory.put(newRecord);
      // Reset form
      setDiagnosis('');
      setNotes('');
      setSpeciality('');
    } catch (err) {
      console.error("Failed to save medical record:", err);
      setError('Failed to save record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Clinical Notes & History">
      {canAddNote && (
        <form onSubmit={handleSubmit} className="mb-6 border-b pb-6 dark:border-gray-700">
          <h4 className="text-md font-semibold mb-4 text-gray-700 dark:text-gray-300">Add New Clinical Note</h4>
          <div className="space-y-4">
             <Select
                label="Speciality/Department"
                value={speciality}
                onChange={(e) => setSpeciality(e.target.value)}
                required
            >
                <option value="" disabled>Select a department</option>
                {departments?.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                ))}
            </Select>
            <Input
              label="Diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              required
            />
            <Textarea
              label="Notes (SOAP, etc.)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
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
          {history && history.length > 0 ? (
            history.map(record => (
              <div key={record.uid} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-gray-800 dark:text-gray-200">{record.diagnosis}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{record.speciality}</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(record.date).toLocaleDateString()}</p>
                </div>
                {record.notes && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{record.notes}</p>}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No clinical history recorded.</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MedicalHistory;
