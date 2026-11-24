/**
 * LockedFeature Component
 * Wrapper component that gates features based on subscription tier
 * Shows upgrade prompt for locked features
 * Requirements: Task 16.2
 */

import React from 'react';
import { 
  isFeatureAvailable, 
  EMR_FEATURES, 
  PLAN_NAMES, 
  PLAN_PRICING,
  getRequiredPlanForFeature 
} from './featureFlags';
import './LockedFeature.css';

const LockedFeature = ({
  featureId,
  currentPlan,
  children,
  onUpgrade,
  fallback = null,
  showInline = false,
  compact = false
}) => {
  // Check if feature is available
  const isAvailable = isFeatureAvailable(featureId, currentPlan);
  
  // If available, render children
  if (isAvailable) {
    return <>{children}</>;
  }

  // Get feature and required plan info
  const feature = EMR_FEATURES[featureId];
  const requiredPlanInfo = getRequiredPlanForFeature(featureId);

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Render locked state
  if (showInline) {
    return (
      <LockedFeatureInline
        feature={feature}
        requiredPlanInfo={requiredPlanInfo}
        currentPlan={currentPlan}
        onUpgrade={onUpgrade}
        compact={compact}
      />
    );
  }

  return (
    <LockedFeatureCard
      feature={feature}
      requiredPlanInfo={requiredPlanInfo}
      currentPlan={currentPlan}
      onUpgrade={onUpgrade}
    />
  );
};

// Inline locked indicator (for buttons, menu items)
const LockedFeatureInline = ({ 
  feature, 
  requiredPlanInfo, 
  currentPlan, 
  onUpgrade,
  compact 
}) => {
  if (compact) {
    return (
      <span 
        className="locked-feature-badge"
        title={`Requires ${requiredPlanInfo?.name || 'upgrade'}`}
        onClick={(e) => {
          e.stopPropagation();
          onUpgrade?.(requiredPlanInfo?.plan);
        }}
      >
        🔒
      </span>
    );
  }

  return (
    <div className="locked-feature-inline">
      <div className="locked-inline-content">
        <span className="locked-icon">🔒</span>
        <span className="locked-text">
          {feature?.name || 'Feature'} requires{' '}
          <strong>{requiredPlanInfo?.name || 'upgrade'}</strong>
        </span>
      </div>
      {onUpgrade && (
        <button 
          className="locked-inline-upgrade"
          onClick={() => onUpgrade(requiredPlanInfo?.plan)}
        >
          Upgrade
        </button>
      )}
    </div>
  );
};

// Card-style locked feature display
const LockedFeatureCard = ({ 
  feature, 
  requiredPlanInfo, 
  currentPlan, 
  onUpgrade 
}) => {
  return (
    <div className="locked-feature-card">
      <div className="locked-card-icon">
        <span className="feature-icon">{feature?.icon || '🔒'}</span>
        <span className="lock-overlay">🔒</span>
      </div>
      
      <div className="locked-card-content">
        <h4 className="locked-card-title">{feature?.name || 'Feature Locked'}</h4>
        <p className="locked-card-description">
          {feature?.description || 'This feature requires a higher subscription tier.'}
        </p>
        
        <div className="locked-card-plan">
          <span className="plan-label">Required Plan:</span>
          <span className="plan-name">{requiredPlanInfo?.name}</span>
          {requiredPlanInfo?.pricing && (
            <span className="plan-price">
              {requiredPlanInfo.pricing.price}/{requiredPlanInfo.pricing.period}
            </span>
          )}
        </div>

        {currentPlan && (
          <p className="current-plan-note">
            Your plan: <strong>{PLAN_NAMES[currentPlan] || currentPlan}</strong>
          </p>
        )}
      </div>

      {onUpgrade && (
        <button 
          className="locked-card-upgrade"
          onClick={() => onUpgrade(requiredPlanInfo?.plan)}
        >
          <span className="upgrade-icon">⬆️</span>
          Upgrade to {requiredPlanInfo?.plan?.charAt(0).toUpperCase() + requiredPlanInfo?.plan?.slice(1)}
        </button>
      )}
    </div>
  );
};

// Hook for checking feature availability
export const useFeatureAccess = (featureId, currentPlan) => {
  const isAvailable = isFeatureAvailable(featureId, currentPlan);
  const feature = EMR_FEATURES[featureId];
  const requiredPlanInfo = getRequiredPlanForFeature(featureId);

  return {
    isAvailable,
    feature,
    requiredPlan: requiredPlanInfo?.plan,
    requiredPlanName: requiredPlanInfo?.name
  };
};

// Higher-order component for feature gating
export const withFeatureAccess = (WrappedComponent, featureId) => {
  return function FeatureGatedComponent(props) {
    const { currentPlan, onUpgrade, ...rest } = props;
    
    return (
      <LockedFeature
        featureId={featureId}
        currentPlan={currentPlan}
        onUpgrade={onUpgrade}
      >
        <WrappedComponent {...rest} />
      </LockedFeature>
    );
  };
};

export default LockedFeature;
