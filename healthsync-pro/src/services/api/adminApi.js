/**
 * Admin API Service - COMPLETE Admin Dashboard APIs
 * 100% Parity with Web Admin Panel
 * 
 * This file contains ALL admin APIs. Mobile admin must ONLY use these.
 * NO dummy data. NO fake screens. NO new endpoints.
 */

import apiClient from './apiClient';

// ==========================================
// 1. DASHBOARD & ANALYTICS
// ==========================================

/**
 * Get complete dashboard overview
 * Endpoint: GET /api/analytics/overview
 */
export const getDashboardOverview = async () => {
  const response = await apiClient.get('/analytics/overview');
  return response.data;
};

/**
 * Get appointment trends (last N days)
 * Endpoint: GET /api/analytics/appointment-trends
 */
export const getAppointmentTrends = async (days = 30) => {
  const response = await apiClient.get('/analytics/appointment-trends', {
    params: { days }
  });
  return response.data;
};

/**
 * Get revenue trends
 * Endpoint: GET /api/analytics/revenue-trends
 */
export const getRevenueTrends = async (days = 30) => {
  const response = await apiClient.get('/analytics/revenue-trends', {
    params: { days }
  });
  return response.data;
};

/**
 * Get top performing doctors
 * Endpoint: GET /api/analytics/top-doctors
 */
export const getTopDoctors = async (limit = 10) => {
  const response = await apiClient.get('/analytics/top-doctors', {
    params: { limit }
  });
  return response.data;
};

/**
 * Get specialization statistics
 * Endpoint: GET /api/analytics/specialization-stats
 */
export const getSpecializationStats = async () => {
  const response = await apiClient.get('/analytics/specialization-stats');
  return response.data;
};

/**
 * Get patient demographics
 * Endpoint: GET /api/analytics/patient-demographics
 */
export const getPatientDemographics = async () => {
  const response = await apiClient.get('/analytics/patient-demographics');
  return response.data;
};

/**
 * Get hourly appointment distribution
 * Endpoint: GET /api/analytics/hourly-distribution
 */
export const getHourlyDistribution = async () => {
  const response = await apiClient.get('/analytics/hourly-distribution');
  return response.data;
};

/**
 * Get review statistics
 * Endpoint: GET /api/analytics/review-stats
 */
export const getReviewStats = async () => {
  const response = await apiClient.get('/analytics/review-stats');
  return response.data;
};

// ==========================================
// 2. USER MANAGEMENT
// ==========================================

/**
 * Get all users (patients)
 * Endpoint: GET /api/users
 */
export const getUsers = async (filters = {}) => {
  const response = await apiClient.get('/users', { params: filters });
  return response.data;
};

/**
 * Get user by ID
 * Endpoint: GET /api/users/:id
 */
export const getUserById = async (userId) => {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
};

/**
 * Create new user
 * Endpoint: POST /api/users
 */
export const createUser = async (userData) => {
  const response = await apiClient.post('/users', userData);
  return response.data;
};

/**
 * Update user
 * Endpoint: PUT /api/users/:id
 */
export const updateUser = async (userId, userData) => {
  const response = await apiClient.put(`/users/${userId}`, userData);
  return response.data;
};

/**
 * Suspend user
 * Endpoint: PUT /api/users/:id (with isActive: false)
 */
export const suspendUser = async (userId, reason) => {
  const response = await apiClient.put(`/users/${userId}`, { 
    isActive: false, 
    suspendReason: reason 
  });
  return response.data;
};

/**
 * Activate user
 * Endpoint: PUT /api/users/:id (with isActive: true)
 */
export const activateUser = async (userId) => {
  const response = await apiClient.put(`/users/${userId}`, { 
    isActive: true,
    suspendReason: null 
  });
  return response.data;
};

// ==========================================
// 3. DOCTOR MANAGEMENT
// ==========================================

/**
 * Get all doctors
 * Endpoint: GET /api/doctors
 */
export const getDoctors = async (filters = {}) => {
  const response = await apiClient.get('/doctors', { params: filters });
  return response.data;
};

/**
 * Get doctor by ID
 * Endpoint: GET /api/doctors/:id
 */
export const getDoctorById = async (doctorId) => {
  const response = await apiClient.get(`/doctors/${doctorId}`);
  return response.data;
};

/**
 * Get pending doctor approvals
 * Endpoint: GET /api/doctors/admin/pending
 */
