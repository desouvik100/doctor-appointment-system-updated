

import apiClient from './apiClient';

export const createPrescription = async (prescriptionData) => {
  const response = await apiClient.post('/prescriptions', prescriptionData);
  return response.data;
};

export const getPatientPrescriptions = async (patientId) => {
  const response = await apiClient.get(`/prescriptions/patient/${patientId}`);
  return response.data;
};

export const getClinicPrescriptions = async (clinicId) => {
  const response = await apiClient.get(`/prescriptions/clinic/${clinicId}`);
  return response.data;
};

export const getDoctorPrescriptions = async (doctorId) => {
  const response = await apiClient.get(`/prescriptions/doctor/${doctorId}`);
  return response.data;
};

export const getPrescription = async (prescriptionId) => {
  const response = await apiClient.get(`/prescriptions/${prescriptionId}`);
  return response.data;
};

export const sendPrescriptionEmail = async (prescriptionId, options = {}) => {
  const response = await apiClient.post(`/prescriptions/${prescriptionId}/send-email`, options);
  return response.data;
};

export const sendPrescriptionWhatsApp = async (prescriptionId, options = {}) => {
  const response = await apiClient.post(`/prescriptions/${prescriptionId}/send-whatsapp`, options);
  return response.data;
};

export const getMyPrescriptions = async (userId) => {
  return getPatientPrescriptions(userId);
};

export default {
  createPrescription,
  getPatientPrescriptions,
  getClinicPrescriptions,
  getDoctorPrescriptions,
  getPrescription,
  sendPrescriptionEmail,
  sendPrescriptionWhatsApp,
  getMyPrescriptions,
};
