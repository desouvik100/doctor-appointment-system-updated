/**
 * Mobile Payment Helper - Capacitor Browser Checkout
 * Opens hosted checkout page in Capacitor Browser for payment processing
 */

import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import axiosInstance from '../api/config';

// Configuration
const CONFIG = {
  // Your production domain for payment callbacks
  SUCCESS_URL: process.env.REACT_APP_PAYMENT_SUCCESS_URL || 'https://yourdomain.com/payment/success',
  CANCEL_URL: process.env.REACT_APP_PAYMENT_CANCEL_URL || 'https://yourdomain.com/payment/cancel',
  // Polling interval for payment verification (ms)
  POLL_INTERVAL: 2000,
  // Max polling attempts
  MAX_POLL_ATTEMPTS: 30,
  // Deep link scheme for app
  APP_SCHEME: 'healthsync'
};

/**
 * Open checkout for an appointment
 * @param {string} appointmentId - The appointment ID to pay for
 * @param {string} userId - The user ID making the payment
 * @param {object} options - Additional options
 * @returns {Promise<object>} Payment result
 */
export const openCheckout = async (appointmentId, userId, options = {}) => {
  const isNative = Capacitor.isNativePlatform();
  
  try {
    // Step 1: Create order on backend
    const orderResponse = await axiosInstance.post('/api/payments/create-order', {
      appointmentId,
      userId
    });

    const orderData = orderResponse.data;

    // If test mode, payment is auto-completed
    if (orderData.testMode) {
      return {
        success: true,
        testMode: true,
        message: orderData.message,
        appointmentId
      };
    }

    // Step 2: For native apps, open browser checkout
    if (isNative) {
      // Create hosted checkout URL with order details
      const checkoutUrl = buildCheckoutUrl(orderData, appointmentId);
      
      // Open in-app browser
      await Browser.open({
        url: checkoutUrl,
        presentationStyle: 'popover',
        toolbarColor: '#4F46E5'
      });

      // Start polling for payment completion
      const paymentResult = await pollPaymentStatus(appointmentId, orderData.orderId);
      
      // Close browser after payment
      await Browser.close();
      
      return paymentResult;
    } else {
      // For web, return order data for Razorpay SDK integration
      return {
        success: true,
        isWeb: true,
        orderData
      };
    }
  } catch (error) {
    console.error('Checkout error:', error);
    throw new Error(error.response?.data?.message || 'Failed to initiate checkout');
  }
};

/**
 * Build hosted checkout URL
 * For Razorpay, this would be a hosted checkout page
 * You may need to create a backend endpoint that renders the Razorpay checkout
 */
const buildCheckoutUrl = (orderData, appointmentId) => {
  const baseUrl = process.env.REACT_APP_API_URL || 'https://yourdomain.com';
  const params = new URLSearchParams({
    orderId: orderData.orderId,
    appointmentId,
    amount: orderData.amount,
    currency: orderData.currency,
    keyId: orderData.keyId,
    prefillName: orderData.prefill?.name || '',
    prefillEmail: orderData.prefill?.email || '',
    prefillContact: orderData.prefill?.contact || '',
    successUrl: `${CONFIG.SUCCESS_URL}?appointmentId=${appointmentId}`,
    cancelUrl: `${CONFIG.CANCEL_URL}?appointmentId=${appointmentId}`
  });
  
  return `${baseUrl}/api/payments/checkout?${params.toString()}`;
};

/**
 * Poll backend for payment status
 */
const pollPaymentStatus = async (appointmentId, orderId) => {
  let attempts = 0;
  
  return new Promise((resolve, reject) => {
    const poll = async () => {
      attempts++;
      
      try {
        const response = await axiosInstance.get(`/api/payments/status/${appointmentId}`);
        const { paymentStatus, status } = response.data;
        
        if (paymentStatus === 'completed') {
          resolve({
            success: true,
            verified: true,
            appointmentId,
            message: 'Payment completed successfully'
          });
          return;
        }
        
        if (paymentStatus === 'failed') {
          resolve({
            success: false,
            verified: false,
            appointmentId,
            message: 'Payment failed'
          });
          return;
        }
        
        if (attempts >= CONFIG.MAX_POLL_ATTEMPTS) {
          resolve({
            success: false,
            timeout: true,
            appointmentId,
            message: 'Payment verification timed out. Please check your appointment status.'
          });
          return;
        }
        
        // Continue polling
        setTimeout(poll, CONFIG.POLL_INTERVAL);
      } catch (error) {
        if (attempts >= CONFIG.MAX_POLL_ATTEMPTS) {
          reject(new Error('Payment verification failed'));
        } else {
          setTimeout(poll, CONFIG.POLL_INTERVAL);
        }
      }
    };
    
    poll();
  });
};

/**
 * Verify payment manually (called after redirect)
 */
export const verifyPayment = async (appointmentId, paymentId, orderId, signature) => {
  try {
    const response = await axiosInstance.post('/api/payments/verify', {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature
    });
    
    return response.data;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw new Error(error.response?.data?.message || 'Payment verification failed');
  }
};

/**
 * Get payment status for an appointment
 */
export const getPaymentStatus = async (appointmentId) => {
  try {
    const response = await axiosInstance.get(`/api/payments/status/${appointmentId}`);
    return response.data;
  } catch (error) {
    console.error('Get payment status error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get payment status');
  }
};

/**
 * Handle deep link callback from payment
 * Call this from your App.js when handling deep links
 */
export const handlePaymentDeepLink = async (url) => {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    const appointmentId = params.get('appointmentId');
    const status = params.get('status');
    const paymentId = params.get('paymentId');
    const orderId = params.get('orderId');
    const signature = params.get('signature');
    
    if (status === 'success' && paymentId && orderId && signature) {
      // Verify the payment
      const result = await verifyPayment(appointmentId, paymentId, orderId, signature);
      return {
        success: true,
        ...result
      };
    } else if (status === 'cancelled') {
      return {
        success: false,
        cancelled: true,
        appointmentId
      };
    }
    
    return {
      success: false,
      appointmentId
    };
  } catch (error) {
    console.error('Deep link handling error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  openCheckout,
  verifyPayment,
  getPaymentStatus,
  handlePaymentDeepLink
};
