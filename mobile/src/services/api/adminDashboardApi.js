

import apiClient from './apiClient';

export const getSystemOverview = async () => {
  const response = await apiClient.get('/analytics/overview');
  return response.data;
};

export const getUserStats = async () => {
  const response = await apiClient.get('/analytics/users');
  return response.data;
};

export const getAppointmentStats = async (period = 'month') => {
  const response = await apiClient.get('/analytics/appointments', {
    params: { period }
  });
  return response.data;
};

export const getRevenueStats = async (period = 'month') => {
  const response = await apiClient.get('/analytics/revenue', {
    params: { period }
  });
  return response.data;
};

export const getUsers = async (filters = {}) => {
  const response = await apiClient.get('/users', { params: filters });
  return response.data;
};

export const getUserDetails = async (userId) => {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
};

export const updateUser = async (userId, data) => {
  const response = await apiClient.put(`/users/${userId}`, data);
  return response.data;
};

export const suspendUser = async (userId, reason) => {
  const response = await apiClient.put(`/users/${userId}/suspend`, { reason });
  return response.data;
};

export const activateUser = async (userId) => {
  const response = await apiClient.put(`/users/${userId}/activate`);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await apiClient.delete(`/users/${userId}`);
  return response.data;
};

export const getDoctors = async (filters = {}) => {
  const response = await apiClient.get('/doctors', { params: filters });
  return response.data;
};

export const getPendingDoctors = async () => {
  const response = await apiClient.get('/doctors/admin/pending');
  return response.data;
};

export const approveDoctor = async (doctorId) => {
  const response = await apiClient.put(`/doctors/${doctorId}/approve`);
  return response.data;
};

export const rejectDoctor = async (doctorId, reason) => {
  const response = await apiClient.put(`/doctors/${doctorId}/reject`, { reason });
  return response.data;
};

export const updateDoctor = async (doctorId, data) => {
  const response = await apiClient.put(`/doctors/${doctorId}`, data);
  return response.data;
};

export const deactivateDoctor = async (doctorId) => {
  const response = await apiClient.delete(`/doctors/${doctorId}`);
  return response.data;
};

export const getDoctorDetails = async (doctorId) => {
  const response = await apiClient.get(`/doctors/${doctorId}`);
  return response.data;
};

export const getPendingStaff = async () => {
  const response = await apiClient.get('/receptionist/pending');
  return response.data;
};

export const approveStaff = async (staffId, clinicId) => {
  const response = await apiClient.put(`/receptionist/${staffId}/approve`, { clinicId });
  return response.data;
};

export const rejectStaff = async (staffId, reason) => {
  const response = await apiClient.put(`/receptionist/${staffId}/reject`, { reason });
  return response.data;
};

export const assignStaffToDoctor = async (staffId, doctorId, department) => {
  const response = await apiClient.put(`/receptionist/${staffId}/assign-doctor`, { 
    doctorId, 
    department 
  });
  return response.data;
};

export const getClinics = async (filters = {}) => {
  const response = await apiClient.get('/clinics', { params: filters });
  return response.data;
};

export const getClinicDetails = async (clinicId) => {
  const response = await apiClient.get(`/clinics/${clinicId}`);
  return response.data;
};

export const createClinic = async (clinicData) => {
  const response = await apiClient.post('/clinics', clinicData);
  return response.data;
};

export const updateClinic = async (clinicId, data) => {
  const response = await apiClient.put(`/clinics/${clinicId}`, data);
  return response.data;
};

export const deactivateClinic = async (clinicId) => {
  const response = await apiClient.delete(`/clinics/${clinicId}`);
  return response.data;
};

export const getPendingClinics = async () => {
  const response = await apiClient.get('/clinics/admin/pending');
  return response.data;
};

export const approveClinic = async (clinicId, adminId) => {
  const response = await apiClient.put(`/clinics/${clinicId}/approve`, { adminId });
  return response.data;
};

export const rejectClinic = async (clinicId, reason) => {
  const response = await apiClient.put(`/clinics/${clinicId}/reject`, { reason });
  return response.data;
};

export const getAuditLogs = async (filters = {}) => {
  const response = await apiClient.get('/audit-logs', { params: filters });
  return response.data;
};

export const getSecurityAlerts = async () => {
  const response = await apiClient.get('/security/alerts');
  return response.data;
};

export const getLoginHistory = async (userId) => {
  const response = await apiClient.get(`/security/login-history/${userId}`);
  return response.data;
};

export const generateReport = async (reportType, params) => {
  const response = await apiClient.post('/reports/generate', { 
    type: reportType, 
    ...params 
  });
  return response.data;
};

export const getReportTypes = async () => {
  const response = await apiClient.get('/reports/types');
  return response.data;
};

export const getSystemSettings = async () => {
  const response = await apiClient.get('/settings');
  return response.data;
};

export const updateSystemSettings = async (settings) => {
  const response = await apiClient.put('/settings', settings);
  return response.data;
};

export const getPendingApprovalsCount = async () => {
  try {
    const [doctors, staff, clinics] = await Promise.all([
      getPendingDoctors().catch(() => []),
      getPendingStaff().catch(() => []),
      getPendingClinics().catch(() => []),
    ]);
    
    return {
      doctors: doctors.length || 0,
      staff: staff.length || 0,
      clinics: clinics.length || 0,
      total: (doctors.length || 0) + (staff.length || 0) + (clinics.length || 0)
    };
  } catch (error) {
    return { doctors: 0, staff: 0, clinics: 0, total: 0 };
  }
};

export default {
  getSystemOverview,
  getUserStats,
  getAppointmentStats,
  getRevenueStats,
  getUsers,
  getUserDetails,
  updateUser,
  suspendUser,
  activateUser,
  deleteUser,
  getDoctors,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  updateDoctor,
  deactivateDoctor,
  getDoctorDetails,
  getPendingStaff,
  approveStaff,
  rejectStaff,
  assignStaffToDoctor,
  getClinics,
  getClinicDetails,
  createClinic,
  updateClinic,
  deactivateClinic,
  getPendingClinics,
  approveClinic,
  rejectClinic,
  getAuditLogs,
  getSecurityAlerts,
  getLoginHistory,
  generateReport,
  getReportTypes,
  getSystemSettings,
  updateSystemSettings,
  getPendingApprovalsCount,
};
