import React, { useState, useEffect, useMemo } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
// FIX: Imported Patient type for useMemo explicit typing.
import { DentalProcedure, DentalProcedureStatus, Patient } from '../../types';
import { Tooth, Hourglass, CheckCircle } from '../../components/icons/Icons';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import EmptyState from '../../components/ui/EmptyState';
import { Link } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

const DentalDashboard: React.FC = () => {
    const [confirmCancelModalOpen, setConfirmCancelModalOpen] = useState(false);
    const [selectedProcedure, setSelectedProcedure] = useState<DentalProcedure | null>(null);
    
    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');

    const procedures = useLiveQuery(() => 
        localDB.dentalProcedures.orderBy('createdAt').reverse().toArray(), 
        []
    );

    const patients = useLiveQuery(() => localDB.patients.toArray(), []);

    const patientMap = useMemo<Map<string, string>>(() => {
        if (!patients) return new Map();
        return new Map(patients.map(p => [p.uid, `${p.firstName} ${p.lastName}`]));
    }, [patients]);
    
    const filteredProcedures = useMemo(() => {
        if (!procedures) return [];
        return procedures.filter(p => {
            const patientName = patientMap.get(p.patientUid)?.toLowerCase() || '';
            const lowerSearchTerm = searchTerm.toLowerCase();

            const matchesSearch = searchTerm ? patientName.includes(lowerSearchTerm) || p.procedureName.toLowerCase().includes(lowerSearchTerm) : true;
            const matchesStatus = statusFilter !== 'all' ? p.status === statusFilter : true;
            const matchesDate = dateFilter ? p.createdAt.toISOString().startsWith(dateFilter) : true;

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [procedures, patientMap, searchTerm, statusFilter, dateFilter]);

    const isAnyFilterActive = searchTerm || statusFilter !== 'all' || dateFilter;

    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setDateFilter('');
    };

    const stats = useLiveQuery(async () => {
        const total = await localDB.dentalProcedures.count();
        const scheduled = await localDB.dentalProcedures.where('status').equals(DentalProcedureStatus.Scheduled).count();
        const completed = await localDB.dentalProcedures.where('status').equals(DentalProcedureStatus.Completed).count();
        return { total, scheduled, completed };
    }, []);

    const getStatusColor = (status: DentalProcedureStatus) => {
        switch(status) {
            case DentalProcedureStatus.Scheduled: return 'bg-blue-100 text-blue-800';
            case DentalProcedureStatus.InProgress: return 'bg-yellow-100 text-yellow-800';
            case DentalProcedureStatus.Completed: return 'bg-green-100 text-green-800';
            case DentalProcedureStatus.Cancelled: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    const handleUpdateStatus = async (procedure: DentalProcedure, status: DentalProcedureStatus) => {
        try {
            await localDB.dentalProcedures.update(procedure.uid, { status, updatedAt: new Date(), syncStatus: 'pending' });
        } catch(err) {
            console.error("Failed to update dental procedure status", err);
            alert("Failed to update status.");
        }
    };

    const handleCancelClick = (procedure: DentalProcedure) => {
        setSelectedProcedure(procedure);
        setConfirmCancelModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (selectedProcedure) {
            await handleUpdateStatus(selectedProcedure, DentalProcedureStatus.Cancelled);
        }
        setConfirmCancelModalOpen(false);
        setSelectedProcedure(null);
    };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <Card>
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-800/50 mr-4">
                    <Tooth className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total ?? '...'}</p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Procedures</p>
                </div>
            </div>
        </Card>
        <Card>
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-800/50 mr-4">
                    <Hourglass className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.scheduled ?? '...'}</p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Scheduled</p>
                </div>
            </div>
        </Card>
        <Card>
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-800/50 mr-4">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.completed ?? '...'}</p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
                </div>
            </div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Dental Procedures</h1>
        </div>

        {/* Filtering UI */}
        <div className="mb-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input placeholder="Search by patient or procedure..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} label="Search" />
                <Select label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Statuses</option>
                    {Object.values(DentalProcedureStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
                <Input label="Date" type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
            </div>
            {isAnyFilterActive && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="!text-sm !text-primary-600 hover:!bg-primary-100 dark:hover:!bg-primary-900/50">Clear Filters</Button>
            )}
        </div>

        <div className="overflow-x-auto">
          {procedures === undefined ? (
             <div className="text-center py-10">
                <div className="flex justify-center items-center text-gray-500">
                  <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-primary-600 mr-3"></div>
                  Loading procedures...
                </div>
              </div>
          ) : filteredProcedures.length === 0 ? (
            <EmptyState
                icon={<Tooth className="w-8 h-8" />}
                title={isAnyFilterActive ? "No Matching Procedures" : "No Dental Procedures"}
                message={isAnyFilterActive ? "No procedures match your filter criteria." : "There are no dental procedures scheduled at the moment."}
            />
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Patient</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Procedure</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProcedures.map((p) => (
                    <tr key={p.uid}>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/patients/${p.patientUid}`} className="hover:underline">
                            <div className="text-sm font-medium text-primary-600 dark:text-primary-400">{patientMap.get(p.patientUid) || 'Unknown Patient'}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">{p.patientUid}</div>
                        </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{p.procedureName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(p.status)}`}>
                            {p.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {p.status === DentalProcedureStatus.Scheduled && (
                            <>
                                <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(p, DentalProcedureStatus.InProgress)}>Start</Button>
                                <Button size="sm" onClick={() => handleUpdateStatus(p, DentalProcedureStatus.Completed)}>Complete</Button>
                            </>
                        )}
                        {p.status === DentalProcedureStatus.InProgress && (
                            <Button size="sm" onClick={() => handleUpdateStatus(p, DentalProcedureStatus.Completed)}>Complete</Button>
                        )}
                        {(p.status === DentalProcedureStatus.Scheduled || p.status === DentalProcedureStatus.InProgress) && (
                            <Button size="sm" variant="danger" onClick={() => handleCancelClick(p)}>Cancel</Button>
                        )}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
          )}
        </div>
      </Card>

      <ConfirmationModal
        isOpen={confirmCancelModalOpen}
        onClose={() => setConfirmCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Procedure"
        message={`Are you sure you want to cancel the procedure "${selectedProcedure?.procedureName}" for patient ${selectedProcedure?.patientUid}?`}
        confirmText="Yes, Cancel Procedure"
      />
    </>
  );
};

export default DentalDashboard;