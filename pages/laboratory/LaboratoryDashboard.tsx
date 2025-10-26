import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { localDB } from '../../services/localdb';
import { DepartmentId } from '../../types';
import DepartmentDashboard from '../../components/dashboards/DepartmentDashboard';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { TestTube2, FileText } from '../../components/icons/Icons';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

const RecentLabResults: React.FC = () => {
    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [hepBFilter, setHepBFilter] = useState('all');
    const [rvsFilter, setRvsFilter] = useState('all');
    
    const allResults = useLiveQuery(
        () => localDB.laboratoryResults.orderBy('createdAt').reverse().toArray(),
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

    const filteredResults = useMemo(() => {
        if (!allResults) return [];
        return allResults.filter(r => {
            const patientName = patientMap.get(r.patientUid)?.toLowerCase() || '';
            const lowerSearchTerm = searchTerm.toLowerCase();

            const matchesSearch = searchTerm ? patientName.includes(lowerSearchTerm) : true;
            const matchesDate = dateFilter ? r.createdAt.toISOString().startsWith(dateFilter) : true;
            const matchesHepB = hepBFilter !== 'all' ? r.hepatitisB === hepBFilter : true;
            const matchesRvs = rvsFilter !== 'all' ? r.rvs === rvsFilter : true;
            
            return matchesSearch && matchesDate && matchesHepB && matchesRvs;
        });
    }, [allResults, patientMap, searchTerm, dateFilter, hepBFilter, rvsFilter]);

    const isAnyFilterActive = searchTerm || dateFilter || hepBFilter !== 'all' || rvsFilter !== 'all';

    const handleClearFilters = () => {
        setSearchTerm('');
        setDateFilter('');
        setHepBFilter('all');
        setRvsFilter('all');
    };

    return (
        <Card title="Recent Lab Results">
            {/* Filtering UI */}
            <div className="mb-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Input placeholder="Search by patient..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} label="Search Patient" />
                    <Input label="Date" type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
                    <Select label="Hepatitis B" value={hepBFilter} onChange={e => setHepBFilter(e.target.value)}>
                        <option value="all">All</option>
                        <option value="Positive">Positive</option>
                        <option value="Negative">Negative</option>
                    </Select>
                    <Select label="RVS" value={rvsFilter} onChange={e => setRvsFilter(e.target.value)}>
                        <option value="all">All</option>
                        <option value="Positive">Positive</option>
                        <option value="Negative">Negative</option>
                    </Select>
                </div>
                {isAnyFilterActive && (
                    <Button variant="ghost" size="sm" onClick={handleClearFilters} className="!text-sm !text-primary-600 hover:!bg-primary-100 dark:hover:!bg-primary-900/50">Clear Filters</Button>
                )}
            </div>

            {filteredResults && filteredResults.length > 0 ? (
                <div className="space-y-4 max-h-[450px] overflow-y-auto">
                    {filteredResults.map(record => (
                        <div key={record.uid} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md text-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-gray-200">
                                       Result for <Link to={`/patients/${record.patientUid}`} className="text-primary-600 hover:underline">{patientMap.get(record.patientUid) || record.patientUid}</Link>
                                    </p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{record.createdAt.toLocaleDateString()}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                                {record.fastingBloodSugar && <div><span className="font-semibold">FBS:</span> {record.fastingBloodSugar}</div>}
                                {record.hepatitisB && <div><span className="font-semibold">Hep B:</span> {record.hepatitisB}</div>}
                                {record.rvs && <div><span className="font-semibold">RVS:</span> {record.rvs}</div>}
                                {record.urinalysis && <div className="col-span-2"><span className="font-semibold">Urinalysis:</span> {record.urinalysis}</div>}
                                {record.others && <div className="col-span-2 mt-1"><span className="font-semibold">Others:</span><p className="whitespace-pre-wrap text-xs pl-2">{record.others}</p></div>}
                            </div>
                            <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Recorded by: {userMap.get(record.recordedBy) || 'Unknown'}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<FileText className="w-8 h-8" />}
                    title={isAnyFilterActive ? "No Matching Results" : "No Recent Results"}
                    message={isAnyFilterActive ? "No lab results match your filter criteria." : "New laboratory results will appear here as they are recorded."}
                />
            )}
        </Card>
    );
};

const LaboratoryDashboard: React.FC = () => {
  return (
    <DepartmentDashboard
      departmentId={DepartmentId.Laboratory}
      departmentName="Laboratory"
      icon={<TestTube2 className="w-8 h-8 text-primary-600" />}
    >
      <RecentLabResults />
    </DepartmentDashboard>
  );
};

export default LaboratoryDashboard;