import apiClient from './api';

const normalizeOptional = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * POST /patients/register
 * Registers a new patient in SQL Server via FastAPI.
 */
export async function registerPatient(formValues) {
  const payload = {
    full_name: formValues.full_name.trim(),
    date_of_birth: formValues.date_of_birth,
    gender: normalizeOptional(formValues.gender),
    phone: formValues.phone.trim(),
    email: normalizeOptional(formValues.email),
    address: normalizeOptional(formValues.address),
    emergency_contact_name: normalizeOptional(formValues.emergency_contact_name),
    emergency_contact_phone: normalizeOptional(formValues.emergency_contact_phone),
  };

  const response = await apiClient.post('/patients/register', payload);
  return response.data;
}

