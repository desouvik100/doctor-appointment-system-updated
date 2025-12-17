import axios from '../api/config';

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
      }
    }
  };

  const razorpay = new window.Razorpay(options);
  razorpay.on('payment.failed', function (response) {
    onFailure(new Error(response.error.description || 'Payment failed'));
  });
  razorpay.open();
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

// Initiate payment - main entry point for payment flow
export const initiatePayment = async (appointmentId, userId, onSuccess, onFailure, couponCode = null) => {
  try {
    // Create order first (with coupon if provided)
    const orderData = await createOrder(appointmentId, userId, couponCode);
    
    // If payments are disabled (test mode), auto-confirm
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
    
    // Check if Razorpay script is loaded
    if (!window.Razorpay) {
      throw new Error('Razorpay SDK not loaded. Please refresh the page.');
    }
    
    // Open Razorpay checkout
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
        color: '#667eea'
      },
      handler: function (response) {
        // Payment successful - pass response to callback
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
        backdropclose: false
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', function (response) {
      onFailure(new Error(response.error.description || 'Payment failed'));
    });
    razorpay.open();
    
  } catch (error) {
    console.error('Payment initiation error:', error);
    onFailure(error);
  }
};
