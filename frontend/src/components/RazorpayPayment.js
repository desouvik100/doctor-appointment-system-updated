import React, { useState, useEffect } from 'react';
import axios from '../api/config';

const RazorpayPayment = ({ appointmentId, user, onPaymentSuccess, onPaymentError, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState('');

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const createOrder = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/payments/create-order', {
        appointmentId,
        userId: user._id || user.id
      });
      
      if (response.data.testMode) {
        // Test mode - payment auto-completed
        onPaymentSuccess({
          testMode: true,
          message: response.data.message
        });
        return;
      }
      
      setOrderData(response.data);
      openRazorpayCheckout(response.data);
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err.response?.data?.message || 'Failed to create payment order');
      setLoading(false);
    }
  };

  const openRazorpayCheckout = (order) => {
    const options = {
      key: order.keyId,
      amount: order.amountInPaise,
      currency: order.currency,
      name: 'HealthSync',
      description: `Consultation with Dr. ${order.notes?.doctorName || 'Doctor'}`,
      image: 'https://i.imgur.com/3g7nmJC.png', // HealthSync logo
      order_id: order.orderId,
      handler: async function (response) {
        // Payment successful - verify on backend
        try {
          const verifyResponse = await axios.post('/api/payments/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            appointmentId: appointmentId
          });
          
          if (verifyResponse.data.success) {
            onPaymentSuccess({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              amount: order.amount,
              ...verifyResponse.data.paymentDetails
            });
          } else {
            onPaymentError({ message: 'Payment verification failed' });
          }
        } catch (err) {
          console.error('Payment verification error:', err);
          onPaymentError({ message: 'Payment verification failed' });
        }
      },
      prefill: {
        name: order.prefill?.name || user.name,
        email: order.prefill?.email || user.email,
        contact: order.prefill?.contact || user.phone || ''
      },
      notes: order.notes,
      theme: {
        color: '#6366f1' // Indigo color matching HealthSync theme
      },
      modal: {
        ondismiss: function() {
          setLoading(false);
          // Don't call onCancel here - user might retry
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    
    razorpay.on('payment.failed', function (response) {
      console.error('Payment failed:', response.error);
      setLoading(false);
      onPaymentError({
        code: response.error.code,
        message: response.error.description,
        reason: response.error.reason
      });
    });
    
    razorpay.open();
    setLoading(false);
  };

  return (
    <div className="razorpay-payment">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}
      
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        
        <button
          onClick={createOrder}
          disabled={loading}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Pay Securely
            </>
          )}
        </button>
      </div>
      
      {/* Security badges */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          SSL Secured
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
          </svg>
          Razorpay
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          PCI Compliant
        </div>
      </div>
    </div>
  );
};

export default RazorpayPayment;
