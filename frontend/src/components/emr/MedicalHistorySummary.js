/**
 * MedicalHistorySummary Component
 * Displays critical medical history items (allergies, active conditions) prominently
 * Shows allergy badges on clinical screens
 * Requirements: 3.8, 9.4
 */

import { useState, useEffect } from 'react';
import axios from '../../api/config';
import './MedicalHistorySummary.css';

// Severity colors for allergy badges
const SEVERITY_COLORS = {
  'mild': { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' },
  'moderate': { bg: '#fed7aa', text: '#ea580c', border: '#fb923c' },
  'severe': { bg: '#fecaca', text: '#dc2626', border: '#f87171' },
  'life-threatening': { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' }
};

// Condition status colors
const STATUS_COLORS = {
  'active': { bg: '#fef3c7', text: '#d97706' },
  'controlled': { bg: '#d1fae5', text: '#059669' },
  'resolved': { bg: '#e0e7ff', text: '#4f46e5' }
};

/**
 * AllergyBadge - Standalone allergy badge component for use on clinical screens
 */
export const AllergyBadge = ({ allergy, compact = false, onClick }) => {
  const colors = SEVERITY_COLORS[allergy.severity] || SEVERITY_COLORS.moderate;
  
  if (compact) {
    return (
      <span
        className="allergy-badge-compact"
        style={{ 
          backgroundColor: colors.bg, 
          color: colors.text,
          borderColor: colors.border
        }}
        title={`${allergy.allergen} - ${allergy.severity}${allergy.reaction ? `: ${allergy.reaction}` : ''}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`Allergy: ${allergy.allergen}, Severity: ${allergy.severity}`}
      >
        ⚠️ {allergy.allergen}
      </span>
    );
  }

  return (
    <div 
      className="allergy-badge-full"
      style={{ 
        backgroundColor: colors.bg, 
        borderColor: colors.border
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Allergy: ${allergy.allergen}, Severity: ${allergy.severity}`}
    >
      <div className="allergy-badge-header">
        <span className="allergy-icon">⚠️</span>
        <span className="allergy-name" style={{ color: colors.text }}>{allergy.allergen}</span>
        <span 
          className="allergy-severity-tag"
          style={{ backgroundColor: colors.text, color: 'white' }}
        >
          {allergy.severity}
        </span>
      </div>
      {allergy.reaction && (
        <p className="allergy-reaction">Reaction: {allergy.reaction}</p>
      )}
      {allergy.type && (
        <span className="allergy-type">{allergy.type}</span>
      )}
    </div>
  );
};

/**
 * ConditionBadge - Standalone condition badge component
 */
export const ConditionBadge = ({ condition, compact = false, onClick }) => {
  const colors = STATUS_COLORS[condition.status] || STATUS_COLORS.active;
  
  if (compact) {
    return (
      <span
        className="condition-badge-compact"
        style={{ backgroundColor: colors.bg, color: colors.text }}
        title={`${condition.condition} - ${condition.status}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`Condition: ${condition.condition}, Status: ${condition.status}`}
      >
        🏥 {condition.condition}
      </span>
    );
  }

  return (
    <div 
      className="condition-badge-full"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Condition: ${condition.condition}, Status: ${condition.status}`}
    >
      <div className="condition-badge-header">
        <span className="condition-icon">🏥</span>
        <span className="condition-name">{condition.condition}</span>
        <span 
          className="condition-status-tag"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {condition.status}
        </span>
      </div>
      {condition.icdCode && (
        <span className="condition-icd">ICD-10: {condition.icdCode}</span>
      )}
    </div>
  );
};

/**
 * MedicationBadge - Standalone medication badge component
 */
export const MedicationBadge = ({ medication, compact = false, onClick }) => {
  if (compact) {
    return (
      <span
        className="medication-badge-compact"
        title={`${medication.drugName} - ${medication.dosage}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`Medication: ${medication.drugName}, Dosage: ${medication.dosage}`}
      >
        💊 {medication.drugName}
      </span>
    );
  }

  return (
    <div 
      className="medication-badge-full"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Medication: ${medication.drugName}, Dosage: ${medication.dosage}`}
    >
      <div className="medication-badge-header">
        <span className="medication-icon">💊</span>
        <span className="medication-name">{medication.drugName}</span>
        <span className="medication-dosage">{medication.dosage}</span>
      </div>
    </div>
  );
};

/**
 * CriticalAlertsBanner - Prominent banner for critical allergies
 */
export const CriticalAlertsBanner = ({ allergies = [], onViewDetails }) => {
  const criticalAllergies = allergies.filter(
    a => a.severity === 'severe' || a.severity === 'life-threatening'
  );

  if (criticalAllergies.length === 0) return null;

  return (
    <div className="critical-alerts-banner" role="alert" aria-live="polite">
      <div className="critical-alerts-icon">🚨</div>
      <div className="critical-alerts-content">
        <strong>Critical Allergies:</strong>
        <span className="critical-allergies-list">
          {criticalAllergies.map((a, idx) => (
            <span key={idx} className="critical-allergy-item">
              {a.allergen} ({a.severity})
              {idx < criticalAllergies.length - 1 && ', '}
            </span>
          ))}
        </span>
      </div>
      {onViewDetails && (
        <button 
          className="critical-alerts-action"
          onClick={onViewDetails}
          aria-label="View all allergies"
        >
          View All
        </button>
      )}
    </div>
  );
};

/**
 * MedicalHistorySummary - Main summary component
 */
const MedicalHistorySummary = ({ 
  patientId, 
  clinicId,
  compact = false,
  showMedications = true,
  onViewFullHistory,
  onAllergyClick,
  onConditionClick,
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    allergies: [],
    activeConditions: [],
    activeMedications: []
  });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (patientId) {
      fetchSummary();
    }
  }, [patientId, clinicId]);

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/emr/patients/${patientId}/history/summary`, {
        params: { clinicId }
      });
      if (response.data.success) {
        setSummary({
          allergies: response.data.summary?.allergies || [],
          activeConditions: response.data.summary?.activeConditions || [],
          activeMedications: response.data.summary?.activeMedications || []
        });
      }
    } catch (err) {
      // If 404, patient has no history yet - not an error
      if (err.response?.status !== 404) {
        setError('Failed to load medical history');
      }
      setSummary({
        allergies: [],
        activeConditions: [],
        activeMedications: []
      });
    } finally {
      setLoading(false);
    }
  };

  const hasData = summary.allergies.length > 0 || 
                  summary.activeConditions.length > 0 || 
                  (showMedications && summary.activeMedications.length > 0);

  const hasCriticalAllergies = summary.allergies.some(
    a => a.severity === 'severe' || a.severity === 'life-threatening'
  );

  if (loading) {
    return (
      <div className={`medical-history-summary loading ${className}`}>
        <div className="summary-loading-spinner"></div>
        <span>Loading history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`medical-history-summary error ${className}`} role="alert">
        <span className="error-icon">⚠️</span>
        <span>{error}</span>
        <button onClick={fetchSummary} className="retry-btn">Retry</button>
      </div>
    );
  }

  // Compact inline view for embedding in headers/cards
  if (compact) {
    return (
      <div className={`medical-history-summary compact ${className}`}>
        {hasCriticalAllergies && (
          <CriticalAlertsBanner 
            allergies={summary.allergies} 
            onViewDetails={onViewFullHistory}
          />
        )}
        <div className="summary-badges-inline">
          {summary.allergies.map((allergy, idx) => (
            <AllergyBadge 
              key={`allergy-${idx}`}
              allergy={allergy}
              compact
              onClick={() => onAllergyClick?.(allergy)}
            />
          ))}
          {summary.activeConditions.map((condition, idx) => (
            <ConditionBadge 
              key={`condition-${idx}`}
              condition={condition}
              compact
              onClick={() => onConditionClick?.(condition)}
            />
          ))}
          {showMedications && summary.activeMedications.slice(0, 3).map((med, idx) => (
            <MedicationBadge 
              key={`med-${idx}`}
              medication={med}
              compact
            />
          ))}
          {showMedications && summary.activeMedications.length > 3 && (
            <span className="more-badge">+{summary.activeMedications.length - 3} more</span>
          )}
        </div>
        {!hasData && (
          <span className="no-history-inline">No medical history recorded</span>
        )}
      </div>
    );
  }

  // Full summary card view
  return (
    <div className={`medical-history-summary card ${className}`}>
      {/* Critical Alerts Banner */}
      {hasCriticalAllergies && (
        <CriticalAlertsBanner 
          allergies={summary.allergies} 
          onViewDetails={onViewFullHistory}
        />
      )}

      {/* Header */}
      <div className="summary-header">
        <h3 className="summary-title">
          <span className="summary-icon">📋</span>
          Medical History Summary
        </h3>
        <div className="summary-actions">
          {hasData && (
            <button 
              className="expand-btn"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-label={expanded ? 'Collapse details' : 'Expand details'}
            >
              {expanded ? '▲ Less' : '▼ More'}
            </button>
          )}
          {onViewFullHistory && (
            <button 
              className="view-full-btn"
              onClick={onViewFullHistory}
              aria-label="View full medical history"
            >
              View Full History →
            </button>
          )}
        </div>
      </div>

      {!hasData ? (
        <div className="no-history-message">
          <span className="no-history-icon">📝</span>
          <p>No medical history recorded for this patient.</p>
          {onViewFullHistory && (
            <button className="add-history-btn" onClick={onViewFullHistory}>
              + Add Medical History
            </button>
          )}
        </div>
      ) : (
        <div className="summary-content">
          {/* Allergies Section */}
          {summary.allergies.length > 0 && (
            <div className="summary-section allergies-section">
              <h4 className="section-title">
                <span>⚠️ Allergies</span>
                <span className="section-count">{summary.allergies.length}</span>
              </h4>
              <div className="section-items">
                {(expanded ? summary.allergies : summary.allergies.slice(0, 3)).map((allergy, idx) => (
                  <AllergyBadge 
                    key={idx}
                    allergy={allergy}
                    onClick={() => onAllergyClick?.(allergy)}
                  />
                ))}
                {!expanded && summary.allergies.length > 3 && (
                  <button 
                    className="show-more-btn"
                    onClick={() => setExpanded(true)}
                  >
                    +{summary.allergies.length - 3} more allergies
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active Conditions Section */}
          {summary.activeConditions.length > 0 && (
            <div className="summary-section conditions-section">
              <h4 className="section-title">
                <span>🏥 Active Conditions</span>
                <span className="section-count">{summary.activeConditions.length}</span>
              </h4>
              <div className="section-items">
                {(expanded ? summary.activeConditions : summary.activeConditions.slice(0, 3)).map((condition, idx) => (
                  <ConditionBadge 
                    key={idx}
                    condition={condition}
                    onClick={() => onConditionClick?.(condition)}
                  />
                ))}
                {!expanded && summary.activeConditions.length > 3 && (
                  <button 
                    className="show-more-btn"
                    onClick={() => setExpanded(true)}
                  >
                    +{summary.activeConditions.length - 3} more conditions
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active Medications Section */}
          {showMedications && summary.activeMedications.length > 0 && (
            <div className="summary-section medications-section">
              <h4 className="section-title">
                <span>💊 Current Medications</span>
                <span className="section-count">{summary.activeMedications.length}</span>
              </h4>
              <div className="section-items">
                {(expanded ? summary.activeMedications : summary.activeMedications.slice(0, 3)).map((med, idx) => (
                  <MedicationBadge 
                    key={idx}
                    medication={med}
                  />
                ))}
                {!expanded && summary.activeMedications.length > 3 && (
                  <button 
                    className="show-more-btn"
                    onClick={() => setExpanded(true)}
                  >
                    +{summary.activeMedications.length - 3} more medications
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicalHistorySummary;
