import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import { ALL_ROLES } from '../../constants';
import { Role, UserProfile } from '../../types';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { auth, db } from '../patients/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { logAction } from '../../services/auditLogService';

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile: adminUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.Nurse);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const allDepartments = useLiveQuery(() => localDB.departments.toArray(), []);

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

    if (!displayName.trim()) {
        setError('Display Name is required.');
        return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
        setError('Please enter a valid email address.');
        return;
    }
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }
    if (selectedDepartments.length === 0) {
      setError('Please assign the user to at least one department.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newFirebaseUser = userCredential.user;

      if (!newFirebaseUser) {
        throw new Error("User creation failed.");
      }

      // 2. Create the user profile object for Firestore and local DB
      const newUserProfile: UserProfile = {
        uid: newFirebaseUser.uid,
        displayName: displayName.trim(),
        email,
        role,
        departments: selectedDepartments,
        syncStatus: 'synced',
      };

      // 3. Save the user profile to Firestore (without local-only fields)
      const { syncStatus, ...firestoreProfile } = newUserProfile;
      await setDoc(doc(db, 'users', newFirebaseUser.uid), firestoreProfile);

      // 4. Save the user profile to the local Dexie DB
      await localDB.users.put(newUserProfile);
      
      // 5. Log the action
      await logAction(adminUserProfile, 'CREATE_USER', `Created user ${newUserProfile.displayName} (${newUserProfile.email}) with role ${newUserProfile.role}.`);

      alert('User created successfully! They can now log in.');
      navigate('/admin/users');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use by another account.');
      } else {
        setError(err.message || 'Failed to create user.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Add New User">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Display Name"
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
        <Input
          label="Email"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 6 characters"
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
            {loading ? 'Creating User...' : 'Add User'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AddUser;