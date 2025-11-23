import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/config';

const PaymentHistory = ({ user }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPaymentHistory = useCallback(async () => {
    try {
      const response = await axios.get(`/api/payments/history/${user.id}`);
      setPayments(response.data.payments);
      setLoading(false);
    } catch (error) {
      console.error('Payment history error:', error);
      setError('Failed to fetch payment history');
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  

  const getPaymentStatusBadge = (status) => {
    const statusClasses = {
      pending: "bg-warning text-dark",
      processing: "bg-info",
      completed: "bg-success",
      failed: "bg-danger",
      refunded: "bg-secondary"
    };

    return (
      <span className={`badge ${statusClasses[status] || "bg-secondary"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading payment history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="fas fa-exclamation-triangle me-2"></i>
        {error}
      </div>
    );
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-success text-white">
        <h5 className="mb-0">
          <i className="fas fa-credit-card me-2"></i>
          Payment History
        </h5>
      </div>
      <div className="card-body">
        {payments.length === 0 ? (
          <div className="text-center py-4">
            <i className="fas fa-receipt fa-3x text-muted mb-3"></i>
            <p className="text-muted">No payment history found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Payment ID</th>
                  <th>Doctor</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, index) => (
                  <tr key={payment.id || index}>
                    <td>
                      <small className="font-monospace">
                        {payment.id ? payment.id.slice(-8) : 'N/A'}
                      </small>
                    </td>
                    <td>
                      <div>
                        <strong>{payment.doctor}</strong>
                        <br />
                        <small className="text-muted">{payment.specialization}</small>
                        {payment.clinic && (
                          <div>
                            <small className="text-muted">
                              <i className="fas fa-hospital me-1"></i>
                              {payment.clinic}
                            </small>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>₹{payment.amount}</strong>
                        <br />
                        <small className="text-muted text-uppercase">
                          {payment.currency}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span className="text-capitalize">
                        <i className="fas fa-credit-card me-1"></i>
                        {payment.paymentMethod || 'Card'}
                      </span>
                    </td>
                    <td>
                      {getPaymentStatusBadge(payment.status)}
                      {payment.refundDetails && (
                        <div className="mt-1">
                          <small className="text-danger">
                            <i className="fas fa-undo me-1"></i>
                            Refunded: ₹{payment.refundDetails.amount}
                          </small>
                        </div>
                      )}
                    </td>
                    <td>
                      <div>
                        <small>
                          <i className="fas fa-calendar me-1"></i>
                          {formatDate(payment.date)}
                        </small>
                      </div>
                      <div>
                        <small>
                          <i className="fas fa-clock me-1"></i>
                          {payment.time}
                        </small>
                      </div>
                      {payment.paidAt && (
                        <div>
                          <small className="text-success">
                            <i className="fas fa-check me-1"></i>
                            Paid: {formatDate(payment.paidAt)}
                          </small>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;