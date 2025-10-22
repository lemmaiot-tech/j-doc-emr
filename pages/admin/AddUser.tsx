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

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.Nurse);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const allDepartments = useLiveQuery(() => localDB.departments.toArray(), []);

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const value: string[] = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    setSelectedDepartments(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!displayName || !email || !password || selectedDepartments.length === 0) {
      setError('Please fill out all fields.');
      setLoading(false);
      return;
    }

    // NOTE: This is a MOCK implementation for an offline-first approach.
    // In a real application, user creation MUST happen on a secure backend
    // (e.g., a Firebase Cloud Function) to create the user in Firebase Auth.
    // Simply adding to the local DB will NOT make the user able to log in.
    const newUser: UserProfile = {
      uid: `local_${Date.now()}`, // Create a temporary local-only UID
      displayName,
      email,
      role,
      departments: selectedDepartments,
    };

    try {
      await localDB.users.add(newUser);
      alert('User added locally successfully. Note: This user cannot log in until also created in the Firebase backend.');
      navigate('/admin/users');
    } catch (err: any) {
      if (err.name === 'ConstraintError') {
         setError('A user with this email or ID already exists in the local database.');
      } else {
         setError('Failed to add user to the local database.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Add New User">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            <label htmlFor="departments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Departments
            </label>
            <Select
                id="departments"
                multiple
                value={selectedDepartments}
                onChange={handleDeptChange}
                className="h-32"
            >
                {allDepartments?.map((d) => (
                <option key={d.id} value={d.id}>
                    {d.name}
                </option>
                ))}
            </Select>
            <p className="mt-1 text-xs text-gray-500">Hold Ctrl (or Cmd on Mac) to select multiple departments.</p>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/users')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Add User'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AddUser;
