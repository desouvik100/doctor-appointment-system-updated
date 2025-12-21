import axios from '../api/config';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

// Backend URL for payment callbacks
const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://doctor-appointment-system-updated.onrender.com';
const FRONTEND_URL = window.location.origin;

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

// Store pending payment callbacks for Android deep link handling
let pendingPaymentCallbacks = null;

// Setup deep link listener for payment callbacks (Android)
const setupPaymentDeepLinkListener = () => {
  if (Capacitor.isNativePlatform()) {
    App.addListener('appUrlOpen', async ({ url }) => {
      console.log('=== DEEP LINK RECEIVED ===');
      console.log('URL:', url);
      
      if (url.includes('payment-callback') || url.includes('payment-success') || url.includes('payment-failed')) {
        // Close the browser
        try {
          await Browser.close();
        } catch (e) {
          console.log('Browser already closed');
        }
        
        // Parse the URL
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        
        if (pendingPaymentCallbacks) {
          if (url.includes('payment-success') || params.get('status') === 'success') {
            pendingPaymentCallbacks.onSuccess({
              razorpay_order_id: params.get('razorpay_order_id'),
              razorpay_payment_id: params.get('razorpay_payment_id'),
              razorpay_signature: params.get('razorpay_signature'),
              method: 'Razorpay'
            });
          } else {
            pendingPaymentCallbacks.onFailure(new Error(params.get('error') || 'Payment failed or cancelled'));
          }
          pendingPaymentCallbacks = null;
        }
      }
    });
  }
};

// Initialize deep link listener
setupPaymentDeepLinkListener();

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
    
    // For Android native app, use external browser with hosted checkout page
    if (isNative && platform === 'android') {
      console.log('Using external browser for Android payment...');
      
      // Store callbacks for deep link handling
      pendingPaymentCallbacks = { onSuccess, onFailure };
      
      // Build URL for mobile checkout page hosted on backend
      const checkoutParams = new URLSearchParams({
        appointmentId: appointmentId,
        amount: orderData.amountInPaise,
        name: orderData.prefill?.name || '',
        email: orderData.prefill?.email || '',
        contact: orderData.prefill?.contact || '',
        doctorName: orderData.notes?.doctorName || 'Doctor'
      });
      
      // Use our backend's mobile checkout page
      const checkoutUrl = `${BACKEND_URL}/api/payments/mobile-checkout/${orderData.orderId}?${checkoutParams.toString()}`;
      
      console.log('Opening mobile checkout URL:', checkoutUrl);
      
      // Open in external browser
      await Browser.open({ 
        url: checkoutUrl,
        presentationStyle: 'fullscreen',
        toolbarColor: '#0ea5e9'
      });
      
      // Set up a listener for when browser closes (user cancelled)
      const browserListener = await Browser.addListener('browserFinished', () => {
        console.log('Browser closed by user');
        // Don't immediately fail - wait a bit for deep link
        setTimeout(() => {
          if (pendingPaymentCallbacks) {
            // If callbacks still pending after 2 seconds, assume cancelled
            pendingPaymentCallbacks.onFailure(new Error('Payment cancelled'));
            pendingPaymentCallbacks = null;
          }
        }, 2000);
        browserListener.remove();
      });
      
      return;
    }
    
    // For web/iOS, use standard Razorpay popup
    console.log('Using standard Razorpay popup...');
    
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
    
    console.log('Razorpay SDK available:', !!window.Razorpay);
    
    // Build Razorpay options
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
      retry: {
        enabled: true,
        max_count: 3
      },
      remember_customer: true,
      redirect: false
    };

    console.log('Razorpay options prepared');
    
    try {
      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response) {
        console.error('=== PAYMENT FAILED ===');
        console.error('Error:', response.error);
        onFailure(new Error(response.error.description || 'Payment failed'));
      });
      
      console.log('Opening Razorpay checkout...');
      razorpay.open();
      console.log('Razorpay.open() called successfully');
      
    } catch (instanceError) {
      console.error('Error creating Razorpay instance:', instanceError);
      onFailure(new Error('Failed to initialize payment. Please try again.'));
    }
    
  } catch (error) {
    console.error('=== PAYMENT INITIATION ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    onFailure(error);
  }
};
