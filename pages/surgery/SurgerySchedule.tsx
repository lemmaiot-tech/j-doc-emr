import React, { useState, useMemo } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
// FIX: Imported Patient type for useMemo explicit typing.
import { SurgicalProcedure, SurgeryStatus, Role, Patient } from '../../types';
import Modal from '../../components/ui/Modal';
import ConsentForm from './ConsentForm';
import { Scissors, Hourglass, CheckCircle, PlusCircle } from '../../components/icons/Icons';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../patients/firebase';
import EmptyState from '../../components/ui/EmptyState';
import { doc, updateDoc } from 'firebase/firestore';
import SurgeryCalendar from './SurgeryCalendar';
import AddSurgeryForm from './AddSurgeryForm';
import { Link } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

const SurgerySchedule: React.FC = () => {
    const [consentModalOpen, setConsentModalOpen] = useState(false);
    const [confirmCancelModalOpen, setConfirmCancelModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedSurgery, setSelectedSurgery] = useState<SurgicalProcedure | null>(null);
    const { userProfile } = useAuth();
    
    // State for calendar and filters
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [consentFilter, setConsentFilter] = useState('all'); // 'all', 'signed', 'not_signed'


    const allSurgeries = useLiveQuery(() => 
        localDB.surgeries.toArray(), 
        []
    );

    const patients = useLiveQuery(() => localDB.patients.toArray(), []);
    const patientMap = useMemo<Map<string, string>>(() => {
        if (!patients) return new Map();
        return new Map(patients.map(p => [p.uid, `${p.firstName} ${p.lastName}`]));
    }, [patients]);

    const isAnyFilterActive = searchTerm || statusFilter !== 'all' || consentFilter !== 'all';

    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setConsentFilter('all');
    };

    const filteredAndSortedSurgeries = useMemo(() => {
        if (!allSurgeries) return [];
        let items = [...allSurgeries];

        if (selectedDate) {
            items = items.filter(s => {
                const surgeryDate = s.createdAt.toISOString().split('T')[0];
                const selected = selectedDate.toISOString().split('T')[0];
                return surgeryDate === selected;
            });
        }
        
        // Apply text search filter
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            items = items.filter(s => {
                const patientName = patientMap.get(s.patientUid)?.toLowerCase() || '';
                return patientName.includes(lowerSearchTerm) || s.procedureName.toLowerCase().includes(lowerSearchTerm);
            });
        }
        
        // Apply status filter
        if (statusFilter !== 'all') {
            items = items.filter(s => s.status === statusFilter);
        }
        
        // Apply consent filter
        if (consentFilter !== 'all') {
            const isSigned = consentFilter === 'signed';
            items = items.filter(s => s.consentSigned === isSigned);
        }

        items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        return items;
    }, [allSurgeries, selectedDate, patientMap, searchTerm, statusFilter, consentFilter]);


    const stats = useLiveQuery(async () => {
        const total = await localDB.surgeries.count();
        const scheduled = await localDB.surgeries.where('status').equals(SurgeryStatus.Scheduled).count();
        const completed = await localDB.surgeries.where('status').equals(SurgeryStatus.Completed).count();
        return { total, scheduled, completed };
    }, []);

    const getStatusColor = (status: SurgeryStatus) => {
        switch(status) {
            case SurgeryStatus.Scheduled: return 'bg-blue-100 text-blue-800';
            case SurgeryStatus.Completed: return 'bg-green-100 text-green-800';
            case SurgeryStatus.Cancelled: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    const handleUpdateStatus = async (surgery: SurgicalProcedure, status: SurgeryStatus) => {
        const updatedData: { status: SurgeryStatus, updatedAt: Date, syncStatus: 'synced' | 'pending' } = { status, updatedAt: new Date(), syncStatus: 'pending' };
        try {
            const surgeryDocRef = doc(db, 'surgeries', surgery.uid);
            await updateDoc(surgeryDocRef, {
                status,
                updatedAt: updatedData.updatedAt
            });
            updatedData.syncStatus = 'synced';
        } catch(err) {
            console.warn("Could not update Firestore, will sync later.", err);
        } finally {
            await localDB.surgeries.update(surgery.uid, updatedData);
        }
    };

    const handleCancelClick = (surgery: SurgicalProcedure) => {
        setSelectedSurgery(surgery);
        setConfirmCancelModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (selectedSurgery) {
            await handleUpdateStatus(selectedSurgery, SurgeryStatus.Cancelled);
        }
        setConfirmCancelModalOpen(false);
        setSelectedSurgery(null);
    };
    
    const handleSignConsentClick = (surgery: SurgicalProcedure) => {
        setSelectedSurgery(surgery);
        setConsentModalOpen(true);
    };

    const handleConsentSave = async (signature: string) => {
        if (!selectedSurgery) return;

        const updatedData: {
            consentSigned: boolean;
            consentSignature: string;
            updatedAt: Date;
            syncStatus: 'synced' | 'pending';
        } = {
            consentSigned: true,
            consentSignature: signature,
            updatedAt: new Date(),
            syncStatus: 'pending'
        };

        try {
            const surgeryDocRef = doc(db, 'surgeries', selectedSurgery.uid);
            await updateDoc(surgeryDocRef, {
                consentSigned: true,
                consentSignature: signature,
                updatedAt: updatedData.updatedAt
            });
            updatedData.syncStatus = 'synced';
        } catch (err) {
            console.warn("Could not update consent in Firestore, will sync later.", err);
        } finally {
            await localDB.surgeries.update(selectedSurgery.uid, updatedData);
            setConsentModalOpen(false);
            setSelectedSurgery(null);
        }
    };

    const canManageSchedule = userProfile?.role === Role.Admin || userProfile?.role === Role.Surgeon;
    const canAddSurgery = userProfile?.role === Role.Admin || userProfile?.role === Role.Surgeon;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <Card>
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-800/50 mr-4">
                    <Scissors className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total ?? '...'}</p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Surgeries</p>
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

      <SurgeryCalendar 
        surgeries={allSurgeries || []}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        currentDate={currentCalendarDate}
        setCurrentDate={setCurrentCalendarDate}
      />

      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold">Surgery Schedule</h1>
            {selectedDate && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing surgeries for {selectedDate.toLocaleDateString()}
                </p>
            )}
          </div>
          {canAddSurgery && (
            <Button onClick={() => setIsAddModalOpen(true)}>
                <PlusCircle className="w-5 h-5 mr-2" />
                Add Surgery
            </Button>
          )}
        </div>
        
        {/* Filtering UI */}
        <div className="mb-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input placeholder="Search by patient or procedure..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} label="Search" />
                <Select label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Statuses</option>
                    {Object.values(SurgeryStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
                <Select label="Consent" value={consentFilter} onChange={e => setConsentFilter(e.target.value)}>
                    <option value="all">All Consent</option>
                    <option value="signed">Signed</option>
                    <option value="not_signed">Not Signed</option>
                </Select>
            </div>
            {isAnyFilterActive && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="!text-sm !text-primary-600 hover:!bg-primary-100 dark:hover:!bg-primary-900/50">Clear Filters</Button>
            )}
        </div>

        <div className="overflow-x-auto">
          {allSurgeries === undefined ? (
            <div className="text-center py-10">
              <div className="flex justify-center items-center text-gray-500">
                <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-primary-600 mr-3"></div>
                Loading surgery schedule...
              </div>
            </div>
          ) : filteredAndSortedSurgeries.length === 0 ? (
            <EmptyState
              icon={<Scissors className="w-8 h-8" />}
              title={selectedDate || isAnyFilterActive ? "No Matching Surgeries" : "No Surgeries Scheduled"}
              message={selectedDate || isAnyFilterActive ? "No surgeries match your filter criteria for the selected date." : "There are currently no surgeries on the schedule."}
            />
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Patient</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Procedure</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Consent</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedSurgeries.map((s) => (
                  <tr key={s.uid}>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/patients/${s.patientUid}`} className="hover:underline">
                            <div className="text-sm font-medium text-primary-600 dark:text-primary-400">{patientMap.get(s.patientUid) || 'Unknown Patient'}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">{s.patientUid}</div>
                        </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{s.procedureName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {s.consentSigned ? (
                        <span className="text-green-600 font-semibold">Signed</span>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => handleSignConsentClick(s)}>Sign Consent</Button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(s.status)}`}>
                          {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {s.status === SurgeryStatus.Scheduled && canManageSchedule && (
                          <>
                              <Button size="sm" variant="secondary" onClick={() => handleCancelClick(s)}>Cancel</Button>
                              <Button size="sm" onClick={() => handleUpdateStatus(s, SurgeryStatus.Completed)}>Mark as Done</Button>
                          </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule New Surgery"
      >
        <AddSurgeryForm 
            onSave={() => setIsAddModalOpen(false)}
            onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      <Modal 
        isOpen={consentModalOpen} 
        onClose={() => {
            setConsentModalOpen(false);
            setSelectedSurgery(null);
        }} 
        title="Surgical Consent Form"
      >
        <ConsentForm onSave={handleConsentSave} />
      </Modal>

      <ConfirmationModal
        isOpen={confirmCancelModalOpen}
        onClose={() => setConfirmCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Surgery"
        message={`Are you sure you want to cancel the surgery "${selectedSurgery?.procedureName}" for patient ${selectedSurgery?.patientUid}?`}
        confirmText="Yes, Cancel Surgery"
      />
    </>
  );
};

export default SurgerySchedule;