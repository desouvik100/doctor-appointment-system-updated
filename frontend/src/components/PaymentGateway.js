import React, { useState, useEffect } from 'react';
import axios from '../api/config';

// Conditional import for StripePayment
let StripePayment;
try {
  StripePayment = require('./StripePayment').default;
} catch (error) {
  console.warn('StripePayment component not available:', error.message);
  StripePayment = ({ onCancel }) => (
    <div className="alert alert-warning">
      <h4>Payment Service Unavailable</h4>
      <p>Payment processing is temporarily unavailable. Please try again later.</p>
      <button className="btn btn-secondary" onClick={onCancel}>
        Go Back
      </button>
    </div>
  );
}

const PaymentGateway = ({ appointmentId, user, onPaymentSuccess, onPaymentCancel }) => {
  const [showStripePayment, setShowStripePayment] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPaymentDetails();
  }, [appointmentId]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await axios.get(`/api/payments/calculate/${appointmentId}`);
      setPaymentDetails(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch payment details');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    onPaymentSuccess({
      paymentIntentId: paymentData.paymentIntentId,
      amount: paymentData.amount,
      currency: paymentData.currency
    });
  };

  const handlePaymentError = (error) => {
    setError(error.message || 'Payment failed');
    setShowStripePayment(false);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (showStripePayment) {
    return (
      <StripePayment
        appointmentId={appointmentId}
        user={user}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        onCancel={() => setShowStripePayment(false)}
      />
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <i className="fas fa-credit-card me-2"></i>
                Secure Payment
              </h4>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              {/* Doctor and Appointment Details */}
              <div className="mb-4">
                <h5 className="text-primary">Appointment Details</h5>
                <div className="bg-light p-3 rounded">
                  <p className="mb-1"><strong>Doctor:</strong> {paymentDetails.doctorName}</p>
                  <p className="mb-0"><strong>Appointment ID:</strong> {appointmentId}</p>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="mb-4">
                <h5 className="text-primary">Payment Breakdown</h5>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <tbody>
                      <tr>
                        <td>Consultation Fee</td>
                        <td className="text-end">₹{paymentDetails.consultationFee}</td>
                      </tr>
                      <tr>
                        <td>GST (22%)</td>
                        <td className="text-end">₹{paymentDetails.gst}</td>
                      </tr>
                      <tr>
                        <td>Platform Fee (7%)</td>
                        <td className="text-end">₹{paymentDetails.platformFee}</td>
                      </tr>
                      <tr className="table-primary">
                        <td><strong>Total Amount</strong></td>
                        <td className="text-end"><strong>₹{paymentDetails.total}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Method Info */}
              <div className="mb-4">
                <h5 className="text-primary">Payment Method</h5>
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  We use Stripe for secure payment processing. All major credit cards, debit cards, and digital wallets are supported.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onPaymentCancel}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-lg"
                  onClick={() => setShowStripePayment(true)}
                >
                  <i className="fas fa-lock me-2"></i>
                  Pay ₹{paymentDetails.total} Securely
                </button>
              </div>

              {/* Security Features */}
              <div className="row mt-4">
                <div className="col-md-4 text-center">
                  <i className="fas fa-lock fa-2x text-success mb-2"></i>
                  <h6>SSL Encrypted</h6>
                  <small className="text-muted">256-bit encryption</small>
                </div>
                <div className="col-md-4 text-center">
                  <i className="fas fa-shield-alt fa-2x text-primary mb-2"></i>
                  <h6>PCI Compliant</h6>
                  <small className="text-muted">Industry standard security</small>
                </div>
                <div className="col-md-4 text-center">
                  <i className="fab fa-stripe fa-2x text-info mb-2"></i>
                  <h6>Powered by Stripe</h6>
                  <small className="text-muted">Trusted by millions</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;