/**
 * Admin Dashboard API Service
 * All API calls for system administration
 */

import apiClient from './apiClient';

// ==========================================
// DASHBOARD & ANALYTICS
// ==========================================

/**
 * Get system overview statistics
 */
export const getSystemOverview = async () => {
  const response = await apiClient.get('/analytics/overview');
  return response.data;
};

/**
 * Get user statistics
 */
export const getUserStats = async () => {
  const response = await apiClient.get('/analytics/users');
  return response.data;
};

/**
 * Get appointment statistics
 */
export const getAppointmentStats = async (period = 'month') => {
  const response = await apiClient.get('/analytics/appointments', {
    params: { period }
  });
  return response.data;
};

/**
 * Get revenue statistics
 */
export const getRevenueStats = async (period = 'month') => {
  const response = await apiClient.get('/analytics/revenue', {
    params: { period }
  });
  return response.data;
};

// ==========================================
// USER MANAGEMENT
// ==========================================

/**
 * Get all users with filters
 */
export const getUsers = async (filters = {}) => {
  const response = await apiClient.get('/users', { params: filters });
  return response.data;
};

/**
 * Get user details
 */
export const getUserDetails = async (userId) => {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
};

/**
 * Update user
 */
export const updateUser = async (userId, data) => {
  const response = await apiClient.put(`/users/${userId}`, data);
  return response.data;
};

/**
 * Suspend user
 */
export const suspendUser = async (userId, reason) => {
  const response = await apiClient.put(`/users/${userId}/suspend`, { reason });
  return response.data;
};

/**
 * Activate user
 */
export const activateUser = async (userId) => {
  const response = await apiClient.put(`/users/${userId}/activate`);
  return response.data;
};

/**
 * Delete user (soft delete)
 */
export const deleteUser = async (userId) => {
  const response = await apiClient.delete(`/users/${userId}`);
  return response.data;
};

// ==========================================
// DOCTOR MANAGEMENT
// ==========================================

/**
 * Get all doctors
 */
export const getDoctors = async (filters = {}) => {
  const response = await apiClient.get('/doctors', { params: filters });
  return response.data;
};

/**
 * Get pending doctor approvals
 */
export const getPendingDoctors = async () => {
  const response = await apiClient.get('/doctors/admin/pending');
  return response.data;
};

/**
 * Approve doctor
 */
export const approveDoctor = async (doctorId) => {
  const response = await apiClient.put(`/doctors/${doctorId}/approve`);
  return response.data;
};

/**
 * Reject doctor
 */
export const rejectDoctor = async (doctorId, reason) => {
  const response = await apiClient.put(`/doctors/${doctorId}/reject`, { reason });
  return response.data;
};

/**
 * Update doctor
 */
export const updateDoctor = async (doctorId, data) => {
  const response = await apiClient.put(`/doctors/${doctorId}`, data);
  return response.data;
};

/**
 * Deactivate doctor
 */
export const deactivateDoctor = async (doctorId) => {
  const response = await apiClient.delete(`/doctors/${doctorId}`);
  return response.data;
};

/**
 * Get doctor details
 */
export const getDoctorDetails = async (doctorId) => {
  const response = await apiClient.get(`/doctors/${doctorId}`);
  return response.data;
};

// ==========================================
// STAFF MANAGEMENT
// ==========================================

/**
 * Get pending staff approvals
 */
export const getPendingStaff = async () => {
  const response = await apiClient.get('/receptionist/pending');
  return response.data;
};

/**
 * Approve staff
 */
export const approveStaff = async (staffId, clinicId) => {
  const response = await apiClient.put(`/receptionist/${staffId}/approve`, { clinicId });
  return response.data;
};

/**
 * Reject staff
 */
export const rejectStaff = async (staffId, reason) => {
  const response = await apiClient.put(`/receptionist/${staffId}/reject`, { reason });
  return response.data;
};

/**
 * Assign staff to doctor
 */
export const assignStaffToDoctor = async (staffId, doctorId, department) => {
  const response = await apiClient.put(`/receptionist/${staffId}/assign-doctor`, { 
    doctorId, 
    department 
  });
  return response.data;
};

