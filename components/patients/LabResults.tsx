import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import { LaboratoryResult, Role } from '../../types';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';

interface LabResultsProps {
  patientUid: string;
}

const LabResults: React.FC<LabResultsProps> = ({ patientUid }) => {
  const { userProfile } = useAuth();
  
  const [fastingBloodSugar, setFastingBloodSugar] = useState('');
  const [hepatitisB, setHepatitisB] = useState<'Negative' | 'Positive' | ''>('');
  const [rvs, setRvs] = useState<'Negative' | 'Positive' | ''>('');
  const [urinalysis, setUrinalysis] = useState('');
  const [others, setOthers] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const labHistory = useLiveQuery(
    () => localDB.laboratoryResults.where('patientUid').equals(patientUid).reverse().sortBy('createdAt'),
    [patientUid],
    []
  );

  const users = useLiveQuery(() => localDB.users.toArray(), []);
  const userMap = useMemo(() => {
    if (!users) return new Map();
    return new Map(users.map(u => [u.uid, u.displayName]));
  }, [users]);


  const canAddResult = userProfile && [Role.Doctor, Role.LabTechnician, Role.Nurse].includes(userProfile.role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      setError('You must be logged in to record results.');
      return;
    }
    if (!fastingBloodSugar && !hepatitisB && !rvs && !urinalysis && !others) {
        setError('At least one result field must be filled.');
        return;
    }

    setLoading(true);
    setError('');

    const newRecord: LaboratoryResult = {
      uid: `lab_${Date.now()}`,
      patientUid,
      fastingBloodSugar: fastingBloodSugar || undefined,
      hepatitisB: hepatitisB || undefined,
      rvs: rvs || undefined,
      urinalysis: urinalysis || undefined,
      others: others || undefined,
      recordedBy: userProfile.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
    };

    try {
      await localDB.laboratoryResults.put(newRecord);
      // Reset form
      setFastingBloodSugar('');
      setHepatitisB('');
      setRvs('');
      setUrinalysis('');
      setOthers('');

    } catch (err) {
      console.error("Failed to save lab result:", err);
      setError('Failed to save result.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Laboratory Results">
      {canAddResult && (
        <form onSubmit={handleSubmit} className="mb-6 border-b pb-6 dark:border-gray-700">
          <h4 className="text-md font-semibold mb-4 text-gray-700 dark:text-gray-300">Add New Lab Result</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fasting Blood Sugar"
              value={fastingBloodSugar}
              onChange={(e) => setFastingBloodSugar(e.target.value)}
            />
            <Select label="Hepatitis B" value={hepatitisB} onChange={(e) => setHepatitisB(e.target.value as any)}>
                <option value="">Select Result</option>
                <option value="Negative">Negative</option>
                <option value="Positive">Positive</option>
            </Select>
            <Select label="RVS" value={rvs} onChange={(e) => setRvs(e.target.value as any)}>
                <option value="">Select Result</option>
                <option value="Negative">Negative</option>
                <option value="Positive">Positive</option>
            </Select>
            <Input
              label="Urinalysis"
              value={urinalysis}
              onChange={(e) => setUrinalysis(e.target.value)}
            />
            <div className="sm:col-span-2">
                <Textarea
                    label="Others"
                    value={others}
                    onChange={(e) => setOthers(e.target.value)}
                    rows={3}
                />
            </div>
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Result'}
            </Button>
          </div>
        </form>
      )}

      <div>
        <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">History</h4>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {labHistory && labHistory.length > 0 ? (
            labHistory.map(record => (
              <div key={record.uid} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md text-sm">
                <div className="grid grid-cols-2 gap-2">
                    {record.fastingBloodSugar && <div><span className="font-semibold text-gray-600 dark:text-gray-300">FBS:</span> {record.fastingBloodSugar}</div>}
                    {record.hepatitisB && <div><span className="font-semibold text-gray-600 dark:text-gray-300">Hep B:</span> {record.hepatitisB}</div>}
                    {record.rvs && <div><span className="font-semibold text-gray-600 dark:text-gray-300">RVS:</span> {record.rvs}</div>}
                    {record.urinalysis && <div><span className="font-semibold text-gray-600 dark:text-gray-300">Urinalysis:</span> {record.urinalysis}</div>}
                </div>
                {record.others && <div className="mt-2"><div className="font-semibold text-gray-600 dark:text-gray-300">Others:</div><p className="whitespace-pre-wrap">{record.others}</p></div>}
                <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-2">
                  - {userMap.get(record.recordedBy) || 'Unknown User'} on {record.createdAt.toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No lab results recorded.</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default LabResults;