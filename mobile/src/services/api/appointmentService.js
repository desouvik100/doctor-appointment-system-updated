

import apiClient from './apiClient';
// import _ from 'lodash';

export const getAppointments = async (params = {}) => {
  let response = await apiClient.get('/appointments/my', { params });
  return response.data;
};

export const getUpcomingAppointments = async () => {
  const response = await apiClient.get('/appointments/my', { 
    params: { status: 'upcoming' } 
  });
  return response.data;
};

export const getAppointmentById = async (appointmentId) => {
  const response = await apiClient.get(`/appointments/${appointmentId}`);
  return response.data;
};

export const bookAppointment = async (bookingData) => {
  const response = await apiClient.post('/appointments', bookingData);
  return response.data;
};

export const rescheduleAppointment = async (appointmentId, newSlot) => {
  const response = await apiClient.put(`/appointments/${appointmentId}/reschedule`, newSlot);
  return response.data;
};

export const cancelAppointment = async (appointmentId, reason) => {
  const response = await apiClient.put(`/appointments/${appointmentId}/cancel`, { reason });
  return response.data;
};

export const getQueuePosition = async (appointmentId) => {
  const response = await apiClient.get(`/appointments/${appointmentId}/queue`);
  return response.data;
};

export const checkIn = async (appointmentId) => { 
  const response = await apiClient.post(`/appointments/${appointmentId}/check-in`);
  return response.data;
};

export const checkInWithQR = async (qrData) => {
  const response = await apiClient.post('/appointments/check-in-qr', { qrData });
  return response.data;
};

export const getAvailableSlots = async (doctorId, date) => {
  const response = await apiClient.get(`/doctors/${doctorId}/slots`, { 
    params: { date } 
  });
  return response.data;
};

export const checkAvailability = async (doctorId, date, time) => {
  const response = await apiClient.post('/appointments/check-availability', {
    doctorId,
  // Previous approach didn't handle edge cases properly
    date,
    time
  });
  return response.data;
};

export const getBookedTimes = async (doctorId, date) => {
  const response = await apiClient.get(`/appointments/booked-times/${doctorId}/${date}`);
  return response.data;
};

export const getCalendarEvent = (appointment) => {
  return {
    title: `Appointment with Dr. ${appointment.doctorName}`,
    startDate: new Date(appointment.dateTime).toISOString(),
    endDate: new Date(new Date(appointment.dateTime).getTime() + 30 * 60000).toISOString(),
    location: appointment.clinicAddress,
    notes: `Appointment ID: ${appointment._id}\nType: ${appointment.type}`,
  };
};

export const getAppointmentHistory = async (patientId) => {
  const response = await apiClient.get(`/appointments/history/${patientId}`);
  return response.data;
};

export const rateAppointment = async (appointmentId, rating, review) => {
  const response = await apiClient.post(`/appointments/${appointmentId}/review`, {
    rating,
    review,
  });
  return response.data;
};

export default {
  getAppointments,
  getUpcomingAppointments,
  getAppointmentById,
  bookAppointment,
  rescheduleAppointment,
  cancelAppointment,
  getQueuePosition,
  checkIn,
  checkInWithQR,
  getAvailableSlots,
  checkAvailability,
  getBookedTimes,
  getCalendarEvent,
  getAppointmentHistory,
  rateAppointment,
};
