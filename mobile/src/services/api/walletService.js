

import apiClient from './apiClient';

export const getBalance = async () => {
  try {
    const response = await apiClient.get('/wallet/balance');
    return response.data;
  } catch (error) {
    return { success: true, balance: 0, currency: 'INR' };
  }
};

export const getTransactions = async (params = {}) => {
  try {
    const response = await apiClient.get('/wallet/transactions', { params });
    return response.data;
  } catch (error) {
    return { success: true, transactions: [], total: 0 };
  }
};

export const addMoney = async (amount, paymentMethod) => {
  const response = await apiClient.post('/wallet/add', { amount, paymentMethod });
  return response.data;
};

export const initiatePayment = async (paymentData) => {
  const response = await apiClient.post('/payments/initiate', paymentData);
  return response.data;
};

export const verifyPayment = async (paymentId, razorpayData) => {
  const response = await apiClient.post('/payments/verify', {
    paymentId,
    ...razorpayData,
  });
  return response.data;
};

export const payFromWallet = async (amount, appointmentId) => {
  const response = await apiClient.post('/wallet/pay', { amount, appointmentId });
  return response.data;
};

export const getLoyaltyPoints = async () => {
  try {
    const response = await apiClient.get('/wallet/loyalty-points');
    return response.data;
  } catch (error) {
    return { success: true, points: 0, pointsValue: 0, tier: 'Bronze' };
  }
};

export const redeemPoints = async (points) => {
  const response = await apiClient.post('/wallet/redeem-points', { points });
  return response.data;
};

export const applyCoupon = async (couponCode, amount) => {
  const response = await apiClient.post('/coupons/apply', { couponCode, amount });
  return response.data;
};

export const getRefundStatus = async (appointmentId) => {
  const response = await apiClient.get(`/payments/refund/${appointmentId}`);
  return response.data;
};

export const requestRefund = async (appointmentId, reason) => {
  const response = await apiClient.post('/payments/refund', { appointmentId, reason });
  return response.data;
};

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
