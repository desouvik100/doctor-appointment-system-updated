/**
 * Subscription Status Screen
 * Current plan details, renewal options, invoice history
 * Requirements: 1.5, 9.3
 */

import React, { useState, useEffect } from 'react';
import axios from '../../api/config';
import './SubscriptionStatus.css';

const SubscriptionStatus = ({ clinicId, onUpgrade, onRenew }) => {
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRenew, setAutoRenew] = useState(false);
  const [updatingAutoRenew, setUpdatingAutoRenew] = useState(false);

  useEffect(() => {
    if (clinicId) {
      fetchSubscription();
      fetchHistory();
    }
  }, [clinicId]);

  const fetchSubscription = async () => {
    try {
      const response = await axios.get(`/api/emr/subscription/${clinicId}`);
      if (response.data.success) {
        setSubscription(response.data.subscription);
        setAutoRenew(response.data.subscription?.autoRenew || false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`/api/emr/subscription/${clinicId}/history`);
      if (response.data.success) {
        setHistory(response.data.history || []);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleToggleAutoRenew = async () => {
    setUpdatingAutoRenew(true);
    try {
      const response = await axios.post('/api/emr/auto-renew', {
        clinicId,
        enabled: !autoRenew
      });
      if (response.data.success) {
        setAutoRenew(!autoRenew);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update auto-renewal');
    } finally {
      setUpdatingAutoRenew(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDaysRemaining = () => {
    if (!subscription?.expiryDate) return 0;
    const expiry = new Date(subscription.expiryDate);
    const now = new Date();
    const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getStatusInfo = () => {
    const daysRemaining = getDaysRemaining();
    
    if (subscription?.status === 'expired' || daysRemaining <= 0) {
      return { status: 'expired', label: 'Expired', class: 'expired', icon: '⚠️' };
    }
    if (daysRemaining <= 7) {
      return { status: 'expiring', label: 'Expiring Soon', class: 'warning', icon: '⏰' };
    }
    if (daysRemaining <= 30) {
      return { status: 'active', label: 'Active', class: 'warning-light', icon: '✓' };
    }
    return { status: 'active', label: 'Active', class: 'active', icon: '✓' };
  };

  const getPlanIcon = (planId) => {
    const icons = { basic: '✨', standard: '🌟', advanced: '⭐' };
    return icons[planId] || '📋';
  };

  const getPlanColor = (planId) => {
    const colors = { basic: '#10b981', standard: '#3b82f6', advanced: '#8b5cf6' };
    return colors[planId] || '#64748b';
  };

  if (loading) {
    return (
      <div className="subscription-status">
        <div className="status-loading">
          <div className="spinner"></div>
          <p>Loading subscription...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="subscription-status">
        <div className="no-subscription">
          <span className="no-sub-icon">📋</span>
          <h2>No Active Subscription</h2>
          <p>Subscribe to EMR to start managing your clinic digitally</p>
          <button className="btn-subscribe" onClick={onUpgrade}>
            View Plans
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();
  const daysRemaining = getDaysRemaining();

  return (
    <div className="subscription-status">
      {/* Header */}
      <div className="status-header">
        <h1>
          <span className="header-icon">💳</span>
          Subscription Status
        </h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Current Plan Card */}
      <div 
        className="current-plan-card"
        style={{ '--plan-color': getPlanColor(subscription.plan) }}
      >
        <div className="plan-badge">
          <span className={`status-badge ${statusInfo.class}`}>
            {statusInfo.icon} {statusInfo.label}
          </span>
        </div>

        <div className="plan-main">
          <div className="plan-icon-large">{getPlanIcon(subscription.plan)}</div>
          <div className="plan-details">
            <h2>{subscription.plan?.charAt(0).toUpperCase() + subscription.plan?.slice(1)} Clinic EMR</h2>
            <p className="plan-duration">
              {subscription.duration === '6_months' ? '6 Month' : '1 Year'} Subscription
            </p>
          </div>
        </div>

        <div className="plan-dates">
          <div className="date-item">
            <span className="date-label">Started</span>
            <span className="date-value">{formatDate(subscription.startDate)}</span>
          </div>
          <div className="date-item">
            <span className="date-label">Expires</span>
            <span className="date-value">{formatDate(subscription.expiryDate)}</span>
          </div>
        </div>

        <div className={`days-remaining ${statusInfo.class}`}>
          <span className="days-number">{daysRemaining}</span>
          <span className="days-label">days remaining</span>
        </div>

        {/* Progress Bar */}
        <div className="validity-progress">
          <div 
            className="progress-fill"
            style={{ 
              width: `${Math.min(100, Math.max(0, (daysRemaining / (subscription.duration === '6_months' ? 180 : 365)) * 100))}%` 
            }}
          ></div>
        </div>

        {/* Actions */}
        <div className="plan-actions">
          {statusInfo.status === 'expired' ? (
            <button className="btn-renew primary" onClick={onRenew}>
              🔄 Renew Now
            </button>
          ) : (
            <>
              <button className="btn-upgrade" onClick={onUpgrade}>
                ⬆️ Upgrade Plan
              </button>
              {daysRemaining <= 30 && (
                <button className="btn-renew" onClick={onRenew}>
                  🔄 Renew Early
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Auto-Renewal Toggle */}
      <div className="auto-renew-section">
        <div className="auto-renew-info">
          <h3>Auto-Renewal</h3>
          <p>Automatically renew your subscription before it expires</p>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={autoRenew}
            onChange={handleToggleAutoRenew}
            disabled={updatingAutoRenew}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {/* Payment Details */}
      {subscription.paymentDetails && (
        <div className="payment-details">
          <h3>Last Payment</h3>
          <div className="payment-info">
            <div className="payment-row">
              <span>Amount Paid</span>
              <span className="payment-amount">
                {formatCurrency(subscription.paymentDetails.amount)}
              </span>
            </div>
            <div className="payment-row">
              <span>Payment ID</span>
              <span className="payment-id">{subscription.paymentDetails.razorpayPaymentId}</span>
            </div>
            <div className="payment-row">
              <span>Date</span>
              <span>{formatDate(subscription.startDate)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Subscription History */}
      {history.length > 0 && (
        <div className="subscription-history">
          <h3>Subscription History</h3>
          <div className="history-list">
            {history.map((item, idx) => (
              <div key={item._id || idx} className="history-item">
                <div className="history-icon">{getPlanIcon(item.plan)}</div>
                <div className="history-info">
                  <span className="history-plan">
                    {item.plan?.charAt(0).toUpperCase() + item.plan?.slice(1)} Plan
                  </span>
                  <span className="history-dates">
                    {formatDate(item.startDate)} - {formatDate(item.expiryDate)}
                  </span>
                </div>
                <div className="history-amount">
                  {formatCurrency(item.paymentDetails?.amount || 0)}
                </div>
                <span className={`history-status ${item.status}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="help-section">
        <h3>Need Help?</h3>
        <p>Contact our support team for any subscription-related queries</p>
        <div className="help-contacts">
          <a href="mailto:support@healthsync.com" className="help-link">
            📧 support@healthsync.com
          </a>
          <a href="tel:+911234567890" className="help-link">
            📞 +91 12345 67890
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="status-footer">
        <p className="powered-by">EMR powered by HealthSync</p>
      </div>
    </div>
  );
};

export default SubscriptionStatus;
