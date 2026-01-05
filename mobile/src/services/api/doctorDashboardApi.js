/**
 * Doctor Dashboard API Service
 * All API calls for doctor-specific features
 */

import apiClient from './apiClient';

// ==========================================
// DASHBOARD & STATS
// ==========================================

/**
 * Get doctor's dashboard statistics
 */
export const getDoctorStats = async (doctorId) => {
  const response = await apiClient.get(`/doctors/${doctorId}`);
  return response.data;
};

/**
 * Get doctor's summary statistics
 */
export const getDoctorSummary = async () => {
  const response = await apiClient.get('/doctors/summary');
  return response.data;
};

// ==========================================
// APPOINTMENTS
// ==========================================

/**
 * Get doctor's appointments for today
 */
export const getTodayAppointments = async (doctorId) => {
  const today = new Date().toISOString().split('T')[0];
  const response = await apiClient.get(`/appointments/doctor/${doctorId}`, {
    params: { date: today }
  });
  return response.data;
};

/**
 * Get all doctor's appointments with optional filters
 */
export const getDoctorAppointments = async (doctorId, filters = {}) => {
  const response = await apiClient.get(`/appointments/doctor/${doctorId}`, {
    params: filters
  });
  return response.data;
};

/**
 * Get appointment details
 */
export const getAppointmentDetails = async (appointmentId) => {
  const response = await apiClient.get(`/appointments/${appointmentId}`);
  return response.data;
};

/**
 * Update appointment status
 */
export const updateAppointmentStatus = async (appointmentId, status) => {
  const response = await apiClient.put(`/appointments/${appointmentId}/status`, { status });
  return response.data;
};

/**
 * Mark appointment as completed
 */
export const completeAppointment = async (appointmentId, notes = '') => {
  const response = await apiClient.put(`/appointments/${appointmentId}/complete`, { notes });
  return response.data;
};

/**
 * Start consultation (mark as in-progress)
 */
export const startConsultation = async (appointmentId) => {
  const response = await apiClient.put(`/appointments/${appointmentId}/status`, { 
    status: 'in-progress' 
  });
  return response.data;
};

// ==========================================
// PATIENTS
// ==========================================

/**
 * Get doctor's patients list
 */
export const getDoctorPatients = async (doctorId) => {
  const response = await apiClient.get(`/doctors/${doctorId}/patients`);
  return response.data;
};

/**
 * Get patient details
 */
export const getPatientDetails = async (patientId) => {
  const response = await apiClient.get(`/users/${patientId}`);
  return response.data;
};

/**
 * Get patient's health records
 */
export const getPatientHealthRecords = async (patientId) => {
  const response = await apiClient.get(`/health/${patientId}/records`);
  return response.data;
};

/**
 * Get patient's vitals history
 */
export const getPatientVitals = async (patientId) => {
  const response = await apiClient.get(`/health/${patientId}/vitals`);
  return response.data;
};

/**
 * Get patient's medical timeline
 */
export const getPatientTimeline = async (patientId) => {
  const response = await apiClient.get(`/health/${patientId}/timeline`);
  return response.data;
};

// ==========================================
// PRESCRIPTIONS
// ==========================================

/**
 * Create a new prescription
 */
export const createPrescription = async (prescriptionData) => {
  const response = await apiClient.post('/prescriptions', prescriptionData);
  return response.data;
};

/**
 * Get doctor's prescriptions
 */
export const getDoctorPrescriptions = async (doctorId, filters = {}) => {
  const response = await apiClient.get(`/prescriptions/doctor/${doctorId}`, {
    params: filters
  });
  return response.data;
};

/**
 * Get prescription details
 */
export const getPrescriptionDetails = async (prescriptionId) => {
  const response = await apiClient.get(`/prescriptions/${prescriptionId}`);
  return response.data;
};

/**
 * Update prescription
 */
export const updatePrescription = async (prescriptionId, data) => {
  const response = await apiClient.put(`/prescriptions/${prescriptionId}`, data);
  return response.data;
};

// ==========================================
// CONSULTATION NOTES
// ==========================================

/**
 * Create consultation notes
 */
