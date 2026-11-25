/**
 * Synthetic demo-only statistics used strictly on the Dashboard where the
 * FastAPI backend does not expose hospital-wide aggregate endpoints.
 * Clearly labeled in the UI as "Demo Data".
 */

export const DEMO_SUMMARY_METRICS = {
  totalPatients: 142,
  todaysAppointments: 28,
  cancelledAppointments: 3,
  completedAppointments: 11,
  bookedAppointments: 14,
};

export const DEMO_APPOINTMENT_STATUS_CHART = [
  { status: 'Booked', count: 14, fill: '#0F766E' },
  { status: 'Completed', count: 11, fill: '#475569' },
  { status: 'Cancelled', count: 3, fill: '#DC2626' },
];

export const DEMO_WEEKLY_APPOINTMENT_TREND = [
  { day: 'Mon', booked: 22, completed: 19, cancelled: 2 },
  { day: 'Tue', booked: 26, completed: 23, cancelled: 1 },
  { day: 'Wed', booked: 24, completed: 20, cancelled: 3 },
  { day: 'Thu', booked: 31, completed: 27, cancelled: 2 },
  { day: 'Fri', booked: 28, completed: 24, cancelled: 3 },
  { day: 'Sat', booked: 16, completed: 14, cancelled: 1 },
];

export const DEMO_TODAY_SCHEDULE = [
  {
    appointment_id: 'DEMO-1041',
    patient_name: 'Demo Patient A',
    patient_id: 'demo-pt-101',
    doctor_name: 'General Outpatient Clinic',
    specialization: 'Internal Medicine',
    start_time: '09:00:00',
    end_time: '09:30:00',
    appointment_status: 'COMPLETED',
    reason: 'Annual physical follow-up',
  },
  {
    appointment_id: 'DEMO-1042',
    patient_name: 'Demo Patient B',
    patient_id: 'demo-pt-102',
    doctor_name: 'Cardiology Unit',
    specialization: 'Cardiology',
    start_time: '10:30:00',
    end_time: '11:00:00',
    appointment_status: 'BOOKED',
    reason: 'ECG & blood pressure review',
  },
  {
    appointment_id: 'DEMO-1043',
    patient_name: 'Demo Patient C',
    patient_id: 'demo-pt-103',
    doctor_name: 'Orthopedics Wing',
    specialization: 'Orthopedics',
    start_time: '11:30:00',
    end_time: '12:00:00',
    appointment_status: 'BOOKED',
    reason: 'Post-op mobility evaluation',
  },
  {
    appointment_id: 'DEMO-1044',
    patient_name: 'Demo Patient D',
    patient_id: 'demo-pt-104',
    doctor_name: 'Pulmonology Clinic',
    specialization: 'Pulmonology',
    start_time: '14:00:00',
    end_time: '14:30:00',
    appointment_status: 'CANCELLED',
    reason: 'Rescheduled by clinic desk',
  },
];

export const DEMO_RECENT_REGISTRATIONS = [
  {
    patient_id: 'demo-reg-901',
    full_name: 'Synthetic Intake #901',
    date_of_birth: '1986-04-14',
    phone: '5550101901',
    registration_status: 'REGISTERED',
    created_at: 'Today, 08:42 AM',
  },
  {
    patient_id: 'demo-reg-902',
    full_name: 'Synthetic Intake #902',
    date_of_birth: '1973-09-22',
    phone: '5550101902',
    registration_status: 'REGISTERED',
    created_at: 'Today, 09:15 AM',
  },
  {
    patient_id: 'demo-reg-903',
    full_name: 'Synthetic Intake #903',
    date_of_birth: '1994-11-03',
    phone: '5550101903',
    registration_status: 'REGISTERED',
    created_at: 'Today, 10:08 AM',
  },
];

