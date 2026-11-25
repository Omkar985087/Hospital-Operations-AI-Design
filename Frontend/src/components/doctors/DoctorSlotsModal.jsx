import { useCallback, useEffect, useState } from 'react';
import { Calendar, Clock, RefreshCw, Stethoscope } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FormField, TextInput } from '../ui/FormControls';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { getAvailableSlots } from '../../services/appointmentService';
import { getErrorMessage } from '../../services/api';
import { formatDisplayDate, formatTimeRange, getTodayISO } from '../../utils/formatters';

export function DoctorSlotsModal({ isOpen, onClose, doctor, onSelectSlotToBook }) {
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSlots = useCallback(async () => {
    if (!isOpen || !doctor?.doctor_id || !selectedDate) return;
    setLoading(true);
    setError('');
    try {
      const data = await getAvailableSlots({
        appointmentDate: selectedDate,
        doctorId: doctor.doctor_id,
      });
      setSlots(Array.isArray(data?.available_slots) ? data.available_slots : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load available slots for this doctor.'));
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [isOpen, doctor?.doctor_id, selectedDate]);

  useEffect(() => {
    if (isOpen) {
      fetchSlots();
    }
  }, [isOpen, fetchSlots]);

  if (!doctor) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${doctor.doctor_name} — Available Slots`}
      description={`${doctor.specialization} · Doctor ID #${doctor.doctor_id}`}
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#CCFBF1] text-[#0F766E]">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">{doctor.doctor_name}</p>
              <p className="text-xs text-[#64748B]">{doctor.specialization}</p>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <FormField id="doc-slot-date" label="Check Date">
              <TextInput
                id="doc-slot-date"
                type="date"
                min={getTodayISO()}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
            </FormField>
            <Button
              variant="secondary"
              size="md"
              icon={RefreshCw}
              onClick={fetchSlots}
              disabled={loading}
              aria-label="Refresh doctor slots"
            >
              Refresh
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-[#DC2626]">
            {error}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-md" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={`No open slots on ${formatDisplayDate(selectedDate)}`}
            description="Select another date above to check availability for this doctor."
          />
        ) : (
          <div>
            <p className="mb-2.5 text-xs font-medium text-[#64748B]">
              {slots.length} open slot{slots.length === 1 ? '' : 's'} on{' '}
              {formatDisplayDate(selectedDate)} — select a slot to book
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
              {slots.map((slot) => (
                <button
                  key={`${slot.availability_id}-${slot.slot_start}`}
                  type="button"
                  onClick={() => {
                    onClose?.();
                    onSelectSlotToBook?.(doctor, selectedDate, slot);
                  }}
                  className="group flex flex-col items-start rounded-md border border-[#E2E8F0] bg-white p-3 text-left transition-colors hover:border-[#0F766E] hover:bg-[#CCFBF1]/30"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] tabular-nums">
                      <Clock className="h-3.5 w-3.5 text-[#0F766E]" />
                      {formatTimeRange(slot.slot_start, slot.slot_end)}
                    </span>
                  </div>
                  <span className="mt-1.5 text-[11px] font-medium text-[#0F766E] group-hover:underline">
                    Book this slot →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default DoctorSlotsModal;

