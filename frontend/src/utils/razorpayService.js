import axios from '../api/config';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

// Backend URL for API calls
const API_BACKEND_URL = process.env.REACT_APP_API_URL || 'https://doctor-appointment-system-updated.onrender.com';

// For mobile payments, use the verified frontend domain
const PAYMENT_CHECKOUT_URL = 'https://healthsyncpro.in';

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
      console.log('✅ Razorpay SDK already loaded');
      resolve(true);
      return;
    }
    
    // Check if script tag exists but not loaded yet
    const existingScript = document.querySelector('script[src*="razorpay"]');
    if (existingScript) {
      console.log('⏳ Razorpay script tag exists, waiting for load...');
      // Wait for it to load
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.Razorpay) {
          clearInterval(checkInterval);
          console.log('✅ Razorpay SDK loaded after waiting');
          resolve(true);
        } else if (attempts > 100) { // 10 seconds max
          clearInterval(checkInterval);
          console.error('❌ Razorpay SDK load timeout');
          // Remove failed script and try again
          existingScript.remove();
          loadRazorpayScriptFresh().then(resolve).catch(reject);
        }
      }, 100);
      return;
    }
    
    loadRazorpayScriptFresh().then(resolve).catch(reject);
  });
};

// Fresh load of Razorpay script
const loadRazorpayScriptFresh = () => {
  return new Promise((resolve, reject) => {
    console.log('📦 Loading Razorpay script dynamically...');
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      // Wait a bit for Razorpay to initialize
      setTimeout(() => {
        if (window.Razorpay) {
          console.log('✅ Razorpay script loaded successfully');
          resolve(true);
        } else {
          console.error('❌ Razorpay object not available after script load');
          reject(new Error('Razorpay SDK failed to initialize'));
        }
      }, 500);
    };
    
    script.onerror = (e) => {
      console.error('❌ Failed to load Razorpay script:', e);
      reject(new Error('Failed to load Razorpay SDK. Please check your internet connection.'));
    };
    
    document.head.appendChild(script);
  });
};

// Store pending payment callbacks for Android deep link handling
let pendingPaymentCallbacks = null;
let pendingAppointmentId = null;
let paymentCheckInterval = null;

