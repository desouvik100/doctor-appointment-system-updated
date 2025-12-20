import axios from '../api/config';
import { Capacitor } from '@capacitor/core';

// Get Razorpay configuration
export const getRazorpayConfig = async () => {
  try {
    const response = await axios.get('/api/payments/config');
    return response.data;
  } catch (error) {
    console.error('Error fetching Razorpay config:', error);
    return { paymentsEnabled: false, testMode: true };
  }
};

// Calculate payment breakdown
export const calculatePayment = async (appointmentId) => {
  try {
    const response = await axios.get(`/api/payments/calculate/${appointmentId}`);
    return response.data;
  } catch (error) {
    console.error('Error calculating payment:', error);
    throw error;
  }
};

// Create Razorpay order
export const createOrder = async (appointmentId, userId, couponCode = null) => {
  try {
    const response = await axios.post('/api/payments/create-order', {
      appointmentId,
      userId,
      couponCode
    });
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Verify payment
export const verifyPayment = async (paymentData) => {
  try {
    const response = await axios.post('/api/payments/verify', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

// Open Razorpay checkout
export const openRazorpayCheckout = (orderData, onSuccess, onFailure) => {
  // Check if we're in a native app
  const isNative = Capacitor.isNativePlatform();
  
  if (isNative) {
    // For native apps, we need to handle Razorpay differently
    // The Razorpay SDK should still work in WebView but may need special handling
    console.log('Opening Razorpay in native WebView...');
  }
  
  const options = {
    key: orderData.keyId,
    amount: orderData.amountInPaise,
    currency: orderData.currency,
    name: 'HealthSync',
    description: `Consultation Fee`,
    order_id: orderData.orderId,
    prefill: orderData.prefill,
    notes: orderData.notes,
    theme: {
      color: '#667eea'
    },
    handler: async function (response) {
      try {
        // Verify payment on backend
        const verificationResult = await verifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        });
        
        if (verificationResult.success) {
          onSuccess(verificationResult);
        } else {
          onFailure(new Error('Payment verification failed'));
        }
      } catch (error) {
        onFailure(error);
      }
    },
    modal: {
      ondismiss: function () {
        onFailure(new Error('Payment cancelled by user'));
      },
      // Important for WebView
      escape: true,
      backdropclose: false,
      confirm_close: true
    },
    // Enable all payment methods
    config: {
      display: {
        blocks: {
          banks: {
            name: 'Pay via UPI/Cards/NetBanking',
            instruments: [
              { method: 'upi' },
              { method: 'card' },
              { method: 'netbanking' },
              { method: 'wallet' }
            ]
          }
        },
        sequence: ['block.banks'],
        preferences: {
          show_default_blocks: true
        }
      }
    }
  };

  try {
    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', function (response) {
      onFailure(new Error(response.error.description || 'Payment failed'));
    });
    razorpay.open();
  } catch (error) {
    console.error('Error opening Razorpay:', error);
    onFailure(new Error('Failed to open payment gateway. Please try again.'));
  }
};

// Process payment for appointment
export const processPayment = async (appointmentId, userId, onSuccess, onFailure) => {
  try {
    // Create order
    const orderData = await createOrder(appointmentId, userId);
    
    // If test mode, payment is already processed
    if (orderData.testMode) {
      onSuccess({
        success: true,
        testMode: true,
        message: orderData.message
      });
      return;
    }
    
    // Open Razorpay checkout
    openRazorpayCheckout(orderData, onSuccess, onFailure);
  } catch (error) {
    onFailure(error);
  }
};

// Get payment history
export const getPaymentHistory = async (userId) => {
  try {
    const response = await axios.get(`/api/payments/history/${userId}`);
    return response.data.payments || [];
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }
};

// Request refund
export const requestRefund = async (appointmentId, reason) => {
  try {
    const response = await axios.post('/api/payments/refund', {
      appointmentId,
      reason
    });
    return response.data;
  } catch (error) {
    console.error('Error requesting refund:', error);
    throw error;
  }
};

// Load Razorpay script dynamically (for native apps)
const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.Razorpay) {
      console.log('Razorpay SDK already loaded');
      resolve(true);
      return;
    }
    
    // Check if script tag exists but not loaded yet
    const existingScript = document.querySelector('script[src*="razorpay"]');
    if (existingScript) {
      console.log('Razorpay script tag exists, waiting for load...');
      // Wait for it to load
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.Razorpay) {
          clearInterval(checkInterval);
          console.log('Razorpay SDK loaded after waiting');
          resolve(true);
        } else if (attempts > 50) { // 5 seconds max
          clearInterval(checkInterval);
          reject(new Error('Razorpay SDK load timeout'));
        }
      }, 100);
      return;
    }
    
    console.log('Loading Razorpay script dynamically...');
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      resolve(true);
    };
    script.onerror = (e) => {
      console.error('Failed to load Razorpay script:', e);
      reject(new Error('Failed to load Razorpay SDK'));
    };
    document.body.appendChild(script);
  });
};

