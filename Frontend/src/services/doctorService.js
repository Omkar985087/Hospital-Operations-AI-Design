import apiClient from './api';

/**
 * GET /appointments/doctors
 * Returns { total_doctors, doctors: [{ doctor_id, doctor_name, specialization }] }
 */
export async function getDoctors() {
  const response = await apiClient.get('/appointments/doctors');
  return response.data;
}