export const createConsultationNotes = async (notesData) => {
  const response = await apiClient.post('/consultation-notes', notesData);
  return response.data;
};

/**
 * Get consultation notes for appointment
 */
export const getConsultationNotes = async (appointmentId) => {
  const response = await apiClient.get(`/consultation-notes/appointment/${appointmentId}`);
  return response.data;
};

/**
 * Update consultation notes
 */
export const updateConsultationNotes = async (notesId, data) => {
  const response = await apiClient.put(`/consultation-notes/${notesId}`, data);
  return response.data;
};

// ==========================================
// SCHEDULE MANAGEMENT
// ==========================================

/**
 * Get doctor's weekly schedule
 */
export const getDoctorSchedule = async (doctorId) => {
  const response = await apiClient.get(`/doctors/${doctorId}/schedule`);
  return response.data;
};

/**
 * Update doctor's weekly schedule
 */
export const updateDoctorSchedule = async (doctorId, scheduleData) => {
  const response = await apiClient.put(`/doctors/${doctorId}/schedule`, scheduleData);
  return response.data;
};

/**
 * Get doctor's calendar view
 */
export const getDoctorCalendar = async (doctorId, month, year) => {
  const response = await apiClient.get(`/doctors/${doctorId}/calendar`, {
    params: { month, year }
  });
  return response.data;
};

/**
 * Add special date (leave/holiday)
 */
export const addSpecialDate = async (doctorId, dateData) => {
  const response = await apiClient.post(`/doctors/${doctorId}/special-dates`, dateData);
  return response.data;
};

/**
 * Remove special date
 */
export const removeSpecialDate = async (doctorId, dateId) => {
  const response = await apiClient.delete(`/doctors/${doctorId}/special-dates/${dateId}`);
  return response.data;
};

/**
 * Apply for leave
 */
export const applyForLeave = async (leaveData) => {
  const response = await apiClient.post('/doctor-leaves', leaveData);
  return response.data;
};

// ==========================================
// ONLINE STATUS
// ==========================================

/**
 * Send heartbeat to update online status
 */
export const sendHeartbeat = async (doctorId) => {
  const response = await apiClient.post(`/doctors/${doctorId}/heartbeat`);
  return response.data;
};

/**
 * Set doctor availability
 */
export const setAvailability = async (doctorId, availability) => {
  const response = await apiClient.put(`/doctors/${doctorId}`, { availability });
  return response.data;
};

// ==========================================
// PROFILE
// ==========================================

/**
 * Update doctor profile
 */
export const updateDoctorProfile = async (doctorId, profileData) => {
  const response = await apiClient.put(`/doctors/${doctorId}`, profileData);
  return response.data;
};

/**
 * Update consultation fee
 */
export const updateConsultationFee = async (doctorId, fee) => {
  const response = await apiClient.put(`/doctors/${doctorId}`, { consultationFee: fee });
  return response.data;
};

/**
 * Update consultation duration
 */
export const updateConsultationDuration = async (doctorId, duration) => {
  const response = await apiClient.put(`/doctors/${doctorId}/consultation-duration`, { 
    consultationDuration: duration 
  });
  return response.data;
};

export default {
  // Dashboard
  getDoctorStats,
  getDoctorSummary,
  // Appointments
  getTodayAppointments,
  getDoctorAppointments,
  getAppointmentDetails,
  updateAppointmentStatus,
  completeAppointment,
  startConsultation,
  // Patients
  getDoctorPatients,
  getPatientDetails,
  getPatientHealthRecords,
  getPatientVitals,
  getPatientTimeline,
  // Prescriptions
  createPrescription,
  getDoctorPrescriptions,
  getPrescriptionDetails,
  updatePrescription,
  // Consultation Notes
  createConsultationNotes,
  getConsultationNotes,
  updateConsultationNotes,
  // Schedule
  getDoctorSchedule,
  updateDoctorSchedule,
  getDoctorCalendar,
  addSpecialDate,
  removeSpecialDate,
  applyForLeave,
  // Online Status
  sendHeartbeat,
  setAvailability,
  // Profile
  updateDoctorProfile,
  updateConsultationFee,
  updateConsultationDuration,
};
