import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './hooks/useToast';
import { WorkspaceProvider } from './hooks/useWorkspaceData';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <ToastProvider>
      <WorkspaceProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/doctors" element={<DoctorsPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </WorkspaceProvider>
    </ToastProvider>
  );
}

export default App;

