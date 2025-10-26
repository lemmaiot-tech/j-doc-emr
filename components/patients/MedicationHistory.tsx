import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import { Medication, Role } from '../../types';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import Textarea from '../ui/Textarea';

interface MedicationHistoryProps {
  patientUid: string;
}

const MedicationHistory: React.FC<MedicationHistoryProps> = ({ patientUid }) => {
  const { userProfile } = useAuth();
  
  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const medicationHistory = useLiveQuery(
    () => localDB.medications.where('patientUid').equals(patientUid).reverse().sortBy('startDate'),
    [patientUid],
    []
  );

  const users = useLiveQuery(() => localDB.users.toArray(), []);
  const userMap = useMemo(() => {
    if (!users) return new Map();
    return new Map(users.map(u => [u.uid, u.displayName]));
  }, [users]);

  const canAddMedication = userProfile && [Role.Doctor, Role.Nurse].includes(userProfile.role);

  const clearForm = () => {
    setDrugName('');
    setDosage('');
    setFrequency('');
    setStartDate('');
    setEndDate('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drugName || !dosage || !frequency || !startDate || !userProfile) {
      setError('Drug Name, Dosage, Frequency, and Start Date are required.');
      return;
    }
    setLoading(true);
    setError('');

    const newMedication: Medication = {
      uid: `med_${Date.now()}`,
      patientUid,
      drugName,
      dosage,
      frequency,
      startDate,
      endDate: endDate || undefined,
      notes: notes || undefined,
      prescribedBy: userProfile.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
    };

    try {
      await localDB.medications.put(newMedication);
      clearForm();
    } catch (err) {
      console.error("Failed to save medication:", err);
      setError('Failed to save medication record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Medication History">
      {canAddMedication && (
        <form onSubmit={handleSubmit} className="mb-6 border-b pb-6 dark:border-gray-700">
          <h4 className="text-md font-semibold mb-4 text-gray-700 dark:text-gray-300">Add New Medication</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Drug Name" value={drugName} onChange={(e) => setDrugName(e.target.value)} required />
            <Input label="Dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g., 500mg" required />
            <Input label="Frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g., Twice daily" required />
            <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            <Input label="End Date (Optional)" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <div className="sm:col-span-2">
              <Textarea label="Notes (Optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Add Medication'}
            </Button>
          </div>
        </form>
      )}

      <div>
        <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">History</h4>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {medicationHistory && medicationHistory.length > 0 ? (
            medicationHistory.map(med => (
              <div key={med.uid} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md text-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-800 dark:text-gray-200">{med.drugName}</p>
                    <p className="text-gray-600 dark:text-gray-300">{med.dosage}, {med.frequency}</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(med.startDate).toLocaleDateString()} - {med.endDate ? new Date(med.endDate).toLocaleDateString() : 'Present'}
                  </p>
                </div>
                {med.notes && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{med.notes}</p>}
                <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Prescribed by: {userMap.get(med.prescribedBy) || 'Unknown'} on {med.createdAt.toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No medication history recorded.</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MedicationHistory;
