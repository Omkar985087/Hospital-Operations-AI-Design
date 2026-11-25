import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, Clock, RefreshCw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FormField, SelectInput, TextArea, TextInput } from '../ui/FormControls';
import { Skeleton } from '../ui/Skeleton';
import { bookAppointment, getAvailableSlots } from '../../services/appointmentService';
import { getErrorMessage } from '../../services/api';
import { useDoctors } from '../../hooks/useDoctors';
import { useWorkspace } from '../../hooks/useWorkspaceData';
import { useToast } from '../../hooks/useToast';
import { formatDisplayDate, formatTimeRange, getTodayISO } from '../../utils/formatters';
import { validateBookingForm } from '../../utils/validators';

export function BookAppointmentModal({
  isOpen,
  onClose,
  initialPatientId = '',
  initialDoctorId = '',
  initialDate = '',
  initialSlot = null,
  onBooked,
}) {
  const { doctors, loading: doctorsLoading } = useDoctors();
  const { patients, addNotification } = useWorkspace();
  const toast = useToast();

  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(getTodayISO());
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync initial props when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setPatientId(initialPatientId || (patients[0]?.patient_id ?? ''));
    setDoctorId(initialDoctorId ? String(initialDoctorId) : '');
    setAppointmentDate(initialDate || getTodayISO());
    setSelectedSlot(initialSlot || null);
    setReason('');
    setErrors({});
    setSubmitError('');
  }, [isOpen, initialPatientId, initialDoctorId, initialDate, initialSlot, patients]);

  // Fetch available slots whenever doctor or date changes
  const loadSlots = useCallback(async () => {
    if (!isOpen || !appointmentDate) return;
    setSlotsLoading(true);
    setSlotsError('');
    try {
      const data = await getAvailableSlots({
        appointmentDate,
        doctorId: doctorId || undefined,
      });
      const fetched = Array.isArray(data?.available_slots) ? data.available_slots : [];
      setSlots(fetched);

      // Keep preselected slot only if still present in fetched list
      setSelectedSlot((prev) => {
        if (!prev) return null;
        return (
          fetched.find(
            (s) =>
              s.availability_id === prev.availability_id &&
              s.slot_start === prev.slot_start &&
              s.doctor_id === prev.doctor_id
          ) || null
        );
      });
    } catch (err) {
      setSlots([]);
      setSlotsError(getErrorMessage(err, 'Failed to load available appointment slots.'));
    } finally {
      setSlotsLoading(false);
    }
  }, [isOpen, appointmentDate, doctorId]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const handleSelectDoctor = (value) => {
    setDoctorId(value);
    setSelectedSlot(null);
    setErrors((prev) => ({ ...prev, doctorId: undefined, slot: undefined }));
  };

  const handleSelectDate = (value) => {
    setAppointmentDate(value);
    setSelectedSlot(null);
    setErrors((prev) => ({ ...prev, appointmentDate: undefined, slot: undefined }));
  };

  const handleSlotPick = (slot) => {
    setSelectedSlot(slot);
    if (!doctorId) {
      setDoctorId(String(slot.doctor_id));
    }
    setErrors((prev) => ({ ...prev, slot: undefined, doctorId: undefined }));
    setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const effectiveDoctorId = doctorId || (selectedSlot ? String(selectedSlot.doctor_id) : '');
    const validationErrors = validateBookingForm({
      patientId,
      doctorId: effectiveDoctorId,
      appointmentDate,
      selectedSlot,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await bookAppointment({
        patientId,
        doctorId: effectiveDoctorId,
        availabilityId: selectedSlot.availability_id,
        appointmentDate,
        startTime: selectedSlot.slot_start,
        reason,
      });

      const bookedInfo = res?.appointment || {};
      addNotification({
        title: 'Appointment booked',
        detail: `ID #${bookedInfo.appointment_id ?? 'new'} · ${selectedSlot.doctor_name} on ${formatDisplayDate(appointmentDate)}`,
      });
      toast.success(
        'Appointment booked',
        res?.message || 'Appointment confirmed successfully.'
      );
      onBooked?.({
        patientId: patientId.trim(),
        appointment: bookedInfo,
      });
      onClose?.();
    } catch (err) {
      const msg = getErrorMessage(err, 'Appointment booking failed.');
      setSubmitError(msg);
      toast.error('Booking failed', msg);
      // Refresh available slots in case the slot was booked concurrently
      loadSlots();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Appointment"
      description="Select a patient, doctor, and date to load real-time available slots from the backend."
      size="lg"
      preventClose={submitting}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="book-appointment-form"
            loading={submitting}
            disabled={!selectedSlot}
            icon={CalendarCheck}
          >
            Confirm Booking
          </Button>
        </>
      }
    >
      <form id="book-appointment-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        {submitError && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-[#DC2626]"
          >
            {submitError}
          </div>
        )}

        {/* Patient selector + direct ID input */}
        <div className="space-y-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          {patients.length > 0 && (
            <FormField id="bk-patient-select" label="Quick Select Registered Patient">
              <SelectInput
                id="bk-patient-select"
                value={patients.some((p) => p.patient_id === patientId) ? patientId : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setPatientId(e.target.value);
                    setErrors((prev) => ({ ...prev, patientId: undefined }));
                  }
                }}
                disabled={submitting}
              >
                <option value="">Choose from workspace patients or enter ID below…</option>
                {patients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.full_name} ({p.patient_id.slice(0, 8)}…)
                  </option>
                ))}
              </SelectInput>
            </FormField>
          )}

          <FormField
            id="bk-patient-id"
            label="Patient ID"
            required
            error={errors.patientId}
            hint="Enter the exact Patient UUID registered in the backend database."
          >
            <TextInput
              id="bk-patient-id"
              placeholder="e.g. fa7d7cbc-581d-4f51-8f79-aabe48f0dad0"
              value={patientId}
              onChange={(e) => {
                setPatientId(e.target.value);
                setErrors((prev) => ({ ...prev, patientId: undefined }));
              }}
              error={errors.patientId}
              disabled={submitting}
              className="font-mono text-xs"
            />
          </FormField>
        </div>

        {/* Doctor & Date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField id="bk-doctor" label="Doctor" required error={errors.doctorId}>
            <SelectInput
              id="bk-doctor"
              value={doctorId}
              onChange={(e) => handleSelectDoctor(e.target.value)}
              error={errors.doctorId}
              disabled={submitting || doctorsLoading}
            >
              <option value="">
                {doctorsLoading ? 'Loading doctors…' : 'All doctors (filter or select)'}
              </option>
              {doctors.map((doc) => (
                <option key={doc.doctor_id} value={doc.doctor_id}>
                  {doc.doctor_name} — {doc.specialization}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField id="bk-date" label="Appointment Date" required error={errors.appointmentDate}>
            <TextInput
              id="bk-date"
              type="date"
              min={getTodayISO()}
              value={appointmentDate}
              onChange={(e) => handleSelectDate(e.target.value)}
              error={errors.appointmentDate}
              disabled={submitting}
            />
          </FormField>
        </div>

        {/* Available Slots */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-[#1E293B]">
              Available Time Slots <span className="text-[#DC2626]">*</span>
            </label>
            <button
              type="button"
              onClick={loadSlots}
              disabled={slotsLoading || submitting}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#0F766E] hover:text-[#115E59] disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${slotsLoading ? 'animate-spin' : ''}`} />
              Refresh slots
            </button>
          </div>

          {slotsError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-[#DC2626]">
              {slotsError}
            </div>
          ) : slotsLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-md" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#E2E8F0] bg-slate-50 px-4 py-6 text-center">
              <Clock className="mx-auto mb-1.5 h-5 w-5 text-[#64748B]" />
              <p className="text-xs font-medium text-[#0F172A]">No available slots found</p>
              <p className="mt-0.5 text-[11px] text-[#64748B]">
                Try selecting a different date or clearing the doctor filter.
              </p>
            </div>
          ) : (
            <div className="grid max-h-52 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
              {slots.map((slot) => {
                const isSelected =
                  selectedSlot?.availability_id === slot.availability_id &&
                  selectedSlot?.slot_start === slot.slot_start &&
                  selectedSlot?.doctor_id === slot.doctor_id;

                return (
                  <button
                    key={`${slot.doctor_id}-${slot.availability_id}-${slot.slot_start}`}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSlotPick(slot)}
                    className={`flex flex-col items-start rounded-md border p-2.5 text-left transition-colors ${
                      isSelected
                        ? 'border-[#0F766E] bg-[#CCFBF1]/60 text-[#0F766E] ring-1 ring-[#0F766E]'
                        : 'border-[#E2E8F0] bg-white text-[#1E293B] hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-semibold tabular-nums">
                      {formatTimeRange(slot.slot_start, slot.slot_end)}
                    </span>
                    <span className="mt-0.5 truncate w-full text-[11px] text-[#64748B]">
                      {slot.doctor_name}
                    </span>
                    <span className="text-[10px] text-slate-400">{slot.specialization}</span>
                  </button>
                );
              })}
            </div>
          )}
          {errors.slot && <p className="mt-1.5 text-xs text-[#DC2626]">{errors.slot}</p>}
        </div>

        {/* Appointment reason */}
        <FormField id="bk-reason" label="Appointment Reason">
          <TextArea
            id="bk-reason"
            rows={2}
            placeholder="e.g. Routine consultation, lab follow-up, chest discomfort evaluation…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
          />
        </FormField>

        {/* Booking summary */}
        {selectedSlot && (
          <div className="rounded-md border border-teal-200 bg-[#CCFBF1]/35 px-4 py-3 text-xs text-[#0F172A]">
            <p className="font-semibold text-[#0F766E]">Booking Summary</p>
            <p className="mt-1 text-[#1E293B]">
              {selectedSlot.doctor_name} ({selectedSlot.specialization}) ·{' '}
              <span className="font-medium">{formatDisplayDate(appointmentDate)}</span> ·{' '}
              <span className="font-medium tabular-nums">
                {formatTimeRange(selectedSlot.slot_start, selectedSlot.slot_end)}
              </span>
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
}

export default BookAppointmentModal;

