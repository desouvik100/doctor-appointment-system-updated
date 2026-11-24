import axios from '../api/config';

// Get PayU configuration
export const getPayUConfig = async () => {
  try {
    const response = await axios.get('/api/payments/config');
    return response.data;
  } catch (error) {
    console.error('Error fetching PayU config:', error);
    return { paymentsEnabled: false, testMode: true };
  }
};

// Create PayU order
export const createOrder = async (appointmentId, userId) => {
  try {
    const response = await axios.post('/api/payments/create-order', {
      appointmentId,
      userId
    });
    return response.data;
  } catch (error) {
    console.error('Error creating PayU order:', error);
    throw error;
  }
};

// Open PayU checkout (redirect to PayU payment page)
export const openPayUCheckout = (orderData) => {
  // Create a form and submit to PayU
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = orderData.payuUrl;
  
  const params = orderData.payuParams;
  
  Object.keys(params).forEach(key => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = params[key] || '';
    form.appendChild(input);
  });
  
  document.body.appendChild(form);
  form.submit();
};

// Verify payment (called after PayU redirect)
export const verifyPayment = async (paymentData) => {
  try {
    const response = await axios.post('/api/payments/verify', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

// Get payment history
export const getPaymentHistory = async (userId) => {
  try {
    const response = await axios.get(`/api/payments/history/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
};

// Get payment status
export const getPaymentStatus = async (appointmentId) => {
  try {
    const response = await axios.get(`/api/payments/status/${appointmentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment status:', error);
    throw error;
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

// Process payment - main function to initiate payment
export const processPayment = async (appointmentId, userId, onSuccess, onFailure) => {
  try {
    // Create order
    const orderData = await createOrder(appointmentId, userId);
    
    if (orderData.testMode) {
      // Test mode - payment auto-completed
      onSuccess({
        testMode: true,
        appointmentId,
        message: orderData.message
      });
      return;
    }
    
    // Redirect to PayU checkout
    openPayUCheckout(orderData);
    
  } catch (error) {
    onFailure(error);
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

export default {
  getPayUConfig,
  createOrder,
  openPayUCheckout,
  verifyPayment,
  getPaymentHistory,
  getPaymentStatus,
  calculatePayment,
  processPayment,
  requestRefund
};
