/**
 * Health Record Service - Timeline, Reports, Prescriptions, Vitals
 */

import apiClient from './apiClient';

/**
 * Get medical timeline
 */
export const getTimeline = async (patientId, params = {}) => {
  const response = await apiClient.get(`/patients/${patientId}/timeline`, { params });
  return response.data;
};

/**
 * Upload lab report
 */
export const uploadReport = async (formData) => {
  const response = await apiClient.post('/reports/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Get reports list
 */
export const getReports = async (patientId, params = {}) => {
  const response = await apiClient.get(`/patients/${patientId}/reports`, { params });
  return response.data;
};

/**
 * Get report by ID
 */
export const getReportById = async (reportId) => {
  const response = await apiClient.get(`/reports/${reportId}`);
  return response.data;
};

/**
 * Delete report
 */
export const deleteReport = async (reportId) => {
  const response = await apiClient.delete(`/reports/${reportId}`);
  return response.data;
};

/**
 * Get prescriptions
 */
export const getPrescriptions = async (patientId, params = {}) => {
  const response = await apiClient.get(`/patients/${patientId}/prescriptions`, { params });
  return response.data;
};

/**
 * Get prescription by ID
 */
export const getPrescriptionById = async (prescriptionId) => {
  const response = await apiClient.get(`/prescriptions/${prescriptionId}`);
  return response.data;
};

/**
 * Get vitals history
 */
export const getVitalsHistory = async (patientId, params = {}) => {
  const response = await apiClient.get(`/patients/${patientId}/vitals`, { params });
  return response.data;
};

/**
 * Record vitals
 */
export const recordVitals = async (patientId, vitalsData) => {
  const response = await apiClient.post(`/patients/${patientId}/vitals`, vitalsData);
  return response.data;
};

/**
 * Get AI report analysis
 */
export const analyzeReport = async (reportId) => {
  const response = await apiClient.post(`/reports/${reportId}/analyze`);
  return response.data;
};

/**
 * Share record with doctor
 */
export const shareWithDoctor = async (recordId, doctorId) => {
  const response = await apiClient.post('/records/share', { recordId, doctorId });
  return response.data;
};

/**
 * Export health records as PDF
 */
export const exportRecords = async (patientId, params = {}) => {
  const response = await apiClient.get(`/patients/${patientId}/export`, { 
    params,
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Get medical history
 */
export const getMedicalHistory = async (patientId) => {
  const response = await apiClient.get(`/patients/${patientId}/medical-history`);
  return response.data;
};

/**
 * Update medical history
 */
export const updateMedicalHistory = async (patientId, historyData) => {
  const response = await apiClient.put(`/patients/${patientId}/medical-history`, historyData);
  return response.data;
};

export default {
  getTimeline,
  uploadReport,
  getReports,
  getReportById,
  deleteReport,
  getPrescriptions,
  getPrescriptionById,
  getVitalsHistory,
  recordVitals,
  analyzeReport,
  shareWithDoctor,
  exportRecords,
  getMedicalHistory,
  updateMedicalHistory,
};
