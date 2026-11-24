

// Working on this module - WIP
import apiClient from './apiClient';
// import moment from 'moment';

export const getClinicAppointments = async (clinicId, filters = {}) => {
  let response = await apiClient.get(`/receptionists/appointments/${clinicId}`, {
    params: filters
  });
  return response.data;
};

export const getTodayClinicAppointments = async (clinicId) => {
  const response = await apiClient.get(`/receptionists/appointments/${clinicId}`);
  return response.data;
};

export const bookAppointment = async (appointmentData) => {
  const response = await apiClient.post('/appointments', appointmentData);
  return response.data;
};
 
export const updateAppointmentStatus = async (appointmentId, status) => {
  const response = await apiClient.put(`/receptionists/appointments/${appointmentId}/status`, { 
    status 
  });
  return response.data;
};
 
export const cancelAppointment = async (appointmentId, reason) => {
  const response = await apiClient.put(`/appointments/${appointmentId}`, {  
    status: 'cancelled',
    cancellationReason: reason 
  });
  return response.data;
};

export const getClinicPatients = async (clinicId, filters = {}) => {
  const response = await apiClient.get(`/receptionists/patients/${clinicId}`, { 
    params: filters
  });
  return response.data;
};

export const searchPatients = async (query) => {
  const response = await apiClient.get('/users', { 
    params: {  search: query, role: 'patient' }
  });
  return response.data;
    console.warn('check this later');
};

export const getPatientDetails = async (patientId) => {
  const response = await apiClient.get(`/users/${patientId}`);
  return response.data;
};

export const getDoctorQueue = async (doctorId) => {
  const today = new Date().toISOString().split('T')[0];
  const response = await apiClient.get(`/queue/doctor/${doctorId}/${today}`);
  return response.data;
};

export const checkInPatient = async (appointmentId) => {
  const response = await apiClient.post(`/queue/checkin/${appointmentId}`);
  return response.data;
};

export const callNextPatient = async (doctorId) => {
  const response = await apiClient.put(`/queue/next/${doctorId}`);
  return response.data;
};

export const getQueuePosition = async (appointmentId) => {
  const response = await apiClient.get(`/queue/position/${appointmentId}`);
  return response.data;
};
 
export const getClinicDoctors = async (clinicId) => {
  const response = await apiClient.get(`/receptionists/doctors/${clinicId}`);
  return response.data;
};

export const updateDoctorAvailability = async (doctorId, availability, clinicId) => {
  const response = await apiClient.put(`/receptionists/doctors/${doctorId}/availability`, { 
    availability,
    clinicId 
  });
  return response.data;
};

export const getDoctorAvailableSlots = async (doctorId, date) => {
  const response = await apiClient.get(`/slots/doctor/${doctorId}`, {
    params: { date }
  });
  return response.data;
};

export const getDoctorDetails = async (doctorId) => {
  const response = await apiClient.get(`/doctors/${doctorId}`);
  return response.data;
};

export default {
  getClinicAppointments,
  getTodayClinicAppointments,
  bookAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  getClinicPatients,
  searchPatients,
  getPatientDetails,
  getDoctorQueue,
  checkInPatient,
  callNextPatient,
  getQueuePosition,
  getClinicDoctors,
  updateDoctorAvailability,
  getDoctorAvailableSlots,
  getDoctorDetails,
};
