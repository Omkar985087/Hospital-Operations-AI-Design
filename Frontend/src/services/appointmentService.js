import apiClient from './api';

/**
 * GET /appointments/available
 * Query params: appointment_date (YYYY-MM-DD), optional doctor_id (int)
 * Returns { total_slots, available_slots: [...] }
 */
export async function getAvailableSlots({ appointmentDate, doctorId } = {}) {
  const params = {
    appointment_date: appointmentDate,
  };

  if (doctorId !== undefined && doctorId !== null && String(doctorId).trim() !== '') {
    params.doctor_id = Number(doctorId);
  }

  const response = await apiClient.get('/appointments/available', { params });
  return response.data;
}

/**
 * POST /appointments/book
 * Request body: { patient_id, doctor_id, availability_id, appointment_date, start_time, reason }
 * Returns { message, appointment: { appointment_id, appointment_status, appointment_date, start_time, end_time } }
 */
export async function bookAppointment({
  patientId,
  doctorId,
  availabilityId,
  appointmentDate,
  startTime,
  reason,
}) {
  const payload = {
    patient_id: patientId.trim(),
    doctor_id: Number(doctorId),
    availability_id: Number(availabilityId),
    appointment_date: appointmentDate,
    start_time: startTime,
    reason: reason && reason.trim() ? reason.trim() : null,
  };

  const response = await apiClient.post('/appointments/book', payload);
  return response.data;
}

/**
 * GET /appointments/patient/{patient_id}
 * Returns { patient_id, total_appointments, appointments: [...] }
 */
export async function getPatientAppointments(patientId) {
  const encodedId = encodeURIComponent(patientId.trim());
  const response = await apiClient.get(`/appointments/patient/${encodedId}`);
  return response.data;
}

/**
 * PATCH /appointments/{appointment_id}/cancel
 * Returns { message, appointment: { appointment_id, appointment_status } }
 */
export async function cancelAppointment(appointmentId) {
  const response = await apiClient.patch(`/appointments/${appointmentId}/cancel`);
  return response.data;
}

