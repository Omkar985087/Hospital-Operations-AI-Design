import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CalendarPlus,
  Clock,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FormField, SelectInput, TextInput } from '../components/ui/FormControls';
import { Skeleton } from '../components/ui/Skeleton';
import { BookAppointmentModal } from '../components/appointments/BookAppointmentModal';
import {
  cancelAppointment,
  getAvailableSlots,
  getPatientAppointments,
} from '../services/appointmentService';
import { getErrorMessage } from '../services/api';
import { useDoctors } from '../hooks/useDoctors';
import { useWorkspace } from '../hooks/useWorkspaceData';
import { useToast } from '../hooks/useToast';
import {
  formatDisplayDate,
  formatTimeRange,
  getTodayISO,
  truncateId,
} from '../utils/formatters';

export function AppointmentsPage() {
  const { patients, globalSearch, addNotification } = useWorkspace();
  const { doctors, loading: doctorsLoading } = useDoctors();
  const toast = useToast();

  // Appointment history state
  const [selectedPatientId, setSelectedPatientId] = useState(
    () => patients[0]?.patient_id || ''
  );
  const [manualPatientId, setManualPatientId] = useState(
    () => patients[0]?.patient_id || ''
  );
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // Live available slots state
  const [slotDate, setSlotDate] = useState(getTodayISO());
  const [slotDoctorId, setSlotDoctorId] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState('');

  // Modals & Cancel dialog
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookingPreset, setBookingPreset] = useState({});
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const patientNameMap = useMemo(() => {
    const map = {};
    patients.forEach((p) => {
      map[p.patient_id] = p.full_name;
    });
    return map;
  }, [patients]);

  const fetchPatientHistory = useCallback(async (ptId) => {
    const targetId = (ptId || '').trim();
    if (!targetId) {
      setAppointments([]);
      setAppointmentsError('');
      return;
    }

    setAppointmentsLoading(true);
    setAppointmentsError('');
    try {
      const data = await getPatientAppointments(targetId);
      setAppointments(Array.isArray(data?.appointments) ? data.appointments : []);
    } catch (err) {
      setAppointments([]);
      setAppointmentsError(getErrorMessage(err, 'Failed to load patient appointments.'));
    } finally {
      setAppointmentsLoading(false);
    }
  }, []);

  const fetchAvailableSlots = useCallback(async () => {
    if (!slotDate) return;
    setSlotsLoading(true);
    setSlotsError('');
    try {
      const data = await getAvailableSlots({
        appointmentDate: slotDate,
        doctorId: slotDoctorId || undefined,
      });
      setAvailableSlots(
        Array.isArray(data?.available_slots) ? data.available_slots : []
      );
    } catch (err) {
      setAvailableSlots([]);
      setSlotsError(getErrorMessage(err, 'Failed to fetch available slots.'));
    } finally {
      setSlotsLoading(false);
    }
  }, [slotDate, slotDoctorId]);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientHistory(selectedPatientId);
    }
  }, [selectedPatientId, fetchPatientHistory]);

  useEffect(() => {
    fetchAvailableSlots();
  }, [fetchAvailableSlots]);

  const handleLoadPatientSubmit = (e) => {
    e.preventDefault();
    const cleaned = manualPatientId.trim();
    setSelectedPatientId(cleaned);
    if (cleaned) {
      fetchPatientHistory(cleaned);
    } else {
      setAppointments([]);
    }
  };

  const handleBookedSuccess = async ({ patientId }) => {
    if (patientId) {
      setSelectedPatientId(patientId);
      setManualPatientId(patientId);
      await fetchPatientHistory(patientId);
    } else if (selectedPatientId) {
      await fetchPatientHistory(selectedPatientId);
    }
    await fetchAvailableSlots();
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await cancelAppointment(cancelTarget.appointment_id);
      toast.success(
        'Appointment cancelled',
        res?.message || `Appointment #${cancelTarget.appointment_id} cancelled.`
      );
      addNotification({
        title: 'Appointment cancelled',
        detail: `Appointment #${cancelTarget.appointment_id} · ${cancelTarget.doctor_name}`,
      });
      setCancelTarget(null);
      await Promise.all([
        fetchPatientHistory(selectedPatientId || cancelTarget.patient_id),
        fetchAvailableSlots(),
      ]);
    } catch (err) {
      toast.error('Cancellation failed', getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const effectiveSearch = (searchFilter || globalSearch || '').trim().toLowerCase();

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      if (statusFilter !== 'ALL' && appt.appointment_status !== statusFilter) {
        return false;
      }
      if (!effectiveSearch) return true;
      const ptName = patientNameMap[appt.patient_id] || '';
      return (
        String(appt.appointment_id).includes(effectiveSearch) ||
        appt.doctor_name?.toLowerCase().includes(effectiveSearch) ||
        appt.specialization?.toLowerCase().includes(effectiveSearch) ||
        appt.reason?.toLowerCase().includes(effectiveSearch) ||
        appt.patient_id?.toLowerCase().includes(effectiveSearch) ||
        ptName.toLowerCase().includes(effectiveSearch)
      );
    });
  }, [appointments, statusFilter, effectiveSearch, patientNameMap]);

  const columns = [
    {
      key: 'patient_id',
      label: 'Patient',
      render: (row) => (
        <div>
          <p className="font-medium text-[#0F172A]">
            {patientNameMap[row.patient_id] || 'Patient Record'}
          </p>
          <p className="font-mono text-[11px] text-[#64748B]">
            {truncateId(row.patient_id, 8, 4)} · #{row.appointment_id}
          </p>
        </div>
      ),
    },
    {
      key: 'doctor_name',
      label: 'Doctor & Specialization',
      render: (row) => (
        <div>
          <p className="font-medium text-[#0F172A]">{row.doctor_name}</p>
          <p className="text-xs text-[#64748B]">{row.specialization}</p>
        </div>
      ),
    },
    {
      key: 'appointment_date',
      label: 'Date & Time',
      render: (row) => (
        <div className="whitespace-nowrap">
          <p className="font-medium text-[#0F172A]">
            {formatDisplayDate(row.appointment_date)}
          </p>
          <p className="text-xs text-[#64748B] tabular-nums">
            {formatTimeRange(row.start_time, row.end_time)}
          </p>
        </div>
      ),
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (row) => (
        <span className="block max-w-[200px] truncate text-xs text-[#64748B]">
          {row.reason || '—'}
        </span>
      ),
    },
    {
      key: 'appointment_status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.appointment_status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right whitespace-nowrap',
      render: (row) =>
        row.appointment_status === 'BOOKED' ? (
          <Button
            variant="dangerOutline"
            size="sm"
            icon={XCircle}
            onClick={() => setCancelTarget(row)}
          >
            Cancel
          </Button>
        ) : (
          <span className="text-xs text-slate-400">No actions</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#0F172A]">
            Appointment Scheduling &amp; Management
          </h2>
          <p className="mt-0.5 text-xs text-[#64748B]">
            Inspect patient bookings, browse live open slots by doctor and date, or schedule new visits.
          </p>
        </div>
        <Button
          icon={CalendarPlus}
          onClick={() => {
            setBookingPreset({
              patientId: selectedPatientId,
              date: slotDate,
              doctorId: slotDoctorId,
            });
            setBookModalOpen(true);
          }}
        >
          Book Appointment
        </Button>
      </div>

      {/* Main Split Layout: Patient Appointments (Left/Top) + Live Slot Availability (Right) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Patient Appointments Section */}
        <section className="space-y-4 xl:col-span-8">
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-card space-y-3">
            <form
              onSubmit={handleLoadPatientSubmit}
              className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end"
            >
              {patients.length > 0 && (
                <div className="sm:col-span-5">
                  <FormField id="appt-patient-dropdown" label="Workspace Patient">
                    <SelectInput
                      id="appt-patient-dropdown"
                      value={
                        patients.some((p) => p.patient_id === selectedPatientId)
                          ? selectedPatientId
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setManualPatientId(val);
                        setSelectedPatientId(val);
                      }}
                    >
                      <option value="">Select registered patient…</option>
                      {patients.map((p) => (
                        <option key={p.patient_id} value={p.patient_id}>
                          {p.full_name} ({truncateId(p.patient_id, 6, 4)})
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>
                </div>
              )}

              <div className={patients.length > 0 ? 'sm:col-span-5' : 'sm:col-span-9'}>
                <FormField id="appt-patient-id-input" label="Patient ID">
                  <TextInput
                    id="appt-patient-id-input"
                    value={manualPatientId}
                    onChange={(e) => setManualPatientId(e.target.value)}
                    placeholder="Enter Patient UUID to load appointments…"
                    className="font-mono text-xs"
                  />
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full"
                  loading={appointmentsLoading}
                >
                  Load
                </Button>
              </div>
            </form>

            {/* Filter row */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-56">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748B]" />
                  <TextInput
                    type="search"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter doctor, reason…"
                    className="h-8 pl-8 text-xs"
                  />
                </div>
                <SelectInput
                  aria-label="Filter appointments by status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 w-36 text-xs"
                >
                  <option value="ALL">All statuses</option>
                  <option value="BOOKED">Booked</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </SelectInput>
              </div>

              {selectedPatientId && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={RefreshCw}
                  onClick={() => fetchPatientHistory(selectedPatientId)}
                  disabled={appointmentsLoading}
                >
                  Refresh list
                </Button>
              )}
            </div>
          </div>

          {appointmentsError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-[#DC2626]">
              {appointmentsError}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredAppointments}
              keyField="appointment_id"
              loading={appointmentsLoading}
              emptyState={
                !selectedPatientId ? (
                  <EmptyState
                    icon={Calendar}
                    title="Select or enter a Patient ID"
                    description="Choose a registered patient above or paste any database Patient UUID to fetch live appointments from GET /appointments/patient/{patient_id}."
                    action={
                      <Button
                        icon={CalendarPlus}
                        onClick={() => {
                          setBookingPreset({ date: slotDate });
                          setBookModalOpen(true);
                        }}
                      >
                        Book Appointment
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={Calendar}
                    title="No appointments found"
                    description="No appointments matched this Patient ID and filter selection."
                    action={
                      <Button
                        icon={CalendarPlus}
                        onClick={() => {
                          setBookingPreset({
                            patientId: selectedPatientId,
                            date: slotDate,
                          });
                          setBookModalOpen(true);
                        }}
                      >
                        Book First Appointment
                      </Button>
                    }
                  />
                )
              }
            />
          )}
        </section>

        {/* Live Available Slots Panel */}
        <section className="flex flex-col rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-card xl:col-span-4">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#0F172A]">Available Slots</h3>
                <StatusBadge status="LIVE" showDot={false} className="!text-[10px]" />
              </div>
              <p className="mt-0.5 text-xs text-[#64748B]">
                Click any open slot to open booking modal
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={fetchAvailableSlots}
              disabled={slotsLoading}
              aria-label="Refresh available slots"
            />
          </div>

          <div className="space-y-3 border-b border-[#E2E8F0] pb-4">
            <FormField id="slots-date" label="Date">
              <TextInput
                id="slots-date"
                type="date"
                min={getTodayISO()}
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
              />
            </FormField>

            <FormField id="slots-doctor" label="Doctor Filter">
              <SelectInput
                id="slots-doctor"
                value={slotDoctorId}
                onChange={(e) => setSlotDoctorId(e.target.value)}
                disabled={doctorsLoading}
              >
                <option value="">All available doctors</option>
                {doctors.map((d) => (
                  <option key={d.doctor_id} value={d.doctor_id}>
                    {d.doctor_name} ({d.specialization})
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </div>

          <div className="mt-4 flex-1">
            {slotsError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-[#DC2626]">
                {slotsError}
              </div>
            ) : slotsLoading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-md" />
                ))}
              </div>
            ) : availableSlots.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No open slots"
                description={`No unbooked slots found for ${formatDisplayDate(slotDate)}.`}
                className="py-8"
              />
            ) : (
              <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">
                {availableSlots.map((slot) => (
                  <button
                    key={`${slot.doctor_id}-${slot.availability_id}-${slot.slot_start}`}
                    type="button"
                    onClick={() => {
                      setBookingPreset({
                        patientId: selectedPatientId,
                        doctorId: slot.doctor_id,
                        date: slot.available_date || slotDate,
                        slot,
                      });
                      setBookModalOpen(true);
                    }}
                    className="group flex w-full items-center justify-between rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-left transition-colors hover:border-[#0F766E] hover:bg-[#CCFBF1]/35"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0F172A] tabular-nums">
                        {formatTimeRange(slot.slot_start, slot.slot_end)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[#1E293B]">
                        {slot.doctor_name}
                      </p>
                      <p className="text-[11px] text-[#64748B]">{slot.specialization}</p>
                    </div>
                    <span className="ml-2 shrink-0 rounded bg-white px-2 py-1 text-[11px] font-medium text-[#0F766E] border border-[#E2E8F0] group-hover:border-[#0F766E]">
                      Book
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Book Modal & Cancel Confirmation */}
      <BookAppointmentModal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        initialPatientId={bookingPreset.patientId}
        initialDoctorId={bookingPreset.doctorId}
        initialDate={bookingPreset.date}
        initialSlot={bookingPreset.slot}
        onBooked={handleBookedSuccess}
      />

      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        loading={cancelling}
        title="Cancel Appointment"
        message={
          cancelTarget
            ? `Cancel appointment #${cancelTarget.appointment_id} with ${cancelTarget.doctor_name} on ${formatDisplayDate(cancelTarget.appointment_date)} (${formatTimeRange(cancelTarget.start_time, cancelTarget.end_time)})?`
            : ''
        }
        confirmLabel="Confirm Cancellation"
        cancelLabel="Keep Booking"
      />
    </div>
  );
}

export default AppointmentsPage;

