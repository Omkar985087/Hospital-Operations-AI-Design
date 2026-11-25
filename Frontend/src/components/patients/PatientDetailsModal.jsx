import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarPlus,
  Copy,
  FileText,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  User,
  XCircle,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { TableSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import {
  cancelAppointment,
  getPatientAppointments,
} from '../../services/appointmentService';
import { getErrorMessage } from '../../services/api';
import { formatDisplayDate, formatTimeRange } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import { useWorkspace } from '../../hooks/useWorkspaceData';

export function PatientDetailsModal({
  isOpen,
  onClose,
  patient,
  onBookForPatient,
}) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();
  const { addNotification } = useWorkspace();

  const fetchHistory = useCallback(async () => {
    if (!patient?.patient_id) return;
    setLoading(true);
    setError('');
    try {
      const res = await getPatientAppointments(patient.patient_id);
      setAppointments(Array.isArray(res?.appointments) ? res.appointments : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load appointment history.'));
    } finally {
      setLoading(false);
    }
  }, [patient?.patient_id]);

  useEffect(() => {
    if (isOpen && patient?.patient_id) {
      fetchHistory();
    }
  }, [isOpen, patient?.patient_id, fetchHistory]);

  const handleCopyId = async () => {
    if (!patient?.patient_id) return;
    try {
      await navigator.clipboard.writeText(patient.patient_id);
      toast.info('Copied', 'Patient ID copied to clipboard.');
    } catch {
      toast.warning('Copy unavailable', 'Please copy the Patient ID manually.');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelAppointment(cancelTarget.appointment_id);
      toast.success(
        'Appointment cancelled',
        `Appointment #${cancelTarget.appointment_id} has been cancelled.`
      );
      addNotification({
        title: 'Appointment cancelled',
        detail: `Appointment #${cancelTarget.appointment_id} (${cancelTarget.doctor_name})`,
      });
      setCancelTarget(null);
      await fetchHistory();
    } catch (err) {
      toast.error('Cancellation failed', getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  if (!patient) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={patient.full_name || 'Patient Details'}
        description={`Patient ID: ${patient.patient_id}`}
        size="xl"
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={FileText}
                onClick={() => {
                  onClose?.();
                  navigate(`/documents?patientId=${encodeURIComponent(patient.patient_id)}`);
                }}
              >
                Documents &amp; RAG
              </Button>
              {onBookForPatient && (
                <Button
                  size="sm"
                  icon={CalendarPlus}
                  onClick={() => {
                    onClose?.();
                    onBookForPatient(patient.patient_id);
                  }}
                >
                  Book Appointment
                </Button>
              )}
            </div>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Patient Demographic Summary */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#CCFBF1] text-[#0F766E]">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#0F172A]">
                      {patient.full_name || 'External Patient Record'}
                    </h3>
                    <StatusBadge status={patient.registration_status || 'REGISTERED'} />
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#64748B]">
                    <span className="font-mono">{patient.patient_id}</span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      aria-label="Copy patient ID"
                      className="rounded p-0.5 hover:bg-slate-200 hover:text-[#0F172A]"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <dl className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
              <div>
                <dt className="text-[#64748B]">Date of Birth</dt>
                <dd className="mt-0.5 font-medium text-[#0F172A]">
                  {formatDisplayDate(patient.date_of_birth)}
                </dd>
              </div>
              <div>
                <dt className="text-[#64748B]">Gender</dt>
                <dd className="mt-0.5 font-medium text-[#0F172A]">{patient.gender || '—'}</dd>
              </div>
              <div>
                <dt className="text-[#64748B]">Phone</dt>
                <dd className="mt-0.5 flex items-center gap-1 font-medium text-[#0F172A]">
                  <Phone className="h-3 w-3 text-[#64748B]" />
                  {patient.phone || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[#64748B]">Email</dt>
                <dd className="mt-0.5 flex items-center gap-1 font-medium text-[#0F172A]">
                  <Mail className="h-3 w-3 text-[#64748B]" />
                  {patient.email || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[#64748B]">Address</dt>
                <dd className="mt-0.5 flex items-center gap-1 font-medium text-[#0F172A]">
                  <MapPin className="h-3 w-3 text-[#64748B]" />
                  {patient.address || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[#64748B]">Emergency Contact</dt>
                <dd className="mt-0.5 font-medium text-[#0F172A]">
                  {patient.emergency_contact_name
                    ? `${patient.emergency_contact_name}${
                        patient.emergency_contact_phone ? ` (${patient.emergency_contact_phone})` : ''
                      }`
                    : '—'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Live Appointment History */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#0F172A]">Appointment History</h3>
                <p className="text-xs text-[#64748B]">
                  Live records fetched from GET /appointments/patient/{patient.patient_id.slice(0, 8)}…
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                onClick={fetchHistory}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-[#DC2626]">
                {error}
              </div>
            ) : loading ? (
              <div className="rounded-lg border border-[#E2E8F0]">
                <TableSkeleton rows={3} columns={5} />
              </div>
            ) : appointments.length === 0 ? (
              <div className="rounded-lg border border-[#E2E8F0] bg-white">
                <EmptyState
                  title="No appointments on record"
                  description="This patient does not have any booked, completed, or cancelled appointments yet."
                />
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
                <table className="min-w-full divide-y divide-[#E2E8F0] text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    <tr>
                      <th className="px-3.5 py-2.5">ID</th>
                      <th className="px-3.5 py-2.5">Doctor</th>
                      <th className="px-3.5 py-2.5">Date &amp; Time</th>
                      <th className="px-3.5 py-2.5">Reason</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] bg-white">
                    {appointments.map((appt) => (
                      <tr key={appt.appointment_id} className="hover:bg-slate-50/70">
                        <td className="px-3.5 py-2.5 font-mono text-[#64748B]">
                          #{appt.appointment_id}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <p className="font-medium text-[#0F172A]">{appt.doctor_name}</p>
                          <p className="text-[11px] text-[#64748B]">{appt.specialization}</p>
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <p className="font-medium text-[#0F172A]">
                            {formatDisplayDate(appt.appointment_date)}
                          </p>
                          <p className="text-[11px] text-[#64748B]">
                            {formatTimeRange(appt.start_time, appt.end_time)}
                          </p>
                        </td>
                        <td className="px-3.5 py-2.5 max-w-[180px] truncate text-[#64748B]">
                          {appt.reason || '—'}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <StatusBadge status={appt.appointment_status} />
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          {appt.appointment_status === 'BOOKED' ? (
                            <Button
                              variant="dangerOutline"
                              size="sm"
                              icon={XCircle}
                              onClick={() => setCancelTarget(appt)}
                            >
                              Cancel
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        loading={cancelling}
        title="Cancel Appointment"
        message={
          cancelTarget
            ? `Are you sure you want to cancel appointment #${cancelTarget.appointment_id} with ${cancelTarget.doctor_name} on ${formatDisplayDate(cancelTarget.appointment_date)}?`
            : ''
        }
        confirmLabel="Yes, Cancel Appointment"
        cancelLabel="Keep Appointment"
      />
    </>
  );
}

export default PatientDetailsModal;

