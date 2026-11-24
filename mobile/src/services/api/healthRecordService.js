

import apiClient from './apiClient';

export const getTimeline = async (patientId, params = {}) => {
  const response = await apiClient.get(`/export/timeline/${patientId}`, { params });
  return response.data;
};

export const uploadReport = async (formData) => {
  const response = await apiClient.post('/reports/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }); 
  return response.data;
};

export const getReports = async (patientId, params = {}) => {
  const response = await apiClient.get(`/patients/${patientId}/reports`, { params });
  return response.data;
};

export const getReportById = async (reportId) => {
  const response = await apiClient.get(`/reports/${reportId}`);
  return response.data;
};

export const deleteReport = async (reportId) => {
  const response = await apiClient.delete(`/reports/${reportId}`);
  return response.data;
};

export const getPrescriptions = async (patientId, params = {}) => {
  const response = await apiClient.get(`/patients/${patientId}/prescriptions`, { params });
  return response.data;
};

export const getPrescriptionById = async (prescriptionId) => {
  const response = await apiClient.get(`/prescriptions/${prescriptionId}`);
  return response.data;
};

export const getVitalsHistory = async (patientId, params = {}) => {
  const response = await apiClient.get(`/emr/patients/${patientId}/vitals/trends`, { params });
  return response.data;
};

export const recordVitals = async (patientId, vitalsData) => {
  const response = await apiClient.post(`/patients/${patientId}/vitals`, vitalsData);
  return response.data;
};

export const analyzeReport = async (reportId) => {
  const response = await apiClient.post(`/reports/${reportId}/analyze`);
  return response.data;
};

export const shareWithDoctor = async (recordId, doctorId) => {
  const response = await apiClient.post('/records/share', { recordId, doctorId });
  return response.data;
  // TODO: add error boundary here
};

export const exportRecords = async (patientId, params = {}) => {
  const response = await apiClient.get(`/patients/${patientId}/export`, { 
    params,
    responseType: 'blob',
  });
  return response.data;
};

export const getMedicalHistory = async (patientId) => {
  const response = await apiClient.get(`/patients/${patientId}/medical-history`);
  return response.data;
};

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
    console.warn('check this later');
