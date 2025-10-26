import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import GeneralDashboard from '../components/dashboards/GeneralDashboard';

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div>
      </div>
    );
  }

  return userProfile.role === Role.Admin 
    ? <AdminDashboard /> 
    : <GeneralDashboard />;
};

export default Dashboard;