import React, { useState } from 'react';
import './SystematicHistorySummary.css';

const BODY_SYSTEMS = {
  general: { name: 'General', icon: '🌡️' },
  respiratory: { name: 'Respiratory', icon: '🫁' },
  cardiovascular: { name: 'Cardiovascular', icon: '❤️' },
  gastrointestinal: { name: 'Gastrointestinal', icon: '🫃' },
  genitourinary: { name: 'Genitourinary', icon: '🚿' },
  neurological: { name: 'Neurological', icon: '🧠' },
  musculoskeletal: { name: 'Musculoskeletal', icon: '🦴' },
  skin: { name: 'Skin', icon: '🖐️' },
  endocrine: { name: 'Endocrine', icon: '⚖️' }
};

const SEVERITY_COLORS = {
  1: '#22c55e',
  2: '#84cc16',
  3: '#eab308',
  4: '#f97316',
  5: '#ef4444'
};

const SEVERITY_LABELS = {
  1: 'Mild',
  2: 'Mild-Mod',
  3: 'Moderate',
  4: 'Mod-Severe',
  5: 'Severe'
};

const DURATION_LABELS = {
  days: '1-3 days',
  week: '~1 week',
  weeks: '2-3 weeks',
  month: '~1 month',
  months: '>1 month'
};

const SystematicHistorySummary = ({ 
  history, 
  compact = false, 
  expandable = true,
  onPrint 
}) => {
  const [expanded, setExpanded] = useState(!compact);
  
  if (!history) {
    return (
      <div className="sh-summary sh-summary-empty">
        <p>No systematic history available</p>
      </div>
    );
  }

  const systemKeys = Object.keys(BODY_SYSTEMS);
  const affectedSystems = systemKeys.filter(
    key => history[key]?.symptoms?.some(s => s.present)
  );

  const renderSystemRow = (systemKey) => {
    const system = BODY_SYSTEMS[systemKey];
    const systemData = history[systemKey];
    const presentSymptoms = systemData?.symptoms?.filter(s => s.present) || [];
    const hasSymptoms = presentSymptoms.length > 0;

    return (
      <div key={systemKey} className={`sh-summary-row ${hasSymptoms ? 'has-symptoms' : ''}`}>
        <div className="sh-summary-system">
          <span className="system-icon">{system.icon}</span>
          <span className="system-name">{system.name}</span>
        </div>
        <div className="sh-summary-status">
          {hasSymptoms ? (
            <div className="symptoms-list">
              {presentSymptoms.map((symptom, idx) => (
                <div key={idx} className="symptom-item">
                  <span className="symptom-name">{symptom.name}</span>
                  {symptom.duration && (
                    <span className="symptom-duration">
                      {DURATION_LABELS[symptom.duration] || symptom.duration}
                    </span>
                  )}
                  {symptom.severity && (
                    <span 
                      className="symptom-severity"
                      style={{ backgroundColor: SEVERITY_COLORS[symptom.severity] }}
                    >
                      {SEVERITY_LABELS[symptom.severity]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span className="no-symptoms">—</span>
          )}
        </div>
      </div>
    );
  };

  const renderCompactView = () => (
    <div className="sh-summary-compact" onClick={() => expandable && setExpanded(true)}>
      <div className="compact-header">
        <span className="compact-icon">📋</span>
        <span className="compact-title">Systematic History</span>
        {affectedSystems.length > 0 && (
          <span className="compact-badge">{affectedSystems.length} systems</span>
        )}
        {expandable && <span className="expand-icon">▼</span>}
      </div>
      {history.chiefComplaint && (
        <p className="compact-complaint">{history.chiefComplaint}</p>
      )}
      <div className="compact-systems">
        {affectedSystems.map(sys => (
          <span key={sys} className="compact-system-chip">
            {BODY_SYSTEMS[sys].icon} {BODY_SYSTEMS[sys].name}
          </span>
        ))}
      </div>
    </div>
  );

  const renderExpandedView = () => (
    <div className="sh-summary-expanded">
      <div className="sh-summary-header">
        <h3>📋 Systematic History Summary</h3>
        <div className="header-actions">
          {onPrint && (
            <button className="print-btn" onClick={onPrint}>
              🖨️ Print
            </button>
          )}
          {expandable && compact && (
            <button className="collapse-btn" onClick={() => setExpanded(false)}>
              ▲ Collapse
            </button>
          )}
        </div>
      </div>

      {history.chiefComplaint && (
        <div className="sh-summary-section chief-complaint">
          <h4>Chief Complaint</h4>
          <p>{history.chiefComplaint}</p>
        </div>
      )}

      <div className="sh-summary-section systems-review">
        <h4>Review of Systems</h4>
        <div className="systems-grid">
          {systemKeys.map(renderSystemRow)}
        </div>
      </div>

      {history.pastHistory?.conditions?.length > 0 && (
        <div className="sh-summary-section past-history">
          <h4>Past Medical History</h4>
          <div className="history-tags">
            {history.pastHistory.conditions.map((condition, idx) => (
              <span key={idx} className="history-tag">{condition}</span>
            ))}
          </div>
        </div>
      )}

      {history.currentMedications?.length > 0 && (
        <div className="sh-summary-section medications">
          <h4>Current Medications</h4>
          <div className="medications-list">
            {history.currentMedications.map((med, idx) => (
              <div key={idx} className="medication-item">
                <span className="med-name">{med.name}</span>
                {med.dosage && <span className="med-dosage">{med.dosage}</span>}
                {med.frequency && <span className="med-freq">{med.frequency}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {(history.allergies?.drugs?.length > 0 || 
        history.allergies?.food?.length > 0 || 
        history.allergies?.other?.length > 0) && (
        <div className="sh-summary-section allergies-section">
          <h4>⚠️ Allergies</h4>
          <div className="allergies-list">
            {history.allergies.drugs?.map((allergy, idx) => (
              <span key={`drug-${idx}`} className="allergy-tag drug">{allergy}</span>
            ))}
            {history.allergies.food?.map((allergy, idx) => (
              <span key={`food-${idx}`} className="allergy-tag food">{allergy}</span>
            ))}
            {history.allergies.other?.map((allergy, idx) => (
              <span key={`other-${idx}`} className="allergy-tag other">{allergy}</span>
            ))}
          </div>
        </div>
      )}

      {history.aiRecommendations?.length > 0 && (
        <div className="sh-summary-section ai-recommendations">
          <h4>🤖 AI Recommendations</h4>
          <div className="recommendations-list">
            {history.aiRecommendations.map((rec, idx) => (
              <div key={idx} className="recommendation-item">
                <span className="rec-spec">{rec.specialization}</span>
                <span className="rec-confidence" style={{
                  backgroundColor: rec.confidence > 0.8 ? '#22c55e' : 
                                   rec.confidence > 0.6 ? '#eab308' : '#94a3b8'
                }}>
                  {Math.round(rec.confidence * 100)}%
                </span>
                {rec.reason && <span className="rec-reason">{rec.reason}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {history.completedAt && (
        <div className="sh-summary-footer">
          <span>Completed: {new Date(history.completedAt).toLocaleString()}</span>
          {history.version > 1 && <span>Version: {history.version}</span>}
        </div>
      )}
    </div>
  );

  return (
    <div className={`sh-summary ${compact && !expanded ? 'compact' : 'expanded'}`}>
      {compact && !expanded ? renderCompactView() : renderExpandedView()}
    </div>
  );
};

export default SystematicHistorySummary;
