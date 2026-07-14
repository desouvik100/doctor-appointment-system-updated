import axios from '../api/config';

// Backend URL for API calls
const API_BACKEND_URL = process.env.REACT_APP_API_URL || 'https://doctor-appointment-system-updated.onrender.com';

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

// Open Razorpay checkout (web)
export const openRazorpayCheckout = (orderData, onSuccess, onFailure) => {
  const options = {
    key: orderData.keyId,
    amount: orderData.amountInPaise,
    currency: orderData.currency,
    name: 'HealthSync',
    description: 'Consultation Fee',
    order_id: orderData.orderId,
    prefill: orderData.prefill,
    notes: orderData.notes,
    theme: { color: '#667eea' },
    handler: async function (response) {
      try {
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
      escape: true,
      backdropclose: false,
      confirm_close: true
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
    const orderData = await createOrder(appointmentId, userId);
    if (orderData.testMode) {
      onSuccess({ success: true, testMode: true, message: orderData.message });
      return;
    }
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
    const response = await axios.post('/api/payments/refund', { appointmentId, reason });
    return response.data;
  } catch (error) {
    console.error('Error requesting refund:', error);
    throw error;
  }
};

// Load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existingScript = document.querySelector('script[src*="razorpay"]');
    if (existingScript) {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.Razorpay) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (attempts > 100) {
          clearInterval(checkInterval);
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
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      setTimeout(() => {
        if (window.Razorpay) {
          resolve(true);
        } else {
          reject(new Error('Razorpay SDK failed to initialize'));
        }
      }, 500);
    };
    script.onerror = () => {
      reject(new Error('Failed to load Razorpay SDK. Please check your internet connection.'));
    };
    document.head.appendChild(script);
  });
};

// Initiate payment - main entry point
export const initiatePayment = async (appointmentId, userId, onSuccess, onFailure, couponCode = null) => {
  try {
    console.log('=== RAZORPAY PAYMENT INITIATION ===');
    console.log('Appointment ID:', appointmentId, '| User ID:', userId);

    const orderData = await createOrder(appointmentId, userId, couponCode);
    console.log('Order created:', orderData);

    // Test mode — auto-confirm
    if (orderData.testMode) {
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

    // Web: ensure SDK is loaded
    try {
      await loadRazorpayScript();
    } catch (scriptError) {
      throw new Error('Payment gateway not available. Please check your internet connection.');
    }

    if (!window.Razorpay) {
      throw new Error('Razorpay SDK not loaded. Please refresh and try again.');
    }

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
        onSuccess({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          method: 'Razorpay'
        });
      },
      modal: {
        ondismiss: function () {
          onFailure(new Error('Payment cancelled'));
        },
        escape: true,
        backdropclose: false,
        confirm_close: true,
        animation: true
      },
      retry: { enabled: true, max_count: 3 },
      remember_customer: true,
      redirect: false
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        console.error('=== PAYMENT FAILED ===', response.error);
        onFailure(new Error(response.error.description || 'Payment failed'));
      });
      razorpay.open();
    } catch (instanceError) {
      console.error('Error creating Razorpay instance:', instanceError);
      onFailure(new Error('Failed to initialize payment. Please try again.'));
    }

  } catch (error) {
    console.error('=== PAYMENT INITIATION ERROR ===', error);
    onFailure(error);
  }
};
