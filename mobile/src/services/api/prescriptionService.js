/**
 * Prescription Service - Prescription Management
 * 
 * Provides functions for creating, retrieving, and sharing prescriptions.
 * 
 * @module prescriptionService
 */

import apiClient from './apiClient';

/**
 * @typedef {Object} Medicine
 * @property {string} name - Medicine name
 * @property {string} [dosage] - Dosage information
 * @property {string} [frequency] - How often to take
 * @property {string} [duration] - Duration of treatment
 * @property {string} [timing] - When to take (before_food, after_food, etc.)
 * @property {string} [instructions] - Additional instructions
 * @property {number} [quantity] - Quantity prescribed
 */

/**
 * @typedef {Object} Prescription
 * @property {string} _id - Prescription ID
 * @property {string} prescriptionNumber - Unique prescription number
 * @property {string} patientId - Patient ID
 * @property {string} doctorId - Doctor ID
 * @property {string} [clinicId] - Clinic ID
 * @property {string} [appointmentId] - Associated appointment ID
 * @property {string} [diagnosis] - Diagnosis
 * @property {string[]} [symptoms] - List of symptoms
 * @property {Medicine[]} medicines - List of prescribed medicines
 * @property {string} [advice] - Doctor's advice
 * @property {Date} [followUpDate] - Follow-up date
 * @property {string} [followUpInstructions] - Follow-up instructions
 * @property {Date} createdAt - Creation timestamp
 */

/**
 * Create a new prescription
 * 
 * @param {Object} prescriptionData - The prescription data
 * @param {string} prescriptionData.patientId - Patient ID
 * @param {string} prescriptionData.doctorId - Doctor ID
 * @param {string} [prescriptionData.clinicId] - Clinic ID
 * @param {string} [prescriptionData.appointmentId] - Associated appointment ID
 * @param {string} [prescriptionData.diagnosis] - Diagnosis
 * @param {string|string[]} [prescriptionData.symptoms] - Symptoms (string or array)
 * @param {Medicine[]} prescriptionData.medicines - List of medicines
 * @param {string} [prescriptionData.advice] - Doctor's advice
 * @param {Date|string} [prescriptionData.followUpDate] - Follow-up date
 * @param {string} [prescriptionData.followUpInstructions] - Follow-up instructions
 * @returns {Promise<{success: boolean, prescription: Prescription}>}
 */
export const createPrescription = async (prescriptionData) => {
  const response = await apiClient.post('/prescriptions', prescriptionData);
  return response.data;
};

/**
 * Get prescriptions for a patient
 * 
 * @param {string} patientId - The patient ID
 * @returns {Promise<Prescription[]>}
 */
export const getPatientPrescriptions = async (patientId) => {
  const response = await apiClient.get(`/prescriptions/patient/${patientId}`);
  return response.data;
};

/**
 * Get prescriptions for a clinic
 * 
 * @param {string} clinicId - The clinic ID
 * @returns {Promise<{success: boolean, prescriptions: Prescription[]}>}
 */
export const getClinicPrescriptions = async (clinicId) => {
  const response = await apiClient.get(`/prescriptions/clinic/${clinicId}`);
  return response.data;
};

/**
 * Get prescriptions by doctor
 * 
 * @param {string} doctorId - The doctor ID
 * @returns {Promise<Prescription[]>}
 */
export const getDoctorPrescriptions = async (doctorId) => {
  const response = await apiClient.get(`/prescriptions/doctor/${doctorId}`);
  return response.data;
};

/**
 * Get a single prescription by ID
 * 
 * @param {string} prescriptionId - The prescription ID
 * @returns {Promise<Prescription>}
 */
export const getPrescription = async (prescriptionId) => {
  const response = await apiClient.get(`/prescriptions/${prescriptionId}`);
  return response.data;
};

/**
 * Send prescription via email
 * 
 * @param {string} prescriptionId - The prescription ID
 * @param {Object} [options] - Send options
 * @param {string} [options.email] - Override email address
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendPrescriptionEmail = async (prescriptionId, options = {}) => {
  const response = await apiClient.post(`/prescriptions/${prescriptionId}/send-email`, options);
  return response.data;
};

/**
 * Generate WhatsApp share link for prescription
 * 
 * @param {string} prescriptionId - The prescription ID
 * @param {Object} [options] - Send options
 * @param {string} [options.phone] - Override phone number
 * @returns {Promise<{success: boolean, message: string, whatsappUrl: string, whatsappMessage: string}>}
 */
export const sendPrescriptionWhatsApp = async (prescriptionId, options = {}) => {
  const response = await apiClient.post(`/prescriptions/${prescriptionId}/send-whatsapp`, options);
  return response.data;
};

/**
 * Get my prescriptions (for authenticated patient)
 * Uses the current user's ID from auth context
 * 
 * @param {string} userId - The current user's ID
 * @returns {Promise<Prescription[]>}
 */
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
