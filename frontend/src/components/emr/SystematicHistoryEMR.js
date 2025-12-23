/**
 * Systematic History EMR Screen
 * Doctor-facing view of patient systematic history with edit capability
 */

import React, { useState, useEffect } from 'react';
import axios from '../../api/config';
import './SystematicHistoryEMR.css';

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

const SystematicHistoryEMR = ({ clinicId, patientId, visitId, onClose }) => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    fetchHistory();
  }, [patientId, visitId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = { patientId };
      if (visitId) params.visitId = visitId;

      const response = await axios.get('/api/systematic-history', { params });
      
      if (response.data.success && response.data.history) {
        setHistory(response.data.history);
        setEditData(response.data.history);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Failed to load history');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.put(`/api/systematic-history/${history._id}`, {
        ...editData,
        clinicId,
        updatedByDoctor: true
      });

      if (response.data.success) {
        setHistory(response.data.history);
        setEditMode(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityLabel = (severity) => {
    if (severity <= 2) return { label: 'Mild', class: 'mild' };
    if (severity <= 4) return { label: 'Moderate', class: 'moderate' };
    return { label: 'Severe', class: 'severe' };
  };

  const renderSymptomsList = (systemKey) => {
    const systemData = history[systemKey];
    if (!systemData?.symptoms?.length) return null;

    const system = BODY_SYSTEMS[systemKey];
    const isExpanded = expandedSections[systemKey];

    return (
      <div key={systemKey} className="history-system">
        <div 
          className="system-header"
          onClick={() => toggleSection(systemKey)}
        >
          <span className="system-icon">{system.icon}</span>
          <span className="system-name">{system.name}</span>
          <span className="symptom-count">{systemData.symptoms.length}</span>
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
        </div>
        
        {isExpanded && (
          <div className="system-symptoms">
            {systemData.symptoms.map((symptom, idx) => {
              const severity = getSeverityLabel(symptom.severity);
              return (
                <div key={idx} className="symptom-item">
                  <span className="symptom-name">{symptom.name}</span>
                  <div className="symptom-details">
                    <span className={`severity-badge ${severity.class}`}>
                      {severity.label}
                    </span>
                    {symptom.duration && (
                      <span className="duration">
                        {symptom.duration}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderEditSymptoms = (systemKey) => {
    const system = BODY_SYSTEMS[systemKey];
    const systemData = editData[systemKey] || { symptoms: [] };

    return (
      <div key={systemKey} className="edit-system">
        <div className="edit-system-header">
          <span>{system.icon} {system.name}</span>
        </div>
        <div className="edit-symptoms">
          {systemData.symptoms?.map((symptom, idx) => (
            <div key={idx} className="edit-symptom-row">
              <input
                type="text"
                value={symptom.name}
                onChange={(e) => {
                  const newSymptoms = [...systemData.symptoms];
                  newSymptoms[idx] = { ...symptom, name: e.target.value };
                  setEditData(prev => ({
                    ...prev,
                    [systemKey]: { ...systemData, symptoms: newSymptoms }
                  }));
                }}
              />
              <select
                value={symptom.severity}
                onChange={(e) => {
                  const newSymptoms = [...systemData.symptoms];
                  newSymptoms[idx] = { ...symptom, severity: parseInt(e.target.value) };
                  setEditData(prev => ({
                    ...prev,
                    [systemKey]: { ...systemData, symptoms: newSymptoms }
                  }));
                }}
              >
                <option value="1">Mild</option>
                <option value="3">Moderate</option>
                <option value="5">Severe</option>
              </select>
              <button
                type="button"
                className="btn-remove"
                onClick={() => {
                  const newSymptoms = systemData.symptoms.filter((_, i) => i !== idx);
                  setEditData(prev => ({
                    ...prev,
                    [systemKey]: { ...systemData, symptoms: newSymptoms }
                  }));
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="systematic-history-emr">
        <div className="history-loading">
          <div className="spinner"></div>
          <p>Loading patient history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="systematic-history-emr">
      {/* Header */}
      <div className="history-header">
        <h2>
          <span className="header-icon">📋</span>
          Systematic History
        </h2>
        <div className="header-actions">
          {history && !editMode && (
            <button className="btn-edit" onClick={() => setEditMode(true)}>
              ✏️ Edit
            </button>
          )}
          {onClose && (
            <button className="btn-close" onClick={onClose}>×</button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Content */}
      <div className="history-content">
        {!history ? (
          <div className="no-history">
            <span className="no-history-icon">📝</span>
            <h3>No History Recorded</h3>
            <p>Patient has not submitted systematic history yet.</p>
          </div>
        ) : editMode ? (
          /* Edit Mode */
          <div className="history-edit">
            <div className="edit-section">
              <label>Chief Complaint</label>
              <textarea
                value={editData.chiefComplaint || ''}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  chiefComplaint: e.target.value
                }))}
                rows={3}
              />
            </div>

            <div className="edit-section">
              <h4>Symptoms by System</h4>
              {Object.keys(BODY_SYSTEMS).map(key => renderEditSymptoms(key))}
            </div>

            <div className="edit-section">
              <label>Doctor's Notes</label>
              <textarea
                value={editData.doctorNotes || ''}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  doctorNotes: e.target.value
                }))}
                rows={4}
                placeholder="Add clinical observations..."
              />
            </div>

            <div className="edit-actions">
              <button 
                className="btn-cancel" 
                onClick={() => {
                  setEditMode(false);
                  setEditData(history);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="history-view">
            {/* Meta Info */}
            <div className="history-meta">
              <span>Recorded: {formatDate(history.createdAt)}</span>
              {history.updatedAt !== history.createdAt && (
                <span>Updated: {formatDate(history.updatedAt)}</span>
              )}
            </div>

            {/* Chief Complaint */}
            {history.chiefComplaint && (
              <div className="history-section chief-complaint">
                <h4>Chief Complaint</h4>
                <p>{history.chiefComplaint}</p>
              </div>
            )}

            {/* Symptoms by System */}
            <div className="history-section">
              <h4>Review of Systems</h4>
              <div className="systems-list">
                {Object.keys(BODY_SYSTEMS).map(key => renderSymptomsList(key))}
                {Object.keys(BODY_SYSTEMS).every(key => 
                  !history[key]?.symptoms?.length
                ) && (
                  <p className="no-symptoms">No symptoms reported</p>
                )}
              </div>
            </div>

            {/* Past History */}
            {history.pastHistory?.conditions?.length > 0 && (
              <div className="history-section">
                <h4>Past Medical History</h4>
                <div className="condition-tags">
                  {history.pastHistory.conditions.map((condition, idx) => (
                    <span key={idx} className="condition-tag">{condition}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Current Medications */}
            {history.currentMedications?.length > 0 && (
              <div className="history-section">
                <h4>Current Medications</h4>
                <div className="medications-list">
                  {history.currentMedications.map((med, idx) => (
                    <div key={idx} className="medication-item">
                      <span className="med-name">{med.name}</span>
                      {med.dosage && <span className="med-dosage">{med.dosage}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Allergies */}
            {(history.allergies?.drugs?.length > 0 || 
              history.allergies?.food?.length > 0 ||
              history.allergies?.other?.length > 0) && (
              <div className="history-section allergies-section">
                <h4>⚠️ Allergies</h4>
                <div className="allergy-tags">
                  {history.allergies.drugs?.map((allergy, idx) => (
                    <span key={`drug-${idx}`} className="allergy-tag drug">
                      💊 {allergy}
                    </span>
                  ))}
                  {history.allergies.food?.map((allergy, idx) => (
                    <span key={`food-${idx}`} className="allergy-tag food">
                      🍽️ {allergy}
                    </span>
                  ))}
                  {history.allergies.other?.map((allergy, idx) => (
                    <span key={`other-${idx}`} className="allergy-tag other">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Doctor's Notes */}
            {history.doctorNotes && (
              <div className="history-section doctor-notes">
                <h4>Doctor's Notes</h4>
                <p>{history.doctorNotes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystematicHistoryEMR;