// ==========================================
// CLINIC MANAGEMENT
// ==========================================

/**
 * Get all clinics
 */
export const getClinics = async (filters = {}) => {
  const response = await apiClient.get('/clinics', { params: filters });
  return response.data;
};

/**
 * Get clinic details
 */
export const getClinicDetails = async (clinicId) => {
  const response = await apiClient.get(`/clinics/${clinicId}`);
  return response.data;
};

/**
 * Create clinic
 */
export const createClinic = async (clinicData) => {
  const response = await apiClient.post('/clinics', clinicData);
  return response.data;
};

/**
 * Update clinic
 */
export const updateClinic = async (clinicId, data) => {
  const response = await apiClient.put(`/clinics/${clinicId}`, data);
  return response.data;
};

/**
 * Deactivate clinic
 */
export const deactivateClinic = async (clinicId) => {
  const response = await apiClient.delete(`/clinics/${clinicId}`);
  return response.data;
};

/**
 * Get pending clinic approvals
 */
export const getPendingClinics = async () => {
  const response = await apiClient.get('/clinics/admin/pending');
  return response.data;
};

/**
 * Approve clinic
 */
export const approveClinic = async (clinicId, adminId) => {
  const response = await apiClient.put(`/clinics/${clinicId}/approve`, { adminId });
  return response.data;
};

/**
 * Reject clinic
 */
export const rejectClinic = async (clinicId, reason) => {
  const response = await apiClient.put(`/clinics/${clinicId}/reject`, { reason });
  return response.data;
};

// ==========================================
// AUDIT & SECURITY
// ==========================================

/**
 * Get audit logs
 */
export const getAuditLogs = async (filters = {}) => {
  const response = await apiClient.get('/audit-logs', { params: filters });
  return response.data;
};

/**
 * Get security alerts
 */
export const getSecurityAlerts = async () => {
  const response = await apiClient.get('/security/alerts');
  return response.data;
};

/**
 * Get login history
 */
export const getLoginHistory = async (userId) => {
  const response = await apiClient.get(`/security/login-history/${userId}`);
  return response.data;
};

// ==========================================
// REPORTS
// ==========================================

/**
 * Generate report
 */
export const generateReport = async (reportType, params) => {
  const response = await apiClient.post('/reports/generate', { 
    type: reportType, 
    ...params 
  });
  return response.data;
};

/**
 * Get available report types
 */
export const getReportTypes = async () => {
  const response = await apiClient.get('/reports/types');
  return response.data;
};

// ==========================================
// SYSTEM SETTINGS
// ==========================================

/**
 * Get system settings
 */
export const getSystemSettings = async () => {
  const response = await apiClient.get('/settings');
  return response.data;
};

/**
 * Update system settings
 */
export const updateSystemSettings = async (settings) => {
  const response = await apiClient.put('/settings', settings);
  return response.data;
};

// ==========================================
// PENDING APPROVALS SUMMARY
// ==========================================

/**
 * Get all pending approvals count
 */
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
  // Dashboard
  getSystemOverview,
  getUserStats,
  getAppointmentStats,
  getRevenueStats,
  // Users
  getUsers,
  getUserDetails,
  updateUser,
  suspendUser,
  activateUser,
  deleteUser,
  // Doctors
  getDoctors,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  updateDoctor,
  deactivateDoctor,
  getDoctorDetails,
  // Staff
  getPendingStaff,
  approveStaff,
  rejectStaff,
  assignStaffToDoctor,
  // Clinics
  getClinics,
  getClinicDetails,
  createClinic,
  updateClinic,
  deactivateClinic,
  getPendingClinics,
  approveClinic,
  rejectClinic,
  // Audit
  getAuditLogs,
  getSecurityAlerts,
  getLoginHistory,
  // Reports
  generateReport,
  getReportTypes,
  // Settings
  getSystemSettings,
  updateSystemSettings,
  // Summary
  getPendingApprovalsCount,
};
