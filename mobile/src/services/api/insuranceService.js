/**
 * Insurance Service - Insurance Claims and TPA Integration
 * 
 * Provides functions for managing insurance claims, pre-authorization,
 * and eligibility verification.
 * 
 * @module insuranceService
 */

import apiClient from './apiClient';

/**
 * @typedef {Object} InsuranceClaim
 * @property {string} _id - Claim ID
 * @property {string} claimNumber - Unique claim number
 * @property {string} patientId - Patient ID
 * @property {string} clinicId - Clinic ID
 * @property {string} insuranceProvider - Insurance provider name
 * @property {string} policyNumber - Policy number
 * @property {string} claimType - Type of claim (cashless, reimbursement)
 * @property {number} claimAmount - Claimed amount
 * @property {number} [approvedAmount] - Approved amount
 * @property {string} status - Claim status
 * @property {Date} [submittedAt] - Submission timestamp
 * @property {Date} [preAuthDate] - Pre-authorization date
 * @property {number} [preAuthAmount] - Pre-authorization amount
 * @property {string} [preAuthStatus] - Pre-authorization status
 * @property {Object[]} [queries] - Insurance queries
 * @property {Date} createdAt - Creation timestamp
 */

/**
 * @typedef {Object} EligibilityResult
 * @property {boolean} isEligible - Whether patient is eligible
 * @property {string} policyNumber - Policy number
 * @property {string} insuranceProvider - Insurance provider
 * @property {string} patientName - Patient name
 * @property {string} planName - Insurance plan name
 * @property {number} sumInsured - Total sum insured
 * @property {number} availableBalance - Available balance
 * @property {number} copayPercentage - Co-pay percentage
 * @property {number} roomRentLimit - Room rent limit per day
 * @property {string} preExistingWaitingPeriod - Waiting period for pre-existing conditions
 * @property {boolean} networkHospital - Whether hospital is in network
 * @property {Date} verifiedAt - Verification timestamp
 */

/**
 * Create a new insurance claim
 * 
 * @param {Object} claimData - The claim data
 * @param {string} claimData.patientId - Patient ID
 * @param {string} claimData.clinicId - Clinic ID
 * @param {string} claimData.insuranceProvider - Insurance provider name
 * @param {string} claimData.policyNumber - Policy number
 * @param {string} claimData.claimType - Type of claim (cashless, reimbursement)
 * @param {number} claimData.claimAmount - Claimed amount
 * @param {string} [claimData.admissionId] - Associated admission ID
 * @param {string} [claimData.diagnosis] - Diagnosis
 * @param {string} [claimData.treatmentDetails] - Treatment details
 * @returns {Promise<{success: boolean, claim: InsuranceClaim, message: string}>}
 */
export const createClaim = async (claimData) => {
  const response = await apiClient.post('/insurance/claims', claimData);
  return response.data;
};

/**
 * Get insurance claims for a clinic
 * 
 * @param {string} clinicId - The clinic ID
 * @param {Object} [params] - Query parameters
 * @param {string} [params.status] - Filter by status
 * @param {string} [params.insuranceProvider] - Filter by provider
 * @param {string} [params.claimType] - Filter by claim type
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 * @returns {Promise<{success: boolean, claims: InsuranceClaim[], pagination: Object}>}
 */
export const getClinicClaims = async (clinicId, params = {}) => {
  const response = await apiClient.get(`/insurance/claims/clinic/${clinicId}`, { params });
  return response.data;
};

/**
 * Get a single insurance claim by ID
 * 
 * @param {string} claimId - The claim ID
 * @returns {Promise<{success: boolean, claim: InsuranceClaim}>}
 */
export const getClaim = async (claimId) => {
  const response = await apiClient.get(`/insurance/claims/${claimId}`);
  return response.data;
};

/**
 * Update an insurance claim
 * 
 * @param {string} claimId - The claim ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<{success: boolean, claim: InsuranceClaim}>}
 */
export const updateClaim = async (claimId, updateData) => {
  const response = await apiClient.put(`/insurance/claims/${claimId}`, updateData);
  return response.data;
};

/**
 * Submit an insurance claim
 * 
 * @param {string} claimId - The claim ID
 * @returns {Promise<{success: boolean, claim: InsuranceClaim, message: string}>}
 */
export const submitClaim = async (claimId) => {
  const response = await apiClient.post(`/insurance/claims/${claimId}/submit`);
  return response.data;
};

/**
 * Request pre-authorization for a claim
 * 
 * @param {string} claimId - The claim ID
 * @param {Object} preAuthData - Pre-authorization data
 * @param {number} preAuthData.preAuthAmount - Pre-authorization amount requested
 * @returns {Promise<{success: boolean, claim: InsuranceClaim, message: string}>}
 */
export const requestPreAuth = async (claimId, preAuthData) => {
  const response = await apiClient.post(`/insurance/claims/${claimId}/pre-auth`, preAuthData);
  return response.data;
};

/**
 * Respond to an insurance query
 * 
 * @param {string} claimId - The claim ID
 * @param {Object} responseData - Query response data
 * @param {number} responseData.queryIndex - Index of the query to respond to
 * @param {string} responseData.response - Response text
 * @returns {Promise<{success: boolean, claim: InsuranceClaim}>}
 */
export const respondToQuery = async (claimId, responseData) => {
  const response = await apiClient.post(`/insurance/claims/${claimId}/query-response`, responseData);
  return response.data;
};

/**
 * Get insurance claim statistics for a clinic
 * 
 * @param {string} clinicId - The clinic ID
 * @returns {Promise<{success: boolean, stats: Object[], byProvider: Object[]}>}
 */
export const getClaimStats = async (clinicId) => {
  const response = await apiClient.get(`/insurance/stats/${clinicId}`);
  return response.data;
};

/**
 * Verify insurance eligibility
 * 
 * @param {Object} verificationData - Verification data
 * @param {string} verificationData.policyNumber - Policy number
 * @param {string} verificationData.insuranceProvider - Insurance provider name
 * @param {string} verificationData.patientName - Patient name
 * @param {string} [verificationData.dob] - Date of birth
 * @returns {Promise<{success: boolean, eligibility: EligibilityResult}>}
 */
export const verifyEligibility = async (verificationData) => {
  const response = await apiClient.post('/insurance/verify-eligibility', verificationData);
  return response.data;
};

export default {
  createClaim,
  getClinicClaims,
  getClaim,
  updateClaim,
  submitClaim,
  requestPreAuth,
  respondToQuery,
  getClaimStats,
  verifyEligibility,
};
