import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import { PaediatricHistory, Role } from '../../types';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import Textarea from '../ui/Textarea';

interface PaediatricHistoryProps {
  patientUid: string;
}

const PaediatricHistorySection: React.FC<PaediatricHistoryProps> = ({ patientUid }) => {
  const { userProfile } = useAuth();
  
  const [formState, setFormState] = useState<Partial<PaediatricHistory>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const history = useLiveQuery(
    () => localDB.paediatricHistory.where('patientUid').equals(patientUid).reverse().sortBy('createdAt'),
    [patientUid],
    []
  );

  const users = useLiveQuery(() => localDB.users.toArray(), []);
  const userMap = useMemo(() => {
    if (!users) return new Map();
    return new Map(users.map(u => [u.uid, u.displayName]));
  }, [users]);


  // FIX: Removed non-existent `Role.Paediatrics`. Doctors and Nurses can add paediatric notes.
  const canAddNote = userProfile && [Role.Doctor, Role.Nurse].includes(userProfile.role);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const historyFields: { key: keyof PaediatricHistory, label: string }[] = [
    { key: 'pregnancyBirthNeonatalHistory', label: 'Pregnancy/Birth/Neonatal History'},
    { key: 'immunizationHistory', label: 'Immunization History'},
    { key: 'nutritionalHistory', label: 'Nutritional History'},
    { key: 'developmentalMilestones', label: 'Developmental Milestones'},
    { key: 'familyAndSocialHistory', label: 'Family and Social History'},
    { key: 'drugAllergies', label: 'Drug Allergies'},
    { key: 'pastMedicalHistory', label: 'Past Medical History'},
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.clinicalFinding?.trim() || !userProfile) {
      setError('Clinical Finding is required.');
      return;
    }
    setLoading(true);
    setError('');

    const newRecord: PaediatricHistory = {
      uid: `paed_${Date.now()}`,
      patientUid,
      ...formState,
      clinicalFinding: formState.clinicalFinding, // Ensure it's not partial
      recordedBy: userProfile.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
    };

    try {
      await localDB.paediatricHistory.put(newRecord);
      setFormState({}); // Reset form
    } catch (err) {
      console.error("Failed to save Paediatric record:", err);
      setError('Failed to save record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Paediatric History">
      {canAddNote && (
        <form onSubmit={handleSubmit} className="mb-6 border-b pb-6 dark:border-gray-700">
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-semibold mb-4 text-gray-700 dark:text-gray-300">Patient History</h4>
              <div className="space-y-4">
                  {historyFields.map(field => (
                      <Textarea 
                        key={field.key}
                        label={field.label} 
                        name={field.key} 
                        value={(formState[field.key] as string) || ''} 
                        onChange={handleInputChange} 
                        rows={3}
                      />
                  ))}
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
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No Paediatric records found.</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PaediatricHistorySection;