import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '../../services/localdb';
import { VitalSign, Role } from '../../types';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

interface VitalSignsProps {
  patientUid: string;
}

const VitalSigns: React.FC<VitalSignsProps> = ({ patientUid }) => {
  const [bloodPressure, setBloodPressure] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { userProfile } = useAuth();

  const vitalSignsHistory = useLiveQuery(
    () => localDB.vitals.where('patientUid').equals(patientUid).reverse().sortBy('createdAt'),
    [patientUid],
    []
  );

  useEffect(() => {
    const heightInMeters = parseFloat(height) / 100;
    const weightInKg = parseFloat(weight);
    if (heightInMeters > 0 && weightInKg > 0) {
      const calculatedBmi = weightInKg / (heightInMeters * heightInMeters);
      setBmi(calculatedBmi.toFixed(2));
    } else {
      setBmi('');
    }
  }, [weight, height]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation, can be enhanced
    if (!bloodPressure) {
      setError('Please fill all required vital signs fields.');
      return;
    }
    setLoading(true);
    setError('');

    const newVitals: VitalSign = {
      uid: `vitals_${Date.now()}`,
      patientUid,
      bloodPressure,
      heartRate: heartRate ? parseFloat(heartRate) : undefined,
      temperature: temperature ? parseFloat(temperature) : undefined,
      respiratoryRate: respiratoryRate ? parseInt(respiratoryRate, 10) : undefined,
      weightKg: weight ? parseFloat(weight) : undefined,
      heightCm: height ? parseFloat(height) : undefined,
      bmi: bmi ? parseFloat(bmi) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
    };

    try {
      await localDB.vitals.put(newVitals);
      // Reset form
      setBloodPressure('');
      setHeartRate('');
      setTemperature('');
      setRespiratoryRate('');
      setWeight('');
      setHeight('');
      setBmi('');
    } catch (err) {
      console.error('Failed to save vitals:', err);
      setError('Failed to save vital signs.');
    } finally {
      setLoading(false);
    }
  };
  
  const canRecordVitals = userProfile && [
    Role.Doctor,
    Role.Nurse,
    Role.Surgeon,
    Role.Dentist,
    Role.Physiotherapist
  ].includes(userProfile.role);

  return (
    <Card title="Vital Signs">
      {/* Form for new vitals */}
      {canRecordVitals && (
        <form onSubmit={handleSubmit} className="mb-6 border-b pb-6 dark:border-gray-700">
          <h4 className="text-md font-semibold mb-4 text-gray-700 dark:text-gray-300">Record New Vitals</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Blood Pressure (required)"
              placeholder="e.g. 120/80"
              value={bloodPressure}
              onChange={(e) => setBloodPressure(e.target.value)}
              required
            />
            <Input
              label="Heart Rate (bpm)"
              type="number"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
            />
            <Input
              label="Temperature (°C)"
              type="number"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
            />
            <Input
              label="Respiratory Rate"
              placeholder="breaths/min"
              type="number"
              value={respiratoryRate}
              onChange={(e) => setRespiratoryRate(e.target.value)}
            />
            <Input
              label="Weight (kg)"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <Input
              label="Height (cm)"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
             <Input
              label="BMI"
              value={bmi}
              disabled
              className="bg-gray-100 dark:bg-gray-700"
              readOnly
            />
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Vitals'}
            </Button>
          </div>
        </form>
      )}

      {/* Historical Data */}
      <div>
        <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">History</h4>
        <div className="overflow-auto max-h-64">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase sticky top-0 bg-white dark:bg-gray-800">
              <tr>
                <th className="py-2 pr-2">Date & Time</th>
                <th className="py-2 px-2">BP</th>
                <th className="py-2 px-2">HR</th>
                <th className="py-2 px-2">Temp</th>
                <th className="py-2 px-2">RR</th>
                <th className="py-2 px-2">Weight</th>
                <th className="py-2 px-2">Height</th>
                <th className="py-2 px-2">BMI</th>
                <th className="py-2 pl-2">Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {vitalSignsHistory?.map(vitals => (
                <tr key={vitals.uid}>
                  <td className="py-2 pr-2 whitespace-nowrap">{vitals.createdAt.toLocaleString()}</td>
                  <td className="py-2 px-2">{vitals.bloodPressure}</td>
                  <td className="py-2 px-2">{vitals.heartRate ?? 'N/A'}</td>
                  <td className="py-2 px-2">{vitals.temperature ? `${vitals.temperature}°C` : 'N/A'}</td>
                  <td className="py-2 px-2">{vitals.respiratoryRate ?? 'N/A'}</td>
                  <td className="py-2 px-2">{vitals.weightKg ? `${vitals.weightKg} kg` : 'N/A'}</td>
                  <td className="py-2 px-2">{vitals.heightCm ? `${vitals.heightCm} cm` : 'N/A'}</td>
                  <td className="py-2 px-2">{vitals.bmi ?? 'N/A'}</td>
                  <td className="py-2 pl-2">
                    {vitals.syncStatus === 'synced' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Synced</span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
              {vitalSignsHistory && vitalSignsHistory.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">No vital signs recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

export default VitalSigns;