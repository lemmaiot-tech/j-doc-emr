import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import { useAuth } from '../../contexts/AuthContext';
import { Prescription, PrescriptionStatus } from '../../types';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import { db } from '../patients/firebase';
import { doc, setDoc } from 'firebase/firestore';
import SearchableSelect from '../../components/ui/SearchableSelect';

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
  
  const patientOptions = useMemo(() => {
    if (!patients) return [];
    return patients.map(p => ({
        value: p.uid,
        label: `${p.firstName} ${p.lastName} (${p.uid})`
    }));
}, [patients]);


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
      const { syncStatus, ...firestoreData } = newPrescription;
      // First, try to write to Firestore for real-time notifications
      await setDoc(doc(db, 'prescriptions', newPrescription.uid), firestoreData);
      newPrescription.syncStatus = 'synced'; // Optimistically set as synced
    } catch (err) {
      console.warn('Could not write to Firestore, saving as pending.', err);
      // syncStatus remains 'pending'
    } finally {
      // Always write to the local DB
      await localDB.prescriptions.put(newPrescription);
      setLoading(false);
      onSave();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
       <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient</label>
        <SearchableSelect
          options={patientOptions}
          value={patientUid}
          onChange={setPatientUid}
          placeholder="Search for a patient by name or ID..."
        />
      </div>
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
