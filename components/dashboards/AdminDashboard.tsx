import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../ui/Card';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import { Users, Home, RefreshCw } from '../icons/Icons';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';
import { useSync } from '../../contexts/SyncProvider';

const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { pendingChangesCount } = useSync();
  
  const userCount = useLiveQuery(() => localDB.users.count(), []);
  const patientCount = useLiveQuery(() => localDB.patients.count(), []);
  const departmentCount = useLiveQuery(() => localDB.departments.count(), []);
  const recentUsers = useLiveQuery(() => localDB.users.orderBy('uid').limit(5).toArray(), []);

  const stats = [
    { title: 'Registered Staff', value: userCount ?? '...', icon: <Users className="w-8 h-8 text-primary-600" /> },
    { title: 'Total Patients', value: patientCount ?? '...', icon: <Users className="w-8 h-8 text-primary-600" /> },
    { title: 'Departments', value: departmentCount ?? '...', icon: <Home className="w-8 h-8 text-primary-600" /> },
    { title: 'Pending Syncs', value: pendingChangesCount ?? '...', icon: <RefreshCw className="w-8 h-8 text-primary-600" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Welcome, {userProfile?.displayName}. Manage users, departments, and system settings.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <div className="flex items-center">
               <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-800/50 mr-4">
                  {stat.icon}
               </div>
               <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
               </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Quick Actions" className="md:col-span-1">
            <div className="flex flex-col space-y-3">
                <Link to="/admin/users">
                    <Button className="w-full">Manage Users</Button>
                </Link>
                <Link to="/admin/departments">
                    <Button className="w-full">Manage Departments</Button>
                </Link>
                <Button variant="secondary" className="w-full" disabled>System Settings</Button>
            </div>
        </Card>
        <Card title="Recent Users" className="md:col-span-2">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {recentUsers?.map((user) => (
                        <tr key={user.uid}>
                            <td className="py-3 whitespace-nowrap">
                                <div className="font-medium text-gray-900 dark:text-white">{user.displayName}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                            </td>
                            <td className="py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.role}</td>
                        </tr>
                        ))}
                        {recentUsers && recentUsers.length === 0 && (
                            <tr>
                                <td colSpan={2} className="text-center py-5 text-gray-500">No users found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;