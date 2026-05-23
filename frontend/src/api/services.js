/**
 * HealthSync API Services
 * Centralized API calls with error handling, caching, and retry logic
 */
import axios from './config';
import toast from 'react-hot-toast';

// ─── Generic request wrapper with error handling ───────────────────────────
const apiCall = async (method, url, data = null, options = {}) => {
  try {
    const config = {
      method,
      url,
      ...options,
    };
    if (data) config.data = data;

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';

    if (!options.silent) {
      // Don't toast 401 — handled by interceptor
      if (error.response?.status !== 401) {
        toast.error(message);
      }
    }

    return {
      success: false,
      error: message,
      status: error.response?.status,
      data: error.response?.data,
    };
  }
};

// ─── Auth Services ─────────────────────────────────────────────────────────
export const authService = {
  login: (email, password) =>
    apiCall('POST', '/api/auth/login', { email, password }),

  register: (userData) =>
    apiCall('POST', '/api/auth/register', userData),

  adminLogin: (email, password) =>
    apiCall('POST', '/api/auth/admin/login', { email, password }),

  clinicLogin: (email, password) =>
    apiCall('POST', '/api/auth/clinic/login', { email, password }),

  doctorLogin: (email, password) =>
    apiCall('POST', '/api/auth/doctor/login', { email, password }),

  sendRegistrationOtp: (email) =>
    apiCall('POST', '/api/auth/send-registration-otp', { email }),

  verifyRegistrationOtp: (email, otp) =>
    apiCall('POST', '/api/auth/verify-registration-otp', { email, otp }),

  sendPasswordResetOtp: (email) =>
    apiCall('POST', '/api/auth/send-reset-otp', { email }),

  resetPassword: (email, otp, newPassword) =>
    apiCall('POST', '/api/auth/reset-password', { email, otp, newPassword }),

  googleLogin: (credential) =>
    apiCall('POST', '/api/auth/google', { credential }),

  refreshToken: () =>
    apiCall('POST', '/api/auth/token/refresh', null, { silent: true }),

  logout: () =>
    apiCall('POST', '/api/auth/logout', null, { silent: true }),
};

