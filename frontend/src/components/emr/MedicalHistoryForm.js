/**
 * MedicalHistoryForm Component
 * Tabbed form for managing patient medical history
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import React, { useState, useEffect } from 'react';
import axios from '../../api/config';
import './MedicalHistoryForm.css';

const TABS = [
  { key: 'allergies', label: 'Allergies', icon: '⚠️' },
  { key: 'conditions', label: 'Chronic Conditions', icon: '🏥' },
  { key: 'familyHistory', label: 'Family History', icon: '👨‍👩‍👧‍👦' },
  { key: 'surgicalHistory', label: 'Surgical History', icon: '🔪' },
  { key: 'medications', label: 'Current Medications', icon: '💊' }
];

const SEVERITY_OPTIONS = [
  { value: 'mild', label: 'Mild', color: '#fbbf24' },
  { value: 'moderate', label: 'Moderate', color: '#f97316' },
  { value: 'severe', label: 'Severe', color: '#ef4444' }
];

const COMMON_CONDITIONS = [
  'Diabetes Type 2', 'Hypertension', 'Asthma', 'COPD', 'Heart Disease',
  'Arthritis', 'Thyroid Disorder', 'Depression', 'Anxiety', 'Migraine'
];

const FAMILY_RELATIONS = [
  'Father', 'Mother', 'Brother', 'Sister', 'Grandfather', 'Grandmother',
  'Uncle', 'Aunt', 'Son', 'Daughter'
];

const MedicalHistoryForm = ({ patientId, clinicId, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState('allergies');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [history, setHistory] = useState({
    allergies: [],
    chronicConditions: [],
    familyHistory: [],
    surgicalHistory: [],
    currentMedications: []
  });

  // Form states for adding new items
  const [newAllergy, setNewAllergy] = useState({ allergen: '', reaction: '', severity: 'moderate' });
  const [newCondition, setNewCondition] = useState({ condition: '', diagnosedDate: '', status: 'active', notes: '' });
  const [newFamilyHistory, setNewFamilyHistory] = useState({ relation: '', condition: '', ageAtOnset: '', notes: '' });
  const [newSurgery, setNewSurgery] = useState({ procedure: '', date: '', hospital: '', notes: '' });
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '', frequency: '', startDate: '', prescribedFor: '' });


  useEffect(() => {
    if (patientId) {
      fetchHistory();
    }
  }, [patientId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/emr/patients/${patientId}/history`, {
        params: { clinicId }
      });
      if (response.data.success && response.data.history) {
        setHistory({
          allergies: response.data.history.allergies || [],
          chronicConditions: response.data.history.chronicConditions || [],
          familyHistory: response.data.history.familyHistory || [],
          surgicalHistory: response.data.history.surgicalHistory || [],
          currentMedications: response.data.history.currentMedications || []
        });
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        setError('Failed to load medical history');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveHistory = async () => {
    setSaving(true);
    setError('');
    try {
      const response = await axios.post(`/api/emr/patients/${patientId}/history`, {
        clinicId,
        ...history
      });
      if (response.data.success) {
        onSave && onSave(response.data.history);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save medical history');
    } finally {
      setSaving(false);
    }
  };

  // Allergies handlers
  const addAllergy = () => {
    if (!newAllergy.allergen.trim()) return;
    setHistory(prev => ({
      ...prev,
      allergies: [...prev.allergies, { ...newAllergy, id: Date.now() }]
    }));
    setNewAllergy({ allergen: '', reaction: '', severity: 'moderate' });
  };

  const removeAllergy = (id) => {
    setHistory(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a.id !== id && a._id !== id)
    }));
  };

  // Conditions handlers
  const addCondition = () => {
    if (!newCondition.condition.trim()) return;
    setHistory(prev => ({
      ...prev,
      chronicConditions: [...prev.chronicConditions, { ...newCondition, id: Date.now() }]
    }));
    setNewCondition({ condition: '', diagnosedDate: '', status: 'active', notes: '' });
  };

  const removeCondition = (id) => {
    setHistory(prev => ({
      ...prev,
      chronicConditions: prev.chronicConditions.filter(c => c.id !== id && c._id !== id)
    }));
  };

  // Family history handlers
  const addFamilyHistory = () => {
    if (!newFamilyHistory.condition.trim()) return;
    setHistory(prev => ({
      ...prev,
      familyHistory: [...prev.familyHistory, { ...newFamilyHistory, id: Date.now() }]
    }));
    setNewFamilyHistory({ relation: '', condition: '', ageAtOnset: '', notes: '' });
  };

  const removeFamilyHistory = (id) => {
    setHistory(prev => ({
      ...prev,
      familyHistory: prev.familyHistory.filter(f => f.id !== id && f._id !== id)
    }));
  };

  // Surgical history handlers
  const addSurgery = () => {
    if (!newSurgery.procedure.trim()) return;
    setHistory(prev => ({
      ...prev,
      surgicalHistory: [...prev.surgicalHistory, { ...newSurgery, id: Date.now() }]
    }));
    setNewSurgery({ procedure: '', date: '', hospital: '', notes: '' });
  };

  const removeSurgery = (id) => {
    setHistory(prev => ({
      ...prev,
      surgicalHistory: prev.surgicalHistory.filter(s => s.id !== id && s._id !== id)
    }));
  };

  // Medications handlers
  const addMedication = () => {
    if (!newMedication.name.trim()) return;
    setHistory(prev => ({
      ...prev,
      currentMedications: [...prev.currentMedications, { ...newMedication, id: Date.now() }]
    }));
    setNewMedication({ name: '', dosage: '', frequency: '', startDate: '', prescribedFor: '' });
  };

  const removeMedication = (id) => {
    setHistory(prev => ({
      ...prev,
      currentMedications: prev.currentMedications.filter(m => m.id !== id && m._id !== id)
    }));
  };

  const getSeverityBadge = (severity) => {
    const option = SEVERITY_OPTIONS.find(s => s.value === severity) || SEVERITY_OPTIONS[1];
    return (
      <span 
        className="severity-badge" 
        style={{ backgroundColor: option.color }}
        aria-label={`Severity: ${option.label}`}
      >
        {option.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="medical-history-form loading">
        <div className="loading-spinner"></div>
        <p>Loading medical history...</p>
      </div>
    );
  }


  return (
    <div className="medical-history-form">
      {error && <div className="error-message" role="alert">{error}</div>}
      
      {/* Tabs */}
      <div className="tabs-container" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            <span className="tab-count">
              {tab.key === 'allergies' && history.allergies.length}
              {tab.key === 'conditions' && history.chronicConditions.length}
              {tab.key === 'familyHistory' && history.familyHistory.length}
              {tab.key === 'surgicalHistory' && history.surgicalHistory.length}
              {tab.key === 'medications' && history.currentMedications.length}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content" role="tabpanel">
        {/* Allergies Tab */}
        {activeTab === 'allergies' && (
          <div className="section-content">
            <h3>Known Allergies</h3>
            
            {/* Add new allergy form */}
            <div className="add-form">
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Allergen (e.g., Penicillin, Peanuts)"
                  value={newAllergy.allergen}
                  onChange={(e) => setNewAllergy({ ...newAllergy, allergen: e.target.value })}
                  aria-label="Allergen name"
                />
                <input
                  type="text"
                  placeholder="Reaction (e.g., Rash, Anaphylaxis)"
                  value={newAllergy.reaction}
                  onChange={(e) => setNewAllergy({ ...newAllergy, reaction: e.target.value })}
                  aria-label="Allergic reaction"
                />
                <select
                  value={newAllergy.severity}
                  onChange={(e) => setNewAllergy({ ...newAllergy, severity: e.target.value })}
                  aria-label="Severity level"
                >
                  {SEVERITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button className="add-btn" onClick={addAllergy} disabled={!newAllergy.allergen.trim()}>
                  + Add
                </button>
              </div>
            </div>

            {/* Allergies list */}
            <div className="items-list">
              {history.allergies.length === 0 ? (
                <p className="empty-message">No allergies recorded</p>
              ) : (
                history.allergies.map((allergy, idx) => (
                  <div key={allergy.id || allergy._id || idx} className="item-card allergy-card">
                    <div className="item-main">
                      <span className="item-title">{allergy.allergen}</span>
                      {getSeverityBadge(allergy.severity)}
                    </div>
                    {allergy.reaction && <p className="item-detail">Reaction: {allergy.reaction}</p>}
                    <button 
                      className="remove-btn" 
                      onClick={() => removeAllergy(allergy.id || allergy._id)}
                      aria-label={`Remove ${allergy.allergen}`}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chronic Conditions Tab */}
        {activeTab === 'conditions' && (
          <div className="section-content">
            <h3>Chronic Conditions</h3>
            
            <div className="add-form">
              <div className="form-row">
                <input
                  type="text"
                  list="conditions-list"
                  placeholder="Condition name"
                  value={newCondition.condition}
                  onChange={(e) => setNewCondition({ ...newCondition, condition: e.target.value })}
                  aria-label="Condition name"
                />
                <datalist id="conditions-list">
                  {COMMON_CONDITIONS.map(c => <option key={c} value={c} />)}
                </datalist>
                <input
                  type="date"
                  value={newCondition.diagnosedDate}
                  onChange={(e) => setNewCondition({ ...newCondition, diagnosedDate: e.target.value })}
                  aria-label="Date diagnosed"
                />
                <select
                  value={newCondition.status}
                  onChange={(e) => setNewCondition({ ...newCondition, status: e.target.value })}
                  aria-label="Condition status"
                >
                  <option value="active">Active</option>
                  <option value="controlled">Controlled</option>
                  <option value="resolved">Resolved</option>
                </select>
                <button className="add-btn" onClick={addCondition} disabled={!newCondition.condition.trim()}>
                  + Add
                </button>
              </div>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={newCondition.notes}
                onChange={(e) => setNewCondition({ ...newCondition, notes: e.target.value })}
                className="full-width"
                aria-label="Additional notes"
              />
            </div>

            <div className="items-list">
              {history.chronicConditions.length === 0 ? (
                <p className="empty-message">No chronic conditions recorded</p>
              ) : (
                history.chronicConditions.map((cond, idx) => (
                  <div key={cond.id || cond._id || idx} className="item-card">
                    <div className="item-main">
                      <span className="item-title">{cond.condition}</span>
                      <span className={`status-badge status-${cond.status}`}>{cond.status}</span>
                    </div>
                    {cond.diagnosedDate && <p className="item-detail">Diagnosed: {new Date(cond.diagnosedDate).toLocaleDateString()}</p>}
                    {cond.notes && <p className="item-detail">{cond.notes}</p>}
                    <button className="remove-btn" onClick={() => removeCondition(cond.id || cond._id)}>×</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}


        {/* Family History Tab */}
        {activeTab === 'familyHistory' && (
          <div className="section-content">
            <h3>Family Medical History</h3>
            
            <div className="add-form">
              <div className="form-row">
                <select
                  value={newFamilyHistory.relation}
                  onChange={(e) => setNewFamilyHistory({ ...newFamilyHistory, relation: e.target.value })}
                  aria-label="Family relation"
                >
                  <option value="">Select relation</option>
                  {FAMILY_RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <input
                  type="text"
                  list="conditions-list"
                  placeholder="Condition"
                  value={newFamilyHistory.condition}
                  onChange={(e) => setNewFamilyHistory({ ...newFamilyHistory, condition: e.target.value })}
                  aria-label="Condition"
                />
                <input
                  type="number"
                  placeholder="Age at onset"
                  value={newFamilyHistory.ageAtOnset}
                  onChange={(e) => setNewFamilyHistory({ ...newFamilyHistory, ageAtOnset: e.target.value })}
                  min="0"
                  max="120"
                  aria-label="Age at onset"
                />
                <button className="add-btn" onClick={addFamilyHistory} disabled={!newFamilyHistory.condition.trim()}>
                  + Add
                </button>
              </div>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={newFamilyHistory.notes}
                onChange={(e) => setNewFamilyHistory({ ...newFamilyHistory, notes: e.target.value })}
                className="full-width"
                aria-label="Additional notes"
              />
            </div>

            <div className="items-list">
              {history.familyHistory.length === 0 ? (
                <p className="empty-message">No family history recorded</p>
              ) : (
                history.familyHistory.map((fh, idx) => (
                  <div key={fh.id || fh._id || idx} className="item-card">
                    <div className="item-main">
                      <span className="item-title">{fh.condition}</span>
                      {fh.relation && <span className="relation-badge">{fh.relation}</span>}
                    </div>
                    {fh.ageAtOnset && <p className="item-detail">Age at onset: {fh.ageAtOnset}</p>}
                    {fh.notes && <p className="item-detail">{fh.notes}</p>}
                    <button className="remove-btn" onClick={() => removeFamilyHistory(fh.id || fh._id)}>×</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Surgical History Tab */}
        {activeTab === 'surgicalHistory' && (
          <div className="section-content">
            <h3>Surgical History</h3>
            
            <div className="add-form">
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Procedure name"
                  value={newSurgery.procedure}
                  onChange={(e) => setNewSurgery({ ...newSurgery, procedure: e.target.value })}
                  aria-label="Procedure name"
                />
                <input
                  type="date"
                  value={newSurgery.date}
                  onChange={(e) => setNewSurgery({ ...newSurgery, date: e.target.value })}
                  aria-label="Surgery date"
                />
                <input
                  type="text"
                  placeholder="Hospital/Facility"
                  value={newSurgery.hospital}
                  onChange={(e) => setNewSurgery({ ...newSurgery, hospital: e.target.value })}
                  aria-label="Hospital or facility"
                />
                <button className="add-btn" onClick={addSurgery} disabled={!newSurgery.procedure.trim()}>
                  + Add
                </button>
              </div>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={newSurgery.notes}
                onChange={(e) => setNewSurgery({ ...newSurgery, notes: e.target.value })}
                className="full-width"
                aria-label="Additional notes"
              />
            </div>

            <div className="items-list">
              {history.surgicalHistory.length === 0 ? (
                <p className="empty-message">No surgical history recorded</p>
              ) : (
                history.surgicalHistory.map((surgery, idx) => (
                  <div key={surgery.id || surgery._id || idx} className="item-card">
                    <div className="item-main">
                      <span className="item-title">{surgery.procedure}</span>
                    </div>
                    {surgery.date && <p className="item-detail">Date: {new Date(surgery.date).toLocaleDateString()}</p>}
                    {surgery.hospital && <p className="item-detail">Facility: {surgery.hospital}</p>}
                    {surgery.notes && <p className="item-detail">{surgery.notes}</p>}
                    <button className="remove-btn" onClick={() => removeSurgery(surgery.id || surgery._id)}>×</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Current Medications Tab */}
        {activeTab === 'medications' && (
          <div className="section-content">
            <h3>Current Medications</h3>
            
            <div className="add-form">
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Medication name"
                  value={newMedication.name}
                  onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                  aria-label="Medication name"
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g., 500mg)"
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                  aria-label="Dosage"
                />
                <input
                  type="text"
                  placeholder="Frequency (e.g., BD)"
                  value={newMedication.frequency}
                  onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                  aria-label="Frequency"
                />
                <button className="add-btn" onClick={addMedication} disabled={!newMedication.name.trim()}>
                  + Add
                </button>
              </div>
              <div className="form-row">
                <input
                  type="date"
                  value={newMedication.startDate}
                  onChange={(e) => setNewMedication({ ...newMedication, startDate: e.target.value })}
                  aria-label="Start date"
                />
                <input
                  type="text"
                  placeholder="Prescribed for (condition)"
                  value={newMedication.prescribedFor}
                  onChange={(e) => setNewMedication({ ...newMedication, prescribedFor: e.target.value })}
                  aria-label="Prescribed for"
                />
              </div>
            </div>

            <div className="items-list">
              {history.currentMedications.length === 0 ? (
                <p className="empty-message">No current medications recorded</p>
              ) : (
                history.currentMedications.map((med, idx) => (
                  <div key={med.id || med._id || idx} className="item-card medication-card">
                    <div className="item-main">
                      <span className="item-title">{med.name}</span>
                      {med.dosage && <span className="dosage-badge">{med.dosage}</span>}
                    </div>
                    {med.frequency && <p className="item-detail">Frequency: {med.frequency}</p>}
                    {med.prescribedFor && <p className="item-detail">For: {med.prescribedFor}</p>}
                    {med.startDate && <p className="item-detail">Since: {new Date(med.startDate).toLocaleDateString()}</p>}
                    <button className="remove-btn" onClick={() => removeMedication(med.id || med._id)}>×</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="form-actions">
        <button className="cancel-btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button className="save-btn" onClick={saveHistory} disabled={saving}>
          {saving ? 'Saving...' : 'Save Medical History'}
        </button>
      </div>
    </div>
  );
};

export default MedicalHistoryForm;