export const getPendingDoctors = async () => {
  const response = await apiClient.get('/doctors/admin/pending');
  return response.data;
};

/**
 * Approve doctor
 * Endpoint: PUT /api/doctors/:id/approve
 */
export const approveDoctor = async (doctorId) => {
  const response = await apiClient.put(`/doctors/${doctorId}/approve`);
  return response.data;
};

/**
 * Reject doctor
 * Endpoint: PUT /api/doctors/:id/reject
 */
export const rejectDoctor = async (doctorId, reason) => {
  const response = await apiClient.put(`/doctors/${doctorId}/reject`, { reason });
  return response.data;
};

/**
 * Create new doctor
 * Endpoint: POST /api/doctors
 */
export const createDoctor = async (doctorData) => {
  const response = await apiClient.post('/doctors', doctorData);
  return response.data;
};

/**
 * Update doctor
 * Endpoint: PUT /api/doctors/:id
 */
export const updateDoctor = async (doctorId, doctorData) => {
  const response = await apiClient.put(`/doctors/${doctorId}`, doctorData);
  return response.data;
};

/**
 * Deactivate doctor (soft delete)
 * Endpoint: DELETE /api/doctors/:id
 */
export const deactivateDoctor = async (doctorId) => {
  const response = await apiClient.delete(`/doctors/${doctorId}`);
  return response.data;
};

/**
 * Update doctor email
 * Endpoint: PUT /api/doctors/:id/email
 */
export const updateDoctorEmail = async (doctorId, email) => {
  const response = await apiClient.put(`/doctors/${doctorId}/email`, { email });
  return response.data;
};

/**
 * Check doctors without email
 * Endpoint: GET /api/doctors/admin/check-emails
 */
export const checkDoctorEmails = async () => {
  const response = await apiClient.get('/doctors/admin/check-emails');
  return response.data;
};

// ==========================================
// 4. STAFF/RECEPTIONIST MANAGEMENT
// ==========================================

/**
 * Get pending staff approvals
 * Endpoint: GET /api/receptionists/pending
 */
export const getPendingStaff = async () => {
  const response = await apiClient.get('/receptionists/pending');
  return response.data;
};

/**
 * Approve staff
 * Endpoint: PUT /api/receptionists/:id/approve
 */
export const approveStaff = async (staffId, clinicId) => {
  const response = await apiClient.put(`/receptionists/${staffId}/approve`, { clinicId });
  return response.data;
};

/**
 * Reject staff
 * Endpoint: PUT /api/receptionists/:id/reject
 */
export const rejectStaff = async (staffId, reason) => {
  const response = await apiClient.put(`/receptionists/${staffId}/reject`, { reason });
  return response.data;
};

/**
 * Assign staff to doctor (department isolation)
 * Endpoint: PUT /api/receptionists/:id/assign-doctor
 */
export const assignStaffToDoctor = async (staffId, doctorId, department) => {
  const response = await apiClient.put(`/receptionists/${staffId}/assign-doctor`, { 
    doctorId, 
    department 
  });
  return response.data;
};

// ==========================================
// 5. CLINIC MANAGEMENT
// ==========================================

/**
 * Get all clinics
 * Endpoint: GET /api/clinics
 */
export const getClinics = async () => {
  const response = await apiClient.get('/clinics');
  return response.data;
};

/**
 * Get clinic by ID
 * Endpoint: GET /api/clinics/:id
 */
export const getClinicById = async (clinicId) => {
  const response = await apiClient.get(`/clinics/${clinicId}`);
  return response.data;
};

/**
 * Get clinic with doctors
 * Endpoint: GET /api/clinics/:id/doctors
 */
export const getClinicWithDoctors = async (clinicId) => {
  const response = await apiClient.get(`/clinics/${clinicId}/doctors`);
  return response.data;
};

/**
 * Get pending clinic approvals
 * Endpoint: GET /api/clinics/admin/pending
 */
export const getPendingClinics = async () => {
  const response = await apiClient.get('/clinics/admin/pending');
  return response.data;
};

/**
 * Create new clinic
 * Endpoint: POST /api/clinics
 */
export const createClinic = async (clinicData) => {
  const response = await apiClient.post('/clinics', clinicData);
  return response.data;
};

/**
 * Update clinic
 * Endpoint: PUT /api/clinics/:id
 */
export const updateClinic = async (clinicId, clinicData) => {
  const response = await apiClient.put(`/clinics/${clinicId}`, clinicData);
  return response.data;
};

