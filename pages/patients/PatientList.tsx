import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { PlusCircle, Trash, Download, Users } from '../../components/icons/Icons';
import Modal from '../../components/ui/Modal';
import AddPatientForm from './AddPatientForm';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { Patient, Role } from '../../types';
import { useUndo } from '../../contexts/UndoContext';
import { useAuth } from '../../contexts/AuthContext';
import EmptyState from '../../components/ui/EmptyState';

// Define a type for our sort configuration
type SortConfig = {
  key: keyof Patient;
  direction: 'ascending' | 'descending';
};

// Helper component for sortable table headers to keep JSX clean
const SortableTH: React.FC<{
  children: React.ReactNode;
  columnKey: keyof Patient;
  sortConfig: SortConfig | null;
  requestSort: (key: keyof Patient) => void;
}> = ({ children, columnKey, sortConfig, requestSort }) => {
  const isSorted = sortConfig?.key === columnKey;
  const directionIcon = isSorted ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '';

  return (
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-600"
      onClick={() => requestSort(columnKey)}
    >
      <div className="flex items-center">
        {children}
        <span className="ml-1 w-4">{directionIcon}</span>
      </div>
    </th>
  );
};


const PatientList: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [filterTerm, setFilterTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'lastName', direction: 'ascending' });
  
  const { deleteWithUndo } = useUndo();
  const { userProfile } = useAuth();

  const patients = useLiveQuery(() => localDB.patients.toArray(), []);

  const requestSort = (key: keyof Patient) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedPatients = useMemo(() => {
    if (!patients) return [];

    let items = [...patients];

    // Filtering logic
    if (filterTerm) {
      const lowercasedFilter = filterTerm.toLowerCase();
      items = items.filter(patient =>
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(lowercasedFilter) ||
        patient.uid.toLowerCase().includes(lowercasedFilter) ||
        patient.phoneNumber.toLowerCase().includes(lowercasedFilter)
      );
    }

    // Sorting logic
    if (sortConfig !== null) {
      items.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue);
        } else if (aValue < bValue) {
            comparison = -1;
        } else if (aValue > bValue) {
            comparison = 1;
        }

        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }

    return items;
  }, [patients, filterTerm, sortConfig]);


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

  const handleExportCSV = async () => {
    const dataToExport = filteredAndSortedPatients;
    if (dataToExport.length === 0) {
      alert("No patient data to export.");
      return;
    }

    setIsExporting(true);
    try {
      const headers = [
        "Patient UID", "First Name", "Last Name", "Date of Birth", "Gender",
        "Phone Number", "Address", "Emergency Contact Name", "Emergency Contact Phone",
        "Created At", "Updated At"
      ];

      const escapeCSV = (value: any): string => {
        if (value == null) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvRows = dataToExport.map(p => [
        escapeCSV(p.uid),
        escapeCSV(p.firstName),
        escapeCSV(p.lastName),
        escapeCSV(p.dateOfBirth),
        escapeCSV(p.gender),
        escapeCSV(p.phoneNumber),
        escapeCSV(p.address),
        escapeCSV(p.emergencyContactName),
        escapeCSV(p.emergencyContactPhone),
        escapeCSV(p.createdAt.toISOString()),
        escapeCSV(p.updatedAt.toISOString()),
      ].join(','));

      const csvString = [headers.join(','), ...csvRows].join('\n');

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.setAttribute('download', `jdoc_patients_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Failed to export patient data:", error);
      alert("An error occurred while exporting data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const canDelete = userProfile?.role === Role.Admin || userProfile?.role === Role.Doctor;

  return (
    <>
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <h1 className="text-xl font-bold">Patient Records</h1>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <Button onClick={handleExportCSV} variant="secondary" disabled={isExporting || filteredAndSortedPatients.length === 0} className="w-full sm:w-auto">
                <Download className="w-5 h-5 mr-2" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
                <PlusCircle className="w-5 h-5 mr-2" />
                Add Patient
            </Button>
          </div>
        </div>
        <div className="mb-4">
            <Input 
                placeholder="Filter by name, ID, or phone..."
                value={filterTerm}
                onChange={e => setFilterTerm(e.target.value)}
            />
        </div>
        <div className="overflow-x-auto">
          {patients === undefined ? (
            <div className="text-center py-10">
              <div className="flex justify-center items-center text-gray-500">
                <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-primary-600 mr-3"></div>
                Loading patients...
              </div>
            </div>
          ) : filteredAndSortedPatients.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title={filterTerm ? "No Matching Patients" : "No Patient Records"}
              message={filterTerm ? "No patients match your filter criteria." : "Get started by adding your first patient."}
              action={
                !filterTerm ? (
                    <Button onClick={() => setIsModalOpen(true)}>
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Add Patient
                    </Button>
                ) : undefined
              }
            />
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <SortableTH columnKey="lastName" sortConfig={sortConfig} requestSort={requestSort}>Name</SortableTH>
                  <SortableTH columnKey="uid" sortConfig={sortConfig} requestSort={requestSort}>Patient ID</SortableTH>
                  <SortableTH columnKey="phoneNumber" sortConfig={sortConfig} requestSort={requestSort}>Phone Number</SortableTH>
                  <SortableTH columnKey="gender" sortConfig={sortConfig} requestSort={requestSort}>Gender</SortableTH>
                  <SortableTH columnKey="syncStatus" sortConfig={sortConfig} requestSort={requestSort}>Status</SortableTH>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedPatients.map((patient) => (
                  <tr key={patient.uid}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                       <Link to={`/patients/${patient.uid}`} className="hover:underline text-primary-600 dark:text-primary-400">
                          {patient.firstName} {patient.lastName}
                       </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{patient.uid}</td>
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
                      <Link to={`/patients/${patient.uid}`} className="text-primary-600 hover:text-primary-900 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">View</Link>
                      {canDelete && (
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(patient)}>
                              <Trash className="w-4 h-4 text-red-500" />
                          </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
