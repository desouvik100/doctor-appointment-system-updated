/**
 * Subscription Checkout Screen
 * Razorpay payment integration and plan selection
 * Requirements: 9.1
 */

import React, { useState, useEffect } from 'react';
import axios from '../../api/config';
import './SubscriptionCheckout.css';

const SubscriptionCheckout = ({ 
  clinicId, 
  selectedPlan, 
  selectedDuration = '1_year',
  onSuccess, 
  onCancel 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [duration, setDuration] = useState(selectedDuration);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [discount, setDiscount] = useState(0);

  const pricing = selectedPlan?.pricing?.[duration] || {};
  const finalAmount = pricing.amount - discount;

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    try {
      const response = await axios.post('/api/emr/coupon/validate', {
        code: couponCode,
        planId: selectedPlan.id,
        amount: pricing.amount
      });
      
      if (response.data.success && response.data.valid) {
        setCouponApplied(response.data.coupon);
        setDiscount(response.data.discount || 0);
      } else {
        setError(response.data.message || 'Invalid coupon code');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply coupon');
      setTimeout(() => setError(''), 3000);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setDiscount(0);
    setCouponCode('');
  };

  const handlePayment = async () => {
    setProcessing(true);
    setError('');

    try {
      // Load Razorpay SDK
      const loaded = await loadRazorpay();
      if (!loaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Create order
      const orderResponse = await axios.post('/api/emr/subscribe', {
        clinicId,
        planId: selectedPlan.id,
        duration,
        couponCode: couponApplied?.code
      });

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || 'Failed to create order');
      }

      const { orderId, amount, currency, key } = orderResponse.data;

      // Open Razorpay checkout
      const options = {
        key,
        amount: amount * 100, // Razorpay expects amount in paise
        currency: currency || 'INR',
        name: 'HealthSync EMR',
        description: `${selectedPlan.name} - ${duration === '6_months' ? '6 Months' : '1 Year'}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResponse = await axios.post('/api/emr/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              clinicId,
              planId: selectedPlan.id,
              duration
            });

            if (verifyResponse.data.success) {
              if (onSuccess) {
                onSuccess(verifyResponse.data.subscription);
              }
            } else {
              setError('Payment verification failed. Please contact support.');
            }
          } catch (err) {
            setError('Payment verification failed. Please contact support.');
          }
          setProcessing(false);
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#3b82f6'
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!selectedPlan) {
    return (
      <div className="subscription-checkout">
        <div className="checkout-error">
          <p>No plan selected. Please select a plan first.</p>
          <button onClick={onCancel}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-checkout">
      <div className="checkout-container">
        {/* Header */}
        <div className="checkout-header">
          <h1>Complete Your Subscription</h1>
          <p>You're subscribing to {selectedPlan.name}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="checkout-content">
          {/* Plan Summary */}
          <div className="checkout-section plan-summary">
            <h3>Plan Summary</h3>
            <div className="summary-card" style={{ '--plan-color': selectedPlan.color }}>
              <div className="summary-header">
                <span className="plan-icon">
                  {selectedPlan.id === 'advanced' ? '⭐' : selectedPlan.id === 'standard' ? '🌟' : '✨'}
                </span>
                <div className="plan-info">
                  <h4>{selectedPlan.name}</h4>
                  <p>{selectedPlan.description}</p>
                </div>
              </div>
              <div className="summary-features">
                {selectedPlan.features?.slice(0, 4).map((feature, idx) => (
                  <span key={idx} className="feature-tag">✓ {feature}</span>
                ))}
                {selectedPlan.features?.length > 4 && (
                  <span className="feature-more">+{selectedPlan.features.length - 4} more</span>
                )}
              </div>
            </div>
          </div>

          {/* Duration Selection */}
          <div className="checkout-section">
            <h3>Subscription Duration</h3>
            <div className="duration-options">
              <label className={`duration-option ${duration === '6_months' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="duration"
                  value="6_months"
                  checked={duration === '6_months'}
                  onChange={(e) => setDuration(e.target.value)}
                />
                <div className="option-content">
                  <span className="option-label">6 Months</span>
                  <span className="option-price">
                    {formatCurrency(selectedPlan.pricing?.['6_months']?.amount)}
                  </span>
                  <span className="option-monthly">
                    {formatCurrency(selectedPlan.pricing?.['6_months']?.perMonth)}/mo
                  </span>
                </div>
              </label>
              <label className={`duration-option ${duration === '1_year' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="duration"
                  value="1_year"
                  checked={duration === '1_year'}
                  onChange={(e) => setDuration(e.target.value)}
                />
                <div className="option-content">
                  <span className="option-label">1 Year</span>
                  <span className="option-price">
                    {formatCurrency(selectedPlan.pricing?.['1_year']?.amount)}
                  </span>
                  <span className="option-monthly">
                    {formatCurrency(selectedPlan.pricing?.['1_year']?.perMonth)}/mo
                  </span>
                  {selectedPlan.pricing?.['1_year']?.savings > 0 && (
                    <span className="option-savings">
                      Save {formatCurrency(selectedPlan.pricing['1_year'].savings)}
                    </span>
                  )}
                </div>
                <span className="best-value">Best Value</span>
              </label>
            </div>
          </div>

          {/* Coupon Code */}
          <div className="checkout-section">
            <h3>Have a Coupon?</h3>
            {couponApplied ? (
              <div className="coupon-applied">
                <span className="coupon-tag">
                  🎟️ {couponApplied.code} applied
                  <span className="coupon-discount">-{formatCurrency(discount)}</span>
                </span>
                <button className="btn-remove-coupon" onClick={removeCoupon}>Remove</button>
              </div>
            ) : (
              <div className="coupon-input">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
                <button 
                  className="btn-apply-coupon" 
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim()}
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="checkout-section order-summary">
            <h3>Order Summary</h3>
            <div className="summary-rows">
              <div className="summary-row">
                <span>{selectedPlan.name}</span>
                <span>{formatCurrency(pricing.amount)}</span>
              </div>
              <div className="summary-row">
                <span>Duration</span>
                <span>{duration === '6_months' ? '6 Months' : '1 Year'}</span>
              </div>
              {discount > 0 && (
                <div className="summary-row discount">
                  <span>Coupon Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Total</span>
                <span>{formatCurrency(finalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <div className="checkout-actions">
            <button
              className="btn-pay"
              onClick={handlePayment}
              disabled={processing}
            >
              {processing ? (
                <>
                  <span className="spinner-small"></span>
                  Processing...
                </>
              ) : (
                <>
                  🔒 Pay {formatCurrency(finalAmount)}
                </>
              )}
            </button>
            <button className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
          </div>

          {/* Security Note */}
          <div className="security-note">
            <span className="security-icon">🔐</span>
            <p>Your payment is secured by Razorpay. We never store your card details.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCheckout;
