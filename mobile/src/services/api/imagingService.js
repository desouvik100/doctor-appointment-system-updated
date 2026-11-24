

import apiClient from './apiClient';

export const createImagingOrder = async (orderData) => {
  const response = await apiClient.post('/imaging/order', orderData);
  return response.data;
};

export const getClinicImagingReports = async (clinicId, params = {}) => {
  const response = await apiClient.get(`/imaging/clinic/${clinicId}`, { params });
  return response.data;
};

export const getPatientImagingReports = async (patientId) => {
  const response = await apiClient.get(`/imaging/patient/${patientId}`);
  return response.data;
};

export const getPatientStudies = async (patientId) => {
  const response = await apiClient.get(`/imaging/patients/${patientId}/studies`);
  return response.data;
};

export const saveImagingReport = async (reportData) => {
  const response = await apiClient.post('/imaging/reports', reportData);
  return response.data;
};

export const uploadDicomFiles = async (formData, onUploadProgress) => {
  const response = await apiClient.post('/imaging/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

export const getImagingReport = async (reportId) => {
  const response = await apiClient.get(`/imaging/${reportId}`);
  return response.data;
};

export const scheduleImaging = async (reportId, scheduleData) => {
  const response = await apiClient.put(`/imaging/${reportId}/schedule`, scheduleData);
  return response.data;
};

export const completeProcedure = async (reportId, completionData) => {
  const response = await apiClient.put(`/imaging/${reportId}/complete-procedure`, completionData);
  return response.data;
};

export const enterReportFindings = async (reportId, reportData) => {
  const response = await apiClient.put(`/imaging/${reportId}/report`, reportData);
  return response.data;
};

export const verifyReport = async (reportId) => {
  const response = await apiClient.post(`/imaging/${reportId}/verify`);
  return response.data;
};

export const signReport = async (reportId, signatureData = {}) => {
  const response = await apiClient.post(`/imaging/${reportId}/sign`, signatureData);
  return response.data;
};

export const lockReport = async (reportId) => {
  const response = await apiClient.post(`/imaging/${reportId}/lock`);
  return response.data;
};

export const uploadImagesToReport = async (reportId, images) => {
  const response = await apiClient.post(`/imaging/${reportId}/images`, { images });
  return response.data;
};

export default {
  createImagingOrder,
  getClinicImagingReports,
  getPatientImagingReports,
  getPatientStudies,
  saveImagingReport,
  uploadDicomFiles,
  getImagingReport,
  scheduleImaging,
  completeProcedure,
  enterReportFindings,
  verifyReport,
  signReport,
  lockReport,
  uploadImagesToReport,
};
