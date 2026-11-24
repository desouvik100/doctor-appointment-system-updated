

import apiClient from './apiClient';

export const getDoctorStats = async (doctorId) => {
  const response = await apiClient.get(`/doctors/${doctorId}`);
  return response.data;
};

export const getDoctorSummary = async () => {
  const response = await apiClient.get('/doctors/summary');
  return response.data;
};

export const getTodayAppointments = async (doctorId) => {
  const today = new Date().toISOString().split('T')[0];
  const response = await apiClient.get(`/appointments/doctor/${doctorId}`, {
    params: { date: today }
  });
  return response.data;
};

export const getDoctorAppointments = async (doctorId, filters = {}) => {
  const response = await apiClient.get(`/appointments/doctor/${doctorId}`, {
    params: filters
  });
  return response.data;
};

export const getAppointmentDetails = async (appointmentId) => {
  const response = await apiClient.get(`/appointments/${appointmentId}`);
  return response.data;
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  const response = await apiClient.put(`/appointments/${appointmentId}/status`, { status });
  return response.data;
};

export const completeAppointment = async (appointmentId, notes = '') => {
  const response = await apiClient.put(`/appointments/${appointmentId}/complete`, { notes });
  return response.data;
};

export const startConsultation = async (appointmentId) => {
  const response = await apiClient.put(`/appointments/${appointmentId}/status`, { 
    status: 'in-progress' 
  });
  return response.data;
};

export const getDoctorPatients = async (doctorId) => {
  const response = await apiClient.get(`/doctors/${doctorId}/patients`);
  return response.data;
};

export const getPatientDetails = async (patientId) => {
  const response = await apiClient.get(`/users/${patientId}`);
  return response.data;
};

export const getPatientHealthRecords = async (patientId) => {
  const response = await apiClient.get(`/health/${patientId}/records`);
  return response.data;
};

export const getPatientVitals = async (patientId) => {
  const response = await apiClient.get(`/health/${patientId}/vitals`);
  return response.data;
};

export const getPatientTimeline = async (patientId) => {
  const response = await apiClient.get(`/health/${patientId}/timeline`);
  return response.data;
};

export const createPrescription = async (prescriptionData) => {
  const response = await apiClient.post('/prescriptions', prescriptionData);
  return response.data;
};

export const getDoctorPrescriptions = async (doctorId, filters = {}) => {
  const response = await apiClient.get(`/prescriptions/doctor/${doctorId}`, {
    params: filters
  });
  return response.data;
};

export const getPrescriptionDetails = async (prescriptionId) => {
  const response = await apiClient.get(`/prescriptions/${prescriptionId}`);
  return response.data;
};

export const updatePrescription = async (prescriptionId, data) => {
  const response = await apiClient.put(`/prescriptions/${prescriptionId}`, data);
  return response.data;
};

export const createConsultationNotes = async (notesData) => {
  const response = await apiClient.post('/consultation-notes', notesData);
  return response.data;
};

export const getConsultationNotes = async (appointmentId) => {
  const response = await apiClient.get(`/consultation-notes/appointment/${appointmentId}`);
  return response.data;
};

export const updateConsultationNotes = async (notesId, data) => {
  const response = await apiClient.put(`/consultation-notes/${notesId}`, data);
  return response.data;
};

export const getDoctorSchedule = async (doctorId) => {
  const response = await apiClient.get(`/doctors/${doctorId}/schedule`);
  return response.data;
};

export const updateDoctorSchedule = async (doctorId, scheduleData) => {
  const response = await apiClient.put(`/doctors/${doctorId}/schedule`, scheduleData);
  return response.data;
};

export const getDoctorCalendar = async (doctorId, month, year) => {
  const response = await apiClient.get(`/doctors/${doctorId}/calendar`, {
    params: { month, year }
  });
  return response.data;
};

export const addSpecialDate = async (doctorId, dateData) => {
  const response = await apiClient.post(`/doctors/${doctorId}/special-dates`, dateData);
  return response.data;
};

export const removeSpecialDate = async (doctorId, dateId) => {
  const response = await apiClient.delete(`/doctors/${doctorId}/special-dates/${dateId}`);
  return response.data;
};

export const applyForLeave = async (leaveData) => {
  const response = await apiClient.post('/doctor-leaves', leaveData);
  return response.data;
};

export const sendHeartbeat = async (doctorId) => {
  const response = await apiClient.post(`/doctors/${doctorId}/heartbeat`);
  return response.data;
};

export const setAvailability = async (doctorId, availability) => {
  const response = await apiClient.put(`/doctors/${doctorId}`, { availability });
  return response.data;
};

export const updateDoctorProfile = async (doctorId, profileData) => {
  const response = await apiClient.put(`/doctors/${doctorId}`, profileData);
  return response.data;
};

export const updateConsultationFee = async (doctorId, fee) => {
  const response = await apiClient.put(`/doctors/${doctorId}`, { consultationFee: fee });
  return response.data;
};

export const updateConsultationDuration = async (doctorId, duration) => {
  const response = await apiClient.put(`/doctors/${doctorId}/consultation-duration`, { 
    consultationDuration: duration 
  });
  return response.data;
};

export default {
  getDoctorStats,
  getDoctorSummary,
  getTodayAppointments,
  getDoctorAppointments,
  getAppointmentDetails,
  updateAppointmentStatus,
  completeAppointment,
  startConsultation,
  getDoctorPatients,
  getPatientDetails,
  getPatientHealthRecords,
  getPatientVitals,
  getPatientTimeline,
  createPrescription,
  getDoctorPrescriptions,
  getPrescriptionDetails,
  updatePrescription,
  createConsultationNotes,
  getConsultationNotes,
  updateConsultationNotes,
  getDoctorSchedule,
  updateDoctorSchedule,
  getDoctorCalendar,
  addSpecialDate,
  removeSpecialDate,
  applyForLeave,
  sendHeartbeat,
  setAvailability,
  updateDoctorProfile,
  updateConsultationFee,
  updateConsultationDuration,
};
