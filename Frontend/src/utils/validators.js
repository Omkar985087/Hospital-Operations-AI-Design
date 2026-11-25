import { getTodayISO } from './formatters';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePatientForm(values) {
  const errors = {};

  if (!values.full_name || values.full_name.trim().length < 2) {
    errors.full_name = 'Full name is required (minimum 2 characters).';
  }

  if (!values.date_of_birth) {
    errors.date_of_birth = 'Date of birth is required.';
  } else if (values.date_of_birth >= getTodayISO()) {
    errors.date_of_birth = 'Date of birth must be in the past.';
  }

  const digits = (values.phone || '').replace(/\D/g, '');
  if (!values.phone || !values.phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (digits.length < 10 || digits.length > 15) {
    errors.phone = 'Enter a valid 10 to 15 digit phone number.';
  }

  if (values.email && values.email.trim() && !EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (values.emergency_contact_phone && values.emergency_contact_phone.trim()) {
    const ecDigits = values.emergency_contact_phone.replace(/\D/g, '');
    if (ecDigits.length < 10 || ecDigits.length > 15) {
      errors.emergency_contact_phone = 'Enter a valid emergency phone number (10–15 digits).';
    }
  }

  return errors;
}

export function validateBookingForm({ patientId, doctorId, appointmentDate, selectedSlot }) {
  const errors = {};

  if (!patientId || !patientId.trim()) {
    errors.patientId = 'Please select or enter a patient ID.';
  }

  if (!doctorId) {
    errors.doctorId = 'Please select a doctor.';
  }

  if (!appointmentDate) {
    errors.appointmentDate = 'Please select an appointment date.';
  }

  if (!selectedSlot) {
    errors.slot = 'Please choose an available time slot.';
  }

  return errors;
}

export function validatePdfFile(file) {
  if (!file) return 'Please choose a PDF document to upload.';
  const isPdfName = file.name?.toLowerCase().endsWith('.pdf');
  const isPdfMime = !file.type || file.type === 'application/pdf';
  if (!isPdfName) {
    return 'Only PDF (.pdf) documents are supported by the backend pipeline.';
  }
  if (!isPdfMime && !isPdfName) {
    return 'Invalid file type. Only PDF files are allowed.';
  }
  if (file.size > 50 * 1024 * 1024) {
    return 'File size exceeds 50 MB limit.';
  }
  return null;
}

