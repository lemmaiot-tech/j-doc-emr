import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../services/localdb';
import { ALL_ROLES } from '../constants';
import { Role, UserProfile } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';

const ProfileSettings: React.FC = () => {
  const { userProfile, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<Role>(Role.Nurse);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const allDepartments = useLiveQuery(() => localDB.departments.toArray(), []);
  const isAdmin = userProfile?.role === Role.Admin;

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName);
      setRole(userProfile.role);
      setSelectedDepartments(userProfile.departments);
    }
  }, [userProfile]);

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
    setSuccess('');
    setLoading(true);

    const changes: Partial<Pick<UserProfile, 'displayName' | 'role' | 'departments'>> = {};
    if (displayName !== userProfile?.displayName) changes.displayName = displayName;
    
    // Only allow admins to change role and departments
    if (isAdmin) {
        if (role !== userProfile?.role) changes.role = role;
        if (JSON.stringify(selectedDepartments) !== JSON.stringify(userProfile?.departments)) {
            changes.departments = selectedDepartments;
        }
    }

    if (Object.keys(changes).length === 0) {
      setError("No changes to save.");
      setLoading(false);
      return;
    }

    try {
      await updateProfile(changes);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) return <div>Loading profile...</div>;

  return (
    <Card title="Profile Settings">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
        <Input
          label="Email Address"
          id="email"
          type="email"
          value={userProfile.email}
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
        <Select 
            label="Role" 
            id="role" 
            value={role} 
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={!isAdmin}
            className={!isAdmin ? 'bg-gray-100 dark:bg-gray-700' : ''}
        >
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
            className={`h-32 ${!isAdmin ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            disabled={!isAdmin}
          >
            {allDepartments?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          {!isAdmin && <p className="mt-1 text-xs text-gray-500">Only Admins can change role and department assignments.</p>}
          {isAdmin && <p className="mt-1 text-xs text-gray-500">Hold Ctrl (or Cmd on Mac) to select multiple departments.</p>}
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        {success && <p className="text-sm text-green-500 text-center">{success}</p>}

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ProfileSettings;