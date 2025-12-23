/**
 * Locked Screen Component
 * Displays when user tries to access a feature not in their subscription
 */

import React from 'react';
import './LockedScreen.css';

const LockedScreen = ({ 
  screenName, 
  requiredPlan, 
  currentPlan,
  onUpgrade,
  onBack 
}) => {
  const planFeatures = {
    basic: {
      name: 'Basic Clinic EMR',
      price: '₹4,999',
      period: '6 months',
      features: [
        'Patient Registration',
        'Visit History',
        'Systematic History',
        'Basic Prescription',
        'Report Viewing'
      ]
    },
    standard: {
      name: 'Standard Clinic EMR',
      price: '₹9,999',
      period: '6 months',
      features: [
        'All Basic features',
        'Doctor Notes & Diagnosis',
        'Follow-up Scheduling',
        'Medication History',
        'Patient Timeline'
      ]
    },
    advanced: {
      name: 'Advanced Clinic EMR',
      price: '₹19,999',
      period: '6 months',
      features: [
        'All Standard features',
        'EMR Dashboard',
        'Analytics & Reports',
        'Audit Logs',
        'Staff Management',
        'PDF Export'
      ]
    }
  };

  const requiredPlanInfo = planFeatures[requiredPlan] || planFeatures.standard;

  return (
    <div className="locked-screen">
      <div className="locked-screen__content">
        {/* Lock Icon */}
        <div className="locked-screen__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        {/* Title */}
        <h2 className="locked-screen__title">Feature Locked</h2>
        
        {/* Description */}
        <p className="locked-screen__description">
          <strong>{screenName}</strong> requires the{' '}
          <span className="plan-highlight">{requiredPlanInfo.name}</span>
        </p>

        {/* Current Plan Info */}
        {currentPlan && (
          <div className="locked-screen__current">
            <span>Your current plan:</span>
            <span className="current-plan">{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</span>
          </div>
        )}

        {/* Upgrade Card */}
        <div className="locked-screen__upgrade-card">
          <div className="upgrade-card__header">
            <h3>{requiredPlanInfo.name}</h3>
            <div className="upgrade-card__price">
              <span className="price">{requiredPlanInfo.price}</span>
              <span className="period">/ {requiredPlanInfo.period}</span>
            </div>
          </div>

          <ul className="upgrade-card__features">
            {requiredPlanInfo.features.map((feature, index) => (
              <li key={index}>
                <span className="check-icon">✓</span>
                {feature}
              </li>
            ))}
          </ul>

          <button 
            className="upgrade-card__button"
            onClick={() => onUpgrade(requiredPlan)}
          >
            Upgrade to {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
          </button>
        </div>

        {/* Compare Plans Link */}
        <button 
          className="locked-screen__compare"
          onClick={() => onUpgrade('compare')}
        >
          Compare All Plans →
        </button>

        {/* Back Button */}
        {onBack && (
          <button 
            className="locked-screen__back"
            onClick={onBack}
          >
            ← Go Back
          </button>
        )}
      </div>
    </div>
  );
};

export default LockedScreen;
