/**
 * PaymentButton Component
 * Cross-platform payment button that works on web and mobile
 * 
 * Usage:
 * <PaymentButton 
 *   appointmentId="123" 
 *   userId="456" 
 *   amount={500}
 *   onSuccess={(result) => console.log('Paid!', result)}
 *   onError={(error) => console.error(error)}
 * />
 */

import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { openCheckout } from './payment';
import toast from 'react-hot-toast';

const PaymentButton = ({ 
  appointmentId, 
  userId, 
  amount, 
  currency = 'INR',
  onSuccess, 
  onError,
  disabled = false,
  className = '',
  children 
}) => {
  const [loading, setLoading] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const handlePayment = async () => {
    if (disabled || loading) return;
    
    setLoading(true);
    
    try {
      const result = await openCheckout(appointmentId, userId);
      
      if (result.success) {
        if (result.testMode) {
          toast.success('Test mode - Appointment confirmed without payment');
        } else {
          toast.success('Payment successful!');
        }
        onSuccess?.(result);
      } else if (result.isWeb && result.orderData) {
        // For web, we need to open Razorpay SDK
        // This should be handled by the parent component
        handleWebPayment(result.orderData);
      } else if (result.cancelled) {
        toast('Payment cancelled');
      } else if (result.timeout) {
        toast.error('Payment verification timed out. Please check your appointment status.');
        onError?.(new Error(result.message));
      } else {
        toast.error(result.message || 'Payment failed');
        onError?.(new Error(result.message));
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle web payment with Razorpay SDK
  const handleWebPayment = (orderData) => {
    if (!window.Razorpay) {
      toast.error('Payment system not loaded. Please refresh the page.');
      return;
    }

    const options = {
      key: orderData.keyId,
      amount: orderData.amountInPaise,
      currency: orderData.currency,
      name: 'HealthSync',
      description: 'Appointment Payment',
      order_id: orderData.orderId,
      prefill: orderData.prefill,
      theme: { color: '#4F46E5' },
      handler: async (response) => {
        try {
          // Verify payment
          const { verifyPayment } = await import('./payment');
          const verifyResult = await verifyPayment(
            appointmentId,
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature
          );
          
          if (verifyResult.success) {
            toast.success('Payment successful!');
            onSuccess?.(verifyResult);
          } else {
            toast.error('Payment verification failed');
            onError?.(new Error('Verification failed'));
          }
        } catch (error) {
          toast.error('Payment verification failed');
          onError?.(error);
        }
      },
      modal: {
        ondismiss: () => {
          toast('Payment cancelled');
          setLoading(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      toast.error(response.error.description || 'Payment failed');
      onError?.(new Error(response.error.description));
      setLoading(false);
    });
    rzp.open();
  };

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: disabled ? '#9CA3AF' : '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s',
    minWidth: '150px'
  };

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || loading}
      style={buttonStyle}
      className={className}
    >
      {loading ? (
        <>
          <span className="spinner" style={{
            width: '16px',
            height: '16px',
            border: '2px solid #ffffff40',
            borderTopColor: '#ffffff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Processing...
        </>
      ) : (
        children || `Pay ₹${amount}`
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default PaymentButton;
