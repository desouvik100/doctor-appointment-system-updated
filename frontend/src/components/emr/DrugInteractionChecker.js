/**
 * DrugInteractionChecker Component
 * Displays drug interaction alerts with severity colors and override options
 * Requirements: 5.2, 5.3, 5.4
 */

import { useState, useEffect } from 'react';
import axios from '../../api/config';
import './DrugInteractionChecker.css';

// Severity configuration
const SEVERITY_CONFIG = {
  contraindicated: {
    level: 1,
    label: 'Contraindicated',
    icon: '🚫',
    color: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    description: 'Do not use together'
  },
  severe: {
    level: 2,
    label: 'Severe',
    icon: '⚠️',
    color: '#ea580c',
    bgColor: '#fff7ed',
    borderColor: '#fed7aa',
    description: 'High risk - avoid if possible'
  },
  moderate: {
    level: 3,
    label: 'Moderate',
    icon: '⚡',
    color: '#ca8a04',
    bgColor: '#fefce8',
    borderColor: '#fef08a',
    description: 'Use with caution'
  },
  minor: {
    level: 4,
    label: 'Minor',
    icon: 'ℹ️',
    color: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    description: 'Monitor patient'
  }
};

const DrugInteractionChecker = ({
  drugs = [],
  currentMedications = [],
  patientAllergies = [],
  visitId,
  patientId,
  onInteractionsChecked,
  onOverride,
  onCancel,
  showAllergyAlerts = true,
  compact = false
}) => {
  const [interactions, setInteractions] = useState([]);
  const [allergyAlerts, setAllergyAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acknowledgedInteractions, setAcknowledgedInteractions] = useState(new Set());
  const [overrideInteraction, setOverrideInteraction] = useState(null);

  // Check interactions when drugs change
  useEffect(() => {
    if (drugs.length > 0 || currentMedications.length > 0) {
      checkInteractions();
    }
  }, [drugs, currentMedications, patientAllergies]);

  const checkInteractions = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/emr/interactions/check', {
        drugs,
        currentMedications,
        allergies: patientAllergies,
        patientId,
        visitId
      });
      
      if (response.data.success) {
        setInteractions(response.data.interactions || []);
        setAllergyAlerts(response.data.allergyAlerts || []);
        onInteractionsChecked?.({
          interactions: response.data.interactions || [],
          allergyAlerts: response.data.allergyAlerts || [],
          logId: response.data.logId
        });
      }
    } catch (err) {
      console.error('Error checking interactions:', err);
      setError('Failed to check drug interactions');
    } finally {
      setLoading(false);
    }
  };

  // Acknowledge an interaction
  const handleAcknowledge = (interactionId) => {
    setAcknowledgedInteractions(prev => new Set([...prev, interactionId]));
  };

  // Request override for an interaction
  const handleRequestOverride = (interaction) => {
    setOverrideInteraction(interaction);
  };

  // Check if all critical interactions are handled
  const hasUnhandledCritical = () => {
    return interactions.some(i => 
      (i.severity === 'contraindicated' || i.severity === 'severe') &&
      !acknowledgedInteractions.has(i.id)
    );
  };

  // Get severity config
  const getSeverityConfig = (severity) => {
    return SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.minor;
  };

  if (loading) {
    return (
      <div className={`drug-interaction-checker loading ${compact ? 'compact' : ''}`}>
        <div className="loading-spinner"></div>
        <p>Checking drug interactions...</p>
      </div>
    );
  }

  const hasIssues = interactions.length > 0 || allergyAlerts.length > 0;

  return (
    <div className={`drug-interaction-checker ${compact ? 'compact' : ''}`}>
      {error && (
        <div className="checker-error" role="alert">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Header */}
      <div className={`checker-header ${hasIssues ? 'has-issues' : 'clear'}`}>
        <div className="header-icon">
          {hasIssues ? '⚠️' : '✓'}
        </div>
        <div className="header-content">
          <h3 className="header-title">
            {hasIssues 
              ? `${interactions.length + allergyAlerts.length} Alert(s) Found`
              : 'No Interactions Detected'}
          </h3>
          <p className="header-subtitle">
            {hasIssues 
              ? 'Review the following alerts before proceeding'
              : 'Safe to proceed with prescription'}
          </p>
        </div>
        <button className="refresh-btn" onClick={checkInteractions} title="Re-check">
          🔄
        </button>
      </div>

      {/* Allergy Alerts */}
      {showAllergyAlerts && allergyAlerts.length > 0 && (
        <div className="alerts-section allergy-alerts">
          <h4 className="section-title">
            <span className="section-icon">🚨</span>
            Allergy Alerts ({allergyAlerts.length})
          </h4>
          <div className="alerts-list">
            {allergyAlerts.map((alert, idx) => (
              <div 
                key={`allergy-${idx}`}
                className="alert-card allergy"
                style={{
                  '--alert-color': '#dc2626',
                  '--alert-bg': '#fef2f2',
                  '--alert-border': '#fecaca'
                }}
              >
                <div className="alert-header">
                  <span className="alert-icon">🚨</span>
                  <span className="alert-title">
                    <strong>{alert.drug}</strong> - Allergy Alert
                  </span>
                  <span className="severity-badge allergy">
                    {alert.severityName || 'Allergy'}
                  </span>
                </div>
                <div className="alert-body">
                  <p className="alert-detail">
                    <strong>Allergen:</strong> {alert.allergen}
                  </p>
                  {alert.reaction && (
                    <p className="alert-detail">
                      <strong>Known Reaction:</strong> {alert.reaction}
                    </p>
                  )}
                  <p className="alert-detail">
                    <strong>Match Type:</strong> {alert.matchReason || alert.matchType}
                  </p>
                </div>
                <div className="alert-recommendation critical">
                  <strong>⛔ {alert.action || 'Do not prescribe. Find alternative medication.'}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drug Interactions */}
      {interactions.length > 0 && (
        <div className="alerts-section drug-interactions">
          <h4 className="section-title">
            <span className="section-icon">💊</span>
            Drug Interactions ({interactions.length})
          </h4>
          <div className="alerts-list">
            {interactions.map((interaction) => {
              const config = getSeverityConfig(interaction.severity);
              const isAcknowledged = acknowledgedInteractions.has(interaction.id);
              
              return (
                <div 
                  key={interaction.id}
                  className={`alert-card interaction ${isAcknowledged ? 'acknowledged' : ''}`}
                  style={{
                    '--alert-color': config.color,
                    '--alert-bg': config.bgColor,
                    '--alert-border': config.borderColor
                  }}
                >
                  <div className="alert-header">
                    <span className="alert-icon">{config.icon}</span>
                    <span className="alert-title">
                      <strong>{interaction.drug1}</strong>
                      <span className="interaction-arrow">↔</span>
                      <strong>{interaction.drug2}</strong>
                    </span>
                    <span 
                      className="severity-badge"
                      style={{ background: config.color }}
                    >
                      {config.label}
                    </span>
                  </div>
                  
                  <div className="alert-body">
                    {interaction.mechanism && (
                      <p className="alert-detail">
                        <strong>Mechanism:</strong> {interaction.mechanism}
                      </p>
                    )}
                    {interaction.clinicalEffect && (
                      <p className="alert-detail">
                        <strong>Clinical Effect:</strong> {interaction.clinicalEffect}
                      </p>
                    )}
                  </div>
                  
                  {interaction.recommendation && (
                    <div className={`alert-recommendation ${interaction.severity}`}>
                      <strong>Recommendation:</strong> {interaction.recommendation}
                    </div>
                  )}
                  
                  {/* Actions */}
                  {!isAcknowledged && (
                    <div className="alert-actions">
                      {interaction.severity !== 'contraindicated' && (
                        <button
                          className="acknowledge-btn"
                          onClick={() => handleAcknowledge(interaction.id)}
                        >
                          ✓ Acknowledge
                        </button>
                      )}
                      <button
                        className="override-btn"
                        onClick={() => handleRequestOverride(interaction)}
                      >
                        Override with Reason
                      </button>
                    </div>
                  )}
                  
                  {isAcknowledged && (
                    <div className="acknowledged-badge">
                      ✓ Acknowledged
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Issues */}
      {!hasIssues && !loading && (
        <div className="no-issues">
          <span className="no-issues-icon">✅</span>
          <p>No drug interactions or allergy conflicts detected.</p>
        </div>
      )}

      {/* Footer Actions */}
      {hasIssues && (
        <div className="checker-footer">
          {hasUnhandledCritical() && (
            <p className="footer-warning">
              ⚠️ Please acknowledge or override all severe interactions before proceeding.
            </p>
          )}
          <div className="footer-actions">
            {onCancel && (
              <button className="cancel-btn" onClick={onCancel}>
                Cancel Prescription
              </button>
            )}
            <button
              className="proceed-btn"
              disabled={hasUnhandledCritical()}
              onClick={() => onOverride?.({ 
                interactions, 
                allergyAlerts, 
                acknowledged: Array.from(acknowledgedInteractions) 
              })}
            >
              {hasUnhandledCritical() ? 'Handle Alerts First' : 'Proceed with Prescription'}
            </button>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {overrideInteraction && (
        <InteractionOverrideInline
          interaction={overrideInteraction}
          visitId={visitId}
          onOverride={(reason) => {
            handleAcknowledge(overrideInteraction.id);
            onOverride?.({ interaction: overrideInteraction, reason });
            setOverrideInteraction(null);
          }}
          onCancel={() => setOverrideInteraction(null)}
        />
      )}
    </div>
  );
};

// Inline override component
const InteractionOverrideInline = ({ interaction, visitId, onOverride, onCancel }) => {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for the override');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      await axios.post('/api/emr/interactions/override', {
        visitId,
        interactionId: interaction.id,
        reason: reason.trim(),
        drug1: interaction.drug1,
        drug2: interaction.drug2,
        severity: interaction.severity
      });
      
      onOverride(reason.trim());
    } catch (err) {
      console.error('Error logging override:', err);
      setError('Failed to log override');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="override-overlay">
      <div className="override-modal">
        <h4>Override Interaction</h4>
        <p className="override-warning">
          You are overriding a <strong>{interaction.severity}</strong> interaction between{' '}
          <strong>{interaction.drug1}</strong> and <strong>{interaction.drug2}</strong>.
        </p>
        
        {error && <p className="override-error">{error}</p>}
        
        <label>
          Clinical Justification (Required):
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter clinical reason for override..."
            rows={3}
            disabled={saving}
          />
        </label>
        
        <div className="override-actions">
          <button onClick={onCancel} disabled={saving}>Cancel</button>
          <button 
            className="confirm-override"
            onClick={handleSubmit}
            disabled={saving || !reason.trim()}
          >
            {saving ? 'Saving...' : 'Confirm Override'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrugInteractionChecker;