/**
 * Approve clinic
 * Endpoint: PUT /api/clinics/:id/approve
 */
export const approveClinic = async (clinicId, adminId) => {
  const response = await apiClient.put(`/clinics/${clinicId}/approve`, { adminId });
  return response.data;
};

/**
 * Reject clinic
 * Endpoint: PUT /api/clinics/:id/reject
 */
export const rejectClinic = async (clinicId, reason) => {
  const response = await apiClient.put(`/clinics/${clinicId}/reject`, { reason });
  return response.data;
};

/**
 * Deactivate clinic
 * Endpoint: DELETE /api/clinics/:id
 */
export const deactivateClinic = async (clinicId) => {
  const response = await apiClient.delete(`/clinics/${clinicId}`);
  return response.data;
};

// ==========================================
// 6. APPOINTMENT MANAGEMENT
// ==========================================

/**
 * Get all appointments with filters
 * Endpoint: GET /api/appointments
 */
export const getAppointments = async (filters = {}) => {
  const response = await apiClient.get('/appointments', { params: filters });
  return response.data;
};

/**
 * Get appointment by ID
 * Endpoint: GET /api/appointments/:id
 */
export const getAppointmentById = async (appointmentId) => {
  const response = await apiClient.get(`/appointments/${appointmentId}`);
  return response.data;
};

/**
 * Update appointment status
 * Endpoint: PUT /api/appointments/:id/status
 */
export const updateAppointmentStatus = async (appointmentId, status) => {
  const response = await apiClient.put(`/appointments/${appointmentId}/status`, { status });
  return response.data;
};

/**
 * Cancel appointment
 * Endpoint: PUT /api/appointments/:id/cancel
 */
export const cancelAppointment = async (appointmentId, reason) => {
  const response = await apiClient.put(`/appointments/${appointmentId}/cancel`, { reason });
  return response.data;
};

// ==========================================
// 7. WALLET & PAYMENTS (ADMIN)
// ==========================================

/**
 * Get all doctor wallets
 * Endpoint: GET /api/wallet/admin/all
 */
export const getAllDoctorWallets = async () => {
  const response = await apiClient.get('/wallet/admin/all');
  return response.data;
};

/**
 * Get pending withdrawal requests
 * Endpoint: GET /api/wallet/admin/withdrawals
 */
export const getPendingWithdrawals = async () => {
  const response = await apiClient.get('/wallet/admin/withdrawals');
  return response.data;
};

/**
 * Process withdrawal (approve/reject)
 * Endpoint: PUT /api/wallet/admin/withdrawals/:walletId/:requestId
 */
export const processWithdrawal = async (walletId, requestId, action, data = {}) => {
  const response = await apiClient.put(`/wallet/admin/withdrawals/${walletId}/${requestId}`, {
    action, // 'approve' or 'reject'
    ...data
  });
  return response.data;
};

/**
 * Process payout to doctor
 * Endpoint: POST /api/wallet/admin/payout
 */
export const processPayout = async (payoutData) => {
  const response = await apiClient.post('/wallet/admin/payout', payoutData);
  return response.data;
};

/**
 * Update doctor commission rate
 * Endpoint: PUT /api/wallet/admin/commission/:doctorId
 */
export const updateCommissionRate = async (doctorId, commissionRate) => {
  const response = await apiClient.put(`/wallet/admin/commission/${doctorId}`, { 
    commissionRate 
  });
  return response.data;
};

/**
 * Add bonus to doctor
 * Endpoint: POST /api/wallet/admin/bonus
 */
export const addDoctorBonus = async (bonusData) => {
  const response = await apiClient.post('/wallet/admin/bonus', bonusData);
  return response.data;
};

/**
 * Get wallet statistics
 * Endpoint: GET /api/wallet/admin/stats
 */
export const getWalletStats = async () => {
  const response = await apiClient.get('/wallet/admin/stats');
  return response.data;
};

// ==========================================
// 8. SUPPORT TICKETS (ADMIN)
// ==========================================

/**
 * Get all support tickets
 * Endpoint: GET /api/support/admin/tickets
 */
export const getSupportTickets = async (filters = {}) => {
  const response = await apiClient.get('/support/admin/tickets', { params: filters });
  return response.data;
};

/**
 * Reply to support ticket
 * Endpoint: POST /api/support/admin/ticket/:ticketId/reply
 */
export const replyToTicket = async (ticketId, message) => {
  const response = await apiClient.post(`/support/admin/ticket/${ticketId}/reply`, { message });
  return response.data;
};

