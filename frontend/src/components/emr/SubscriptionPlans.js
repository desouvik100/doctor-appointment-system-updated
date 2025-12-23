/**
 * Subscription Plans Screen
 * Plan comparison table and pricing display
 * Requirements: 1.1, 1.2
 */

import React, { useState, useEffect } from 'react';
import axios from '../../api/config';
import './SubscriptionPlans.css';

const SubscriptionPlans = ({ clinicId, currentPlan, onSelectPlan, onClose }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('1_year');
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get('/api/emr/plans');
      if (response.data.success) {
        setPlans(response.data.plans || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    if (onSelectPlan) {
      onSelectPlan(plan, selectedDuration);
    }
  };

  const getPlanIcon = (planId) => {
    const icons = {
      basic: '✨',
      standard: '🌟',
      advanced: '⭐'
    };
    return icons[planId] || '📋';
  };

  if (loading) {
    return (
      <div className="subscription-plans">
        <div className="plans-loading">
          <div className="spinner"></div>
          <p>Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-plans">
      {/* Header */}
      <div className="plans-header">
        <div className="header-content">
          <h1>Choose Your EMR Plan</h1>
          <p>Select the plan that best fits your clinic's needs</p>
        </div>
        {onClose && (
          <button className="btn-close" onClick={onClose}>×</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Duration Toggle */}
      <div className="duration-toggle">
        <button
          className={`duration-btn ${selectedDuration === '6_months' ? 'active' : ''}`}
          onClick={() => setSelectedDuration('6_months')}
        >
          6 Months
        </button>
        <button
          className={`duration-btn ${selectedDuration === '1_year' ? 'active' : ''}`}
          onClick={() => setSelectedDuration('1_year')}
        >
          1 Year
          <span className="save-badge">Save up to 20%</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="plans-grid">
        {plans.map((plan) => {
          const pricing = plan.pricing?.[selectedDuration] || {};
          const isCurrentPlan = currentPlan === plan.id;
          const isRecommended = plan.recommended;

          return (
            <div
              key={plan.id}
              className={`plan-card ${isRecommended ? 'recommended' : ''} ${isCurrentPlan ? 'current' : ''} ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
              style={{ '--plan-color': plan.color }}
            >
              {isRecommended && (
                <div className="recommended-badge">Most Popular</div>
              )}
              {isCurrentPlan && (
                <div className="current-badge">Current Plan</div>
              )}

              <div className="plan-header">
                <span className="plan-icon">{getPlanIcon(plan.id)}</span>
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-tagline">{plan.tagline}</p>
              </div>

              <div className="plan-pricing">
                <div className="price-main">
                  <span className="price-amount">{formatCurrency(pricing.amount)}</span>
                  <span className="price-period">/{selectedDuration === '6_months' ? '6 mo' : 'year'}</span>
                </div>
                <div className="price-monthly">
                  {formatCurrency(pricing.perMonth)}/month
                </div>
                {pricing.savings > 0 && (
                  <div className="price-savings">
                    Save {formatCurrency(pricing.savings)}
                  </div>
                )}
              </div>

              <div className="plan-features">
                <h4>Features included:</h4>
                <ul>
                  {plan.features?.map((feature, idx) => (
                    <li key={idx}>
                      <span className="feature-check">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="plan-limits">
                <div className="limit-item">
                  <span className="limit-icon">👨‍⚕️</span>
                  <span className="limit-value">
                    {plan.limits?.maxDoctors === -1 ? 'Unlimited' : plan.limits?.maxDoctors} Doctors
                  </span>
                </div>
                <div className="limit-item">
                  <span className="limit-icon">👥</span>
                  <span className="limit-value">
                    {plan.limits?.maxStaff === -1 ? 'Unlimited' : plan.limits?.maxStaff} Staff
                  </span>
                </div>
              </div>

              <button
                className={`btn-select ${isCurrentPlan ? 'current' : ''}`}
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrentPlan}
              >
                {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison */}
      <div className="feature-comparison">
        <h2>Feature Comparison</h2>
        <div className="comparison-table">
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                {plans.map((plan) => (
                  <th key={plan.id} style={{ color: plan.color }}>
                    {plan.name?.replace('Clinic EMR', '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Patient Registration</td>
                <td>✓</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Visit History</td>
                <td>✓</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Systematic History</td>
                <td>✓</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Basic Prescription</td>
                <td>✓</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Report Viewing</td>
                <td>✓</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Doctor Notes & Diagnosis</td>
                <td>—</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Follow-up Scheduling</td>
                <td>—</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Medication History</td>
                <td>—</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Patient Timeline</td>
                <td>—</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>EMR Dashboard</td>
                <td>—</td>
                <td>—</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Analytics & Reports</td>
                <td>—</td>
                <td>—</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Audit Logs</td>
                <td>—</td>
                <td>—</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Staff Management</td>
                <td>—</td>
                <td>—</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>PDF Export</td>
                <td>—</td>
                <td>—</td>
                <td>✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="plans-footer">
        <p>All plans include 24/7 support and automatic updates</p>
        <p className="powered-by">EMR powered by HealthSync</p>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
