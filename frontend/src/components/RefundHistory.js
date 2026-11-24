// frontend/src/components/RefundHistory.js
// Displays user's refund history

import React, { useState, useEffect } from 'react';
import axios from '../api/config';
import './RefundHistory.css';

const RefundHistory = ({ userId }) => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchRefundHistory();
    }
  }, [userId]);

  const fetchRefundHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/refunds/history/${userId}`);
      if (response.data.success) {
        setRefunds(response.data.refunds);
      }
    } catch (err) {
      console.error('Error fetching refund history:', err);
      setError('Unable to load refund history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time || !time.includes(':')) return time;
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'processed':
      case 'completed':
        return { class: 'success', icon: 'check-circle', text: 'Processed' };
      case 'pending':
        return { class: 'warning', icon: 'clock', text: 'Pending' };
      case 'failed':
        return { class: 'error', icon: 'times-circle', text: 'Failed' };
      default:
        return { class: 'default', icon: 'question-circle', text: status || 'Unknown' };
    }
  };

  const getPolicyBadge = (policy) => {
    switch (policy) {
      case 'full_refund':
        return { class: 'full', text: '100%' };
      case 'partial_refund':
        return { class: 'partial', text: '50%' };
      case 'doctor_cancelled':
        return { class: 'doctor', text: 'Doctor Cancelled' };
      case 'no_refund':
      case 'no_show':
        return { class: 'none', text: 'No Refund' };
      default:
        return { class: 'default', text: policy || '-' };
    }
  };

  if (loading) {
    return (
      <div className="refund-history">
        <div className="refund-history__loading">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Loading refund history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="refund-history">
        <div className="refund-history__error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={fetchRefundHistory}>
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="refund-history">
      <div className="refund-history__header">
        <h3>
          <i className="fas fa-history"></i>
          Refund History
        </h3>
        <span className="refund-history__count">{refunds.length} refunds</span>
      </div>

      {refunds.length === 0 ? (
        <div className="refund-history__empty">
          <div className="refund-history__empty-icon">
            <i className="fas fa-receipt"></i>
          </div>
          <h4>No Refunds Yet</h4>
          <p>Your refund history will appear here when you cancel paid appointments.</p>
        </div>
      ) : (
        <div className="refund-history__list">
          {refunds.map((refund, index) => {
            const statusBadge = getStatusBadge(refund.refundStatus);
            const policyBadge = getPolicyBadge(refund.policyApplied);
            
            return (
              <div key={refund.appointmentId || index} className="refund-history__item">
                <div className="refund-history__item-header">
                  <div className="refund-history__doctor">
                    <i className="fas fa-user-md"></i>
                    <span>{refund.doctor || 'Doctor'}</span>
                  </div>
                  <span className={`refund-history__status refund-history__status--${statusBadge.class}`}>
                    <i className={`fas fa-${statusBadge.icon}`}></i>
                    {statusBadge.text}
                  </span>
                </div>

                <div className="refund-history__details">
                  <div className="refund-history__detail">
                    <span className="label">Appointment</span>
                    <span className="value">{formatDate(refund.date)} at {formatTime(refund.time)}</span>
                  </div>
                  <div className="refund-history__detail">
                    <span className="label">Cancelled</span>
                    <span className="value">{formatDate(refund.cancelledAt)}</span>
                  </div>
                  <div className="refund-history__detail">
                    <span className="label">Cancelled By</span>
                    <span className="value capitalize">{refund.cancelledBy || '-'}</span>
                  </div>
                </div>

                <div className="refund-history__amounts">
                  <div className="refund-history__amount-row">
                    <span>Original Amount</span>
                    <span>₹{refund.originalAmount || 0}</span>
                  </div>
                  <div className="refund-history__amount-row refund-history__amount-row--highlight">
                    <span>Refund Amount</span>
                    <span className={refund.refundAmount > 0 ? 'text-green' : 'text-red'}>
                      ₹{refund.refundAmount || 0}
                    </span>
                  </div>
                  {refund.walletCredit > 0 && (
                    <div className="refund-history__amount-row refund-history__amount-row--bonus">
                      <span>
                        <i className="fas fa-wallet"></i>
                        Wallet Credit
                      </span>
                      <span className="text-purple">+₹{refund.walletCredit}</span>
                    </div>
                  )}
                </div>

                <div className="refund-history__footer">
                  <span className={`refund-history__policy refund-history__policy--${policyBadge.class}`}>
                    {policyBadge.text}
                  </span>
                  {refund.reason && (
                    <span className="refund-history__reason" title={refund.reason}>
                      <i className="fas fa-comment-alt"></i>
                      {refund.reason.length > 40 ? refund.reason.substring(0, 40) + '...' : refund.reason}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RefundHistory;
