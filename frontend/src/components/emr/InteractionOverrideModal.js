/**
 * InteractionOverrideModal Component
 * Modal for overriding drug interactions with required clinical justification
 * Requirements: 5.5
 */

import { useState } from 'react';
import axios from '../../api/config';
import './InteractionOverrideModal.css';

// Severity configuration for display
const SEVERITY_CONFIG = {
  contraindicated: {
    label: 'Contraindicated',
    icon: '🚫',
    color: '#dc2626',
    warning: 'This is a contraindicated combination. Override only if absolutely necessary.'
  },
  severe: {
    label: 'Severe',
    icon: '⚠️',
    color: '#ea580c',
    warning: 'This is a severe interaction. Careful monitoring required if proceeding.'
  },
  moderate: {
    label: 'Moderate',
    icon: '⚡',
    color: '#ca8a04',
    warning: 'This is a moderate interaction. Document your clinical reasoning.'
  },
  minor: {
    label: 'Minor',
    icon: 'ℹ️',
    color: '#2563eb',
    warning: 'This is a minor interaction. Documentation recommended.'
  },
  allergy: {
    label: 'Allergy',
    icon: '🚨',
    color: '#dc2626',
    warning: 'Patient has a documented allergy. Override only with extreme caution.'
  }
};

// Common override reasons for quick selection
const COMMON_REASONS = [
  'No suitable alternative available',
  'Benefits outweigh risks for this patient',
  'Patient has tolerated this combination previously',
  'Lower doses being used to minimize risk',
  'Close monitoring will be implemented',
  'Time-limited therapy with defined endpoint'
];

const InteractionOverrideModal = ({
  isOpen,
  interaction,
  visitId,
  patientId,
  prescriptionId,
  onOverride,
  onCancel,
  isAllergy = false
}) => {
  const [reason, setReason] = useState('');
  const [selectedCommonReason, setSelectedCommonReason] = useState('');
  const [monitoringPlan, setMonitoringPlan] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !interaction) return null;

  const severity = isAllergy ? 'allergy' : (interaction.severity || 'moderate');
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.moderate;

  const handleCommonReasonSelect = (commonReason) => {
    setSelectedCommonReason(commonReason);
    if (reason) {
      setReason(`${reason}\n${commonReason}`);
    } else {
      setReason(commonReason);
    }
  };

  const handleSubmit = async () => {
    const finalReason = reason.trim();
    
    if (!finalReason) {
      setError('Please provide a clinical justification for the override');
      return;
    }

    if (finalReason.length < 20) {
      setError('Please provide a more detailed justification (at least 20 characters)');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        visitId,
        patientId,
        prescriptionId,
        interactionId: interaction.id,
        reason: finalReason,
        monitoringPlan: monitoringPlan.trim() || undefined,
        severity,
        isAllergy,
        drug1: interaction.drug1 || interaction.drug,
        drug2: interaction.drug2 || interaction.allergen,
        mechanism: interaction.mechanism,
        clinicalEffect: interaction.clinicalEffect
      };

      const response = await axios.post('/api/emr/interactions/override', payload);

      if (response.data.success) {
        onOverride?.({
          interaction,
          reason: finalReason,
          monitoringPlan: monitoringPlan.trim(),
          overrideId: response.data.overrideId,
          timestamp: response.data.timestamp
        });
      } else {
        setError(response.data.message || 'Failed to log override');
      }
    } catch (err) {
      console.error('Error logging override:', err);
      setError(err.response?.data?.message || 'Failed to log override. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setSelectedCommonReason('');
    setMonitoringPlan('');
    setError('');
    onCancel?.();
  };

  return (
    <div className="override-modal-overlay" onClick={handleClose}>
      <div 
        className="override-modal-container" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="override-modal-title"
      >
        {/* Header */}
        <div className="override-modal-header" style={{ borderColor: config.color }}>
          <div className="header-icon" style={{ color: config.color }}>
            {config.icon}
          </div>
          <div className="header-content">
            <h3 id="override-modal-title">
              {isAllergy ? 'Override Allergy Alert' : 'Override Drug Interaction'}
            </h3>
            <span 
              className="severity-indicator"
              style={{ background: config.color }}
            >
              {config.label}
            </span>
          </div>
          <button 
            className="close-btn"
            onClick={handleClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Interaction Details */}
        <div className="override-modal-body">
          <div className="interaction-summary">
            {isAllergy ? (
              <>
                <p className="drug-pair">
                  <strong>{interaction.drug}</strong>
                  <span className="arrow">→</span>
                  <span className="allergen">{interaction.allergen}</span>
                </p>
                {interaction.reaction && (
                  <p className="detail">
                    <span className="label">Known Reaction:</span>
                    <span className="value">{interaction.reaction}</span>
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="drug-pair">
                  <strong>{interaction.drug1}</strong>
                  <span className="arrow">↔</span>
                  <strong>{interaction.drug2}</strong>
                </p>
                {interaction.mechanism && (
                  <p className="detail">
                    <span className="label">Mechanism:</span>
                    <span className="value">{interaction.mechanism}</span>
                  </p>
                )}
                {interaction.clinicalEffect && (
                  <p className="detail">
                    <span className="label">Clinical Effect:</span>
                    <span className="value">{interaction.clinicalEffect}</span>
                  </p>
                )}
              </>
            )}
          </div>

          {/* Warning */}
          <div className="override-warning" style={{ borderColor: config.color }}>
            <span className="warning-icon">⚠️</span>
            <p>{config.warning}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="override-error" role="alert">
              {error}
            </div>
          )}

          {/* Common Reasons */}
          <div className="common-reasons">
            <label>Quick Select (optional):</label>
            <div className="reason-chips">
              {COMMON_REASONS.map((commonReason, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`reason-chip ${selectedCommonReason === commonReason ? 'selected' : ''}`}
                  onClick={() => handleCommonReasonSelect(commonReason)}
                >
                  {commonReason}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Input */}
          <div className="form-group">
            <label htmlFor="override-reason">
              Clinical Justification <span className="required">*</span>
            </label>
            <textarea
              id="override-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide detailed clinical reasoning for this override..."
              rows={4}
              disabled={saving}
              required
            />
            <span className="char-count">
              {reason.length} characters {reason.length < 20 && '(minimum 20)'}
            </span>
          </div>

          {/* Monitoring Plan */}
          <div className="form-group">
            <label htmlFor="monitoring-plan">
              Monitoring Plan (recommended)
            </label>
            <textarea
              id="monitoring-plan"
              value={monitoringPlan}
              onChange={(e) => setMonitoringPlan(e.target.value)}
              placeholder="Describe any monitoring or precautions to be taken..."
              rows={2}
              disabled={saving}
            />
          </div>

          {/* Audit Notice */}
          <div className="audit-notice">
            <span className="notice-icon">📋</span>
            <p>
              This override will be logged in the patient's medical record with your credentials 
              and timestamp for audit purposes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="override-modal-footer">
          <button 
            className="cancel-btn"
            onClick={handleClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="confirm-btn"
            onClick={handleSubmit}
            disabled={saving || reason.trim().length < 20}
            style={{ background: saving ? '#94a3b8' : config.color }}
          >
            {saving ? (
              <>
                <span className="spinner"></span>
                Saving...
              </>
            ) : (
              'Confirm Override'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InteractionOverrideModal;
