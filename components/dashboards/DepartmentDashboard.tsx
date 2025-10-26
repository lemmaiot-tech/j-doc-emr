import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Card from '../ui/Card';
import { localDB } from '../../services/localdb';
import { DepartmentId, UserProfile } from '../../types';
import EmptyState from '../ui/EmptyState';
import { Users, ClipboardList } from '../icons/Icons';
import { Link } from 'react-router-dom';

interface DepartmentDashboardProps {
  departmentId: DepartmentId | string;
  departmentName: string;
  icon: React.ReactNode;
  children: React.ReactNode; // For the "Recent Activity" section
}

const DepartmentDashboard: React.FC<DepartmentDashboardProps> = ({ departmentId, departmentName, icon, children }) => {
  const assignedStaff = useLiveQuery(
    () => localDB.users.where('departments').equals(departmentId).toArray(),
    [departmentId],
    []
  );

  const assignedPatients = useLiveQuery(
    () => localDB.patients.where('assignedDepartments').equals(departmentId).toArray(),
    [departmentId],
    []
  );

  const stats = [
    { title: 'Assigned Patients', value: assignedPatients?.length ?? '...', icon: <Users className="w-6 h-6 text-blue-600 dark:text-blue-300" /> },
    { title: 'Assigned Staff', value: assignedStaff?.length ?? '...', icon: <Users className="w-6 h-6 text-green-600 dark:text-green-300" /> },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-800/50">
            {icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{departmentName} Dashboard</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Overview of departmental activities and assignments.</p>
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <div className="flex items-center">
              <div className={`p-3 rounded-full mr-4 ${index === 0 ? 'bg-blue-100 dark:bg-blue-800/50' : 'bg-green-100 dark:bg-green-800/50'}`}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {children}
        </div>
        <Card title="Assigned Staff">
          {assignedStaff && assignedStaff.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {assignedStaff.map(staff => (
                <li key={staff.uid} className="py-3">
                  <p className="font-medium text-gray-900 dark:text-white">{staff.displayName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{staff.role}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="No Staff Assigned"
              message={`Assign staff to the ${departmentName} department in User Management.`}
            />
          )}
        </Card>
      </div>

      <Card title="Patient Queue">
        {assignedPatients && assignedPatients.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Patient ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                     <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {assignedPatients.map(patient => (
                            <tr key={patient.uid}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Link to={`/patients/${patient.uid}`} className="text-primary-600 hover:underline dark:text-primary-400">
                                        {patient.firstName} {patient.lastName}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{patient.uid}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{patient.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <EmptyState
                icon={<ClipboardList className="w-8 h-8" />}
                title="No Patients Assigned"
                message={`Assign patients to the ${departmentName} department from their detail page.`}
            />
        )}
      </Card>

    </div>
  );
};

export default DepartmentDashboard;
