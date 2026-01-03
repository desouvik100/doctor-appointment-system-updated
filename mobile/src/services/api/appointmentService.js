/**
 * Appointment Service - Booking, Management, Queue
 */

import apiClient from './apiClient';

/**
 * Get user's appointments
 */
export const getAppointments = async (params = {}) => {
  const response = await apiClient.get('/appointments/my', { params });
  return response.data;
};

/**
 * Get upcoming appointments
 */
export const getUpcomingAppointments = async () => {
  const response = await apiClient.get('/appointments/my', { 
    params: { status: 'upcoming' } 
  });
  return response.data;
};

/**
 * Get appointment by ID
 */
export const getAppointmentById = async (appointmentId) => {
  const response = await apiClient.get(`/appointments/${appointmentId}`);
  return response.data;
};

/**
 * Book a new appointment
 */
export const bookAppointment = async (bookingData) => {
  const response = await apiClient.post('/appointments', bookingData);
  return response.data;
};

/**
 * Reschedule appointment
 */
export const rescheduleAppointment = async (appointmentId, newSlot) => {
  const response = await apiClient.put(`/appointments/${appointmentId}/reschedule`, newSlot);
  return response.data;
};

/**
 * Cancel appointment
 */
export const cancelAppointment = async (appointmentId, reason) => {
  const response = await apiClient.put(`/appointments/${appointmentId}/cancel`, { reason });
  return response.data;
};

/**
 * Get queue position for appointment
 */
export const getQueuePosition = async (appointmentId) => {
  const response = await apiClient.get(`/appointments/${appointmentId}/queue`);
  return response.data;
};

/**
 * Check in for appointment
 */
export const checkIn = async (appointmentId) => {
  const response = await apiClient.post(`/appointments/${appointmentId}/check-in`);
  return response.data;
};

/**
 * Check in via QR code
 */
export const checkInWithQR = async (qrData) => {
  const response = await apiClient.post('/appointments/check-in-qr', { qrData });
  return response.data;
};

/**
 * Get available slots for a doctor on a date
 */
export const getAvailableSlots = async (doctorId, date) => {
  const response = await apiClient.get(`/doctors/${doctorId}/slots`, { 
    params: { date } 
  });
  return response.data;
};

/**
 * Check time availability (same as web: POST /api/appointments/check-availability)
 */
export const checkAvailability = async (doctorId, date, time) => {
  const response = await apiClient.post('/appointments/check-availability', {
    doctorId,
    date,
    time
  });
  return response.data;
};

/**
 * Get booked times for a doctor on a date (same as web)
 */
export const getBookedTimes = async (doctorId, date) => {
  const response = await apiClient.get(`/appointments/booked-times/${doctorId}/${date}`);
  return response.data;
};

/**
 * Add appointment to calendar
 */
export const getCalendarEvent = (appointment) => {
  return {
    title: `Appointment with Dr. ${appointment.doctorName}`,
    startDate: new Date(appointment.dateTime).toISOString(),
    endDate: new Date(new Date(appointment.dateTime).getTime() + 30 * 60000).toISOString(),
    location: appointment.clinicAddress,
    notes: `Appointment ID: ${appointment._id}\nType: ${appointment.type}`,
  };
};

/**
 * Get appointment history for a patient
 */
export const getAppointmentHistory = async (patientId) => {
  const response = await apiClient.get(`/appointments/history/${patientId}`);
  return response.data;
};

/**
 * Rate appointment/doctor
 */
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
