
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { PlusCircle, Pill, Hourglass, CheckCircle } from '../../components/icons/Icons';
import { Prescription, PrescriptionStatus, Role } from '../../types';
import Modal from '../../components/ui/Modal';
import AddPrescriptionForm from './AddPrescriptionForm';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../patients/firebase';
import EmptyState from '../../components/ui/EmptyState';
import { doc, updateDoc } from 'firebase/firestore';

const PharmacyQueue: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userProfile } = useAuth();
  
  const prescriptions = useLiveQuery(() => 
    localDB.prescriptions.orderBy('createdAt').reverse().toArray(), 
    []
  );
  
  const stats = useLiveQuery(async () => {
    const total = await localDB.prescriptions.count();
    const pending = await localDB.prescriptions.where('status').equals(PrescriptionStatus.Pending).count();
    const dispensed = await localDB.prescriptions.where('status').equals(PrescriptionStatus.Dispensed).count();
    return { total, pending, dispensed };
  }, []);

  const getStatusColor = (status: PrescriptionStatus) => {
    switch(status) {
        case PrescriptionStatus.Pending: return 'bg-yellow-100 text-yellow-800';
        case PrescriptionStatus.Dispensed: return 'bg-green-100 text-green-800';
        case PrescriptionStatus.NotAvailable: return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  }

  const handleUpdateStatus = async (prescription: Prescription, status: PrescriptionStatus) => {
    const updatedData: { status: PrescriptionStatus, updatedAt: Date, syncStatus: 'synced' | 'pending' } = { status, updatedAt: new Date(), syncStatus: 'pending' };
    try {
        // First, try to update Firestore for real-time notifications
        const prescrDocRef = doc(db, 'prescriptions', prescription.uid);
        await updateDoc(prescrDocRef, {
            status,
            updatedAt: updatedData.updatedAt
        });
        updatedData.syncStatus = 'synced';
    } catch(err) {
        console.warn("Could not update Firestore, will sync later.", err);
    } finally {
        // Always update the local DB using uid
        await localDB.prescriptions.update(prescription.uid, updatedData);
    }
  }

  const canAddPrescription = userProfile?.role === Role.Admin || userProfile?.role === Role.Doctor;
  const canUpdateStatus = userProfile?.role === Role.Admin || userProfile?.role === Role.Pharmacist || userProfile?.role === Role.Nurse;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <Card>
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-800/50 mr-4">
                    <Pill className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total ?? '...'}</p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Prescriptions</p>
                </div>
            </div>
        </Card>
        <Card>
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-800/50 mr-4">
                    <Hourglass className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.pending ?? '...'}</p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
                </div>
            </div>
        </Card>
        <Card>
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-800/50 mr-4">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.dispensed ?? '...'}</p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Dispensed</p>
                </div>
            </div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Pharmacy Queue</h1>
          {canAddPrescription && (
            <Button onClick={() => setIsModalOpen(true)}>
                <PlusCircle className="w-5 h-5 mr-2" />
                Add Prescription
            </Button>
          )}
        </div>
        <div className="overflow-x-auto">
          {prescriptions === undefined ? (
            <div className="text-center py-10">
              <div className="flex justify-center items-center text-gray-500">
                <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-primary-600 mr-3"></div>
                Loading prescriptions...
              </div>
            </div>
          ) : prescriptions.length === 0 ? (
            <EmptyState
              icon={<Pill className="w-8 h-8" />}
              title="Pharmacy Queue is Empty"
              message="No prescriptions are currently pending. Prescriptions added by doctors will appear here."
              action={
                canAddPrescription ? (
                  <Button onClick={() => setIsModalOpen(true)}>
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Add Prescription
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Patient ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Drug</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dosage</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sync Status</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {prescriptions.map((p) => (
                  <tr key={p.uid}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">{p.patientUid}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{p.drug}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{p.dosage}</td>
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
                      {p.status === PrescriptionStatus.Pending && canUpdateStatus && (
                          <>
                              <Button size="sm" onClick={() => handleUpdateStatus(p, PrescriptionStatus.Dispensed)}>Dispense</Button>
                              <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(p, PrescriptionStatus.NotAvailable)}>Not Available</Button>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Prescription">
        <AddPrescriptionForm 
          onSave={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
};

export default PharmacyQueue;
