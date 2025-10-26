import React from 'react';
import Card from '../ui/Card';

interface DepartmentNotesProps {
  patientUid: string;
  departmentName: string;
}

const DepartmentNotes: React.FC<DepartmentNotesProps> = ({ patientUid, departmentName }) => {
  return (
    <Card title={`${departmentName} Notes`}>
        <div className="text-center py-8 text-gray-500">
            <p>This section is for notes specific to the {departmentName} department.</p>
            <p className="text-sm mt-2">(Feature under development)</p>
        </div>
    </Card>
  );
};

export default DepartmentNotes;
