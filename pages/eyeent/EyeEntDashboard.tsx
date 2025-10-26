import React from 'react';
import { DepartmentId } from '../../types';
import DepartmentDashboard from '../../components/dashboards/DepartmentDashboard';
import { Eye } from '../../components/icons/Icons';
import RecentDepartmentNotes from '../../components/dashboards/RecentDepartmentNotes';

const EyeEntDashboard: React.FC = () => {
  return (
    <DepartmentDashboard
      departmentId={DepartmentId.EyeENT}
      departmentName="Eye/ENT"
      icon={<Eye className="w-8 h-8 text-primary-600" />}
    >
        <RecentDepartmentNotes departmentId={DepartmentId.EyeENT} />
    </DepartmentDashboard>
  );
};

export default EyeEntDashboard;