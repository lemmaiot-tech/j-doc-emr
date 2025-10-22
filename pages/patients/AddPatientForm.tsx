import React, { useState } from 'react';
import { localDB } from '../../services/localdb';
import { Patient } from '../../types';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';

interface AddPatientFormProps {
  onSave: () => void;
  onCancel: () => void;
}

const AddPatientForm: React.FC<AddPatientFormProps> = ({ onSave, onCancel }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !dateOfBirth || !gender || !phoneNumber) {
      setError('Please fill out all required fields.');
      return;
    }
    setLoading(true);
    setError('');

    const newPatient: Patient = {
      uid: `pat_${Date.now()}`,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phoneNumber,
      address,
      emergencyContactName,
      emergencyContactPhone,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
    };

    try {
      await localDB.patients.add(newPatient);
      onSave();
    } catch (err) {
      console.error('Failed to add patient:', err);
      setError('Failed to save patient record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <Input
          label="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Date of Birth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          required
        />
        <Select
          label="Gender"
          value={gender}
          onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
          required
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </Select>
      </div>
      <hr className="dark:border-gray-600"/>
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <Input
            label="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
         />
        </div>
      <Textarea
        label="Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        rows={3}
      />
      <hr className="dark:border-gray-600"/>
      <h3 className="text-md font-medium text-gray-800 dark:text-gray-200">Emergency Contact</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          value={emergencyContactName}
          onChange={(e) => setEmergencyContactName(e.target.value)}
        />
        <Input
          label="Phone Number"
          value={emergencyContactPhone}
          onChange={(e) => setEmergencyContactPhone(e.target.value)}
        />
      </div>


      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Patient'}
        </Button>
      </div>
    </form>
  );
};

export default AddPatientForm;