// ─── User Services ─────────────────────────────────────────────────────────
export const userService = {
  getProfile: () =>
    apiCall('GET', '/api/users/profile'),

  updateProfile: (data) =>
    apiCall('PUT', '/api/users/profile', data),

  uploadProfilePhoto: (formData) =>
    apiCall('POST', '/api/upload/profile-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  changePassword: (currentPassword, newPassword) =>
    apiCall('PUT', '/api/users/change-password', { currentPassword, newPassword }),

  deleteAccount: () =>
    apiCall('DELETE', '/api/users/account'),

  getNotifications: () =>
    apiCall('GET', '/api/notifications'),

  markNotificationRead: (id) =>
    apiCall('PUT', `/api/notifications/${id}/read`),

  markAllNotificationsRead: () =>
    apiCall('PUT', '/api/notifications/read-all'),
};

// ─── Doctor Services ───────────────────────────────────────────────────────
export const doctorService = {
  getAll: (params = {}) =>
    apiCall('GET', '/api/doctors', null, { params }),

  getById: (id) =>
    apiCall('GET', `/api/doctors/${id}`),

  search: (query, specialization, city) =>
    apiCall('GET', '/api/doctors/search', null, {
      params: { q: query, specialization, city },
    }),

  getAvailability: (doctorId, date) =>
    apiCall('GET', `/api/doctors/${doctorId}/availability`, null, {
      params: { date },
    }),

  getReviews: (doctorId) =>
    apiCall('GET', `/api/reviews/doctor/${doctorId}`),

  getSchedule: (doctorId, date) =>
    apiCall('GET', `/api/schedule/${doctorId}`, null, { params: { date } }),

  updateProfile: (data) =>
    apiCall('PUT', '/api/doctors/profile', data),

  updateAvailability: (data) =>
    apiCall('PUT', '/api/doctors/availability', data),

  getEarnings: (period) =>
    apiCall('GET', '/api/doctors/earnings', null, { params: { period } }),

  getPatients: () =>
    apiCall('GET', '/api/doctors/patients'),
};

// ─── Appointment Services ──────────────────────────────────────────────────
export const appointmentService = {
  create: (data) =>
    apiCall('POST', '/api/appointments', data),

  getMyAppointments: (status) =>
    apiCall('GET', '/api/appointments/my', null, { params: { status } }),

  getById: (id) =>
    apiCall('GET', `/api/appointments/${id}`),

  cancel: (id, reason) =>
    apiCall('PUT', `/api/appointments/${id}/cancel`, { reason }),

  reschedule: (id, date, time) =>
    apiCall('PUT', `/api/appointments/${id}/reschedule`, { date, time }),

  complete: (id, notes) =>
    apiCall('PUT', `/api/appointments/${id}/complete`, { notes }),

  checkAvailability: (doctorId, date, time) =>
    apiCall('POST', '/api/appointments/check-availability', { doctorId, date, time }),

  getQueueInfo: (doctorId, date, consultationType) =>
    apiCall('GET', `/api/appointments/queue-info/${doctorId}/${date}`, null, {
      params: { consultationType },
    }),

  getBookedTimes: (doctorId, date) =>
    apiCall('GET', `/api/appointments/booked-times/${doctorId}/${date}`),

  getDoctorQueue: (doctorId, date) =>
    apiCall('GET', `/api/appointments/doctor/${doctorId}/queue`, null, {
      params: { date },
    }),

  updateStatus: (id, status) =>
    apiCall('PUT', `/api/appointments/${id}/status`, { status }),

  addReview: (id, rating, comment) =>
    apiCall('POST', `/api/reviews`, { appointmentId: id, rating, comment }),
};

// ─── Payment Services ──────────────────────────────────────────────────────
export const paymentService = {
  createOrder: (appointmentId, amount) =>
    apiCall('POST', '/api/payments/create-order', { appointmentId, amount }),

  verifyPayment: (data) =>
    apiCall('POST', '/api/payments/verify', data),

  getHistory: () =>
    apiCall('GET', '/api/payments/history'),

  requestRefund: (paymentId, reason) =>
    apiCall('POST', '/api/refunds/request', { paymentId, reason }),

  getRefundStatus: (refundId) =>
    apiCall('GET', `/api/refunds/${refundId}`),
};

// ─── Clinic Services ───────────────────────────────────────────────────────
export const clinicService = {
  getAll: () =>
    apiCall('GET', '/api/clinics'),

  getById: (id) =>
    apiCall('GET', `/api/clinics/${id}`),

  getDoctors: (clinicId) =>
    apiCall('GET', `/api/clinics/${clinicId}/doctors`),

  getAppointments: (clinicId, date) =>
    apiCall('GET', `/api/appointments/clinic/${clinicId}`, null, {
      params: { date },
    }),

  updateSettings: (data) =>
    apiCall('PUT', '/api/clinics/settings', data),

  getAnalytics: (period) =>
    apiCall('GET', '/api/clinic-analytics', null, { params: { period } }),

  getQueue: (clinicId, date) =>
    apiCall('GET', `/api/advanced-queue/${clinicId}`, null, { params: { date } }),
};

// ─── Medical Records Services ──────────────────────────────────────────────
export const medicalService = {
  getPrescriptions: () =>
    apiCall('GET', '/api/prescriptions'),

  getPrescriptionById: (id) =>
    apiCall('GET', `/api/prescriptions/${id}`),

  getLabReports: () =>
    apiCall('GET', '/api/lab-reports'),

  uploadLabReport: (formData) =>
    apiCall('POST', '/api/lab-reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getMedicalFiles: () =>
    apiCall('GET', '/api/medical-files'),

  uploadMedicalFile: (formData) =>
    apiCall('POST', '/api/medical-files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getEMRRecords: () =>
    apiCall('GET', '/api/emr/records'),

  createPrescription: (data) =>
    apiCall('POST', '/api/prescriptions', data),
};

// ─── AI Services ───────────────────────────────────────────────────────────
export const aiService = {
  chat: (message, context) =>
    apiCall('POST', '/api/chatbot/chat', { message, context }),

  analyzeSymptoms: (symptoms) =>
    apiCall('POST', '/api/ai/symptom-check', { symptoms }),

  analyzeReport: (reportData) =>
    apiCall('POST', '/api/ai-report/analyze', reportData),

  getHealthInsights: () =>
    apiCall('GET', '/api/ai-health/insights'),

  getDrugInteractions: (drugs) =>
    apiCall('POST', '/api/drugs/check-interactions', { drugs }),
};

// ─── Notification Services ─────────────────────────────────────────────────
export const notificationService = {
  getAll: () =>
    apiCall('GET', '/api/notifications'),

  getUnreadCount: () =>
    apiCall('GET', '/api/notifications/unread-count', null, { silent: true }),

  markRead: (id) =>
    apiCall('PUT', `/api/notifications/${id}/read`),

  markAllRead: () =>
    apiCall('PUT', '/api/notifications/read-all'),

  updatePreferences: (prefs) =>
    apiCall('PUT', '/api/notifications/preferences', prefs),
};

// ─── Admin Services ────────────────────────────────────────────────────────
export const adminService = {
  getStats: () =>
    apiCall('GET', '/api/analytics/overview'),

  getUsers: (params) =>
    apiCall('GET', '/api/users', null, { params }),

  getDoctors: (params) =>
    apiCall('GET', '/api/doctors', null, { params }),

  suspendUser: (userId, reason) =>
    apiCall('PUT', `/api/users/${userId}/suspend`, { reason }),

  activateUser: (userId) =>
    apiCall('PUT', `/api/users/${userId}/activate`),

  approveDoctor: (doctorId) =>
    apiCall('PUT', `/api/doctors/${doctorId}/approve`),

  rejectDoctor: (doctorId, reason) =>
    apiCall('PUT', `/api/doctors/${doctorId}/reject`, { reason }),

  getAuditLogs: (params) =>
    apiCall('GET', '/api/audit-logs', null, { params }),

  getRevenueReport: (period) =>
    apiCall('GET', '/api/analytics/revenue', null, { params: { period } }),

  sendBulkEmail: (data) =>
    apiCall('POST', '/api/admin/email/send-bulk', data),

  getSecurityAlerts: () =>
    apiCall('GET', '/api/security-admin/alerts'),
};

// ─── Loyalty Services ──────────────────────────────────────────────────────
export const loyaltyService = {
  getPoints: () =>
    apiCall('GET', '/api/loyalty-points'),

  getHistory: () =>
    apiCall('GET', '/api/loyalty-points/history'),

  redeemPoints: (points) =>
    apiCall('POST', '/api/loyalty-points/redeem', { points }),
};

// ─── Family Services ───────────────────────────────────────────────────────
export const familyService = {
  getMembers: () =>
    apiCall('GET', '/api/family/members'),

  addMember: (data) =>
    apiCall('POST', '/api/family/members', data),

  updateMember: (id, data) =>
    apiCall('PUT', `/api/family/members/${id}`, data),

  removeMember: (id) =>
    apiCall('DELETE', `/api/family/members/${id}`),
};

// ─── Slot Services ─────────────────────────────────────────────────────────
export const slotService = {
  getOnlineSlots: (doctorId, date) =>
    apiCall('GET', `/api/slots/online/${doctorId}/${date}`),

  getClinicSlots: (doctorId, date) =>
    apiCall('GET', `/api/slots/clinic/${doctorId}/${date}`),

  bookSlot: (slotId, data) =>
    apiCall('POST', `/api/slots/${slotId}/book`, data),

  releaseSlot: (slotId) =>
    apiCall('DELETE', `/api/slots/${slotId}/release`),
};

// ─── Health check ──────────────────────────────────────────────────────────
export const systemService = {
  healthCheck: () =>
    apiCall('GET', '/api/health', null, { silent: true }),

  getVersion: () =>
    apiCall('GET', '/api/version', null, { silent: true }),
};

export default {
  auth: authService,
  user: userService,
  doctor: doctorService,
  appointment: appointmentService,
  payment: paymentService,
  clinic: clinicService,
  medical: medicalService,
  ai: aiService,
  notification: notificationService,
  admin: adminService,
  loyalty: loyaltyService,
  family: familyService,
  slot: slotService,
  system: systemService,
};
