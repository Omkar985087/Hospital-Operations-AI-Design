import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FormField, SelectInput, TextArea, TextInput } from '../ui/FormControls';
import { registerPatient } from '../../services/patientService';
import { getErrorMessage } from '../../services/api';
import { validatePatientForm } from '../../utils/validators';
import { getTodayISO } from '../../utils/formatters';
import { useWorkspace } from '../../hooks/useWorkspaceData';
import { useToast } from '../../hooks/useToast';

const INITIAL_FORM = {
  full_name: '',
  date_of_birth: '',
  gender: '',
  phone: '',
  email: '',
  address: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
};

export function RegisterPatientModal({ isOpen, onClose, onRegistered }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { upsertPatient, addNotification } = useWorkspace();
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM);
      setErrors({});
      setApiError('');
    }
  }, [isOpen]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validatePatientForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setApiError('');

    try {
      const response = await registerPatient(form);

      const storedRecord = {
        patient_id: response.patient_id,
        full_name: response.full_name || form.full_name.trim(),
        date_of_birth: form.date_of_birth,
        gender: form.gender || null,
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        emergency_contact_name: form.emergency_contact_name.trim() || null,
        emergency_contact_phone: form.emergency_contact_phone.trim() || null,
        registration_status: response.registration_status || 'REGISTERED',
        created_at: new Date().toISOString(),
      };

      upsertPatient(storedRecord);
      addNotification({
        title: 'Patient registered',
        detail: `${storedRecord.full_name} (${storedRecord.patient_id.slice(0, 8)}…)`,
      });
      toast.success(
        'Patient registered',
        `${storedRecord.full_name} registered with ID ${storedRecord.patient_id}`
      );
      onRegistered?.(storedRecord);
      onClose?.();
    } catch (err) {
      const msg = getErrorMessage(err, 'Patient registration failed.');
      setApiError(msg);
      toast.error('Registration failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Patient"
      description="Submits directly to POST /patients/register and stores the returned patient UUID."
      size="lg"
      preventClose={submitting}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="register-patient-form"
            loading={submitting}
            icon={UserPlus}
          >
            Register Patient
          </Button>
        </>
      }
    >
      <form id="register-patient-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {apiError && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-[#DC2626]"
          >
            {apiError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField id="pt-full-name" label="Full Name" required error={errors.full_name}>
            <TextInput
              id="pt-full-name"
              placeholder="e.g. Elena Rostova"
              value={form.full_name}
              onChange={handleChange('full_name')}
              error={errors.full_name}
              disabled={submitting}
              autoFocus
            />
          </FormField>

          <FormField id="pt-dob" label="Date of Birth" required error={errors.date_of_birth}>
            <TextInput
              id="pt-dob"
              type="date"
              max={getTodayISO()}
              value={form.date_of_birth}
              onChange={handleChange('date_of_birth')}
              error={errors.date_of_birth}
              disabled={submitting}
            />
          </FormField>

          <FormField id="pt-phone" label="Phone Number" required error={errors.phone}>
            <TextInput
              id="pt-phone"
              type="tel"
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={handleChange('phone')}
              error={errors.phone}
              disabled={submitting}
            />
          </FormField>

          <FormField id="pt-gender" label="Gender" error={errors.gender}>
            <SelectInput
              id="pt-gender"
              value={form.gender}
              onChange={handleChange('gender')}
              disabled={submitting}
            >
              <option value="">Select gender (optional)</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </SelectInput>
          </FormField>

          <FormField id="pt-email" label="Email Address" error={errors.email}>
            <TextInput
              id="pt-email"
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={handleChange('email')}
              error={errors.email}
              disabled={submitting}
            />
          </FormField>

          <FormField id="pt-address" label="Residential Address" error={errors.address}>
            <TextInput
              id="pt-address"
              placeholder="Street, city, postal code"
              value={form.address}
              onChange={handleChange('address')}
              error={errors.address}
              disabled={submitting}
            />
          </FormField>
        </div>

        <div className="border-t border-[#E2E8F0] pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Emergency Contact (Optional)
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="pt-ec-name"
              label="Contact Name"
              error={errors.emergency_contact_name}
            >
              <TextInput
                id="pt-ec-name"
                placeholder="Full name"
                value={form.emergency_contact_name}
                onChange={handleChange('emergency_contact_name')}
                disabled={submitting}
              />
            </FormField>

            <FormField
              id="pt-ec-phone"
              label="Contact Phone"
              error={errors.emergency_contact_phone}
            >
              <TextInput
                id="pt-ec-phone"
                type="tel"
                placeholder="10-digit phone"
                value={form.emergency_contact_phone}
                onChange={handleChange('emergency_contact_phone')}
                error={errors.emergency_contact_phone}
                disabled={submitting}
              />
            </FormField>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default RegisterPatientModal;

