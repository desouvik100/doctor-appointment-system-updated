/**
 * DiagnosisPrompt Component
 * Prompts user to add diagnosis before completing visit
 * Requirements: 10.4
 */

import { useState } from 'react';
import DiagnosisCoder from './DiagnosisCoder';
import DiagnosisList from './DiagnosisList';
import './DiagnosisPrompt.css';

const DiagnosisPrompt = ({
  visitId,
  diagnoses = [],
  onComplete,
  onSkip,
  onDiagnosisAdded,
  onDiagnosisUpdated,
  onDiagnosisRemoved
}) => {
  const [showCoder, setShowCoder] = useState(diagnoses.length === 0);

  const hasPrimaryDiagnosis = diagnoses.some(d => d.type === 'primary');

  // Handle diagnosis added
  const handleDiagnosisAdded = (diagnosis) => {
    onDiagnosisAdded?.(diagnosis);
    setShowCoder(false);
  };

  return (
    <div className="diagnosis-prompt">
      {/* Header */}
      <div className="prompt-header">
        <div className="header-icon">
          {diagnoses.length === 0 ? '⚠️' : hasPrimaryDiagnosis ? '✓' : '⚡'}
        </div>
        <div className="header-content">
          <h3 className="prompt-title">
            {diagnoses.length === 0 
              ? 'No Diagnosis Recorded'
              : hasPrimaryDiagnosis 
                ? 'Diagnosis Recorded'
                : 'Primary Diagnosis Missing'}
          </h3>
          <p className="prompt-subtitle">
            {diagnoses.length === 0 
              ? 'Please add at least one diagnosis before completing this visit.'
              : hasPrimaryDiagnosis 
                ? 'Review diagnoses before completing the visit.'
                : 'Consider adding a primary diagnosis for this visit.'}
          </p>
        </div>
      </div>

      {/* Current Diagnoses */}
      {diagnoses.length > 0 && (
        <div className="current-diagnoses">
          <DiagnosisList
            visitId={visitId}
            diagnoses={diagnoses}
            onDiagnosisUpdated={onDiagnosisUpdated}
            onDiagnosisRemoved={onDiagnosisRemoved}
            compact
          />
        </div>
      )}

      {/* Add Diagnosis Section */}
      {showCoder ? (
        <div className="coder-section">
          <DiagnosisCoder
            visitId={visitId}
            existingDiagnoses={diagnoses}
            onDiagnosisAdded={handleDiagnosisAdded}
            onCancel={() => setShowCoder(false)}
            compact
          />
        </div>
      ) : (
        <button 
          className="add-more-btn"
          onClick={() => setShowCoder(true)}
        >
          + Add {diagnoses.length > 0 ? 'Another' : ''} Diagnosis
        </button>
      )}

      {/* Actions */}
      <div className="prompt-actions">
        {diagnoses.length === 0 ? (
          <>
            <button
              className="skip-btn"
              onClick={onSkip}
            >
              Skip for Now
            </button>
            <button
              className="complete-btn disabled"
              disabled
              title="Add at least one diagnosis to complete"
            >
              Complete Visit
            </button>
          </>
        ) : (
          <>
            <button
              className="skip-btn"
              onClick={onSkip}
            >
              Cancel
            </button>
            <button
              className="complete-btn"
              onClick={onComplete}
            >
              Complete Visit
            </button>
          </>
        )}
      </div>

      {/* Warning for no primary */}
      {diagnoses.length > 0 && !hasPrimaryDiagnosis && (
        <div className="warning-banner">
          <span className="warning-icon">💡</span>
          <span>Tip: Setting a primary diagnosis helps with billing and reporting.</span>
        </div>
      )}
    </div>
  );
};

/**
 * Hook to check if diagnosis prompt should be shown
 * @param {Array} diagnoses - Current diagnoses
 * @param {boolean} requireDiagnosis - Whether diagnosis is required
 * @returns {Object} Prompt state and handlers
 */
export const useDiagnosisPrompt = (diagnoses = [], requireDiagnosis = true) => {
  const [showPrompt, setShowPrompt] = useState(false);

  const shouldPrompt = () => {
    if (!requireDiagnosis) return false;
    return diagnoses.length === 0;
  };

  const checkBeforeComplete = (onComplete) => {
    if (shouldPrompt()) {
      setShowPrompt(true);
      return false;
    }
    onComplete?.();
    return true;
  };

  const closePrompt = () => setShowPrompt(false);

  return {
    showPrompt,
    setShowPrompt,
    shouldPrompt,
    checkBeforeComplete,
    closePrompt,
    hasDiagnosis: diagnoses.length > 0,
    hasPrimaryDiagnosis: diagnoses.some(d => d.type === 'primary')
  };
};

export default DiagnosisPrompt;
