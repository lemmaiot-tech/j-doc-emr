import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SyncProvider } from './contexts/SyncProvider'; // FIX: Changed to the more advanced provider
import { UndoProvider } from './contexts/UndoContext';
import { NotificationProvider } from './contexts/NotificationContext'; // Import NotificationProvider
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import PharmacyQueue from './pages/pharmacy/PharmacyQueue';
import SurgerySchedule from './pages/surgery/SurgerySchedule';
import PatientList from './pages/patients/PatientList';
import PatientDetail from './pages/patients/PatientDetail';
import NotFound from './pages/NotFound';
import { Role } from './types';
import AddUser from './pages/admin/AddUser';
import EditUser from './pages/admin/EditUser';
import ForgotPassword from './pages/ForgotPassword';
import ProfileSettings from './pages/ProfileSettings';
import DentalDashboard from './pages/dental/DentalDashboard';
import PatientFormPage from './pages/patients/PatientFormPage';
import AuditLog from './pages/admin/AuditLog';
import LaboratoryDashboard from './pages/laboratory/LaboratoryDashboard';
import PhysiotherapyDashboard from './pages/physiotherapy/PhysiotherapyDashboard';
import GeneralConsultationDashboard from './pages/general/GeneralConsultationDashboard';
import EyeEntDashboard from './pages/eyeent/EyeEntDashboard';
import PaediatricsDashboard from './pages/paediatrics/PaediatricsDashboard';
import OAndGDashboard from './pages/oandg/OAndGDashboard';

function App() {
  return (
    <AuthProvider>
      <UndoProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <SyncProvider>
                    <NotificationProvider> {/* Add NotificationProvider here */}
                      <Layout />
                    </NotificationProvider>
                  </SyncProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="patients" element={<PatientList />} />
              <Route path="patients/add" element={<PatientFormPage />} />
              <Route path="patients/edit/:patientUid" element={<ProtectedRoute roles={[Role.Admin]}><PatientFormPage /></ProtectedRoute>} />
              <Route path="patients/:patientUid" element={<PatientDetail />} />
              <Route path="pharmacy" element={<PharmacyQueue />} />
              <Route path="surgery" element={<SurgerySchedule />} />
              <Route path="dental" element={<DentalDashboard />} />
              <Route path="laboratory" element={<LaboratoryDashboard />} />
              <Route path="physiotherapy" element={<PhysiotherapyDashboard />} />
              <Route path="general-consultation" element={<GeneralConsultationDashboard />} />
              <Route path="eye-ent" element={<EyeEntDashboard />} />
              <Route path="paediatrics" element={<PaediatricsDashboard />} />
              <Route path="o-and-g" element={<OAndGDashboard />} />
              <Route path="profile" element={<ProfileSettings />} />

              {/* Admin Routes */}
              <Route path="admin/users" element={<ProtectedRoute roles={[Role.Admin]}><UserManagement /></ProtectedRoute>} />
              <Route path="admin/users/add" element={<ProtectedRoute roles={[Role.Admin]}><AddUser /></ProtectedRoute>} />
              <Route path="admin/users/edit/:uid" element={<ProtectedRoute roles={[Role.Admin]}><EditUser /></ProtectedRoute>} />
              <Route path="admin/departments" element={<ProtectedRoute roles={[Role.Admin]}><DepartmentManagement /></ProtectedRoute>} />
              <Route path="admin/audit-log" element={<ProtectedRoute roles={[Role.Admin]}><AuditLog /></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </HashRouter>
      </UndoProvider>
    </AuthProvider>
  );
}

export default App;