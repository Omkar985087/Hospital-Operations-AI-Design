import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { useWorkspace } from '../hooks/useWorkspaceData';

const ROUTE_META = {
  '/': { title: 'Dashboard', breadcrumb: 'Overview' },
  '/patients': { title: 'Patients', breadcrumb: 'Patient Management' },
  '/appointments': { title: 'Appointments', breadcrumb: 'Scheduling & Slots' },
  '/doctors': { title: 'Doctors', breadcrumb: 'Medical Staff Directory' },
  '/documents': { title: 'Documents', breadcrumb: 'Document Intelligence (RAG)' },
  '/settings': { title: 'Settings', breadcrumb: 'System & Preferences' },
};

export function DashboardLayout() {
  const { pathname } = useLocation();
  const { settings, updateSettings } = useWorkspace();
  const [mobileOpen, setMobileOpen] = useState(false);

  const meta = ROUTE_META[pathname] || {
    title: 'Hospital Operations AI',
    breadcrumb: 'Workspace',
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      <Sidebar
        collapsed={settings.sidebarCollapsed}
        onToggleCollapse={() =>
          updateSettings({ sidebarCollapsed: !settings.sidebarCollapsed })
        }
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={`flex min-h-screen flex-col transition-all duration-200 ${
          settings.sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        }`}
      >
        <Navbar
          title={meta.title}
          breadcrumb={meta.breadcrumb}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;

