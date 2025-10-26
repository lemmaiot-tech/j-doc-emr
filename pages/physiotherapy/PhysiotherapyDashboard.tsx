import React from 'react';
import { DepartmentId } from '../../types';
import DepartmentDashboard from '../../components/dashboards/DepartmentDashboard';
import { Stethoscope } from '../../components/icons/Icons';
import RecentDepartmentNotes from '../../components/dashboards/RecentDepartmentNotes';

const PhysiotherapyDashboard: React.FC = () => {
  return (
    <DepartmentDashboard
      departmentId={DepartmentId.Physiotherapy}
      departmentName="Physiotherapy"
      icon={<Stethoscope className="w-8 h-8 text-primary-600" />}
    >
        <RecentDepartmentNotes departmentId={DepartmentId.Physiotherapy} />
    </DepartmentDashboard>
  );
};

export default PhysiotherapyDashboard;