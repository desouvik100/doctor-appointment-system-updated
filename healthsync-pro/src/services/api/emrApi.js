/**
 * EMR API Service — Full feature parity with web EMR
 * Covers: vitals, prescriptions, lab orders, medical history, timeline, visits, analytics
 */

import apiClient from './apiClient';

// ==========================================
// SUBSCRIPTION & DASHBOARD
// ==========================================

export const getEMRSubscription = (clinicId) =>
  apiClient.get(`/emr/subscription/${clinicId}`).then(r => r.data);

export const getEMRDashboardStats = (clinicId) =>
  apiClient.get(`/emr/dashboard/${clinicId}/stats`).then(r => r.data);

export const getEMRTodayAppointments = (clinicId) =>
  apiClient.get(`/emr/dashboard/${clinicId}/today-appointments`).then(r => r.data);

export const getEMRRecentActivity = (clinicId) =>
  apiClient.get(`/emr/dashboard/${clinicId}/recent-activity`).then(r => r.data);

// ==========================================
// PATIENTS
// ==========================================

export const getEMRPatients = (clinicId, params = {}) =>
  apiClient.get(`/emr/patients/clinic/${clinicId}`, { params }).then(r => r.data);

export const getPatientHistory = (patientId, clinicId) =>
  apiClient.get(`/emr/patients/${patientId}/history`, { params: { clinicId } }).then(r => r.data);

export const savePatientHistory = (patientId, data) =>
  apiClient.post(`/emr/patients/${patientId}/history`, data).then(r => r.data);

export const getPatientTimeline = (patientId, clinicId) =>
  apiClient.get(`/emr/patient/timeline`, { params: { patientId, clinicId } }).then(r => r.data);

// ==========================================
// VISITS
// ==========================================

export const getVisits = (clinicId, params = {}) =>
  apiClient.get(`/emr/visits`, { params: { clinicId, ...params } }).then(r => r.data);

export const createVisit = (data) =>
  apiClient.post(`/emr/visits`, data).then(r => r.data);

export const getVisitById = (visitId) =>
  apiClient.get(`/emr/visits/${visitId}`).then(r => r.data);

export const updateVisit = (visitId, data) =>
  apiClient.put(`/emr/visits/${visitId}`, data).then(r => r.data);

// ==========================================
// VITALS
// ==========================================

export const saveVitals = (visitId, vitalsData) =>
  apiClient.post(`/emr/visits/${visitId}/vitals`, vitalsData).then(r => r.data);

export const getVitals = (visitId) =>
  apiClient.get(`/emr/visits/${visitId}/vitals`).then(r => r.data);

// ==========================================
// PRESCRIPTIONS
// ==========================================

export const createPrescription = (data) =>
  apiClient.post(`/emr/prescriptions`, data).then(r => r.data);

export const getPrescriptions = (patientId, clinicId) =>
  apiClient.get(`/emr/prescriptions`, { params: { patientId, clinicId } }).then(r => r.data);

export const searchDrugs = (query) =>
  apiClient.get(`/emr/drugs/search`, { params: { q: query } }).then(r => r.data);

export const checkDrugInteractions = (drugs) =>
  apiClient.post(`/emr/drug-interactions/check`, { drugs }).then(r => r.data);

// ==========================================
// LAB ORDERS
// ==========================================

export const getLabCatalog = () =>
  apiClient.get(`/emr/lab-tests/catalog`).then(r => r.data);

export const createLabOrder = (data) =>
  apiClient.post(`/emr/lab-orders`, data).then(r => r.data);

export const getLabOrders = (patientId, clinicId) =>
  apiClient.get(`/emr/lab-orders`, { params: { patientId, clinicId } }).then(r => r.data);

// ==========================================
// ANALYTICS
// ==========================================

export const getAnalyticsOverview = (clinicId, params = {}) =>
  apiClient.get(`/emr/analytics/${clinicId}/overview`, { params }).then(r => r.data);

export const getVisitTrends = (clinicId, params = {}) =>
  apiClient.get(`/emr/analytics/${clinicId}/visit-trends`, { params }).then(r => r.data);

export const getPatientStats = (clinicId, params = {}) =>
  apiClient.get(`/emr/analytics/${clinicId}/patient-stats`, { params }).then(r => r.data);

export const getRevenueStats = (clinicId, params = {}) =>
  apiClient.get(`/emr/analytics/${clinicId}/revenue`, { params }).then(r => r.data);

// ==========================================
// AUDIT LOGS
// ==========================================

export const getAuditLogs = (clinicId, params = {}) =>
  apiClient.get(`/emr/audit/${clinicId}`, { params }).then(r => r.data);

// ==========================================
// STAFF
// ==========================================

export const getEMRStaff = (clinicId, params = {}) =>
  apiClient.get(`/emr/staff/${clinicId}`, { params }).then(r => r.data);

export default {
  getEMRSubscription, getEMRDashboardStats, getEMRTodayAppointments, getEMRRecentActivity,
  getEMRPatients, getPatientHistory, savePatientHistory, getPatientTimeline,
  getVisits, createVisit, getVisitById, updateVisit,
  saveVitals, getVitals,
  createPrescription, getPrescriptions, searchDrugs, checkDrugInteractions,
  getLabCatalog, createLabOrder, getLabOrders,
  getAnalyticsOverview, getVisitTrends, getPatientStats, getRevenueStats,
  getAuditLogs, getEMRStaff,
};
