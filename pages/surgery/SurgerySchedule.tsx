import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import { SurgicalProcedure, SurgeryStatus, Role } from '../../types';
import Modal from '../../components/ui/Modal';
import ConsentForm from './ConsentForm';
import { Scissors, Hourglass, CheckCircle } from '../../components/icons/Icons';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../patients/firebase';

const SurgerySchedule: React.FC = () => {
    const [consentModalOpen, setConsentModalOpen] = useState(false);
    const [confirmCancelModalOpen, setConfirmCancelModalOpen] = useState(false);
    const [selectedSurgery, setSelectedSurgery] = useState<SurgicalProcedure | null>(null);
    const { userProfile } = useAuth();

    const surgeries = useLiveQuery(() => 
        localDB.surgeries.orderBy('createdAt').reverse().toArray(), 
        []
    );

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
            // First, try to update Firestore for real-time notifications
            await updateDoc(doc(db, 'surgeries', surgery.uid), {
                status,
                updatedAt: updatedData.updatedAt
            });
            updatedData.syncStatus = 'synced';
        } catch(err) {
            console.warn("Could not update Firestore, will sync later.", err);
        } finally {
            // Always update the local DB using uid
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

    const canManageSchedule = userProfile?.role === Role.Admin || userProfile?.role === Role.Surgeon;

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

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Surgery Schedule</h1>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Patient ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Procedure</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Consent</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sync Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {surgeries === undefined && (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <div className="flex justify-center items-center text-gray-500">
                      <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-primary-600 mr-3"></div>
                      Loading surgery schedule...
                    </div>
                  </td>
                </tr>
              )}
              {surgeries?.map((s) => (
                <tr key={s.uid}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">{s.patientUid}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{s.procedureName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {s.consentSigned ? (
                      <span className="text-green-600 font-semibold">Signed</span>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => setConsentModalOpen(true)}>Sign Consent</Button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(s.status)}`}>
                        {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {s.syncStatus === 'synced' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Synced</span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                    )}
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
              {surgeries && surgeries.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">No surgeries scheduled.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={consentModalOpen} onClose={() => setConsentModalOpen(false)} title="Surgical Consent Form">
        <ConsentForm onSave={(signature) => {
            console.log("Signature saved:", signature.substring(0, 30) + "...");
            setConsentModalOpen(false);
        }} />
      </Modal>

      <ConfirmationModal
        isOpen={confirmCancelModalOpen}
        onClose={() => setConfirmCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Surgery"
        message={`Are you sure you want to cancel the surgery "${selectedSurgery?.procedureName}" for patient ${selectedSurgery?.patientUid}? This action cannot be undone.`}
        confirmText="Yes, Cancel Surgery"
      />
    </>
  );
};

export default SurgerySchedule;