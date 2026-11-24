

import apiClient from './apiClient';

export const getDashboardOverview = async () => {
  const response = await apiClient.get('/analytics/overview');
  return response.data;
};

export const getAppointmentTrends = async (days = 30) => {
  const response = await apiClient.get('/analytics/appointment-trends', {
    params: { days }
  });
  return response.data;
};

export const getRevenueTrends = async (days = 30) => {
  const response = await apiClient.get('/analytics/revenue-trends', {
    params: { days }
  });
  return response.data;
};

export const getTopDoctors = async (limit = 10) => {
  const response = await apiClient.get('/analytics/top-doctors', {
    params: { limit }
  });
  return response.data;
};

export const getSpecializationStats = async () => {
  const response = await apiClient.get('/analytics/specialization-stats');
  return response.data;
};

export const getPatientDemographics = async () => {
  const response = await apiClient.get('/analytics/patient-demographics');
  return response.data;
};

export const getHourlyDistribution = async () => {
  const response = await apiClient.get('/analytics/hourly-distribution');
  return response.data;
};

export const getReviewStats = async () => {
  const response = await apiClient.get('/analytics/review-stats');
  return response.data;
};

export const getUsers = async (filters = {}) => {
  const response = await apiClient.get('/users', { params: filters });
  return response.data;
};

export const getUserById = async (userId) => {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await apiClient.post('/users', userData);
  return response.data;
};

export const updateUser = async (userId, userData) => {
  const response = await apiClient.put(`/users/${userId}`, userData);
  return response.data;
};

export const suspendUser = async (userId, reason) => {
  const response = await apiClient.put(`/users/${userId}`, { 
    isActive: false, 
    suspendReason: reason 
  });
  return response.data;
};

export const activateUser = async (userId) => {
  const response = await apiClient.put(`/users/${userId}`, { 
    isActive: true,
    suspendReason: null 
  });
  return response.data;
};

export const getDoctors = async (filters = {}) => {
  const response = await apiClient.get('/doctors', { params: filters });
  return response.data;
};

