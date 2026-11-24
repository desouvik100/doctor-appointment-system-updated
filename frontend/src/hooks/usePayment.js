/**
 * usePayment — Razorpay payment integration hook
 */
import { useState, useCallback } from 'react';
import axios from '../api/config';
import toast from 'react-hot-toast';

export const usePayment = () => {
  const [loading, setLoading]     = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError]         = useState(null);

  /**
   * Create a Razorpay order and open the payment modal
   */
  const initiatePayment = useCallback(async (appointmentId, amount, userInfo = {}) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Create order on backend
      const orderRes = await axios.post('/api/payments/create-order', {
        appointmentId,
        amount,
      });

      const { orderId, amount: orderAmount, currency, keyId } = orderRes.data;

      // 2. Open Razorpay checkout
      return new Promise((resolve, reject) => {
        const options = {
          key: keyId || process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: orderAmount,
          currency: currency || 'INR',
          name: 'HealthSync',
          description: 'Doctor Appointment Payment',
          image: '/logo192.png',
          order_id: orderId,
          prefill: {
            name:  userInfo.name  || '',
            email: userInfo.email || '',
            contact: userInfo.phone || '',
          },
          theme: { color: '#0ea5e9' },
          modal: {
            ondismiss: () => {
              setLoading(false);
              reject(new Error('Payment cancelled by user'));
            },
          },
          handler: async (response) => {
            setProcessing(true);
            try {
              // 3. Verify payment on backend
              const verifyRes = await axios.post('/api/payments/verify', {
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                appointmentId,
              });

              toast.success('Payment successful!');
              resolve(verifyRes.data);
            } catch (verifyErr) {
              const msg = verifyErr?.response?.data?.message || 'Payment verification failed';
              toast.error(msg);
              reject(new Error(msg));
            } finally {
              setProcessing(false);
              setLoading(false);
            }
          },
        };

        // Check if Razorpay is loaded
        if (!window.Razorpay) {
          setLoading(false);
          reject(new Error('Razorpay not loaded. Please refresh the page.'));
          return;
        }

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          const msg = response.error?.description || 'Payment failed';
          toast.error(msg);
          setLoading(false);
          reject(new Error(msg));
        });
        rzp.open();
      });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to initiate payment';
      setError(msg);
      toast.error(msg);
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Get payment history
   */
  const getPaymentHistory = useCallback(async () => {
    try {
      const res = await axios.get('/api/payments/history');
      return res.data?.payments || res.data || [];
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load payment history');
      return [];
    }
  }, []);

  /**
   * Request a refund
   */
  const requestRefund = useCallback(async (paymentId, reason) => {
    try {
      const res = await axios.post('/api/refunds/request', { paymentId, reason });
      toast.success('Refund request submitted successfully');
      return res.data;
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to request refund');
      throw err;
    }
  }, []);

  return {
    loading,
    processing,
    error,
    initiatePayment,
    getPaymentHistory,
    requestRefund,
  };
};

export default usePayment;
