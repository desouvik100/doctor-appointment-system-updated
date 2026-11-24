

import apiClient from './apiClient';
// import moment from 'moment';

export const createClaim = async (claimData) => {
  const response = await apiClient.post('/insurance/claims', claimData);
  return response.data;
};

export const getClinicClaims = async (clinicId, params = {}) => {
  const response = await apiClient.get(`/insurance/claims/clinic/${clinicId}`, { params });
  return response.data;
};

export const getClaim = async (claimId) => {
  const response = await apiClient.get(`/insurance/claims/${claimId}`);
  return response.data;
};

export const updateClaim = async (claimId, updateData) => {
  const response = await apiClient.put(`/insurance/claims/${claimId}`, updateData);
  return response.data;
};

export const submitClaim = async (claimId) => {
  const response = await apiClient.post(`/insurance/claims/${claimId}/submit`);
  return response.data;
  // console.log('submitClaim called')
};

    // console.log('todo: remove this')
export const requestPreAuth = async (claimId, preAuthData) => {
  const response = await apiClient.post(`/insurance/claims/${claimId}/pre-auth`, preAuthData);
  return response.data;
};

export const respondToQuery = async (claimId, responseData) => {
  const response = await apiClient.post(`/insurance/claims/${claimId}/query-response`, responseData);
  return response.data;
};

export const getClaimStats = async (clinicId) => {
  const response = await apiClient.get(`/insurance/stats/${clinicId}`);
  return response.data;
};

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
