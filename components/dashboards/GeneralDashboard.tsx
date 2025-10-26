import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../ui/Card';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import { Users, Pill, Scissors, ArrowRight, PlusCircle, Tooth, Briefcase } from '../icons/Icons';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import { PrescriptionStatus, Role, SurgeryStatus } from '../../types';

const GeneralDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  
  const patientCount = useLiveQuery(() => localDB.patients.count(), []);
  const pendingPrescriptions = useLiveQuery(() => localDB.prescriptions.where('status').equals(PrescriptionStatus.Pending).count(), []);
  const scheduledSurgeries = useLiveQuery(() => localDB.surgeries.where('status').equals(SurgeryStatus.Scheduled).count(), []);
  const userCount = useLiveQuery(() => localDB.users.count(), []);
  
  const isAdmin = userProfile?.role === Role.Admin;

  const stats = [
    { title: 'Total Patients', value: patientCount ?? '...', icon: <Users className="w-8 h-8 text-white" />, path: '/patients' },
    { title: 'Pending Prescriptions', value: pendingPrescriptions ?? '...', icon: <Pill className="w-8 h-8 text-white" />, path: '/pharmacy' },
    { title: 'Scheduled Surgeries', value: scheduledSurgeries ?? '...', icon: <Scissors className="w-8 h-8 text-white" />, path: '/surgery' },
    { title: 'Registered Staff', value: userCount ?? '...', icon: <Briefcase className="w-8 h-8 text-white" />, path: isAdmin ? '/admin/users' : undefined },
  ];
  
  const quickActions = [
      { title: 'View Patients', path: '/patients', icon: <Users className="w-6 h-6 text-primary-600" /> },
      { title: 'Pharmacy Queue', path: '/pharmacy', icon: <Pill className="w-6 h-6 text-primary-600" /> },
      { title: 'Surgery Schedule', path: '/surgery', icon: <Scissors className="w-6 h-6 text-primary-600" /> },
      { title: 'Dental Dashboard', path: '/dental', icon: <Tooth className="w-6 h-6 text-primary-600" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {userProfile?.displayName}!
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Here's a summary of the clinic's activity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
           const card = (
            <Card className="!p-0 overflow-hidden shadow-lg">
              <div className="p-5 flex items-center bg-primary-600">
                 <div className="p-3 rounded-full bg-primary-500 mr-4">
                    {stat.icon}
                 </div>
                 <div>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm font-medium text-primary-200">{stat.title}</p>
                 </div>
              </div>
            </Card>
          );
          return stat.path ? (
            <Link to={stat.path} key={index} className="block hover:scale-105 transition-transform duration-200">
              {card}
            </Link>
          ) : (
            <div key={index}>{card}</div>
          )
        })}
      </div>

      {patientCount === 0 ? (
        <Card>
            <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No patients yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding your first patient record.</p>
                <div className="mt-6">
                    <Link to="/patients">
                        <Button>
                            <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                            Add New Patient
                        </Button>
                    </Link>
                </div>
            </div>
        </Card>
      ) : (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map(action => (
                <Link to={action.path} key={action.path}>
                    <Card className="hover:shadow-lg hover:border-primary-500/50 border-2 border-transparent transition-all duration-300">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <div className="p-3 rounded-md bg-primary-100 dark:bg-primary-800/50 mr-4">
                                    {action.icon}
                                </div>
                                <p className="font-semibold">{action.title}</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400" />
                        </div>
                    </Card>
                </Link>
            ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default GeneralDashboard;