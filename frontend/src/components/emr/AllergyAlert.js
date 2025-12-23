/**
 * AllergyAlert Component
 * Displays prominent allergy warnings with matching allergen and reaction
 * Requirements: 5.7
 */

import './AllergyAlert.css';

// Severity configuration
const SEVERITY_CONFIG = {
  severe: {
    level: 1,
    label: 'Severe/Anaphylaxis',
    icon: '🚨',
    color: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fecaca'
  },
  moderate: {
    level: 2,
    label: 'Moderate',
    icon: '⚠️',
    color: '#ea580c',
    bgColor: '#fff7ed',
    borderColor: '#fed7aa'
  },
  mild: {
    level: 3,
    label: 'Mild',
    icon: '⚡',
    color: '#ca8a04',
    bgColor: '#fefce8',
    borderColor: '#fde68a'
  },
  unknown: {
    level: 4,
    label: 'Unknown',
    icon: '❓',
    color: '#6b7280',
    bgColor: '#f9fafb',
    borderColor: '#e5e7eb'
  }
};

const AllergyAlert = ({
  drug,
  allergen,
  severity = 'unknown',
  reaction,
  matchType,
  matchReason,
  action,
  onDismiss,
  onOverride,
  showActions = true,
  compact = false,
  animate = true
}) => {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.unknown;

  return (
    <div 
      className={`allergy-alert ${compact ? 'compact' : ''} ${animate ? 'animate' : ''}`}
      style={{
        '--alert-color': config.color,
        '--alert-bg': config.bgColor,
        '--alert-border': config.borderColor
      }}
      role="alert"
      aria-live="assertive"
    >
      {/* Alert Icon */}
      <div className="alert-icon-container">
        <span className="alert-icon">{config.icon}</span>
      </div>

      {/* Alert Content */}
      <div className="alert-content">
        <div className="alert-header">
          <h4 className="alert-title">
            Allergy Alert: {drug}
          </h4>
          <span 
            className="severity-tag"
            style={{ background: config.color }}
          >
            {config.label}
          </span>
        </div>

        <div className="alert-details">
          <p className="detail-item">
            <span className="detail-label">Known Allergen:</span>
            <span className="detail-value allergen">{allergen}</span>
          </p>
          
          {reaction && (
            <p className="detail-item">
              <span className="detail-label">Reaction:</span>
              <span className="detail-value reaction">{reaction}</span>
            </p>
          )}
          
          {(matchType || matchReason) && (
            <p className="detail-item">
              <span className="detail-label">Match:</span>
              <span className="detail-value">{matchReason || matchType}</span>
            </p>
          )}
        </div>

        {/* Recommendation */}
        <div className="alert-recommendation">
          <strong>⛔ {action || 'Do not prescribe. Find alternative medication.'}</strong>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="alert-actions">
          {onOverride && (
            <button 
              className="override-btn"
              onClick={onOverride}
              title="Override with clinical justification"
            >
              Override
            </button>
          )}
          {onDismiss && (
            <button 
              className="dismiss-btn"
              onClick={onDismiss}
              aria-label="Dismiss alert"
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * AllergyAlertBanner - Compact banner version for headers
 */
export const AllergyAlertBanner = ({ 
  allergies = [], 
  onViewAll,
  maxDisplay = 3 
}) => {
  if (allergies.length === 0) return null;

  const displayAllergies = allergies.slice(0, maxDisplay);
  const remaining = allergies.length - maxDisplay;

  return (
    <div className="allergy-alert-banner" role="alert">
      <span className="banner-icon">🚨</span>
      <span className="banner-text">
        <strong>Allergies:</strong>{' '}
        {displayAllergies.map((a, i) => (
          <span key={i} className="allergy-item">
            {a.allergen || a}
            {a.severity === 'severe' && <span className="severe-marker">!</span>}
            {i < displayAllergies.length - 1 && ', '}
          </span>
        ))}
        {remaining > 0 && (
          <span className="more-count">+{remaining} more</span>
        )}
      </span>
      {onViewAll && (
        <button className="view-all-btn" onClick={onViewAll}>
          View All
        </button>
      )}
    </div>
  );
};

/**
 * AllergyAlertList - List of multiple allergy alerts
 */
export const AllergyAlertList = ({ 
  alerts = [],
  onOverride,
  compact = false 
}) => {
  if (alerts.length === 0) return null;

  return (
    <div className="allergy-alert-list">
      <h4 className="list-title">
        <span className="list-icon">🚨</span>
        Allergy Alerts ({alerts.length})
      </h4>
      <div className="list-items">
        {alerts.map((alert, idx) => (
          <AllergyAlert
            key={idx}
            drug={alert.drug}
            allergen={alert.allergen}
            severity={alert.severity}
            reaction={alert.reaction}
            matchType={alert.matchType}
            matchReason={alert.matchReason}
            action={alert.action}
            onOverride={onOverride ? () => onOverride(alert) : undefined}
            compact={compact}
            animate={false}
          />
        ))}
      </div>
    </div>
  );
};

export default AllergyAlert;