/**
 * Update ticket status
 * Endpoint: PATCH /api/support/admin/ticket/:ticketId/status
 */
export const updateTicketStatus = async (ticketId, status, resolution) => {
  const response = await apiClient.patch(`/support/admin/ticket/${ticketId}/status`, { 
    status, 
    resolution 
  });
  return response.data;
};

/**
 * Get support ticket stats
 * Endpoint: GET /api/support/admin/stats
 */
export const getSupportStats = async () => {
  const response = await apiClient.get('/support/admin/stats');
  return response.data;
};

// ==========================================
// 9. AUDIT LOGS
// ==========================================

/**
 * Get audit logs
 * Endpoint: GET /api/audit-logs
 */
export const getAuditLogs = async (filters = {}) => {
  const response = await apiClient.get('/audit-logs', { params: filters });
  return response.data;
};

// ==========================================
// 10. REPORTS & EXPORT
// ==========================================

/**
 * Export data
 * Endpoint: GET /api/analytics/export
 */
export const exportData = async (type, startDate, endDate, format = 'json') => {
  const response = await apiClient.get('/analytics/export', {
    params: { type, startDate, endDate, format }
  });
  return response.data;
};

// ==========================================
// 11. COUPONS MANAGEMENT
// ==========================================

/**
 * Get all coupons
 * Endpoint: GET /api/coupons
 */
export const getCoupons = async () => {
  const response = await apiClient.get('/coupons');
  return response.data;
};

/**
 * Create coupon
 * Endpoint: POST /api/coupons
 */
export const createCoupon = async (couponData) => {
  const response = await apiClient.post('/coupons', couponData);
  return response.data;
};

/**
 * Update coupon
 * Endpoint: PUT /api/coupons/:id
 */
export const updateCoupon = async (couponId, couponData) => {
  const response = await apiClient.put(`/coupons/${couponId}`, couponData);
  return response.data;
};

/**
 * Delete coupon
 * Endpoint: DELETE /api/coupons/:id
 */
export const deleteCoupon = async (couponId) => {
  const response = await apiClient.delete(`/coupons/${couponId}`);
  return response.data;
};

// ==========================================
// HELPER: Get all pending approvals count
// ==========================================

export const getPendingApprovalsCount = async () => {
  try {
    const [doctors, staff, clinics] = await Promise.all([
      getPendingDoctors().catch(() => []),
      getPendingStaff().catch(() => []),
      getPendingClinics().catch(() => []),
    ]);
    
    return {
      doctors: Array.isArray(doctors) ? doctors.length : 0,
      staff: Array.isArray(staff) ? staff.length : 0,
      clinics: Array.isArray(clinics) ? clinics.length : 0,
      total: (Array.isArray(doctors) ? doctors.length : 0) + 
             (Array.isArray(staff) ? staff.length : 0) + 
             (Array.isArray(clinics) ? clinics.length : 0)
    };
  } catch (error) {
    return { doctors: 0, staff: 0, clinics: 0, total: 0 };
  }
};

export default {
  // Dashboard
  getDashboardOverview,
  getAppointmentTrends,
  getRevenueTrends,
  getTopDoctors,
  getSpecializationStats,
  getPatientDemographics,
  getHourlyDistribution,
  getReviewStats,
  // Users
  getUsers,
  getUserById,
  createUser,
  updateUser,
  suspendUser,
  activateUser,
  // Doctors
  getDoctors,
  getDoctorById,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  createDoctor,
  updateDoctor,
  deactivateDoctor,
  updateDoctorEmail,
  checkDoctorEmails,
  // Staff
  getPendingStaff,
  approveStaff,
  rejectStaff,
  assignStaffToDoctor,
  // Clinics
  getClinics,
  getClinicById,
  getClinicWithDoctors,
  getPendingClinics,
  createClinic,
  updateClinic,
  approveClinic,
  rejectClinic,
  deactivateClinic,
  // Appointments
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  // Wallet
  getAllDoctorWallets,
  getPendingWithdrawals,
  processWithdrawal,
  processPayout,
  updateCommissionRate,
  addDoctorBonus,
  getWalletStats,
  // Support
  getSupportTickets,
  replyToTicket,
  updateTicketStatus,
  getSupportStats,
  // Audit
  getAuditLogs,
  // Export
  exportData,
  // Coupons
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  // Helpers
  getPendingApprovalsCount,
};
