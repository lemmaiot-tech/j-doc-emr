import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import { DentalProcedure, DentalProcedureStatus } from '../../types';
import { Tooth, Hourglass, CheckCircle } from '../../components/icons/Icons';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

const DentalDashboard: React.FC = () => {
    const [confirmCancelModalOpen, setConfirmCancelModalOpen] = useState(false);
    const [selectedProcedure, setSelectedProcedure] = useState<DentalProcedure | null>(null);

    // Seed initial data for demonstration
    useEffect(() => {
        const seedData = async () => {
            const count = await localDB.dentalProcedures.count();
            if (count === 0) {
                const mockProcedures: DentalProcedure[] = [
                    {
                        uid: `dental_${Date.now()}_1`,
                        patientUid: 'pat_1715012345678',
                        procedureName: 'Root Canal Therapy',
                        dentistUid: 'user_admin',
                        status: DentalProcedureStatus.Scheduled,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        syncStatus: 'pending'
                    },
                    {
                        uid: `dental_${Date.now()}_2`,
                        patientUid: 'pat_1715012345679',
                        procedureName: 'Wisdom Tooth Extraction',
                        dentistUid: 'user_admin',
                        status: DentalProcedureStatus.Completed,
                        createdAt: new Date(Date.now() - 86400000), // yesterday
                        updatedAt: new Date(),
                        syncStatus: 'synced'
                    },
                ];
                await localDB.dentalProcedures.bulkAdd(mockProcedures);
            }
        };
        seedData();
    }, []);

    const procedures = useLiveQuery(() => 
        localDB.dentalProcedures.orderBy('createdAt').reverse().toArray(), 
        []
    );

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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Patient ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Procedure</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sync Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {procedures === undefined && (
                <tr>
                  <td colSpan={5} className="text-center py-10">
                    <div className="flex justify-center items-center text-gray-500">
                      <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-primary-600 mr-3"></div>
                      Loading procedures...
                    </div>
                  </td>
                </tr>
              )}
              {procedures?.map((p) => (
                <tr key={p.uid}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">{p.patientUid}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{p.procedureName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(p.status)}`}>
                        {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {p.syncStatus === 'synced' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Synced</span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                    )}
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
              {procedures && procedures.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">No dental procedures scheduled.</td>
                </tr>
              )}
            </tbody>
          </table>
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
