import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import { ALL_ROLES } from '../../constants';
import { Role, UserProfile } from '../../types';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { db } from '../patients/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { logAction } from '../../services/auditLogService';

const EditUser: React.FC = () => {
  const navigate = useNavigate();
  const { uid } = useParams<{ uid: string }>();
  const { userProfile: adminUserProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<Role>(Role.Nurse);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const userToEdit = useLiveQuery(() => uid ? localDB.users.get(uid) : undefined, [uid]);
  const allDepartments = useLiveQuery(() => localDB.departments.toArray(), []);

  useEffect(() => {
    if (userToEdit) {
      setDisplayName(userToEdit.displayName);
      setRole(userToEdit.role);
      setSelectedDepartments(userToEdit.departments || []);
    }
  }, [userToEdit]);

  const handleDeptChange = (departmentId: string) => {
    setSelectedDepartments(prev => 
        prev.includes(departmentId) 
            ? prev.filter(id => id !== departmentId) 
            : [...prev, departmentId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!uid || !userToEdit) {
        setError('User not found.');
        return;
    }
    if (!displayName.trim()) {
        setError('Display Name is required.');
        return;
    }
    if (selectedDepartments.length === 0) {
      setError('Please assign the user to at least one department.');
      return;
    }

    setLoading(true);

    const updatedData: Partial<UserProfile> = {
        displayName: displayName.trim(),
        role,
        departments: selectedDepartments,
        syncStatus: 'pending' // Mark for sync
    };

    try {
      // 1. Update Firestore first for real-time propagation
      const { syncStatus, ...firestoreData } = updatedData;
      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, firestoreData, { merge: true });
      updatedData.syncStatus = 'synced'; // If firestore update is successful

    } catch(err) {
      console.warn("Could not write to Firestore, saving as pending.", err);
      // syncStatus will remain 'pending'
    }
    finally {
      // 2. Always update the local Dexie DB
      await localDB.users.update(uid, updatedData);
      
      // 3. Log the action
      await logAction(adminUserProfile, 'UPDATE_USER', `Updated user profile for ${userToEdit.displayName} (ID: ${uid}).`);
      
      alert('User updated successfully!');
      navigate('/admin/users');
    }

    setLoading(false);
  };

  if (!userToEdit && uid) {
    return (
        <div className="flex items-center justify-center h-full">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary-600"></div>
        </div>
    );
  }

  if (!userToEdit) {
    return <Card title="Error"><p>Could not find the specified user.</p></Card>;
  }

  return (
    <Card title={`Edit User: ${userToEdit.displayName}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email"
          id="email"
          type="email"
          value={userToEdit.email}
          disabled
          className="bg-gray-100 dark:bg-gray-700"
        />
        <Input
          label="Display Name"
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
        <Select label="Role" id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Departments
            </label>
            <div className="space-y-2 p-4 border border-gray-300 dark:border-gray-600 rounded-md max-h-48 overflow-y-auto">
                {allDepartments?.map((d) => (
                    <label key={d.id} className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            checked={selectedDepartments.includes(d.id)}
                            onChange={() => handleDeptChange(d.id)}
                        />
                        <span className="text-gray-900 dark:text-gray-200">{d.name}</span>
                    </label>
                ))}
                {allDepartments?.length === 0 && (
                    <p className="text-sm text-gray-500">No departments found. Please add departments first.</p>
                )}
            </div>
        </div>

        {error && <p className="text-sm text-red-500 text-center py-2">{error}</p>}

        <div className="flex justify-end space-x-2 pt-4 border-t dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/users')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default EditUser;