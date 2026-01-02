/**
 * Wallet Service - Balance, Transactions, Payments
 */

import apiClient from './apiClient';

/**
 * Get wallet balance
 */
export const getBalance = async () => {
  const response = await apiClient.get('/wallet/balance');
  return response.data;
};

/**
 * Get transaction history
 */
export const getTransactions = async (params = {}) => {
  const response = await apiClient.get('/wallet/transactions', { params });
  return response.data;
};

/**
 * Add money to wallet
 */
export const addMoney = async (amount, paymentMethod) => {
  const response = await apiClient.post('/wallet/add', { amount, paymentMethod });
  return response.data;
};

/**
 * Initiate payment for appointment
 */
export const initiatePayment = async (paymentData) => {
  const response = await apiClient.post('/payments/initiate', paymentData);
  return response.data;
};

/**
 * Verify payment
 */
export const verifyPayment = async (paymentId, razorpayData) => {
  const response = await apiClient.post('/payments/verify', {
    paymentId,
    ...razorpayData,
  });
  return response.data;
};

/**
 * Pay from wallet
 */
export const payFromWallet = async (amount, appointmentId) => {
  const response = await apiClient.post('/wallet/pay', { amount, appointmentId });
  return response.data;
};

/**
 * Get loyalty points
 */
export const getLoyaltyPoints = async () => {
  const response = await apiClient.get('/wallet/loyalty-points');
  return response.data;
};

/**
 * Redeem loyalty points
 */
export const redeemPoints = async (points) => {
  const response = await apiClient.post('/wallet/redeem-points', { points });
  return response.data;
};

/**
 * Apply coupon code
 */
export const applyCoupon = async (couponCode, amount) => {
  const response = await apiClient.post('/coupons/apply', { couponCode, amount });
  return response.data;
};

/**
 * Get refund status
 */
export const getRefundStatus = async (appointmentId) => {
  const response = await apiClient.get(`/payments/refund/${appointmentId}`);
  return response.data;
};

/**
 * Request refund
 */
export const requestRefund = async (appointmentId, reason) => {
  const response = await apiClient.post('/payments/refund', { appointmentId, reason });
  return response.data;
};

/**
 * Get payment receipt
 */
export const getReceipt = async (paymentId) => {
  const response = await apiClient.get(`/payments/receipt/${paymentId}`);
  return response.data;
};

export default {
  getBalance,
  getTransactions,
  addMoney,
  initiatePayment,
  verifyPayment,
  payFromWallet,
  getLoyaltyPoints,
  redeemPoints,
  applyCoupon,
  getRefundStatus,
  requestRefund,
  getReceipt,
};
