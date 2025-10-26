import React, { useState, useEffect } from 'react';
import { Department, Patient } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface DepartmentManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedDepartments: string[]) => Promise<void>;
  patient: Patient;
  allDepartments: Department[];
}

const DepartmentManager: React.FC<DepartmentManagerProps> = ({
  isOpen,
  onClose,
  onSave,
  patient,
  allDepartments
}) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && patient) {
      setSelected(patient.assignedDepartments || []);
    }
  }, [isOpen, patient]);

  const handleToggle = (deptId: string) => {
    setSelected(prev =>
      prev.includes(deptId)
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(selected);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Departments for ${patient.firstName} ${patient.lastName}`}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select the departments this patient should be assigned to for consultations and procedures.
        </p>
        <div className="space-y-2 p-4 border border-gray-300 dark:border-gray-600 rounded-md max-h-60 overflow-y-auto">
          {allDepartments.map(dept => (
            <label key={dept.id} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={selected.includes(dept.id)}
                onChange={() => handleToggle(dept.id)}
              />
              <span className="text-gray-900 dark:text-gray-200">{dept.name}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end space-x-2 pt-4 border-t dark:border-gray-700">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DepartmentManager;
