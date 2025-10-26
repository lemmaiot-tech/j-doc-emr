import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import { OAndGHistory, Role } from '../../types';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import Textarea from '../ui/Textarea';

interface OgHistoryProps {
  patientUid: string;
}

const OgHistory: React.FC<OgHistoryProps> = ({ patientUid }) => {
  const { userProfile } = useAuth();
  
  const [formState, setFormState] = useState<Partial<OAndGHistory>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const history = useLiveQuery(
    () => localDB.oAndGHistory.where('patientUid').equals(patientUid).reverse().sortBy('createdAt'),
    [patientUid],
    []
  );

  const users = useLiveQuery(() => localDB.users.toArray(), []);
  const userMap = useMemo(() => {
    if (!users) return new Map();
    return new Map(users.map(u => [u.uid, u.displayName]));
  }, [users]);


  const canAddNote = userProfile && [Role.Doctor, Role.Nurse].includes(userProfile.role);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.clinicalFinding?.trim() || !userProfile) {
      setError('Clinical Finding is required.');
      return;
    }
    setLoading(true);
    setError('');

    const newRecord: OAndGHistory = {
      uid: `og_${Date.now()}`,
      patientUid,
      ...formState,
      clinicalFinding: formState.clinicalFinding, // Ensure it's not partial
      recordedBy: userProfile.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
    };

    try {
      await localDB.oAndGHistory.put(newRecord);
      setFormState({}); // Reset form
    } catch (err) {
      console.error("Failed to save O&G record:", err);
      setError('Failed to save record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Obstetrics & Gynaecology History">
      {canAddNote && (
        <form onSubmit={handleSubmit} className="mb-6 border-b pb-6 dark:border-gray-700">
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-semibold mb-4 text-gray-700 dark:text-gray-300">Patient History</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Input label="LMNP" name="lmnp" value={formState.lmnp || ''} onChange={handleInputChange} />
                  <Input label="Ketamania" name="ketamania" value={formState.ketamania || ''} onChange={handleInputChange} />
                  <Input label="Menarche" name="menarche" value={formState.menarche || ''} onChange={handleInputChange} />
                  <Input label="Coitarche" name="coitarche" value={formState.coitarche || ''} onChange={handleInputChange} />
                  <Input label="Dysmenorrhea" name="dysmenorrhea" value={formState.dysmenorrhea || ''} onChange={handleInputChange} />
                  <Input label="Menorrhagia" name="menorrhagia" value={formState.menorrhagia || ''} onChange={handleInputChange} />
                  <Input label="Vaginal Discharge" name="vaginalDischarge" value={formState.vaginalDischarge || ''} onChange={handleInputChange} />
                  <Input label="Family Planning" name="familyPlanning" value={formState.familyPlanning || ''} onChange={handleInputChange} />
                  <Input label="Parity" name="parity" value={formState.parity || ''} onChange={handleInputChange} />
                  <Input label="Last Confinement" name="lastConfinement" value={formState.lastConfinement || ''} onChange={handleInputChange} />
              </div>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4 text-gray-700 dark:text-gray-300">Clinical Note</h4>
              <div className="space-y-4">
                  <Textarea label="Clinical Finding" name="clinicalFinding" value={formState.clinicalFinding || ''} onChange={handleInputChange} rows={4} required />
                  <Input label="Diagnosis" name="diagnosis" value={formState.diagnosis || ''} onChange={handleInputChange} />
                  <Textarea label="Management" name="management" value={formState.management || ''} onChange={handleInputChange} rows={3} />
                  <Textarea label="Drug Prescription" name="drugPrescription" value={formState.drugPrescription || ''} onChange={handleInputChange} rows={3} />
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Record'}
            </Button>
          </div>
        </form>
      )}

      <div>
        <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">History</h4>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {history && history.length > 0 ? (
            history.map(record => (
              <div key={record.uid} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md text-sm">
                <div className="font-bold text-gray-800 dark:text-gray-200">Record from {record.createdAt.toLocaleDateString()}</div>
                
                <div className="mt-2 pl-2 border-l-2 border-gray-200 dark:border-gray-600">
                    <div className="font-semibold text-gray-600 dark:text-gray-300">Clinical Finding:</div>
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-2">{record.clinicalFinding}</p>
                </div>
                
                <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-2">
                  - {userMap.get(record.recordedBy) || 'Unknown User'}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No O&G records found.</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default OgHistory;