// Setup deep link listener for payment callbacks (Android)
const setupPaymentDeepLinkListener = () => {
  if (Capacitor.isNativePlatform()) {
    console.log('📱 Setting up payment deep link listener...');
    
    App.addListener('appUrlOpen', async ({ url }) => {
      console.log('=== DEEP LINK RECEIVED ===');
      console.log('URL:', url);
      
      // Clear any pending check interval
      if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
        paymentCheckInterval = null;
      }
      
      if (url.includes('payment-callback') || url.includes('payment-success') || url.includes('payment-failed')) {
        // Close the browser
        try {
          await Browser.close();
          console.log('Browser closed');
        } catch (e) {
          console.log('Browser close error (may already be closed):', e.message);
        }
        
        // Parse the URL - handle both URL formats
        let params;
        try {
          // Try parsing as full URL first
          const urlObj = new URL(url);
          params = new URLSearchParams(urlObj.search);
        } catch {
          // Fallback: parse query string after ?
          const queryStart = url.indexOf('?');
          if (queryStart !== -1) {
            params = new URLSearchParams(url.substring(queryStart + 1));
          } else {
            params = new URLSearchParams();
          }
        }
        
        const isSuccess = url.includes('payment-success') || params.get('status') === 'success';
        const isVerified = params.get('verified') === 'true';
        const appointmentId = params.get('appointmentId') || pendingAppointmentId;
        const errorMsg = params.get('error');
        
        console.log('Payment result:', { isSuccess, isVerified, appointmentId, errorMsg });
        
        if (pendingPaymentCallbacks) {
          if (isSuccess) {
            console.log('✅ Calling onSuccess callback');
            pendingPaymentCallbacks.onSuccess({
              razorpay_order_id: params.get('razorpay_order_id') || 'verified',
              razorpay_payment_id: params.get('razorpay_payment_id') || 'verified',
              razorpay_signature: params.get('razorpay_signature') || 'verified',
              method: 'Razorpay',
              verified: isVerified,
              appointmentId: appointmentId
            });
          } else {
            console.log('❌ Calling onFailure callback');
            pendingPaymentCallbacks.onFailure(new Error(errorMsg || 'Payment failed or cancelled'));
          }
          pendingPaymentCallbacks = null;
          pendingAppointmentId = null;
        } else {
          // No pending callbacks - dispatch event for app to handle
          console.log('No pending callbacks, dispatching event');
          window.dispatchEvent(new CustomEvent('paymentComplete', {
            detail: {
              success: isSuccess,
              verified: isVerified,
              appointmentId: appointmentId,
              error: errorMsg
            }
          }));
        }
      }
    });
    
    // Also listen for app resume to check payment status
    App.addListener('appStateChange', async ({ isActive }) => {
      console.log('App state changed:', isActive ? 'active' : 'background');
      
      if (isActive && pendingAppointmentId && pendingPaymentCallbacks) {
        console.log('App resumed with pending payment, checking status...');
        
        // Give a moment for deep link to fire first
        setTimeout(async () => {
          if (pendingPaymentCallbacks && pendingAppointmentId) {
            // Check payment status from backend
            try {
              console.log('Checking payment status for:', pendingAppointmentId);
              const response = await axios.get(`/api/payments/status/${pendingAppointmentId}`);
              console.log('Payment status response:', response.data);
              
              if (response.data?.paymentStatus === 'completed') {
                console.log('✅ Payment was completed while app was in background');
                
                // Close browser if still open
                try {
                  await Browser.close();
                } catch (e) {
                  // Ignore
                }
                
                pendingPaymentCallbacks.onSuccess({
                  method: 'Razorpay',
                  verified: true,
                  fromResume: true,
                  appointmentId: pendingAppointmentId
                });
                pendingPaymentCallbacks = null;
                pendingAppointmentId = null;
                
                if (paymentCheckInterval) {
                  clearInterval(paymentCheckInterval);
                  paymentCheckInterval = null;
                }
              }
            } catch (e) {
              console.log('Could not check payment status:', e.message);
            }
          }
        }, 2000);
      }
    });
    
    console.log('✅ Payment deep link listener setup complete');
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
    
    // For Android native app - use external browser for reliable payment
    // WebView has issues with Razorpay SDK in Capacitor apps
    if (isNative && platform === 'android') {
      console.log('📱 Android detected - using external browser for payment...');
      
      // Store callbacks and appointmentId for handling
      pendingPaymentCallbacks = { onSuccess, onFailure };
      pendingAppointmentId = appointmentId;
      
      // Open external browser with mobile checkout page (most reliable method)
      const checkoutParams = new URLSearchParams({
        appointmentId: appointmentId,
        amount: orderData.amountInPaise,
        name: orderData.prefill?.name || '',
        email: orderData.prefill?.email || '',
        contact: orderData.prefill?.contact || '',
        doctorName: orderData.notes?.doctorName || 'Doctor'
      });
      
      const checkoutUrl = `${PAYMENT_CHECKOUT_URL}/#/payment-checkout?orderId=${orderData.orderId}&appointmentId=${appointmentId}&amount=${orderData.amountInPaise}&name=${encodeURIComponent(orderData.prefill?.name || '')}&email=${encodeURIComponent(orderData.prefill?.email || '')}&contact=${encodeURIComponent(orderData.prefill?.contact || '')}&doctorName=${encodeURIComponent(orderData.notes?.doctorName || 'Doctor')}&keyId=${encodeURIComponent(orderData.keyId)}`;
      
      console.log('Opening mobile checkout URL:', checkoutUrl);
      
      try {
        await Browser.open({ 
          url: checkoutUrl,
          presentationStyle: 'fullscreen',
          toolbarColor: '#0ea5e9',
          windowName: '_blank'
        });
        console.log('✅ Browser opened successfully');
      } catch (browserError) {
        console.error('❌ Failed to open browser:', browserError);
        pendingPaymentCallbacks = null;
        pendingAppointmentId = null;
        onFailure(new Error('Could not open payment page. Please try again.'));
        return;
      }
      
      // Start periodic check for payment completion (backup for deep link)
      if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
      }
      
      let checkCount = 0;
      const maxChecks = 60; // Check for up to 5 minutes (every 5 seconds)
      
      paymentCheckInterval = setInterval(async () => {
        checkCount++;
        
        if (checkCount >= maxChecks) {
          console.log('Max payment checks reached, stopping');
          clearInterval(paymentCheckInterval);
          paymentCheckInterval = null;
          return;
        }
        
        if (!pendingPaymentCallbacks || !pendingAppointmentId) {
          console.log('No pending payment, stopping checks');
          clearInterval(paymentCheckInterval);
          paymentCheckInterval = null;
          return;
        }
        
        try {
          const response = await axios.get(`/api/payments/status/${pendingAppointmentId}`);
          
          if (response.data?.paymentStatus === 'completed') {
            console.log('✅ Payment completed (detected via polling)');
            
            clearInterval(paymentCheckInterval);
            paymentCheckInterval = null;
            
            // Close browser
            try {
              await Browser.close();
            } catch (e) {
              // Ignore
            }
            
            if (pendingPaymentCallbacks) {
              pendingPaymentCallbacks.onSuccess({
                method: 'Razorpay',
                verified: true,
                fromPolling: true,
                appointmentId: pendingAppointmentId
              });
              pendingPaymentCallbacks = null;
              pendingAppointmentId = null;
            }
          }
        } catch (e) {
          // Silent fail - will retry
        }
      }, 5000); // Check every 5 seconds
      
      // Set up a listener for when browser closes
      const browserListener = await Browser.addListener('browserFinished', () => {
        console.log('Browser closed by user');
        
        // Don't immediately fail - give time for deep link or status check
        setTimeout(async () => {
          if (pendingPaymentCallbacks && pendingAppointmentId) {
            // One final check before failing
            try {
              const response = await axios.get(`/api/payments/status/${pendingAppointmentId}`);
              if (response.data?.paymentStatus === 'completed') {
                console.log('✅ Payment was actually completed');
                pendingPaymentCallbacks.onSuccess({
                  method: 'Razorpay',
                  verified: true,
                  fromBrowserClose: true,
                  appointmentId: pendingAppointmentId
                });
              } else {
                console.log('Payment not completed, treating as cancelled');
                pendingPaymentCallbacks.onFailure(new Error('Payment cancelled'));
              }
            } catch (e) {
              pendingPaymentCallbacks.onFailure(new Error('Payment cancelled'));
            }
            
            pendingPaymentCallbacks = null;
            pendingAppointmentId = null;
            
            if (paymentCheckInterval) {
              clearInterval(paymentCheckInterval);
              paymentCheckInterval = null;
            }
          }
        }, 3000);
        
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
