import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CalendarX2,
  FileText,
  RefreshCw,
  Stethoscope,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatCard } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { RegisterPatientModal } from '../components/patients/RegisterPatientModal';
import { BookAppointmentModal } from '../components/appointments/BookAppointmentModal';
import { DoctorSlotsModal } from '../components/doctors/DoctorSlotsModal';
import { useDoctors } from '../hooks/useDoctors';
import { useWorkspace } from '../hooks/useWorkspaceData';
import { getAvailableSlots } from '../services/appointmentService';
import { getErrorMessage } from '../services/api';
import { formatDisplayDate, formatTimeRange, getTodayISO } from '../utils/formatters';
import {
  DEMO_APPOINTMENT_STATUS_CHART,
  DEMO_RECENT_REGISTRATIONS,
  DEMO_SUMMARY_METRICS,
  DEMO_TODAY_SCHEDULE,
  DEMO_WEEKLY_APPOINTMENT_TREND,
} from '../utils/demoData';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-xs shadow-elevated">
      <p className="font-semibold text-[#0F172A]">{label}</p>
      <div className="mt-1 space-y-0.5">
        {payload.map((entry) => (
          <p key={entry.dataKey || entry.name} className="flex items-center gap-2 text-[#1E293B]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color || entry.payload?.fill }}
            />
            <span className="capitalize">{entry.name}:</span>
            <span className="font-semibold tabular-nums">{entry.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { doctors, loading: doctorsLoading, error: doctorsError, refreshDoctors } = useDoctors();
  const { patients, documents, backendStatus, refreshBackendStatus, settings } = useWorkspace();

  const [todaySlots, setTodaySlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState('');
  const [chartView, setChartView] = useState('status'); // 'status' | 'weekly'

  const [registerOpen, setRegisterOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [bookingPreset, setBookingPreset] = useState({});
  const [slotsModalDoctor, setSlotsModalDoctor] = useState(null);

  const todayISO = getTodayISO();

  const loadTodaySlots = useCallback(async () => {
    setSlotsLoading(true);
    setSlotsError('');
    try {
      const data = await getAvailableSlots({ appointmentDate: todayISO });
      setTodaySlots(Array.isArray(data?.available_slots) ? data.available_slots : []);
    } catch (err) {
      setSlotsError(getErrorMessage(err, 'Unable to load today’s open slots.'));
      setTodaySlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [todayISO]);

  useEffect(() => {
    loadTodaySlots();
  }, [loadTodaySlots]);

  // Compute live slots count per doctor for today
  const doctorAvailabilityRows = useMemo(() => {
    const slotCountByDoctor = todaySlots.reduce((acc, slot) => {
      acc[slot.doctor_id] = (acc[slot.doctor_id] || 0) + 1;
      return acc;
    }, {});

    return doctors.map((doc) => ({
      ...doc,
      openSlotsToday: slotCountByDoctor[doc.doctor_id] || 0,
    }));
  }, [doctors, todaySlots]);

  const doctorsWithOpenSlotsCount = useMemo(
    () => doctorAvailabilityRows.filter((d) => d.openSlotsToday > 0).length,
    [doctorAvailabilityRows]
  );

  const recentRegistrations = patients.length > 0 ? patients.slice(0, 5) : DEMO_RECENT_REGISTRATIONS;
  const usingLiveRegistrations = patients.length > 0;

  const handleRefreshAll = () => {
    refreshBackendStatus();
    refreshDoctors();
    loadTodaySlots();
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Transparency Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Hospital Operations Overview
            </h2>
            <StatusBadge
              status={backendStatus.state === 'online' ? 'LIVE' : 'OFFLINE'}
              label={
                backendStatus.state === 'online'
                  ? 'FastAPI Connected'
                  : 'Backend Offline'
              }
            />
          </div>
          <p className="text-xs text-[#64748B]">
            Doctors, availability slots, registrations, bookings, and document RAG connect to live
            APIs. Aggregate KPIs marked <span className="font-medium text-[#B45309]">Demo Data</span>{' '}
            represent synthetic hospital baselines where backend summary endpoints are absent.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={handleRefreshAll}>
            Sync
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={UserPlus}
            onClick={() => setRegisterOpen(true)}
          >
            Register Patient
          </Button>
          <Button
            size="sm"
            icon={CalendarCheck}
            onClick={() => {
              setBookingPreset({});
              setBookOpen(true);
            }}
          >
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <section aria-label="Operational Summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Patients"
          value={
            patients.length > 0 && !settings.showDemoData
              ? patients.length
              : DEMO_SUMMARY_METRICS.totalPatients
          }
          icon={Users}
          accent="navy"
          dataSource={patients.length > 0 && !settings.showDemoData ? 'LIVE' : 'DEMO'}
          subtitle={`${patients.length} registered in this session`}
        />

        <StatCard
          label="Today's Appointments"
          value={DEMO_SUMMARY_METRICS.todaysAppointments}
          icon={CalendarClock}
          accent="teal"
          dataSource="DEMO"
          subtitle={`${DEMO_SUMMARY_METRICS.bookedAppointments} booked · ${DEMO_SUMMARY_METRICS.completedAppointments} completed`}
        />

        <StatCard
          label="Available Doctors"
          value={
            doctorsError
              ? '—'
              : slotsLoading
              ? doctors.length
              : doctorsWithOpenSlotsCount > 0
              ? doctorsWithOpenSlotsCount
              : doctors.length
          }
          icon={Stethoscope}
          accent="success"
          dataSource="LIVE"
          loading={doctorsLoading}
          subtitle={
            doctorsError
              ? 'Backend unavailable'
              : `${doctors.length} total doctors · ${todaySlots.length} open slots today`
          }
        />

        <StatCard
          label="Cancelled Appointments"
          value={DEMO_SUMMARY_METRICS.cancelledAppointments}
          icon={CalendarX2}
          accent="error"
          dataSource="DEMO"
          subtitle={`${documents.length} PDF(s) ingested in workspace`}
        />
      </section>

      {/* Main Content Grid: Chart + Doctor Availability */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Appointment Status Chart (Recharts) */}
        <section className="flex flex-col rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-card lg:col-span-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#0F172A]">
                  Appointment Status Overview
                </h3>
                <StatusBadge status="DEMO" showDot={false} className="!text-[10px]" />
              </div>
              <p className="mt-0.5 text-xs text-[#64748B]">
                {chartView === 'status'
                  ? 'Synthetic daily status distribution across outpatient clinics'
                  : 'Synthetic 6-day appointment volume trend'}
              </p>
            </div>

            <div className="inline-flex rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setChartView('status')}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  chartView === 'status'
                    ? 'bg-white text-[#0F766E] shadow-sm'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Today Status
              </button>
              <button
                type="button"
                onClick={() => setChartView('weekly')}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  chartView === 'weekly'
                    ? 'bg-white text-[#0F766E] shadow-sm'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Weekly Trend
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === 'status' ? (
                <BarChart
                  data={DEMO_APPOINTMENT_STATUS_CHART}
                  margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
                  barSize={44}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="status"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F8FAFC' }} />
                  <Bar dataKey="count" name="Appointments" radius={[6, 6, 0, 0]}>
                    {DEMO_APPOINTMENT_STATUS_CHART.map((entry) => (
                      <Cell key={entry.status} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart
                  data={DEMO_WEEKLY_APPOINTMENT_TREND}
                  margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F8FAFC' }} />
                  <Bar dataKey="booked" name="Booked" fill="#0F766E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#475569" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cancelled" name="Cancelled" fill="#DC2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-[#E2E8F0] pt-3 text-xs text-[#64748B]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#0F766E]" />
              Booked
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#475569]" />
              Completed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#DC2626]" />
              Cancelled
            </span>
          </div>
        </section>

        {/* Doctor Availability Overview (Live Backend) */}
        <section className="flex flex-col rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-card lg:col-span-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#0F172A]">
                  Doctor Availability Today
                </h3>
                <StatusBadge status="LIVE" showDot={false} className="!text-[10px]" />
              </div>
              <p className="mt-0.5 text-xs text-[#64748B]">
                Live schedule slots for {formatDisplayDate(todayISO)}
              </p>
            </div>
            <Link
              to="/doctors"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#0F766E] hover:text-[#115E59]"
            >
              All doctors <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {doctorsError || slotsError ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-md border border-dashed border-red-200 bg-red-50/40 p-6 text-center">
              <p className="text-xs font-medium text-[#DC2626]">
                {doctorsError || slotsError}
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                icon={RefreshCw}
                onClick={handleRefreshAll}
              >
                Retry Connection
              </Button>
            </div>
          ) : doctorsLoading || slotsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border border-[#E2E8F0] p-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-7 w-20 rounded-md" />
                </div>
              ))}
            </div>
          ) : doctorAvailabilityRows.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-[#E2E8F0] p-6 text-center text-xs text-[#64748B]">
              No active doctors found in the database.
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0] overflow-y-auto max-h-72">
              {doctorAvailabilityRows.map((doc) => (
                <div
                  key={doc.doctor_id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#0F172A]">
                      {doc.doctor_name}
                    </p>
                    <p className="truncate text-xs text-[#64748B]">
                      {doc.specialization} · ID #{doc.doctor_id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums ${
                        doc.openSlotsToday > 0
                          ? 'bg-[#CCFBF1] text-[#0F766E]'
                          : 'bg-slate-100 text-[#64748B]'
                      }`}
                    >
                      {doc.openSlotsToday} slot{doc.openSlotsToday === 1 ? '' : 's'}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSlotsModalDoctor(doc)}
                    >
                      Slots
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Bottom Row: Today's Schedule + Recent Patient Registrations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Appointment schedule for today */}
        <section className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-card lg:col-span-7">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#0F172A]">
                  Today&apos;s Appointment Schedule
                </h3>
                <StatusBadge status="DEMO" showDot={false} className="!text-[10px]" />
              </div>
              <p className="mt-0.5 text-xs text-[#64748B]">
                Sample schedule view — use Appointments to view and cancel live patient bookings
              </p>
            </div>
            <Link
              to="/appointments"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#0F766E] hover:text-[#115E59]"
            >
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E2E8F0] text-left text-xs">
              <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <tr>
                  <th className="px-3 py-2.5">Time</th>
                  <th className="px-3 py-2.5">Patient</th>
                  <th className="px-3 py-2.5">Unit / Specialty</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {DEMO_TODAY_SCHEDULE.map((item) => (
                  <tr key={item.appointment_id} className="hover:bg-slate-50/60">
                    <td className="px-3 py-2.5 font-medium text-[#0F172A] whitespace-nowrap tabular-nums">
                      {formatTimeRange(item.start_time, item.end_time)}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-[#1E293B]">{item.patient_name}</p>
                      <p className="text-[11px] text-[#64748B] truncate max-w-[180px]">
                        {item.reason}
                      </p>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-[#1E293B]">{item.doctor_name}</p>
                      <p className="text-[11px] text-[#64748B]">{item.specialization}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={item.appointment_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Patient Registrations */}
        <section className="flex flex-col rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-card lg:col-span-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#0F172A]">
                  Recent Patient Registrations
                </h3>
                <StatusBadge
                  status={usingLiveRegistrations ? 'LIVE' : 'DEMO'}
                  showDot={false}
                  className="!text-[10px]"
                />
              </div>
              <p className="mt-0.5 text-xs text-[#64748B]">
                {usingLiveRegistrations
                  ? 'Registered via POST /patients/register in this workspace'
                  : 'Synthetic sample list — register a patient to populate live entries'}
              </p>
            </div>
            <Link
              to="/patients"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#0F766E] hover:text-[#115E59]"
            >
              Patients <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-[#E2E8F0]">
            {recentRegistrations.map((pt) => (
              <div
                key={pt.patient_id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#0F172A]">{pt.full_name}</p>
                  <p className="truncate font-mono text-[11px] text-[#64748B]">
                    {pt.patient_id} · DOB {formatDisplayDate(pt.date_of_birth)}
                  </p>
                </div>
                <StatusBadge status={pt.registration_status || 'REGISTERED'} />
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[#E2E8F0] pt-3">
            <Link
              to="/documents"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F766E]"
            >
              <FileText className="h-3.5 w-3.5" />
              Open Document Intelligence
            </Link>
            <Button size="sm" variant="secondary" onClick={() => setRegisterOpen(true)}>
              + New Patient
            </Button>
          </div>
        </section>
      </div>

      {/* Modals */}
      <RegisterPatientModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
      />

      <BookAppointmentModal
        isOpen={bookOpen}
        onClose={() => setBookOpen(false)}
        initialDoctorId={bookingPreset.doctorId}
        initialDate={bookingPreset.date}
        initialSlot={bookingPreset.slot}
        onBooked={() => {
          loadTodaySlots();
        }}
      />

      <DoctorSlotsModal
        isOpen={Boolean(slotsModalDoctor)}
        onClose={() => setSlotsModalDoctor(null)}
        doctor={slotsModalDoctor}
        onSelectSlotToBook={(doctor, date, slot) => {
          setBookingPreset({
            doctorId: doctor.doctor_id,
            date,
            slot,
          });
          setBookOpen(true);
        }}
      />
    </div>
  );
}

export default DashboardPage;

