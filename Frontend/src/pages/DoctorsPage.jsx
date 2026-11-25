import { useMemo, useState } from 'react';
import {
  CalendarClock,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  Stethoscope,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataTable } from '../components/ui/DataTable';
import { CardGridSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { SelectInput, TextInput } from '../components/ui/FormControls';
import { DoctorSlotsModal } from '../components/doctors/DoctorSlotsModal';
import { BookAppointmentModal } from '../components/appointments/BookAppointmentModal';
import { useDoctors } from '../hooks/useDoctors';
import { useWorkspace } from '../hooks/useWorkspaceData';

export function DoctorsPage() {
  const { doctors, loading, error, refreshDoctors } = useDoctors();
  const { globalSearch } = useWorkspace();

  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  const [slotsDoctor, setSlotsDoctor] = useState(null);
  const [bookingPreset, setBookingPreset] = useState({});
  const [bookOpen, setBookOpen] = useState(false);

  const specializations = useMemo(() => {
    const set = new Set(doctors.map((d) => d.specialization).filter(Boolean));
    return Array.from(set).sort();
  }, [doctors]);

  const effectiveSearch = (searchTerm || globalSearch || '').trim().toLowerCase();

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      if (
        specializationFilter !== 'ALL' &&
        doc.specialization !== specializationFilter
      ) {
        return false;
      }
      if (!effectiveSearch) return true;
      return (
        doc.doctor_name?.toLowerCase().includes(effectiveSearch) ||
        doc.specialization?.toLowerCase().includes(effectiveSearch) ||
        String(doc.doctor_id).includes(effectiveSearch)
      );
    });
  }, [doctors, specializationFilter, effectiveSearch]);

  const tableColumns = [
    {
      key: 'doctor_id',
      label: 'Doctor ID',
      render: (row) => (
        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-[#0F172A]">
          #{row.doctor_id}
        </span>
      ),
    },
    {
      key: 'doctor_name',
      label: 'Doctor Name',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#CCFBF1] text-[#0F766E]">
            <Stethoscope className="h-4 w-4" />
          </div>
          <span className="font-medium text-[#0F172A]">{row.doctor_name}</span>
        </div>
      ),
    },
    {
      key: 'specialization',
      label: 'Specialization',
      render: (row) => (
        <span className="text-sm text-[#1E293B]">{row.specialization}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Availability',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          icon={CalendarClock}
          onClick={() => setSlotsDoctor(row)}
        >
          View Available Slots
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[#0F172A]">Medical Staff Directory</h2>
            <StatusBadge status="LIVE" showDot={false} className="!text-[10px]" />
          </div>
          <p className="mt-0.5 text-xs text-[#64748B]">
            Live roster from <code className="font-mono text-[#0F172A]">GET /appointments/doctors</code> ({doctors.length} doctor{doctors.length === 1 ? '' : 's'})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              aria-label="Card view"
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-[#0F766E] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-[#0F766E] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Table
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={refreshDoctors}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#E2E8F0] bg-white p-3.5 shadow-card">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
            aria-hidden="true"
          />
          <TextInput
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search doctors by name, specialization, or ID…"
            aria-label="Search doctors"
            className="pl-9"
          />
        </div>

        <SelectInput
          aria-label="Filter by specialization"
          value={specializationFilter}
          onChange={(e) => setSpecializationFilter(e.target.value)}
          className="w-52"
        >
          <option value="ALL">All specializations</option>
          {specializations.map((spec) => (
            <option key={spec} value={spec}>
              {spec}
            </option>
          ))}
        </SelectInput>
      </div>

      {/* Error State */}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-[#DC2626]">Failed to fetch doctors</p>
          <p className="mt-1 text-xs text-[#DC2626]">{error}</p>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            className="mt-4"
            onClick={refreshDoctors}
          >
            Try Again
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        <DataTable
          columns={tableColumns}
          data={filteredDoctors}
          keyField="doctor_id"
          loading={loading}
          emptyState={
            <EmptyState
              icon={Stethoscope}
              title="No doctors match your filters"
              description="Clear search or specialization filters to see all doctors."
            />
          }
        />
      ) : loading ? (
        <CardGridSkeleton count={6} />
      ) : filteredDoctors.length === 0 ? (
        <div className="rounded-lg border border-[#E2E8F0] bg-white shadow-card">
          <EmptyState
            icon={Stethoscope}
            title="No doctors found"
            description="No doctors matched your filter criteria or none exist in the backend database."
            action={
              (searchTerm || specializationFilter !== 'ALL') && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setSpecializationFilter('ALL');
                  }}
                >
                  Reset Filters
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDoctors.map((doc) => (
            <article
              key={doc.doctor_id}
              className="flex flex-col justify-between rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-card transition-colors hover:border-slate-300"
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#CCFBF1] text-[#0F766E]">
                  <Stethoscope className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-[#0F172A]">
                      {doc.doctor_name}
                    </h3>
                    <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-[#64748B]">
                      ID #{doc.doctor_id}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-[#0F766E]">
                    {doc.specialization}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#E2E8F0] pt-3.5">
                <span className="text-[11px] text-[#64748B]">Live slot lookup</span>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={CalendarClock}
                  onClick={() => setSlotsDoctor(doc)}
                >
                  View Available Slots
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Doctor Available Slots Modal */}
      <DoctorSlotsModal
        isOpen={Boolean(slotsDoctor)}
        onClose={() => setSlotsDoctor(null)}
        doctor={slotsDoctor}
        onSelectSlotToBook={(doctor, date, slot) => {
          setBookingPreset({
            doctorId: doctor.doctor_id,
            date,
            slot,
          });
          setBookOpen(true);
        }}
      />

      {/* Quick Booking from Slot */}
      <BookAppointmentModal
        isOpen={bookOpen}
        onClose={() => setBookOpen(false)}
        initialDoctorId={bookingPreset.doctorId}
        initialDate={bookingPreset.date}
        initialSlot={bookingPreset.slot}
      />
    </div>
  );
}

export default DoctorsPage;

