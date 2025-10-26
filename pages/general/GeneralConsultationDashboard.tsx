import React from 'react';
import { DepartmentId } from '../../types';
import DepartmentDashboard from '../../components/dashboards/DepartmentDashboard';
import { Stethoscope } from '../../components/icons/Icons'; // Using Stethoscope as a general medical icon
import RecentDepartmentNotes from '../../components/dashboards/RecentDepartmentNotes';

const GeneralConsultationDashboard: React.FC = () => {
  return (
    <DepartmentDashboard
      departmentId={DepartmentId.GeneralConsultation}
      departmentName="General Consultation"
      icon={<Stethoscope className="w-8 h-8 text-primary-600" />}
    >
        <RecentDepartmentNotes departmentId={DepartmentId.GeneralConsultation} />
    </DepartmentDashboard>
  );
};

export default GeneralConsultationDashboard;