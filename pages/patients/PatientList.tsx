import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { PlusCircle, Trash } from '../../components/icons/Icons';
import Modal from '../../components/ui/Modal';
import AddPatientForm from './AddPatientForm';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { Patient, Role } from '../../types';
import { useUndo } from '../../contexts/UndoContext';
import { useAuth } from '../../contexts/AuthContext';

const PatientList: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { deleteWithUndo } = useUndo();
  const { userProfile } = useAuth();

  const patients = useLiveQuery(() => localDB.patients.toArray(), []);

  const handleDeleteClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedPatient) {
        try {
            await deleteWithUndo('patients', selectedPatient);
        } catch (err) {
            console.error("Failed to delete patient with undo", err);
            alert("Failed to delete patient.");
        } finally {
            setIsConfirmOpen(false);
            setSelectedPatient(null);
        }
    }
  };

  const canDelete = userProfile?.role === Role.Admin || userProfile?.role === Role.Doctor;

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Patient Records</h1>
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="w-5 h-5 mr-2" />
            Add Patient
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Patient ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone Number</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gender</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {patients?.map((patient) => (
                <tr key={patient.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                     <Link to={`/patients/${patient.uid}`} className="hover:underline text-primary-600 dark:text-primary-400">
                        {patient.firstName} {patient.lastName}
                     </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{patient.uid}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{patient.phoneNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{patient.gender}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {patient.syncStatus === 'synced' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Synced</span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Link to={`/patients/${patient.uid}`} className="text-primary-600 hover:text-primary-900 px-2">View</Link>
                    {canDelete && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(patient)}>
                            <Trash className="w-4 h-4 text-red-500" />
                        </Button>
                    )}
                  </td>
                </tr>
              ))}
               {patients && patients.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">No patients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Patient">
        <AddPatientForm 
          onSave={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
      
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Patient"
        message={`Are you sure you want to delete patient "${selectedPatient?.firstName} ${selectedPatient?.lastName}"? This action can be undone.`}
      />
    </>
  );
};

export default PatientList;