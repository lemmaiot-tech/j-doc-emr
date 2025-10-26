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
  const [notificationPermission, setNotificationPermission] = useState('Notification' in window ? Notification.permission : 'default');

  const allDepartments = useLiveQuery(() => localDB.departments.toArray(), []);
  const isAdmin = userProfile?.role === Role.Admin;

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName);
      setRole(userProfile.role);
      setSelectedDepartments(userProfile.departments || []); // Ensure it's an array to prevent errors
    }
  }, [userProfile]);

  const handleDeptChange = (departmentId: string) => {
    if (!isAdmin) return;
    setSelectedDepartments(prev => 
        prev.includes(departmentId) 
            ? prev.filter(id => id !== departmentId) 
            : [...prev, departmentId]
    );
  };
  
  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notification');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!displayName.trim()) {
        setError('Display Name cannot be empty.');
        return;
    }
    if (isAdmin && selectedDepartments.length === 0) {
        setError('A user must be assigned to at least one department.');
        return;
    }

    setLoading(true);
    const changes: Partial<Pick<UserProfile, 'displayName' | 'role' | 'departments'>> = {};
    if (displayName.trim() !== userProfile?.displayName) changes.displayName = displayName.trim();
    
    // Only allow admins to change role and departments
    if (isAdmin) {
        if (role !== userProfile?.role) changes.role = role;
        
        const sortedSelected = [...selectedDepartments].sort();
        const sortedOriginal = [...(userProfile?.departments || [])].sort();
        if (JSON.stringify(sortedSelected) !== JSON.stringify(sortedOriginal)) {
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
      setTimeout(() => setSuccess(''), 3000);
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
      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
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
            className={!isAdmin ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}
        >
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
            <div className={`space-y-2 p-4 border rounded-md max-h-48 overflow-y-auto ${!isAdmin ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600'}`}>
                {allDepartments?.map((d) => (
                    <label key={d.id} className={`flex items-center space-x-3 ${!isAdmin ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        <input
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
                            checked={selectedDepartments.includes(d.id)}
                            onChange={() => handleDeptChange(d.id)}
                            disabled={!isAdmin}
                        />
                        <span className={`text-gray-900 dark:text-gray-200 ${!isAdmin ? 'opacity-70' : ''}`}>{d.name}</span>
                    </label>
                ))}
                 {allDepartments?.length === 0 && (
                    <p className="text-sm text-gray-500">No departments found.</p>
                )}
            </div>
            {!isAdmin && <p className="mt-2 text-xs text-gray-500">Only Admins can change role and department assignments.</p>}
        </div>

        <hr className="dark:border-gray-700"/>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Push Notifications</label>
            {notificationPermission === 'granted' && (
                <p className="text-sm text-green-600">Real-time push notifications are enabled for this device.</p>
            )}
            {notificationPermission === 'denied' && (
                 <div>
                    <p className="text-sm text-red-600">Push notifications are blocked by your browser.</p>
                    <p className="text-xs text-gray-500 mt-1">You must enable them in your browser's site settings to receive alerts.</p>
                </div>
            )}
             {notificationPermission === 'default' && (
                <Button size="sm" type="button" variant="secondary" onClick={handleRequestNotificationPermission}>
                    Enable Notifications
                </Button>
            )}
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        {success && <p className="text-sm text-green-500 text-center">{success}</p>}

        <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ProfileSettings;