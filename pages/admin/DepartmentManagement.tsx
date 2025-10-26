
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { PlusCircle, Edit, Trash, Home } from '../../components/icons/Icons';
import { Department } from '../../types';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useUndo } from '../../contexts/UndoContext';
import { INITIAL_DEPARTMENTS } from '../../constants';
import EmptyState from '../../components/ui/EmptyState';

const DepartmentManagement: React.FC = () => {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedDept, setSelectedDept] = useState<Department | null>(null);
    const { deleteWithUndo } = useUndo();

  const departments = useLiveQuery(() => localDB.departments.toArray(), []);

  const handleEdit = (dept: Department) => {
    alert(`Editing ${dept.name}`);
  }

  const handleDeleteClick = (dept: Department) => {
    setSelectedDept(dept);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedDept) {
        try {
            await deleteWithUndo('departments', selectedDept);
        } catch (err) {
            console.error("Failed to delete department", err);
            alert("Failed to delete department.");
        } finally {
            setIsConfirmOpen(false);
            setSelectedDept(null);
        }
    }
  };

  return (
    <>
        <Card>
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">Department Management</h1>
            <Button>
            <PlusCircle className="w-5 h-5 mr-2" />
            Add Department
            </Button>
        </div>
        <div className="overflow-x-auto">
            {departments === undefined ? (
                 <div className="text-center py-10">
                    <div className="flex justify-center items-center text-gray-500">
                      <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-primary-600 mr-3"></div>
                      Loading departments...
                    </div>
                 </div>
            ) : departments.length === 0 ? (
                <EmptyState
                    icon={<Home className="w-8 h-8" />}
                    title="No Departments Found"
                    message="Add a department to begin organizing users and clinic functions."
                    action={
                        <Button>
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Add Department
                        </Button>
                    }
                />
            ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {departments.map((dept) => (
                        <li key={dept.id} className="py-4 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{dept.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">ID: {dept.id}</p>
                            </div>
                            <div className="space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(dept)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(dept)}>
                                    <Trash className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
        </Card>
        <ConfirmationModal
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={handleConfirmDelete}
            title="Delete Department"
            message={`Are you sure you want to delete the "${selectedDept?.name}" department? This action can be undone.`}
        />
    </>
  );
};

export default DepartmentManagement;
