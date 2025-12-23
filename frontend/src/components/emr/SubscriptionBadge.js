/**
 * Subscription Badge Component
 * Shows current EMR subscription status
 */

import React from 'react';
import './SubscriptionBadge.css';

const SubscriptionBadge = ({ 
  subscription, 
  compact = false,
  onClick 
}) => {
  if (!subscription) {
    return (
      <div 
        className={`subscription-badge no-subscription ${compact ? 'compact' : ''}`}
        onClick={onClick}
      >
        <span className="badge-icon">⚠️</span>
        {!compact && <span className="badge-text">No EMR Subscription</span>}
      </div>
    );
  }

  const getDaysRemaining = () => {
    if (!subscription.expiryDate) return 0;
    const expiry = new Date(subscription.expiryDate);
    const now = new Date();
    const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const daysRemaining = getDaysRemaining();
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining <= 0;

  const planIcons = {
    basic: '✨',
    standard: '🌟',
    advanced: '⭐'
  };

  const planColors = {
    basic: 'basic',
    standard: 'standard',
    advanced: 'advanced'
  };

  const statusClass = isExpired ? 'expired' : isExpiringSoon ? 'warning' : 'active';

  return (
    <div 
      className={`subscription-badge ${planColors[subscription.plan]} ${statusClass} ${compact ? 'compact' : ''}`}
      onClick={onClick}
      title={`${subscription.plan?.charAt(0).toUpperCase() + subscription.plan?.slice(1)} Plan - ${daysRemaining} days remaining`}
    >
      <span className="badge-icon">{planIcons[subscription.plan] || '📋'}</span>
      
      {!compact && (
        <>
          <span className="badge-plan">
            EMR: {subscription.plan?.charAt(0).toUpperCase() + subscription.plan?.slice(1)}
          </span>
          <span className="badge-divider">•</span>
          <span className={`badge-status ${statusClass}`}>
            {isExpired ? (
              'Expired'
            ) : isExpiringSoon ? (
              `${daysRemaining}d left!`
            ) : (
              `${daysRemaining} days`
            )}
          </span>
        </>
      )}

      {compact && isExpiringSoon && (
        <span className="badge-alert">!</span>
      )}
    </div>
  );
};

export default SubscriptionBadge;