export const getDoctorById = async (doctorId) => {
  const response = await apiClient.get(`/doctors/${doctorId}`);
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

export const createDoctor = async (doctorData) => {
  const response = await apiClient.post('/doctors', doctorData);
  return response.data;
};

export const updateDoctor = async (doctorId, doctorData) => {
  const response = await apiClient.put(`/doctors/${doctorId}`, doctorData);
  return response.data;
};

export const deactivateDoctor = async (doctorId) => {
  const response = await apiClient.delete(`/doctors/${doctorId}`);
  return response.data;
};

export const updateDoctorEmail = async (doctorId, email) => {
  const response = await apiClient.put(`/doctors/${doctorId}/email`, { email });
  return response.data;
};

export const checkDoctorEmails = async () => {
  const response = await apiClient.get('/doctors/admin/check-emails');
  return response.data;
};

export const getPendingStaff = async () => {
  const response = await apiClient.get('/receptionists/pending');
  return response.data;
};

export const approveStaff = async (staffId, clinicId) => {
  const response = await apiClient.put(`/receptionists/${staffId}/approve`, { clinicId });
  return response.data;
};

export const rejectStaff = async (staffId, reason) => {
  const response = await apiClient.put(`/receptionists/${staffId}/reject`, { reason });
  return response.data;
};

export const assignStaffToDoctor = async (staffId, doctorId, department) => {
  const response = await apiClient.put(`/receptionists/${staffId}/assign-doctor`, { 
    doctorId, 
    department 
  });
  return response.data;
};

export const getClinics = async () => {
  const response = await apiClient.get('/clinics');
  return response.data;
};

export const getClinicById = async (clinicId) => {
  const response = await apiClient.get(`/clinics/${clinicId}`);
  return response.data;
};

export const getClinicWithDoctors = async (clinicId) => {
  const response = await apiClient.get(`/clinics/${clinicId}/doctors`);
  return response.data;
};

export const getPendingClinics = async () => {
  const response = await apiClient.get('/clinics/admin/pending');
  return response.data;
};

export const createClinic = async (clinicData) => {
  const response = await apiClient.post('/clinics', clinicData);
  return response.data;
};

export const updateClinic = async (clinicId, clinicData) => {
  const response = await apiClient.put(`/clinics/${clinicId}`, clinicData);
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

export const deactivateClinic = async (clinicId) => {
  const response = await apiClient.delete(`/clinics/${clinicId}`);
  return response.data;
};

export const getAppointments = async (filters = {}) => {
  const response = await apiClient.get('/appointments', { params: filters });
  return response.data;
};

export const getAppointmentById = async (appointmentId) => {
  const response = await apiClient.get(`/appointments/${appointmentId}`);
  return response.data;
};

export const updateAppointmentStatus = async (appointmentId, status) => {
  const response = await apiClient.put(`/appointments/${appointmentId}/status`, { status });
  return response.data;
};

export const cancelAppointment = async (appointmentId, reason) => {
  const response = await apiClient.put(`/appointments/${appointmentId}/cancel`, { reason });
  return response.data;
};

export const getAllDoctorWallets = async () => {
  const response = await apiClient.get('/wallet/admin/all');
  return response.data;
};

export const getPendingWithdrawals = async () => {
  const response = await apiClient.get('/wallet/admin/withdrawals');
  return response.data;
};

export const processWithdrawal = async (walletId, requestId, action, data = {}) => {
  const response = await apiClient.put(`/wallet/admin/withdrawals/${walletId}/${requestId}`, {
    action, 
    ...data
  });
  return response.data;
};

export const processPayout = async (payoutData) => {
  const response = await apiClient.post('/wallet/admin/payout', payoutData);
  return response.data;
};

export const updateCommissionRate = async (doctorId, commissionRate) => {
  const response = await apiClient.put(`/wallet/admin/commission/${doctorId}`, { 
    commissionRate 
  });
  return response.data;
};

export const addDoctorBonus = async (bonusData) => {
  const response = await apiClient.post('/wallet/admin/bonus', bonusData);
  return response.data;
};

export const getWalletStats = async () => {
  const response = await apiClient.get('/wallet/admin/stats');
  return response.data;
};

export const getSupportTickets = async (filters = {}) => {
  const response = await apiClient.get('/support/admin/tickets', { params: filters });
  return response.data;
};

export const replyToTicket = async (ticketId, message) => {
  const response = await apiClient.post(`/support/admin/ticket/${ticketId}/reply`, { message });
  return response.data;
};

export const updateTicketStatus = async (ticketId, status, resolution) => {
  const response = await apiClient.patch(`/support/admin/ticket/${ticketId}/status`, { 
    status, 
    resolution 
  });
  return response.data;
};

export const getSupportStats = async () => {
  const response = await apiClient.get('/support/admin/stats');
  return response.data;
};

export const getAuditLogs = async (filters = {}) => {
  const response = await apiClient.get('/audit-logs', { params: filters });
  return response.data;
};

export const exportData = async (type, startDate, endDate, format = 'json') => {
  const response = await apiClient.get('/analytics/export', {
    params: { type, startDate, endDate, format }
  });
  return response.data;
};

export const getCoupons = async () => {
  const response = await apiClient.get('/coupons');
  return response.data;
};

export const createCoupon = async (couponData) => {
  const response = await apiClient.post('/coupons', couponData);
  return response.data;
};

export const updateCoupon = async (couponId, couponData) => {
  const response = await apiClient.put(`/coupons/${couponId}`, couponData);
  return response.data;
};

export const deleteCoupon = async (couponId) => {
  const response = await apiClient.delete(`/coupons/${couponId}`);
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
  getDashboardOverview,
  getAppointmentTrends,
  getRevenueTrends,
  getTopDoctors,
  getSpecializationStats,
  getPatientDemographics,
  getHourlyDistribution,
  getReviewStats,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  suspendUser,
  activateUser,
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
  getPendingStaff,
  approveStaff,
  rejectStaff,
  assignStaffToDoctor,
  getClinics,
  getClinicById,
  getClinicWithDoctors,
  getPendingClinics,
  createClinic,
  updateClinic,
  approveClinic,
  rejectClinic,
  deactivateClinic,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  getAllDoctorWallets,
  getPendingWithdrawals,
  processWithdrawal,
  processPayout,
  updateCommissionRate,
  addDoctorBonus,
  getWalletStats,
  getSupportTickets,
  replyToTicket,
  updateTicketStatus,
  getSupportStats,
  getAuditLogs,
  exportData,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getPendingApprovalsCount,
};
