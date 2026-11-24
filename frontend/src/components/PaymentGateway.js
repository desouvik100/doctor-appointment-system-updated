import React, { useState, useEffect } from 'react';
import axios from '../api/config';
import RazorpayPayment from './RazorpayPayment';

const PaymentGateway = ({ appointmentId, user, onPaymentSuccess, onPaymentCancel }) => {
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentConfig, setPaymentConfig] = useState(null);

  useEffect(() => {
    fetchPaymentDetails();
    fetchPaymentConfig();
  }, [appointmentId]);

  const fetchPaymentConfig = async () => {
    try {
      const response = await axios.get('/api/payments/config');
      setPaymentConfig(response.data);
    } catch (err) {
      console.error('Error fetching payment config:', err);
    }
  };

  const fetchPaymentDetails = async () => {
    try {
      const response = await axios.get(`/api/payments/calculate/${appointmentId}`);
      setPaymentDetails(response.data);
      
      // If payments are disabled (not just test mode), skip payment and auto-confirm
      if (!response.data.paymentsEnabled) {
        console.log('Payments disabled - auto-confirming appointment');
        setTimeout(() => {
          onPaymentSuccess({
            testMode: true,
            message: 'Payments disabled - appointment confirmed automatically'
          });
        }, 1500);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch payment details');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    onPaymentSuccess({
      paymentId: paymentData.paymentId,
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      method: paymentData.method
    });
  };

  const handlePaymentError = (error) => {
    setError(error.message || 'Payment failed. Please try again.');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
        {!paymentDetails?.paymentsEnabled && (
          <div className="text-center">
            <p className="text-green-600 font-medium">✅ Payments Disabled</p>
            <p className="text-gray-500 text-sm">No payment required - auto-confirming...</p>
          </div>
        )}
      </div>
    );
  }

  // Don't show payment UI only when payments are completely disabled
  if (!paymentDetails?.paymentsEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8 bg-green-50 rounded-xl">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-xl font-semibold text-green-700 mb-2">Payments Disabled</h3>
        <p className="text-green-600 text-center">Payment is disabled. Your appointment will be confirmed automatically.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Secure Payment</h2>
              <p className="text-indigo-100 text-sm">Powered by Razorpay</p>
            </div>
          </div>
        </div>

        <div className="p-6">
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

          {/* Appointment Details */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Appointment Details</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{paymentDetails?.doctorName}</p>
                  <p className="text-sm text-gray-500">Consultation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Payment Breakdown</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Consultation Fee</span>
                <span>₹{paymentDetails?.consultationFee}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST ({paymentConfig?.gstPercentage || 18}%)</span>
                <span>₹{paymentDetails?.gst}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Platform Fee ({paymentConfig?.platformFeePercentage || 7}%)</span>
                <span>₹{paymentDetails?.platformFee}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-bold text-gray-900">Total Amount</span>
                <span className="font-bold text-2xl text-indigo-600">₹{paymentDetails?.total}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods Info */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Accepted Payment Methods</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">💳 Credit Card</span>
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">💳 Debit Card</span>
              <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">📱 UPI</span>
              <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">🏦 Net Banking</span>
              <span className="px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-xs font-medium">👛 Wallets</span>
            </div>
          </div>

          {/* Razorpay Payment Button */}
          <RazorpayPayment
            appointmentId={appointmentId}
            user={user}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            onCancel={onPaymentCancel}
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;
