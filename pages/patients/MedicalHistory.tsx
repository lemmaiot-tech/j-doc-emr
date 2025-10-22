import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import { MedicalHistoryEntry, MedicalHistoryType, Role } from '../../types';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

interface MedicalHistoryProps {
  patientUid: string;
}

const MedicalHistory: React.FC<MedicalHistoryProps> = ({ patientUid }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [type, setType] = useState<MedicalHistoryType>(MedicalHistoryType.Illness);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { userProfile } = useAuth();

  const history = useLiveQuery(
    () => localDB.medicalHistory.where('patientUid').equals(patientUid).reverse().sortBy('date'),
    [patientUid],
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !type || !description) {
      setError('Please fill all fields.');
      return;
    }
    setLoading(true);
    setError('');

    const newEntry: MedicalHistoryEntry = {
      uid: `medhist_${Date.now()}`,
      patientUid,
      date,
      type,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
    };

    try {
      await localDB.medicalHistory.add(newEntry);
      // Reset form
      setDescription('');
      setType(MedicalHistoryType.Illness);
      setDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error('Failed to save medical history entry:', err);
      setError('Failed to save entry.');
    } finally {
      setLoading(false);
    }
  };

  const canAddHistory = userProfile && [
    Role.Admin,
    Role.Doctor,
    Role.Surgeon,
    Role.Dentist,
  ].includes(userProfile.role);

  return (
    <Card title="Medical History">
      {/* Form for new entry */}
      {canAddHistory && (
        <form onSubmit={handleSubmit} className="mb-6 border-b pb-6 dark:border-gray-700">
          <h4 className="text-md font-semibold mb-4 text-gray-700 dark:text-gray-300">Add New Entry</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as MedicalHistoryType)}
              required
            >
              {Object.values(MedicalHistoryType).map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div className="mt-4">
              <Textarea
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
              />
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Add Entry'}
            </Button>
          </div>
        </form>
      )}

      {/* Historical Data */}
      <div>
        <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">History</h4>
        <div className="overflow-auto max-h-64">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase sticky top-0 bg-white dark:bg-gray-800">
              <tr>
                <th className="py-2 pr-2">Date</th>
                <th className="py-2 px-2">Type</th>
                <th className="py-2 pl-2">Description</th>
                <th className="py-2 pl-2">Sync Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {history?.map(entry => (
                <tr key={entry.id}>
                  <td className="py-2 pr-2 whitespace-nowrap">{entry.date}</td>
                  <td className="py-2 px-2">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300">
                        {entry.type}
                    </span>
                  </td>
                  <td className="py-2 pl-2 whitespace-pre-wrap">{entry.description}</td>
                  <td className="py-2 pl-2">
                    {entry.syncStatus === 'synced' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Synced</span>
                    ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
              {history && history.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">No medical history recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

export default MedicalHistory;