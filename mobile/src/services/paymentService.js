/**
 * Payment Service
 * Handles Razorpay payment integration for mobile app
 */

import { Linking, Platform } from 'react-native';
import apiClient from './api/apiClient';

// Backend URL - update with your actual backend
const BACKEND_URL = 'https://healthsync-backend.onrender.com';

/**
 * Get payment configuration
 */
export const getPaymentConfig = async () => {
  try {
    const response = await apiClient.get('/payments/config');
    return {
      success: true,
      paymentsEnabled: response.data.paymentsEnabled,
      keyId: response.data.keyId,
      testMode: response.data.testMode,
      currency: response.data.currency || 'INR',
    };
  } catch (error) {
    console.error('Error getting payment config:', error);
    return { success: false, paymentsEnabled: false };
  }
};

/**
 * Calculate payment breakdown
 */
export const calculatePayment = async (appointmentId) => {
  try {
    const response = await apiClient.get(`/payments/calculate/${appointmentId}`);
    return {
      success: true,
      ...response.data,
    };
  } catch (error) {
    console.error('Error calculating payment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create Razorpay order
 */
export const createOrder = async (appointmentId, userId, couponCode = null) => {
  try {
    const response = await apiClient.post('/payments/create-order', {
      appointmentId,
      userId,
      couponCode,
    });
    
    if (response.data.testMode) {
      return {
        success: true,
        testMode: true,
        message: 'Payment completed in test mode',
        appointmentId,
      };
    }
    
    return {
      success: true,
      orderId: response.data.orderId,
      amount: response.data.amount,
      amountInPaise: response.data.amountInPaise,
      currency: response.data.currency || 'INR',
      keyId: response.data.keyId,
      prefill: response.data.prefill,
      breakdown: response.data.breakdown,
      couponDiscount: response.data.couponDiscount || 0,
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Open Razorpay payment page in browser
 * This is the recommended approach for React Native without native SDK
 */
export const openPaymentPage = async (orderData, appointmentId) => {
  try {
    const { orderId, amount, keyId, prefill } = orderData;
    
    // Build mobile checkout URL
    const params = new URLSearchParams({
      appointmentId,
      amount: amount * 100, // Convert to paise
      name: encodeURIComponent(prefill?.name || ''),
      email: encodeURIComponent(prefill?.email || ''),
      contact: encodeURIComponent(prefill?.contact || ''),
      doctorName: encodeURIComponent(orderData.doctorName || 'Doctor'),
    });
    
    const checkoutUrl = `${BACKEND_URL}/api/payments/mobile-checkout/${orderId}?${params.toString()}`;
    
    console.log('Opening payment URL:', checkoutUrl);
    
    const canOpen = await Linking.canOpenURL(checkoutUrl);
    if (canOpen) {
      await Linking.openURL(checkoutUrl);
      return { success: true, opened: true };
    } else {
      return { success: false, error: 'Cannot open payment page' };
    }
  } catch (error) {
    console.error('Error opening payment page:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify payment after completion
 */
export const verifyPayment = async (paymentData) => {
  try {
    const response = await apiClient.post('/payments/verify', paymentData);
    return {
      success: response.data.success,
      verified: response.data.verified,
      appointment: response.data.appointment,
      paymentDetails: response.data.paymentDetails,
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get payment status for an appointment
 */
export const getPaymentStatus = async (appointmentId) => {
  try {
    const response = await apiClient.get(`/payments/status/${appointmentId}`);
    return {
      success: true,
      paymentStatus: response.data.paymentStatus,
      status: response.data.status,
      paidAt: response.data.paidAt,
    };
  } catch (error) {
    console.error('Error getting payment status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get payment history for user
 */
export const getPaymentHistory = async (userId) => {
  try {
    const response = await apiClient.get(`/payments/history/${userId}`);
    return {
      success: true,
      payments: response.data.payments || [],
    };
  } catch (error) {
    console.error('Error getting payment history:', error);
    return { success: false, payments: [] };
  }
};

/**
 * Request refund
 */
export const requestRefund = async (appointmentId, reason) => {
  try {
    const response = await apiClient.post('/payments/refund', {
      appointmentId,
      reason,
    });
    return {
      success: response.data.success,
      refundId: response.data.refundId,
      message: response.data.message,
    };
  } catch (error) {
    console.error('Error requesting refund:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Validate coupon code
 */
export const validateCoupon = async (code, amount) => {
  try {
    const response = await apiClient.post('/coupons/validate', {
      code: code.trim().toUpperCase(),
      amount,
    });
    return {
      success: response.data.success,
      coupon: response.data.coupon,
      discount: response.data.discount,
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return { success: false, error: error.message || 'Invalid coupon code' };
  }
};

export default {
  getPaymentConfig,
  calculatePayment,
  createOrder,
  openPaymentPage,
  verifyPayment,
  getPaymentStatus,
  getPaymentHistory,
  requestRefund,
  validateCoupon,
};
