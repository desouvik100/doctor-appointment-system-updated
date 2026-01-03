/**
 * Imaging Service - Medical Imaging and DICOM Management
 * 
 * Provides functions for managing medical imaging reports, DICOM uploads,
 * and radiology workflows.
 * 
 * @module imagingService
 */

import apiClient from './apiClient';

/**
 * Create a new imaging order
 * 
 * @param {Object} orderData - The imaging order data
 * @param {string} orderData.patientId - Patient ID
 * @param {string} orderData.patientName - Patient name
 * @param {number} [orderData.patientAge] - Patient age
 * @param {string} [orderData.patientGender] - Patient gender
 * @param {string} orderData.imagingType - Type of imaging (xray, ct, mri, ultrasound, etc.)
 * @param {string} orderData.bodyPart - Body part to be imaged
 * @param {string[]} [orderData.views] - Imaging views required
 * @param {string} [orderData.clinicalHistory] - Clinical history
 * @param {string} [orderData.indication] - Indication for imaging
 * @param {boolean} [orderData.contrastUsed] - Whether contrast is used
 * @param {string} [orderData.contrastType] - Type of contrast if used
 * @param {string} [orderData.priority] - Priority level (routine, urgent, stat)
 * @param {string} [orderData.admissionId] - Associated admission ID
 * @param {string} [orderData.appointmentId] - Associated appointment ID
 * @param {string} orderData.clinicId - Clinic ID
 * @param {number} [orderData.cost] - Cost of the imaging
 * @returns {Promise<{success: boolean, message: string, report: Object}>}
 */
export const createImagingOrder = async (orderData) => {
  const response = await apiClient.post('/imaging/order', orderData);
  return response.data;
};

/**
 * Get imaging reports for a clinic
 * 
 * @param {string} clinicId - The clinic ID
 * @param {Object} [params] - Query parameters
 * @param {string} [params.status] - Filter by status
 * @param {string} [params.imagingType] - Filter by imaging type
 * @param {string} [params.patientId] - Filter by patient ID
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=50] - Items per page
 * @returns {Promise<{success: boolean, reports: Object[], pagination: Object}>}
 */
export const getClinicImagingReports = async (clinicId, params = {}) => {
  const response = await apiClient.get(`/imaging/clinic/${clinicId}`, { params });
  return response.data;
};

/**
 * Get imaging reports for a patient
 * 
 * @param {string} patientId - The patient ID
 * @returns {Promise<{success: boolean, reports: Object[]}>}
 */
export const getPatientImagingReports = async (patientId) => {
  const response = await apiClient.get(`/imaging/patient/${patientId}`);
  return response.data;
};

/**
 * Get patient's imaging studies (DICOM viewer compatible format)
 * 
 * @param {string} patientId - The patient ID
 * @returns {Promise<{success: boolean, data: Object[], studies: Object[]}>}
 */
export const getPatientStudies = async (patientId) => {
  const response = await apiClient.get(`/imaging/patients/${patientId}/studies`);
  return response.data;
};

/**
 * Save imaging report findings
 * 
 * @param {Object} reportData - The report data
 * @param {string} reportData.studyId - Study/Report ID
 * @param {string} reportData.findings - Report findings
 * @param {string} reportData.impression - Report impression
 * @param {string} [reportData.recommendations] - Recommendations
 * @returns {Promise<{success: boolean, message: string, report: Object}>}
 */
export const saveImagingReport = async (reportData) => {
  const response = await apiClient.post('/imaging/reports', reportData);
  return response.data;
};

/**
 * Upload DICOM files
 * 
 * @param {FormData} formData - FormData containing files and metadata
 * @param {Function} [onUploadProgress] - Progress callback
 * @returns {Promise<{success: boolean, message: string, data: Object}>}
 */
export const uploadDicomFiles = async (formData, onUploadProgress) => {
  const response = await apiClient.post('/imaging/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

/**
 * Get a single imaging report by ID
 * 
 * @param {string} reportId - The report ID
 * @returns {Promise<{success: boolean, report: Object}>}
 */
export const getImagingReport = async (reportId) => {
  const response = await apiClient.get(`/imaging/${reportId}`);
  return response.data;
};

/**
 * Schedule an imaging procedure
 * 
 * @param {string} reportId - The report ID
 * @param {Object} scheduleData - Schedule data
 * @param {string} scheduleData.procedureDate - Date of procedure
 * @param {string} [scheduleData.procedureTime] - Time of procedure
 * @returns {Promise<{success: boolean, message: string, report: Object}>}
 */
export const scheduleImaging = async (reportId, scheduleData) => {
  const response = await apiClient.put(`/imaging/${reportId}/schedule`, scheduleData);
  return response.data;
};

/**
 * Mark imaging procedure as completed
 * 
 * @param {string} reportId - The report ID
 * @param {Object} completionData - Completion data
 * @param {string} [completionData.performedBy] - ID of person who performed
 * @param {string} [completionData.technician] - Technician name
 * @param {string} [completionData.equipment] - Equipment used
 * @returns {Promise<{success: boolean, message: string, report: Object}>}
 */
export const completeProcedure = async (reportId, completionData) => {
  const response = await apiClient.put(`/imaging/${reportId}/complete-procedure`, completionData);
  return response.data;
};

/**
 * Enter report findings for an imaging study
 * 
 * @param {string} reportId - The report ID
 * @param {Object} reportData - Report findings data
 * @param {string} reportData.findings - Detailed findings
 * @param {string} reportData.impression - Impression/conclusion
 * @param {string} [reportData.recommendations] - Recommendations
 * @param {string} [reportData.comparisonWithPrevious] - Comparison notes
 * @returns {Promise<{success: boolean, message: string, report: Object}>}
 */
export const enterReportFindings = async (reportId, reportData) => {
  const response = await apiClient.put(`/imaging/${reportId}/report`, reportData);
  return response.data;
};

/**
 * Verify an imaging report
 * 
 * @param {string} reportId - The report ID
 * @returns {Promise<{success: boolean, message: string, report: Object}>}
 */
export const verifyReport = async (reportId) => {
  const response = await apiClient.post(`/imaging/${reportId}/verify`);
  return response.data;
};

/**
 * Sign an imaging report digitally
 * 
 * @param {string} reportId - The report ID
 * @param {Object} [signatureData] - Optional signature data
 * @param {string} [signatureData.signatureData] - Digital signature string
 * @returns {Promise<{success: boolean, message: string, report: Object}>}
 */
export const signReport = async (reportId, signatureData = {}) => {
  const response = await apiClient.post(`/imaging/${reportId}/sign`, signatureData);
  return response.data;
};

/**
 * Lock an imaging report (prevents further edits)
 * 
 * @param {string} reportId - The report ID
 * @returns {Promise<{success: boolean, message: string, report: Object}>}
 */
export const lockReport = async (reportId) => {
  const response = await apiClient.post(`/imaging/${reportId}/lock`);
  return response.data;
};

/**
 * Upload images to an existing imaging report
 * 
 * @param {string} reportId - The report ID
 * @param {Object[]} images - Array of image objects
 * @param {string} images[].fileName - File name
 * @param {string} images[].fileUrl - File URL
 * @param {string} images[].fileType - File type
 * @param {string} [images[].thumbnailUrl] - Thumbnail URL
 * @param {string} [images[].description] - Image description
 * @returns {Promise<{success: boolean, message: string, report: Object}>}
 */
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
