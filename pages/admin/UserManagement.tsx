
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { localDB } from '../../services/localdb';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { PlusCircle, Edit, Trash, Users } from '../../components/icons/Icons';
import { UserProfile } from '../../types';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useUndo } from '../../contexts/UndoContext';
import EmptyState from '../../components/ui/EmptyState';

const UserManagement: React.FC = () => {
  const users = useLiveQuery(() => localDB.users.toArray(), []);
  const navigate = useNavigate();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const { deleteWithUndo } = useUndo();

  const handleEdit = (user: UserProfile) => {
    navigate(`/admin/users/edit/${user.uid}`);
  };

  const handleDeleteClick = (user: UserProfile) => {
    setSelectedUser(user);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedUser) {
      try {
        await deleteWithUndo('users', selectedUser);
      } catch (err) {
        console.error('Failed to delete user', err);
        alert('Failed to delete user.');
      } finally {
        setIsConfirmOpen(false);
        setSelectedUser(null);
      }
    }
  };

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">User Management</h1>
          <Button onClick={() => navigate('/admin/users/add')}>
            <PlusCircle className="w-5 h-5 mr-2" />
            Add User
          </Button>
        </div>
        <div className="overflow-x-auto">
          {users === undefined ? (
            <div className="text-center py-10">
              <div className="flex justify-center items-center text-gray-500">
                <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-primary-600 mr-3"></div>
                Loading users...
              </div>
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="No Users Found"
              message="Create the first user to get started with managing your team."
              action={
                <Button onClick={() => navigate('/admin/users/add')}>
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Add User
                </Button>
              }
            />
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Departments</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.uid}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.displayName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {/* FIX: Add fallback for undefined 'departments' array to prevent crash. */}
                      {(user.departments || []).join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(user)}>
                        <Trash className="w-4 h-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete the user "${selectedUser?.displayName}"? This action can be undone.`}
      />
    </>
  );
};

export default UserManagement;
