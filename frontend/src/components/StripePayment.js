import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import axios from '../api/config';

// Stripe configuration
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#424770',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#9e2146',
      iconColor: '#9e2146'
    }
  }
};

const CheckoutForm = ({ appointmentId, user, onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [paymentBreakdown, setPaymentBreakdown] = useState(null);

  useEffect(() => {
    createPaymentIntent();
  }, [appointmentId]);

  const createPaymentIntent = async () => {
    try {
      const response = await axios.post('/api/payments/create-payment-intent', {
        appointmentId,
        userId: user.id
      });

      if (response.data.success) {
        setPaymentIntent(response.data);
        setPaymentBreakdown(response.data.breakdown);
      } else {
        setError('Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      setError(error.response?.data?.message || 'Failed to initialize payment');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const card = elements.getElement(CardElement);

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
        paymentIntent.clientSecret,
        {
          payment_method: {
            card: card,
            billing_details: {
              name: user.name,
              email: user.email,
            },
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        onPaymentError(stripeError);
      } else if (confirmedPayment.status === 'succeeded') {
        // Confirm payment on backend
        await axios.post('/api/payments/confirm', {
          paymentIntentId: confirmedPayment.id
        });

        onPaymentSuccess({
          paymentIntentId: confirmedPayment.id,
          amount: paymentBreakdown.total,
          currency: paymentBreakdown.currency
        });
      }
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      setError(error.response?.data?.message || 'Payment failed');
      onPaymentError(error);
    } finally {
      setLoading(false);
    }
  };

  if (!paymentBreakdown) {
    return (
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading payment details...</span>
        </div>
        <p className="mt-2">Initializing payment...</p>
      </div>
    );
  }

  return (
    <div className="stripe-payment-form">
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            <i className="fas fa-credit-card me-2"></i>
            Payment Details
          </h5>
        </div>
        <div className="card-body">
          <div className="payment-breakdown mb-4">
            <div className="row">
              <div className="col-8">Consultation Fee:</div>
              <div className="col-4 text-end">₹{paymentBreakdown.consultationFee}</div>
            </div>
            <div className="row">
              <div className="col-8">GST ({process.env.REACT_APP_GST_PERCENTAGE || 22}%):</div>
              <div className="col-4 text-end">₹{paymentBreakdown.gst}</div>
            </div>
            <div className="row">
              <div className="col-8">Platform Fee ({process.env.REACT_APP_PLATFORM_FEE_PERCENTAGE || 7}%):</div>
              <div className="col-4 text-end">₹{paymentBreakdown.platformFee}</div>
            </div>
            <hr />
            <div className="row fw-bold">
              <div className="col-8">Total Amount:</div>
              <div className="col-4 text-end">₹{paymentBreakdown.total}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Card Details</label>
              <div className="card-element-container p-3 border rounded">
                <CardElement options={CARD_ELEMENT_OPTIONS} />
              </div>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            <div className="d-grid">
              <button
                type="submit"
                className="btn btn-success btn-lg"
                disabled={!stripe || loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <i className="fas fa-lock me-2"></i>
                    Pay ₹{paymentBreakdown.total} Securely
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-3">
            <small className="text-muted">
              <i className="fas fa-shield-alt me-1"></i>
              Your payment is secured by Stripe. We never store your card details.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

const StripePayment = ({ appointmentId, user, onPaymentSuccess, onPaymentError, onCancel }) => {
  const [stripeKey, setStripeKey] = useState(null);

  useEffect(() => {
    fetchStripeConfig();
  }, []);

  const fetchStripeConfig = async () => {
    try {
      const response = await axios.get('/api/payments/config');
      setStripeKey(response.data.publishableKey);
    } catch (error) {
      console.error('Failed to fetch Stripe config:', error);
      onPaymentError(error);
    }
  };

  if (!stripeKey) {
    return (
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading payment system...</span>
        </div>
        <p className="mt-2">Initializing secure payment...</p>
      </div>
    );
  }

  return (
    <div className="stripe-payment-wrapper">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4>
              <i className="fas fa-credit-card me-2"></i>
              Secure Payment
            </h4>
            <button
              onClick={onCancel}
              className="btn btn-outline-secondary"
            >
              <i className="fas fa-arrow-left me-1"></i>
              Back
            </button>
          </div>

          <Elements stripe={loadStripe(stripeKey)}>
            <CheckoutForm
              appointmentId={appointmentId}
              user={user}
              onPaymentSuccess={onPaymentSuccess}
              onPaymentError={onPaymentError}
            />
          </Elements>

          <div className="row mt-4">
            <div className="col-md-4 text-center">
              <i className="fas fa-lock fa-2x text-success mb-2"></i>
              <h6>Secure</h6>
              <small className="text-muted">256-bit SSL encryption</small>
            </div>
            <div className="col-md-4 text-center">
              <i className="fas fa-shield-alt fa-2x text-primary mb-2"></i>
              <h6>Protected</h6>
              <small className="text-muted">PCI DSS compliant</small>
            </div>
            <div className="col-md-4 text-center">
              <i className="fas fa-credit-card fa-2x text-info mb-2"></i>
              <h6>All Cards</h6>
              <small className="text-muted">Visa, MasterCard, Amex</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripePayment;