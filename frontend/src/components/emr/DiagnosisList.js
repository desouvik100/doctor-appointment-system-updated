/**
 * DiagnosisList Component
 * Displays all diagnoses for a visit with editing and removal capabilities
 * Requirements: 4.5
 */

import { useState } from 'react';
import axios from '../../api/config';
import './DiagnosisList.css';

// Diagnosis type configuration
const TYPE_CONFIG = {
  primary: { label: 'Primary', color: '#dc2626', bgColor: '#fef2f2', borderColor: '#fecaca' },
  secondary: { label: 'Secondary', color: '#f59e0b', bgColor: '#fffbeb', borderColor: '#fde68a' },
  differential: { label: 'Differential', color: '#6366f1', bgColor: '#eef2ff', borderColor: '#c7d2fe' }
};

const DiagnosisList = ({
  visitId,
  diagnoses = [],
  onDiagnosisUpdated,
  onDiagnosisRemoved,
  readOnly = false,
  compact = false
}) => {
  const [editingCode, setEditingCode] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Start editing a diagnosis
  const handleStartEdit = (diagnosis) => {
    setEditingCode(diagnosis.code);
    setEditData({
      type: diagnosis.type,
      notes: diagnosis.notes || ''
    });
    setError('');
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCode(null);
    setEditData({});
    setError('');
  };

  // Save edited diagnosis
  const handleSaveEdit = async (diagnosisCode) => {
    if (!visitId) {
      setError('Visit ID is required');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      const response = await axios.put(
        `/api/emr/visits/${visitId}/diagnoses/${diagnosisCode}`,
        editData
      );
      
      if (response.data.success || response.data.visit) {
        onDiagnosisUpdated?.({
          code: diagnosisCode,
          ...editData
        });
        handleCancelEdit();
      } else {
        throw new Error(response.data.message || 'Failed to update diagnosis');
      }
    } catch (err) {
      console.error('Error updating diagnosis:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // Remove diagnosis
  const handleRemove = async (diagnosisCode) => {
    if (!visitId) {
      setError('Visit ID is required');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      const response = await axios.delete(
        `/api/emr/visits/${visitId}/diagnoses/${diagnosisCode}`
      );
      
      if (response.data.success || response.data.visit) {
        onDiagnosisRemoved?.(diagnosisCode);
        setConfirmDelete(null);
      } else {
        throw new Error(response.data.message || 'Failed to remove diagnosis');
      }
    } catch (err) {
      console.error('Error removing diagnosis:', err);
      setError(err.response?.data?.message || err.message || 'Failed to remove');
    } finally {
      setSaving(false);
    }
  };

  // Change diagnosis type
  const handleTypeChange = (newType) => {
    setEditData(prev => ({ ...prev, type: newType }));
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Sort diagnoses: primary first, then secondary, then differential
  const sortedDiagnoses = [...diagnoses].sort((a, b) => {
    const order = { primary: 0, secondary: 1, differential: 2 };
    return (order[a.type] || 3) - (order[b.type] || 3);
  });

  if (diagnoses.length === 0) {
    return (
      <div className={`diagnosis-list empty ${compact ? 'compact' : ''}`}>
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <p>No diagnoses recorded</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`diagnosis-list ${compact ? 'compact' : ''}`}>
      {error && (
        <div className="list-error" role="alert">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="diagnoses-container">
        {sortedDiagnoses.map((diagnosis) => {
          const typeConfig = TYPE_CONFIG[diagnosis.type] || TYPE_CONFIG.secondary;
          const isEditing = editingCode === diagnosis.code;
          const isDeleting = confirmDelete === diagnosis.code;
          
          return (
            <div
              key={diagnosis.code}
              className={`diagnosis-item ${isEditing ? 'editing' : ''}`}
              style={{
                '--type-color': typeConfig.color,
                '--type-bg': typeConfig.bgColor,
                '--type-border': typeConfig.borderColor
              }}
            >
              {/* Delete Confirmation Overlay */}
              {isDeleting && (
                <div className="delete-confirm-overlay">
                  <p>Remove this diagnosis?</p>
                  <div className="confirm-actions">
                    <button
                      className="confirm-cancel"
                      onClick={() => setConfirmDelete(null)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      className="confirm-delete"
                      onClick={() => handleRemove(diagnosis.code)}
                      disabled={saving}
                    >
                      {saving ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              )}

              {/* Diagnosis Content */}
              <div className="diagnosis-content">
                <div className="diagnosis-header">
                  <span className="diagnosis-code">{diagnosis.code}</span>
                  
                  {isEditing ? (
                    <div className="type-edit-options">
                      {Object.entries(TYPE_CONFIG).map(([type, config]) => (
                        <button
                          key={type}
                          className={`type-option ${editData.type === type ? 'selected' : ''}`}
                          onClick={() => handleTypeChange(type)}
                          style={{ '--opt-color': config.color }}
                          disabled={saving}
                        >
                          {config.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span 
                      className="diagnosis-type-badge"
                      style={{ 
                        background: typeConfig.bgColor,
                        color: typeConfig.color,
                        borderColor: typeConfig.borderColor
                      }}
                    >
                      {typeConfig.label}
                    </span>
                  )}
                </div>

                <p className="diagnosis-description">{diagnosis.description}</p>

                {isEditing ? (
                  <div className="notes-edit">
                    <textarea
                      value={editData.notes}
                      onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add clinical notes..."
                      rows={2}
                      disabled={saving}
                    />
                  </div>
                ) : diagnosis.notes ? (
                  <p className="diagnosis-notes">
                    <span className="notes-label">Notes:</span> {diagnosis.notes}
                  </p>
                ) : null}

                {!compact && diagnosis.addedAt && (
                  <p className="diagnosis-meta">
                    Added {formatDate(diagnosis.addedAt)}
                  </p>
                )}
              </div>

              {/* Actions */}
              {!readOnly && (
                <div className="diagnosis-actions">
                  {isEditing ? (
                    <>
                      <button
                        className="action-btn save-btn"
                        onClick={() => handleSaveEdit(diagnosis.code)}
                        disabled={saving}
                        title="Save changes"
                      >
                        {saving ? '...' : '✓'}
                      </button>
                      <button
                        className="action-btn cancel-btn"
                        onClick={handleCancelEdit}
                        disabled={saving}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleStartEdit(diagnosis)}
                        title="Edit diagnosis"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => setConfirmDelete(diagnosis.code)}
                        title="Remove diagnosis"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {!compact && (
        <div className="diagnosis-summary">
          <span className="summary-item">
            <span className="summary-count">{diagnoses.length}</span> diagnosis(es)
          </span>
          {diagnoses.filter(d => d.type === 'primary').length > 0 && (
            <span className="summary-item primary">
              {diagnoses.filter(d => d.type === 'primary').length} primary
            </span>
          )}
          {diagnoses.filter(d => d.type === 'secondary').length > 0 && (
            <span className="summary-item secondary">
              {diagnoses.filter(d => d.type === 'secondary').length} secondary
            </span>
          )}
          {diagnoses.filter(d => d.type === 'differential').length > 0 && (
            <span className="summary-item differential">
              {diagnoses.filter(d => d.type === 'differential').length} differential
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default DiagnosisList;
