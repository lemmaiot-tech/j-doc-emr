import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { localDB } from '../../services/localdb';
import { DepartmentId } from '../../types';
import DepartmentDashboard from '../../components/dashboards/DepartmentDashboard';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { Users, FileText } from '../../components/icons/Icons'; // Using Users icon for O&G
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const RecentOAndGNotes: React.FC = () => {
    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    const allNotes = useLiveQuery(
        () => localDB.oAndGHistory.orderBy('createdAt').reverse().toArray(),
        [],
        []
    );

    const patients = useLiveQuery(() => localDB.patients.toArray(), []);
    const patientMap = useMemo(() => {
        if (!patients) return new Map();
        return new Map(patients.map(p => [p.uid, `${p.firstName} ${p.lastName}`]));
    }, [patients]);
    
    const users = useLiveQuery(() => localDB.users.toArray(), []);
    const userMap = useMemo(() => {
      if (!users) return new Map();
      return new Map(users.map(u => [u.uid, u.displayName]));
    }, [users]);

    const filteredNotes = useMemo(() => {
        if (!allNotes) return [];
        return allNotes.filter(note => {
            const patientName = patientMap.get(note.patientUid)?.toLowerCase() || '';
            const lowerSearchTerm = searchTerm.toLowerCase();

            const matchesSearch = searchTerm 
                ? patientName.includes(lowerSearchTerm) || 
                  note.clinicalFinding.toLowerCase().includes(lowerSearchTerm) || 
                  (note.diagnosis || '').toLowerCase().includes(lowerSearchTerm)
                : true;

            const matchesDate = dateFilter ? note.createdAt.toISOString().startsWith(dateFilter) : true;
            
            return matchesSearch && matchesDate;
        });
    }, [allNotes, patientMap, searchTerm, dateFilter]);

    const isAnyFilterActive = searchTerm || dateFilter;

    const handleClearFilters = () => {
        setSearchTerm('');
        setDateFilter('');
    };

    return (
        <Card title="Recent O & G Notes">
            {/* Filtering UI */}
            <div className="mb-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input placeholder="Search patient, finding, diagnosis..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} label="Search Notes" />
                    <Input label="Date" type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
                </div>
                {isAnyFilterActive && (
                    <Button variant="ghost" size="sm" onClick={handleClearFilters} className="!text-sm !text-primary-600 hover:!bg-primary-100 dark:hover:!bg-primary-900/50">Clear Filters</Button>
                )}
            </div>

            {filteredNotes && filteredNotes.length > 0 ? (
                <div className="space-y-4 max-h-[450px] overflow-y-auto">
                    {filteredNotes.map(note => (
                        <div key={note.uid} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md text-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-gray-200">
                                       Note for <Link to={`/patients/${note.patientUid}`} className="text-primary-600 hover:underline">{patientMap.get(note.patientUid) || note.patientUid}</Link>
                                    </p>
                                    {note.diagnosis && <p className="text-xs text-primary-700 dark:text-primary-400">Diagnosis: {note.diagnosis}</p>}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{note.createdAt.toLocaleDateString()}</p>
                            </div>
                            <div className="mt-2 pl-2 border-l-2 border-gray-200 dark:border-gray-600">
                                <p className="font-semibold text-gray-600 dark:text-gray-300">Clinical Finding:</p>
                                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 truncate">{note.clinicalFinding}</p>
                            </div>
                             <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Recorded by: {userMap.get(note.recordedBy) || 'Unknown'}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<FileText className="w-8 h-8" />}
                    title={isAnyFilterActive ? "No Matching Notes" : "No Recent Notes"}
                    message={isAnyFilterActive ? "No O & G notes match your filter criteria." : "New O & G notes will appear here."}
                />
            )}
        </Card>
    );
};


const OAndGDashboard: React.FC = () => {
  return (
    <DepartmentDashboard
      departmentId={DepartmentId.OAndG}
      departmentName="O and G"
      icon={<Users className="w-8 h-8 text-primary-600" />}
    >
        <RecentOAndGNotes />
    </DepartmentDashboard>
  );
};

export default OAndGDashboard;