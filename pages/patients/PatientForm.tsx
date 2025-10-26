import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { localDB } from '../../services/localdb';
import { Patient, PatientStatus, Role } from '../../types';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '../../contexts/AuthContext';
import { logAction } from '../../services/auditLogService';
import Card from '../../components/ui/Card';

interface PatientFormProps {
  patientToEdit?: Patient;
}

const PatientForm: React.FC<PatientFormProps> = ({ patientToEdit }) => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const isEditMode = !!patientToEdit;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [assignedDepartments, setAssignedDepartments] = useState<string[]>([]);
  const [occupation, setOccupation] = useState('');
  const [religion, setReligion] = useState('');
  const [tribe, setTribe] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<Patient['maritalStatus'] | ''>('');
  const [status, setStatus] = useState<PatientStatus>(PatientStatus.Active);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const allDepartments = useLiveQuery(() => localDB.departments.toArray(), []);
  
  useEffect(() => {
    if (isEditMode && patientToEdit) {
        setFirstName(patientToEdit.firstName);
        setLastName(patientToEdit.lastName);
        setDateOfBirth(patientToEdit.dateOfBirth || '');
        setAge(patientToEdit.age?.toString() || '');
        setGender(patientToEdit.gender);
        setPhoneNumber(patientToEdit.phoneNumber);
        setAddress(patientToEdit.address || '');
        setEmergencyContactName(patientToEdit.emergencyContactName || '');
        setEmergencyContactPhone(patientToEdit.emergencyContactPhone || '');
        setAssignedDepartments(patientToEdit.assignedDepartments || []);
        setOccupation(patientToEdit.occupation || '');
        setReligion(patientToEdit.religion || '');
        setTribe(patientToEdit.tribe || '');
        setMaritalStatus(patientToEdit.maritalStatus || '');
        setStatus(patientToEdit.status);
    }
  }, [isEditMode, patientToEdit]);

  const handleDeptChange = (departmentId: string) => {
    setAssignedDepartments(prev => 
        prev.includes(departmentId) 
            ? prev.filter(id => id !== departmentId) 
            : [...prev, departmentId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName || !lastName || !gender || !phoneNumber) {
      setError('Please fill out all required fields (First Name, Last Name, Gender, Phone Number).');
      return;
    }
    const phoneRegex = /^\+?[\d\s()-]{7,20}$/;
    if (!phoneRegex.test(phoneNumber)) {
        setError('Please enter a valid phone number.');
        return;
    }
    if (emergencyContactPhone && !phoneRegex.test(emergencyContactPhone)) {
        setError('Please enter a valid emergency contact phone number.');
        return;
    }

    setLoading(true);

    if (isEditMode && patientToEdit) {
        // Update logic
        const updatedPatient: Patient = {
            ...patientToEdit,
            firstName, lastName, dateOfBirth: dateOfBirth || undefined, age: age ? parseInt(age, 10) : undefined,
            gender, phoneNumber, address: address || undefined, emergencyContactName: emergencyContactName || undefined,
            emergencyContactPhone: emergencyContactPhone || undefined, assignedDepartments, occupation: occupation || undefined,
            religion: religion || undefined, tribe: tribe || undefined, maritalStatus: maritalStatus || undefined,
            status, updatedAt: new Date(), syncStatus: 'pending',
        };

        try {
            await localDB.patients.put(updatedPatient);
            await logAction(userProfile, 'UPDATE_PATIENT', `Updated patient ${updatedPatient.firstName} ${updatedPatient.lastName} (ID: ${updatedPatient.uid})`);
            navigate(`/patients/${patientToEdit.uid}`);
        } catch (err) {
            console.error('Failed to update patient:', err);
            setError('Failed to save patient record.');
            setLoading(false);
        }

    } else {
        // Create logic
        const randomNumber = Math.floor(100000 + Math.random() * 900000).toString();
        const newUid = `PT-${randomNumber}`;

        const newPatient: Patient = {
          uid: newUid,
          firstName, lastName, dateOfBirth: dateOfBirth || undefined, age: age ? parseInt(age, 10) : undefined,
          gender, phoneNumber, address: address || undefined, emergencyContactName: emergencyContactName || undefined,
          emergencyContactPhone: emergencyContactPhone || undefined, assignedDepartments, occupation: occupation || undefined,
          religion: religion || undefined, tribe: tribe || undefined, maritalStatus: maritalStatus || undefined,
          status: PatientStatus.Active, createdAt: new Date(), updatedAt: new Date(), syncStatus: 'pending',
        };

        try {
          await localDB.patients.put(newPatient);
          await logAction(userProfile, 'CREATE_PATIENT', `Created patient ${newPatient.firstName} ${newPatient.lastName} (ID: ${newPatient.uid})`);
          navigate('/patients');
        } catch (err) {
          console.error('Failed to add patient:', err);
          setError('Failed to save patient record.');
          setLoading(false);
        }
    }
  };

  return (
    <Card title={isEditMode ? `Edit Patient: ${patientToEdit.firstName} ${patientToEdit.lastName}` : 'Register New Patient'}>
        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
            <Select label="Gender" value={gender} onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')} required>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            </Select>
        </div>

        <hr className="dark:border-gray-600"/>
        <h3 className="text-md font-medium text-gray-800 dark:text-gray-200">Additional Information (Optional)</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Date of Birth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            <Input label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
            <Select label="Marital Status" value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value as any)}>
                <option value="">Select status</option>
                {['Single', 'Married', 'Widow/Widower', 'Separated', 'Divorced', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Religion" value={religion} onChange={(e) => setReligion(e.target.value)} />
            <Input label="Tribe" value={tribe} onChange={(e) => setTribe(e.target.value)} />
        </div>
        <Textarea label="Address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
        
        <hr className="dark:border-gray-600"/>
        <h3 className="text-md font-medium text-gray-800 dark:text-gray-200">Emergency Contact</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
            <Input label="Phone Number" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} />
        </div>

        <hr className="dark:border-gray-600"/>
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign to Departments</label>
            <div className="space-y-2 p-4 border border-gray-300 dark:border-gray-600 rounded-md max-h-48 overflow-y-auto">
                {allDepartments?.map((d) => (
                    <label key={d.id} className="flex items-center space-x-3 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" checked={assignedDepartments.includes(d.id)} onChange={() => handleDeptChange(d.id)} />
                        <span className="text-gray-900 dark:text-gray-200">{d.name}</span>
                    </label>
                ))}
            </div>
        </div>

        {userProfile?.role === Role.Admin && isEditMode && (
             <>
                <hr className="dark:border-gray-600"/>
                <h3 className="text-md font-medium text-gray-800 dark:text-gray-200">Admin Settings</h3>
                 <Select label="Patient Status" value={status} onChange={(e) => setStatus(e.target.value as PatientStatus)}>
                    {Object.values(PatientStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
             </>
        )}


        {error && <p className="text-sm text-red-500 py-2">{error}</p>}

        <div className="flex justify-end space-x-2 pt-4 border-t dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => navigate(isEditMode ? `/patients/${patientToEdit.uid}` : '/patients')} disabled={loading}>
            Cancel
            </Button>
            <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Save Patient')}
            </Button>
        </div>
        </form>
    </Card>
  );
};

export default PatientForm;
