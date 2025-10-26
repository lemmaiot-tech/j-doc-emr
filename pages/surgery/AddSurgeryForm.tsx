import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import { useAuth } from '../../contexts/AuthContext';
import { SurgicalProcedure, SurgeryStatus, Role } from '../../types';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { db } from '../patients/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AddSurgeryFormProps {
  onSave: () => void;
  onCancel: () => void;
}

const AddSurgeryForm: React.FC<AddSurgeryFormProps> = ({ onSave, onCancel }) => {
  const { userProfile } = useAuth();
  const patients = useLiveQuery(() => localDB.patients.toArray(), []);
  const users = useLiveQuery(() => localDB.users.toArray(), []);

  const surgeons = React.useMemo(() => {
    return users?.filter(u => u.role === Role.Surgeon) || [];
  }, [users]);

  const [patientUid, setPatientUid] = useState('');
  const [procedureName, setProcedureName] = useState('');
  const [surgeonUid, setSurgeonUid] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientUid || !procedureName || !surgeonUid || !userProfile) {
      setError('Please fill out all required fields.');
      return;
    }
    setLoading(true);
    setError('');

    const newSurgery: SurgicalProcedure = {
      uid: `surg_${Date.now()}`,
      patientUid,
      procedureName,
      surgeonUid,
      status: SurgeryStatus.Scheduled,
      consentSigned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
    };

    try {
      const { syncStatus, ...firestoreData } = newSurgery;
      // Attempt to write to Firestore for real-time updates
      await setDoc(doc(db, 'surgeries', newSurgery.uid), firestoreData);
      newSurgery.syncStatus = 'synced'; // Mark as synced if Firestore write succeeds
    } catch (err) {
      console.warn('Could not write to Firestore, saving as pending.', err);
      // syncStatus remains 'pending'
    } finally {
      // Always write to the local DB
      await localDB.surgeries.put(newSurgery);
      setLoading(false);
      onSave();
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
        label="Procedure Name"
        value={procedureName}
        onChange={(e) => setProcedureName(e.target.value)}
        required
      />

      <Select
        label="Assigned Surgeon"
        value={surgeonUid}
        onChange={(e) => setSurgeonUid(e.target.value)}
        required
      >
        <option value="" disabled>Select a surgeon</option>
        {surgeons.map(s => (
          <option key={s.uid} value={s.uid}>
            {s.displayName}
          </option>
        ))}
      </Select>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Schedule Surgery'}
        </Button>
      </div>
    </form>
  );
};

export default AddSurgeryForm;