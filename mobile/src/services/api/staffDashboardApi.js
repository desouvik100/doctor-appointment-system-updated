/**
 * Staff/Receptionist Dashboard API Service
 * All API calls for clinic staff features
 * Updated to match actual backend endpoints
 */

import apiClient from './apiClient';

// ==========================================
// APPOINTMENTS
// ==========================================

/**
 * Get clinic appointments (uses receptionist route)
 * Route: /api/receptionists/appointments/:clinicId
 */
export const getClinicAppointments = async (clinicId, filters = {}) => {
  const response = await apiClient.get(`/receptionists/appointments/${clinicId}`, {
    params: filters
  });
  return response.data;
};

/**
 * Get today's appointments for clinic
 */
export const getTodayClinicAppointments = async (clinicId) => {
  const response = await apiClient.get(`/receptionists/appointments/${clinicId}`);
  return response.data;
};

/**
 * Book new appointment
 */
export const bookAppointment = async (appointmentData) => {
  const response = await apiClient.post('/appointments', appointmentData);
  return response.data;
};

/**
 * Update appointment status
 */
export const updateAppointmentStatus = async (appointmentId, status) => {
  const response = await apiClient.put(`/receptionists/appointments/${appointmentId}/status`, { 
    status 
  });
  return response.data;
};

/**
 * Cancel appointment
 */
export const cancelAppointment = async (appointmentId, reason) => {
  const response = await apiClient.put(`/appointments/${appointmentId}`, { 
    status: 'cancelled',
    cancellationReason: reason 
  });
  return response.data;
};

// ==========================================
// PATIENT MANAGEMENT
// ==========================================

/**
 * Get clinic patients (uses receptionist route)
 * Route: /api/receptionists/patients/:clinicId
 */
export const getClinicPatients = async (clinicId, filters = {}) => {
  const response = await apiClient.get(`/receptionists/patients/${clinicId}`, {
    params: filters
  });
  return response.data;
};

/**
 * Search patients
 */
export const searchPatients = async (query) => {
  const response = await apiClient.get('/users', {
    params: { search: query, role: 'patient' }
  });
  return response.data;
};

/**
 * Get patient details
 */
export const getPatientDetails = async (patientId) => {
  const response = await apiClient.get(`/users/${patientId}`);
  return response.data;
};

// ==========================================
// QUEUE MANAGEMENT
// ==========================================

/**
 * Get queue for a doctor on today's date
 */
export const getDoctorQueue = async (doctorId) => {
  const today = new Date().toISOString().split('T')[0];
  const response = await apiClient.get(`/queue/doctor/${doctorId}/${today}`);
  return response.data;
};

/**
 * Check-in patient (uses queue checkin endpoint)
 */
export const checkInPatient = async (appointmentId) => {
  const response = await apiClient.post(`/queue/checkin/${appointmentId}`);
  return response.data;
};

/**
 * Call next patient for a doctor
 */
export const callNextPatient = async (doctorId) => {
  const response = await apiClient.put(`/queue/next/${doctorId}`);
  return response.data;
};

/**
 * Get patient's queue position
 */
export const getQueuePosition = async (appointmentId) => {
  const response = await apiClient.get(`/queue/position/${appointmentId}`);
  return response.data;
};

// ==========================================
// DOCTOR MANAGEMENT
// ==========================================

/**
 * Get clinic doctors (uses receptionist route)
 * Route: /api/receptionists/doctors/:clinicId
 */
export const getClinicDoctors = async (clinicId) => {
  const response = await apiClient.get(`/receptionists/doctors/${clinicId}`);
  return response.data;
};

/**
 * Update doctor availability
 */
export const updateDoctorAvailability = async (doctorId, availability, clinicId) => {
  const response = await apiClient.put(`/receptionists/doctors/${doctorId}/availability`, { 
    availability,
    clinicId 
  });
  return response.data;
};

/**
 * Get doctor's available slots
 */
export const getDoctorAvailableSlots = async (doctorId, date) => {
  const response = await apiClient.get(`/slots/doctor/${doctorId}`, {
    params: { date }
  });
  return response.data;
};

/**
 * Get doctor details
 */
export const getDoctorDetails = async (doctorId) => {
  const response = await apiClient.get(`/doctors/${doctorId}`);
  return response.data;
};

export default {
  // Appointments
  getClinicAppointments,
  getTodayClinicAppointments,
  bookAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  // Patients
  getClinicPatients,
  searchPatients,
  getPatientDetails,
  // Queue
  getDoctorQueue,
  checkInPatient,
  callNextPatient,
  getQueuePosition,
  // Doctors
  getClinicDoctors,
  updateDoctorAvailability,
  getDoctorAvailableSlots,
  getDoctorDetails,
};
