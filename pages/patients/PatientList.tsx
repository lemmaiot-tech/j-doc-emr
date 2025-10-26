import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { PlusCircle, Trash, Download, Users, ArrowUp, ArrowDown, ChevronsUpDown, Camera } from '../../components/icons/Icons';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { Patient, PatientStatus, Role } from '../../types';
import { useUndo } from '../../contexts/UndoContext';
import { useAuth } from '../../contexts/AuthContext';
import EmptyState from '../../components/ui/EmptyState';
import Select from '../../components/ui/Select';
import ScannerModal from '../../components/ui/ScannerModal';

// Levenshtein distance function for fuzzy search
const levenshteinDistance = (a: string, b: string): number => {
    const an = a.length;
    const bn = b.length;
    if (an === 0) return bn;
    if (bn === 0) return an;
    const matrix = Array(bn + 1).fill(null).map(() => Array(an + 1).fill(null));
    for (let i = 0; i <= an; i += 1) {
      matrix[0][i] = i;
    }
    for (let j = 0; j <= bn; j += 1) {
      matrix[j][0] = j;
    }
    for (let j = 1; j <= bn; j += 1) {
      for (let i = 1; i <= an; i += 1) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    return matrix[bn][an];
};

// Define a type for our sort configuration
type SortConfig = {
  key: keyof Patient | 'latestClinicalRecord';
  direction: 'ascending' | 'descending';
};

// Helper component for sortable table headers to keep JSX clean
const SortableTH: React.FC<{
  children: React.ReactNode;
  columnKey: keyof Patient | 'latestClinicalRecord';
  sortConfig: SortConfig | null;
  requestSort: (key: keyof Patient | 'latestClinicalRecord') => void;
}> = ({ children, columnKey, sortConfig, requestSort }) => {
  const isSorted = sortConfig?.key === columnKey;
  
  const getSortIcon = () => {
    if (!isSorted) {
      // Show a subtle icon for non-sorted headers, indicating they are sortable
      return <ChevronsUpDown className="w-4 h-4 ml-1.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="w-4 h-4 ml-1.5 text-gray-800 dark:text-gray-200" />;
    }
    return <ArrowDown className="w-4 h-4 ml-1.5 text-gray-800 dark:text-gray-200" />;
  };

  return (
    <th
      scope="col"
      className="group px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-600"
      onClick={() => requestSort(columnKey)}
    >
      <div className="flex items-center">
        {children}
        {getSortIcon()}
      </div>
    </th>
  );
};


const PatientList: React.FC = () => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [filterTerm, setFilterTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'lastName', direction: 'ascending' });
  
  // New filter states
  const [genderFilter, setGenderFilter] = useState('all');
  const [maritalStatusFilter, setMaritalStatusFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('');
  const [tribeFilter, setTribeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { deleteWithUndo } = useUndo();
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const patients = useLiveQuery(() => localDB.patients.toArray(), []);
  const medicalHistory = useLiveQuery(() => localDB.medicalHistory.toArray(), []);

  const latestRecordMap = useMemo(() => {
    if (!medicalHistory) return new Map();
    const map = new Map<string, string>();
    // Sort history to easily find the latest date per patient
    const sortedHistory = [...medicalHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (const record of sortedHistory) {
        if (!map.has(record.patientUid)) {
            map.set(record.patientUid, record.date);
        }
    }
    return map;
}, [medicalHistory]);


  const canCreatePatient = userProfile && [Role.Admin, Role.Doctor, Role.Nurse, Role.RecordsClerk].includes(userProfile.role);

  const requestSort = (key: keyof Patient | 'latestClinicalRecord') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleClearFilters = () => {
    setFilterTerm('');
    setGenderFilter('all');
    setMaritalStatusFilter('all');
    setAgeFilter('');
    setTribeFilter('');
    setDateFilter('');
    setStatusFilter('all');
  };
  
  const isAnyFilterActive = filterTerm || genderFilter !== 'all' || maritalStatusFilter !== 'all' || dateFilter || statusFilter !== 'all' || ageFilter || tribeFilter;

  const getStatusColor = (status: PatientStatus) => {
    switch(status) {
        case PatientStatus.Active: return 'bg-green-100 text-green-800';
        case PatientStatus.Inactive: return 'bg-yellow-100 text-yellow-800';
        case PatientStatus.Deceased: return 'bg-red-100 text-red-800';
        case PatientStatus.Archived: return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAndSortedPatients = useMemo(() => {
    if (!patients) return [];

    let items = [...patients];

    if (filterTerm) {
        const lowercasedFilter = filterTerm.toLowerCase();
        items = items.filter(patient => {
            const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
            // Name matches if it includes the term OR is within a small Levenshtein distance (for typos)
            const nameMatches = fullName.includes(lowercasedFilter) || levenshteinDistance(fullName, lowercasedFilter) <= 2;
            
            return nameMatches ||
                patient.uid.toLowerCase().includes(lowercasedFilter) ||
                patient.phoneNumber.includes(lowercasedFilter);
        });
    }

    if (genderFilter !== 'all') items = items.filter(p => p.gender === genderFilter);
    if (maritalStatusFilter !== 'all') items = items.filter(p => p.maritalStatus === maritalStatusFilter);
    if (statusFilter !== 'all') items = items.filter(p => p.status === statusFilter);
    if (dateFilter) items = items.filter(p => p.createdAt.toISOString().startsWith(dateFilter));
    if (ageFilter) {
        const ageNum = parseInt(ageFilter, 10);
        if (!isNaN(ageNum)) {
            items = items.filter(p => p.age === ageNum);
        }
    }
    if (tribeFilter) {
        items = items.filter(p => p.tribe && p.tribe.toLowerCase().includes(tribeFilter.toLowerCase()));
    }

    if (sortConfig !== null) {
      items.sort((a, b) => {
        const aValue = sortConfig.key === 'latestClinicalRecord' ? latestRecordMap.get(a.uid) : a[sortConfig.key as keyof Patient];
        const bValue = sortConfig.key === 'latestClinicalRecord' ? latestRecordMap.get(b.uid) : b[sortConfig.key as keyof Patient];

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
  }, [patients, filterTerm, sortConfig, genderFilter, maritalStatusFilter, dateFilter, statusFilter, ageFilter, tribeFilter, latestRecordMap]);


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
        "Patient UID", "First Name", "Last Name", "Date of Birth", "Gender", "Status",
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
        escapeCSV(p.uid), escapeCSV(p.firstName), escapeCSV(p.lastName), escapeCSV(p.dateOfBirth),
        escapeCSV(p.gender), escapeCSV(p.status), escapeCSV(p.phoneNumber), escapeCSV(p.address),
        escapeCSV(p.emergencyContactName), escapeCSV(p.emergencyContactPhone),
        escapeCSV(p.createdAt.toISOString()), escapeCSV(p.updatedAt.toISOString()),
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
  
  const handleScanSuccess = (decodedText: string) => {
    setFilterTerm(decodedText);
    setIsScannerOpen(false);
  }

  const canDelete = userProfile?.role === Role.Admin;
  const maritalStatuses: Patient['maritalStatus'][] = ['Single', 'Married', 'Widow/Widower', 'Separated', 'Divorced', 'Other'];

  return (
    <>
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <h1 className="text-xl font-bold">Patient Records</h1>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <Button onClick={() => setIsScannerOpen(true)} variant="secondary" className="w-full sm:w-auto">
                <Camera className="w-5 h-5 mr-2" />
                Scan ID
            </Button>
            <Button onClick={handleExportCSV} variant="secondary" disabled={isExporting || filteredAndSortedPatients.length === 0} className="w-full sm:w-auto">
                <Download className="w-5 h-5 mr-2" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            {canCreatePatient && (
              <Button onClick={() => navigate('/patients/add')} className="w-full sm:w-auto">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Add Patient
              </Button>
            )}
          </div>
        </div>

        <div className="mb-4 space-y-4">
            <div className="flex flex-wrap items-end gap-4">
                <div className="flex-grow min-w-[250px]">
                    <Input placeholder="Search by name, phone, or ID..." value={filterTerm} onChange={e => setFilterTerm(e.target.value)} label="Search Patients" />
                </div>
                <div className="flex-grow min-w-[150px]">
                    <Select label="Gender" value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
                      <option value="all">All Genders</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </Select>
                </div>
                <div className="flex-grow min-w-[150px]">
                    <Select label="Marital Status" value={maritalStatusFilter} onChange={e => setMaritalStatusFilter(e.target.value)}>
                        <option value="all">All Marital Statuses</option>
                        {maritalStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                    </Select>
                </div>
                <div className="flex-grow min-w-[150px]">
                    <Select label="Patient Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="all">All Statuses</option>
                        {Object.values(PatientStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                </div>
                <div className="flex-grow min-w-[120px]">
                    <Input label="Age" type="number" placeholder="e.g. 42" value={ageFilter} onChange={e => setAgeFilter(e.target.value)} />
                </div>
                <div className="flex-grow min-w-[150px]">
                    <Input label="Tribe" placeholder="Search tribe..." value={tribeFilter} onChange={e => setTribeFilter(e.target.value)} />
                </div>
            </div>
            {isAnyFilterActive && (
                <div className="flex items-center flex-wrap gap-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mr-2">Active Filters:</span>
                    {filterTerm && (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Search: "{filterTerm}"</span>)}
                    {genderFilter !== 'all' && (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Gender: {genderFilter}</span>)}
                    {maritalStatusFilter !== 'all' && (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Marital: {maritalStatusFilter}</span>)}
                    {statusFilter !== 'all' && (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Status: {statusFilter}</span>)}
                    {ageFilter && (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Age: {ageFilter}</span>)}
                    {tribeFilter && (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Tribe: "{tribeFilter}"</span>)}
                    <Button variant="ghost" size="sm" onClick={handleClearFilters} className="ml-auto !text-sm !text-primary-600 hover:!bg-primary-100 dark:hover:!bg-primary-900/50">Clear All</Button>
                </div>
            )}
        </div>

        <div className="overflow-x-auto">
          {patients === undefined ? (
            <div className="text-center py-10"><div className="flex justify-center items-center text-gray-500"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-primary-600 mr-3"></div>Loading patients...</div></div>
          ) : filteredAndSortedPatients.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title={isAnyFilterActive ? "No Matching Patients" : "No Patient Records"}
              message={isAnyFilterActive ? "No patients match your filter criteria." : "Get started by adding your first patient."}
              action={ canCreatePatient ? ( <Button onClick={() => navigate('/patients/add')}><PlusCircle className="w-5 h-5 mr-2" />Add Patient</Button> ) : undefined }
            />
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <SortableTH columnKey="lastName" sortConfig={sortConfig} requestSort={requestSort}>Name</SortableTH>
                  <SortableTH columnKey="uid" sortConfig={sortConfig} requestSort={requestSort}>Patient ID</SortableTH>
                  <SortableTH columnKey="status" sortConfig={sortConfig} requestSort={requestSort}>Status</SortableTH>
                  <SortableTH columnKey="tribe" sortConfig={sortConfig} requestSort={requestSort}>Tribe</SortableTH>
                  <SortableTH columnKey="latestClinicalRecord" sortConfig={sortConfig} requestSort={requestSort}>Latest Clinical Note</SortableTH>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedPatients.map((patient) => (
                  <tr key={patient.uid}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                       <Link to={`/patients/${patient.uid}`} className="hover:underline text-primary-600 dark:text-primary-400">{patient.firstName} {patient.lastName}</Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{patient.uid}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(patient.status)}`}>{patient.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{patient.tribe || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{latestRecordMap.get(patient.uid) || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link to={`/patients/${patient.uid}`} className="text-primary-600 hover:text-primary-900 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">View</Link>
                      {canDelete && ( <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(patient)}><Trash className="w-4 h-4 text-red-500" /></Button> )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
      
      <ScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} />
      
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