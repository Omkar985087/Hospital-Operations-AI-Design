import { useState } from 'react';
import { RefreshCw, Server, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { API_BASE_URL } from '../services/api';
import { useWorkspace } from '../hooks/useWorkspaceData';
import { useToast } from '../hooks/useToast';
import { formatDateTime } from '../utils/formatters';

const API_ENDPOINTS = [
  { method: 'GET', path: '/', purpose: 'Backend health & running message' },
  { method: 'POST', path: '/patients/register', purpose: 'Register patient in SQL Server' },
  { method: 'GET', path: '/appointments/doctors', purpose: 'List active doctors and specializations' },
  { method: 'GET', path: '/appointments/available', purpose: 'Fetch unbooked slots by date and doctor' },
  { method: 'POST', path: '/appointments/book', purpose: 'Book appointment slot with lock check' },
  { method: 'GET', path: '/appointments/patient/{patient_id}', purpose: 'Get patient appointment history' },
  { method: 'PATCH', path: '/appointments/{appointment_id}/cancel', purpose: 'Cancel a booked appointment' },
  { method: 'POST', path: '/documents/upload', purpose: 'Upload PDF and run OCR + RAG ingestion' },
  { method: 'POST', path: '/documents/ask', purpose: 'Query patient documents via RAG LLM' },
];

export function SettingsPage() {
  const {
    backendStatus,
    refreshBackendStatus,
    settings,
    updateSettings,
    patients,
    documents,
    clearWorkspaceCache,
  } = useWorkspace();
  const toast = useToast();

  const [testing, setTesting] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    const ok = await refreshBackendStatus();
    setTesting(false);
    if (ok) {
      toast.success('Backend connected', `FastAPI responded at ${API_BASE_URL}`);
    } else {
      toast.error('Connection failed', `Could not reach ${API_BASE_URL}`);
    }
  };

  const handleClearCache = () => {
    clearWorkspaceCache();
    setConfirmClear(false);
    toast.info(
      'Local cache cleared',
      'Browser patient directory, document list, and RAG chat history were cleared.'
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Backend Connectivity */}
      <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#CCFBF1] text-[#0F766E]">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#0F172A]">
                  FastAPI Backend Connection
                </h2>
                <StatusBadge
                  status={
                    backendStatus.state === 'online'
                      ? 'ONLINE'
                      : backendStatus.state === 'offline'
                      ? 'OFFLINE'
                      : 'PENDING'
                  }
                  label={
                    backendStatus.state === 'online'
                      ? 'Connected'
                      : backendStatus.state === 'offline'
                      ? 'Unreachable'
                      : 'Checking…'
                  }
                />
              </div>
              <p className="mt-1 text-xs text-[#64748B]">
                Configured Axios base URL:{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[#0F172A]">
                  {API_BASE_URL}
                </code>
              </p>
              <p className="mt-1 text-xs text-[#64748B]">
                Status: {backendStatus.message}
                {backendStatus.latencyMs !== null && ` (${backendStatus.latencyMs} ms)`}
                {backendStatus.checkedAt && ` · Checked ${formatDateTime(backendStatus.checkedAt)}`}
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={testing}
            onClick={handleTestConnection}
          >
            Test Connection
          </Button>
        </div>
      </section>

      {/* Workspace Preferences */}
      <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-card space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#0F172A]">Workspace Preferences</h3>
          <p className="text-xs text-[#64748B]">
            Customize dashboard behavior and layout defaults.
          </p>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#0F172A]">
                Show synthetic baseline on Dashboard KPIs
              </p>
              <p className="text-xs text-[#64748B]">
                Displays demo patient counts clearly tagged as Demo Data when backend summary
                endpoints are unavailable.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showDemoData}
              onChange={(e) => updateSettings({ showDemoData: e.target.checked })}
              className="h-4 w-4 rounded border-[#E2E8F0] text-[#0F766E] focus:ring-[#0F766E]"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#0F172A]">Compact desktop sidebar</p>
              <p className="text-xs text-[#64748B]">
                Keep the left navigation rail collapsed to icons on wide screens.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.sidebarCollapsed}
              onChange={(e) => updateSettings({ sidebarCollapsed: e.target.checked })}
              className="h-4 w-4 rounded border-[#E2E8F0] text-[#0F766E] focus:ring-[#0F766E]"
            />
          </label>
        </div>
      </section>

      {/* Browser Workspace Storage */}
      <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A]">Local Browser Directory</h3>
            <p className="mt-0.5 text-xs text-[#64748B]">
              Currently tracking {patients.length} patient(s) and {documents.length} uploaded
              document(s) in local browser storage. Clearing this does not delete SQL Server rows.
            </p>
          </div>
          <Button
            variant="dangerOutline"
            size="sm"
            icon={Trash2}
            onClick={() => setConfirmClear(true)}
            disabled={patients.length === 0 && documents.length === 0}
          >
            Clear Local Cache
          </Button>
        </div>
      </section>

      {/* Connected Backend Routes Reference */}
      <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-card">
        <h3 className="text-sm font-semibold text-[#0F172A]">Connected FastAPI Endpoints</h3>
        <p className="mt-0.5 mb-3 text-xs text-[#64748B]">
          Verified routes inspected from the existing backend routers.
        </p>

        <div className="overflow-x-auto rounded-md border border-[#E2E8F0]">
          <table className="min-w-full divide-y divide-[#E2E8F0] text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              <tr>
                <th className="px-3.5 py-2.5">Method</th>
                <th className="px-3.5 py-2.5">Endpoint</th>
                <th className="px-3.5 py-2.5">Integration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {API_ENDPOINTS.map((ep) => (
                <tr key={`${ep.method}-${ep.path}`}>
                  <td className="px-3.5 py-2 font-mono font-semibold text-[#0F766E]">
                    {ep.method}
                  </td>
                  <td className="px-3.5 py-2 font-mono text-[#0F172A]">{ep.path}</td>
                  <td className="px-3.5 py-2 text-[#64748B]">{ep.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClearCache}
        title="Clear Local Workspace Cache"
        message="This will remove locally remembered patient entries, uploaded document metadata, and RAG chat transcripts from your browser. Records already saved in SQL Server are unaffected."
        confirmLabel="Clear Local Cache"
      />
    </div>
  );
}

export default SettingsPage;

