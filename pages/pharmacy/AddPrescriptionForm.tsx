import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import { useAuth } from '../../contexts/AuthContext';
import { Prescription, PrescriptionStatus } from '../../types';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';

interface AddPrescriptionFormProps {
  onSave: () => void;
  onCancel: () => void;
}

const AddPrescriptionForm: React.FC<AddPrescriptionFormProps> = ({ onSave, onCancel }) => {
  const { userProfile } = useAuth();
  const patients = useLiveQuery(() => localDB.patients.toArray(), []);

  const [patientUid, setPatientUid] = useState('');
  const [drug, setDrug] = useState('');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientUid || !drug || !dosage || !userProfile) {
      setError('Please fill out all required fields.');
      return;
    }
    setLoading(true);
    setError('');

    const newPrescription: Prescription = {
      uid: `presc_${Date.now()}`,
      patientUid,
      drug,
      dosage,
      notes,
      prescribedBy: userProfile.uid,
      status: PrescriptionStatus.Pending,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
    };

    try {
      await localDB.prescriptions.add(newPrescription);
      onSave();
    } catch (err) {
      console.error('Failed to add prescription:', err);
      setError('Failed to save prescription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Patient"
        value={patientUid}
        onChange={(e) => setPatientUid(e.target.value)}
        required
      >
        <option value="" disabled>Select a patient</option>
        {patients?.map(p => (
          <option key={p.uid} value={p.uid}>
            {p.firstName} {p.lastName} ({p.uid})
          </option>
        ))}
      </Select>
      <Input
        label="Drug"
        value={drug}
        onChange={(e) => setDrug(e.target.value)}
        required
      />
      <Input
        label="Dosage"
        value={dosage}
        onChange={(e) => setDosage(e.target.value)}
        required
      />
      <Textarea
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Prescription'}
        </Button>
      </div>
    </form>
  );
};

export default AddPrescriptionForm;
