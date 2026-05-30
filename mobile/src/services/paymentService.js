/**
 * Payment Service
 * Handles Razorpay payment integration for mobile app
 */

import { Linking, Platform } from 'react-native';
import apiClient from './api/apiClient';

import { API_URL } from '../config/env';
const BACKEND_URL = API_URL.replace('/api', '');

/**
 * Get payment configuration
 */
export const getPaymentConfig = async () => {
  try {
    const response = await apiClient.get('/payments/config');
    const data = response?.data || {};
    return {
      success: true,
      paymentsEnabled: data.paymentsEnabled || false,
      keyId: data.keyId || null,
      testMode: data.testMode !== false,
      currency: data.currency || 'INR',
    };
  } catch (error) {
    console.error('Error getting payment config:', error);
    return { success: false, paymentsEnabled: false, testMode: true, currency: 'INR' };
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
    
    const data = response?.data || {};
    
    if (data.testMode) {
      return {
        success: true,
        testMode: true,
        message: 'Payment completed in test mode',
        appointmentId,
      };
    }
    
    // Validate required fields
    if (!data.orderId || !data.keyId) {
      throw new Error('Invalid order response from server');
    }
    
    return {
      success: true,
      orderId: data.orderId,
      amount: data.amount || 0,
      amountInPaise: data.amountInPaise || 0,
      currency: data.currency || 'INR',
      keyId: data.keyId,
      prefill: data.prefill || {},
      breakdown: data.breakdown || {},
      couponDiscount: data.couponDiscount || 0,
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message || 'Failed to create order' };
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
    const data = response?.data || {};
    
    return {
      success: data.success || false,
      verified: data.verified || false,
      appointment: data.appointment || null,
      paymentDetails: data.paymentDetails || null,
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { success: false, verified: false, error: error.message || 'Payment verification failed' };
  }
};

/**
 * Get payment status for an appointment
 */
export const getPaymentStatus = async (appointmentId) => {
  try {
    const response = await apiClient.get(`/payments/status/${appointmentId}`);
    const data = response?.data || {};
    
    return {
      success: true,
      paymentStatus: data.paymentStatus || 'pending',
      status: data.status || 'pending',
      paidAt: data.paidAt || null,
    };
  } catch (error) {
    console.error('Error getting payment status:', error);
    return { success: false, paymentStatus: 'unknown', error: error.message };
  }
};

/**
 * Get payment history for user
 */
export const getPaymentHistory = async (userId) => {
  try {
    const response = await apiClient.get(`/payments/history/${userId}`);
    const data = response?.data || {};
    
    return {
      success: true,
      payments: Array.isArray(data.payments) ? data.payments : [],
    };
  } catch (error) {
    console.error('Error getting payment history:', error);
    return { success: false, payments: [], error: error.message };
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
    const data = response?.data || {};
    
    return {
      success: data.success || false,
      refundId: data.refundId || null,
      message: data.message || 'Refund request submitted',
    };
  } catch (error) {
    console.error('Error requesting refund:', error);
    return { success: false, error: error.message || 'Refund request failed' };
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
    const data = response?.data || {};
    
    return {
      success: data.success || false,
      coupon: data.coupon || null,
      discount: data.discount || 0,
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