// Initiate payment - main entry point for payment flow
export const initiatePayment = async (appointmentId, userId, onSuccess, onFailure, couponCode = null) => {
  try {
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    
    console.log('=== RAZORPAY PAYMENT INITIATION ===');
    console.log('Platform:', platform);
    console.log('Is Native:', isNative);
    console.log('Appointment ID:', appointmentId);
    console.log('User ID:', userId);
    console.log('Coupon Code:', couponCode);
    
    // Create order first (with coupon if provided)
    console.log('Creating order...');
    const orderData = await createOrder(appointmentId, userId, couponCode);
    console.log('Order created:', orderData);
    
    // If payments are disabled (test mode), auto-confirm
    if (orderData.testMode) {
      console.log('Test mode - auto confirming payment');
      onSuccess({
        success: true,
        testMode: true,
        message: orderData.message,
        razorpay_order_id: 'test_order',
        razorpay_payment_id: 'test_payment',
        razorpay_signature: 'test_signature'
      });
      return;
    }
    
    // Ensure Razorpay script is loaded
    console.log('Checking Razorpay SDK...');
    try {
      await loadRazorpayScript();
      console.log('Razorpay SDK ready');
    } catch (scriptError) {
      console.error('Failed to load Razorpay script:', scriptError);
      throw new Error('Payment gateway not available. Please check your internet connection.');
    }
    
    // Double check Razorpay is available
    if (!window.Razorpay) {
      console.error('window.Razorpay is undefined after script load');
      throw new Error('Razorpay SDK not loaded. Please refresh and try again.');
    }
    
    console.log('Razorpay SDK version:', window.Razorpay.version || 'unknown');
    
    // Build Razorpay options - optimized for Android WebView
    const options = {
      key: orderData.keyId,
      amount: orderData.amountInPaise,
      currency: orderData.currency || 'INR',
      name: 'HealthSync Pro',
      description: `Consultation with ${orderData.notes?.doctorName || 'Doctor'}`,
      order_id: orderData.orderId,
      prefill: orderData.prefill || {},
      notes: orderData.notes || {},
      theme: {
        color: '#0ea5e9',
        backdrop_color: 'rgba(0, 0, 0, 0.6)'
      },
      handler: function (response) {
        console.log('=== PAYMENT SUCCESS ===');
        console.log('Response:', response);
        onSuccess({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          method: 'Razorpay'
        });
      },
      modal: {
        ondismiss: function () {
          console.log('Payment modal dismissed by user');
          onFailure(new Error('Payment cancelled'));
        },
        escape: true,
        backdropclose: false,
        confirm_close: true,
        animation: true
      },
      // Retry configuration
      retry: {
        enabled: true,
        max_count: 3
      },
      // Send SMS hash for auto-read OTP (Android)
      send_sms_hash: isNative && platform === 'android',
      // Allow remember customer
      remember_customer: true,
      // Callback URL for redirect-based flows (important for some Android WebViews)
      callback_url: window.location.origin + '/payment-callback',
      // Redirect mode - set to false to use popup mode
      redirect: false
    };

    console.log('Razorpay options:', JSON.stringify(options, null, 2));
    
    // Create Razorpay instance
    console.log('Creating Razorpay instance...');
    const razorpay = new window.Razorpay(options);
    
    // Add payment failed handler
    razorpay.on('payment.failed', function (response) {
      console.error('=== PAYMENT FAILED ===');
      console.error('Error:', response.error);
      onFailure(new Error(response.error.description || 'Payment failed'));
    });
    
    // Open the checkout - with slight delay for Android WebView
    console.log('Opening Razorpay checkout...');
    
    if (isNative && platform === 'android') {
      // Small delay for Android WebView to ensure DOM is ready
      setTimeout(() => {
        console.log('Opening Razorpay (Android delayed)...');
        try {
          razorpay.open();
          console.log('Razorpay.open() called successfully');
        } catch (openError) {
          console.error('Error calling razorpay.open():', openError);
          onFailure(new Error('Failed to open payment gateway. Please try again.'));
        }
      }, 300);
    } else {
      try {
        razorpay.open();
        console.log('Razorpay.open() called successfully');
      } catch (openError) {
        console.error('Error calling razorpay.open():', openError);
        onFailure(new Error('Failed to open payment gateway. Please try again.'));
      }
    }
    
  } catch (error) {
    console.error('=== PAYMENT INITIATION ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    onFailure(error);
  }
};
