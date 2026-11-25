import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarPlus,
  Copy,
  Eye,
  FileText,
  Info,
  Search,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SelectInput, TextInput } from '../components/ui/FormControls';
import { RegisterPatientModal } from '../components/patients/RegisterPatientModal';
import { PatientDetailsModal } from '../components/patients/PatientDetailsModal';
import { BookAppointmentModal } from '../components/appointments/BookAppointmentModal';
import { getPatientAppointments } from '../services/appointmentService';
import { getErrorMessage } from '../services/api';
import { useWorkspace } from '../hooks/useWorkspaceData';
import { useToast } from '../hooks/useToast';
import { formatDisplayDate, truncateId } from '../utils/formatters';

export function PatientsPage() {
  const { patients, upsertPatient, globalSearch } = useWorkspace();
  const toast = useToast();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');

  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [bookPatientId, setBookPatientId] = useState('');
  const [bookOpen, setBookOpen] = useState(false);

  // Lookup an existing SQL Server patient_id directly via GET /appointments/patient/{id}
  const [lookupId, setLookupId] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  const effectiveQuery = (searchTerm || globalSearch || '').trim().toLowerCase();

  const filteredPatients = useMemo(() => {
    return patients.filter((pt) => {
      if (statusFilter !== 'ALL' && (pt.registration_status || 'REGISTERED') !== statusFilter) {
        return false;
      }
      if (genderFilter !== 'ALL' && (pt.gender || '') !== genderFilter) {
        return false;
      }
      if (!effectiveQuery) return true;
      return (
        pt.patient_id?.toLowerCase().includes(effectiveQuery) ||
        pt.full_name?.toLowerCase().includes(effectiveQuery) ||
        pt.phone?.toLowerCase().includes(effectiveQuery) ||
        pt.email?.toLowerCase().includes(effectiveQuery)
      );
    });
  }, [patients, statusFilter, genderFilter, effectiveQuery]);

  const handleCopyId = async (e, id) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      toast.info('Copied', 'Patient ID copied to clipboard.');
    } catch {
      toast.warning('Copy failed', 'Unable to access clipboard.');
    }
  };

  const handleLookupExisting = async (e) => {
    e.preventDefault();
    const id = lookupId.trim();
    if (!id) {
      toast.warning('Patient ID required', 'Enter an existing Patient UUID to query.');
      return;
    }

    setLookupLoading(true);
    try {
      const data = await getPatientAppointments(id);
      const existing = patients.find((p) => p.patient_id === id);
      const record = existing || {
        patient_id: data.patient_id || id,
        full_name: `Database Patient (${truncateId(id, 6, 4)})`,
        date_of_birth: null,
        phone: '—',
        registration_status: 'REGISTERED',
        isLookupRecord: true,
      };

      if (!existing) {
        upsertPatient(record);
      }

      setSelectedPatient(record);
      setLookupId('');
      toast.success(
        'Patient queried',
        `Loaded ${data?.total_appointments ?? 0} appointment record(s) from backend.`
      );
    } catch (err) {
      toast.error('Lookup failed', getErrorMessage(err));
    } finally {
      setLookupLoading(false);
    }
  };

  const columns = [
    {
      key: 'patient_id',
      label: 'Patient ID',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-[#0F172A]">
            {truncateId(row.patient_id, 8, 4)}
          </span>
          <button
            type="button"
            onClick={(e) => handleCopyId(e, row.patient_id)}
            aria-label={`Copy patient ID ${row.patient_id}`}
            title="Copy full Patient ID"
            className="rounded p-1 text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A]"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
    {
      key: 'full_name',
      label: 'Full Name',
      render: (row) => (
        <div>
          <p className="font-medium text-[#0F172A]">{row.full_name}</p>
          {row.email && <p className="text-xs text-[#64748B]">{row.email}</p>}
        </div>
      ),
    },
    {
      key: 'date_of_birth',
      label: 'Date of Birth',
      render: (row) => (
        <span className="text-sm text-[#1E293B] whitespace-nowrap">
          {formatDisplayDate(row.date_of_birth)}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone Number',
      render: (row) => (
        <span className="font-mono text-xs text-[#1E293B]">{row.phone || '—'}</span>
      ),
    },
    {
      key: 'registration_status',
      label: 'Registration Status',
      render: (row) => <StatusBadge status={row.registration_status || 'REGISTERED'} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right whitespace-nowrap',
      render: (row) => (
        <div
          className="inline-flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="secondary"
            size="sm"
            icon={Eye}
            onClick={() => setSelectedPatient(row)}
          >
            Details
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={CalendarPlus}
            onClick={() => {
              setBookPatientId(row.patient_id);
              setBookOpen(true);
            }}
          >
            Book
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={FileText}
            onClick={() =>
              navigate(`/documents?patientId=${encodeURIComponent(row.patient_id)}`)
            }
            title="Open patient documents & RAG"
          >
            Docs
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header & Registration Info Note */}
      <div className="flex flex-col gap-4 rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-card lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#0F172A]">Patient Registry</h2>
          <p className="mt-1 flex items-start gap-1.5 text-xs text-[#64748B]">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0F766E]" />
            <span>
              Patients registered via <code className="font-mono text-[#0F172A]">POST /patients/register</code>{' '}
              are persisted in SQL Server and tracked in this workspace directory. You can also load
              any existing database Patient ID below.
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button icon={UserPlus} onClick={() => setRegisterOpen(true)}>
            Register Patient
          </Button>
        </div>
      </div>

      {/* Filters & Existing Patient ID Lookup */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#E2E8F0] bg-white p-3.5 shadow-card lg:col-span-7">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
              aria-hidden="true"
            />
            <TextInput
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, patient ID, or phone…"
              aria-label="Search patients"
              className="pl-9"
            />
          </div>

          <SelectInput
            aria-label="Filter by registration status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
          >
            <option value="ALL">All statuses</option>
            <option value="REGISTERED">Registered</option>
          </SelectInput>

          <SelectInput
            aria-label="Filter by gender"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="w-36"
          >
            <option value="ALL">All genders</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </SelectInput>
        </div>

        <form
          onSubmit={handleLookupExisting}
          className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white p-3.5 shadow-card lg:col-span-5"
        >
          <TextInput
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            placeholder="Lookup existing DB Patient ID…"
            aria-label="Lookup existing patient ID"
            className="flex-1 font-mono text-xs"
            disabled={lookupLoading}
          />
          <Button
            type="submit"
            variant="secondary"
            icon={UserCheck}
            loading={lookupLoading}
          >
            Inspect
          </Button>
        </form>
      </div>

      {/* Patient Data Table */}
      <DataTable
        columns={columns}
        data={filteredPatients}
        keyField="patient_id"
        onRowClick={(row) => setSelectedPatient(row)}
        emptyState={
          patients.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No patients registered in this workspace yet"
              description="Register a new patient through the FastAPI backend to receive a Patient ID, view appointment history, book consultations, and upload clinical PDFs."
              action={
                <Button icon={UserPlus} onClick={() => setRegisterOpen(true)}>
                  Register New Patient
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No matching patients"
              description="Adjust your search query or filter criteria to see registered patients."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('ALL');
                    setGenderFilter('ALL');
                  }}
                >
                  Reset Filters
                </Button>
              }
            />
          )
        }
      />

      {/* Modals */}
      <RegisterPatientModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
      />

      <PatientDetailsModal
        isOpen={Boolean(selectedPatient)}
        onClose={() => setSelectedPatient(null)}
        patient={selectedPatient}
        onBookForPatient={(ptId) => {
          setBookPatientId(ptId);
          setBookOpen(true);
        }}
      />

      <BookAppointmentModal
        isOpen={bookOpen}
        onClose={() => setBookOpen(false)}
        initialPatientId={bookPatientId}
      />
    </div>
  );
}

export default PatientsPage;

