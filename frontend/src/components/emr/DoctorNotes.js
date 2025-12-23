/**
 * Doctor Notes Screen
 * Clinical notes editor with diagnosis entry (ICD-10 codes)
 * Includes voice-to-text for hands-free documentation
 */

import { useState, useEffect } from 'react';
import axios from '../../api/config';
import { useVoiceInput } from './VoiceInput';
import './DoctorNotes.css';

const COMMON_DIAGNOSES = [
  { code: 'J06.9', description: 'Acute upper respiratory infection' },
  { code: 'J18.9', description: 'Pneumonia, unspecified' },
  { code: 'K29.7', description: 'Gastritis, unspecified' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus' },
  { code: 'I10', description: 'Essential hypertension' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'R51', description: 'Headache' },
  { code: 'J02.9', description: 'Acute pharyngitis' },
  { code: 'N39.0', description: 'Urinary tract infection' },
  { code: 'K30', description: 'Functional dyspepsia' }
];

const DoctorNotes = ({ clinicId, patientId, visitId, onClose, onSave }) => {
  const [notes, setNotes] = useState({
    clinicalNotes: '',
    examination: '',
    impression: '',
    plan: ''
  });
  const [activeVoiceField, setActiveVoiceField] = useState(null);
  const [diagnoses, setDiagnoses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDiagnosisSearch, setShowDiagnosisSearch] = useState(false);

  // Voice input hook
  const { isListening, transcript, isSupported, start, stop } = useVoiceInput({
    language: 'en-IN',
    continuous: true,
    enableCommands: true,
    onResult: (text) => {
      if (activeVoiceField) {
        setNotes(prev => ({
          ...prev,
          [activeVoiceField]: prev[activeVoiceField] + (prev[activeVoiceField] ? ' ' : '') + text
        }));
      }
    }
  });

  const toggleVoice = (field) => {
    if (isListening && activeVoiceField === field) {
      stop();
      setActiveVoiceField(null);
    } else {
      if (isListening) stop();
      setActiveVoiceField(field);
      setTimeout(() => start(), 100);
    }
  };

  useEffect(() => {
    if (visitId) {
      fetchExistingNotes();
    } else {
      setLoading(false);
    }
  }, [visitId]);

  const fetchExistingNotes = async () => {
    try {
      const response = await axios.get(`/api/emr/visits/${visitId}/notes`);
      if (response.data.success && response.data.notes) {
        setNotes(response.data.notes);
        setDiagnoses(response.data.diagnoses || []);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        setError('Failed to load existing notes');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchDiagnosis = (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const filtered = COMMON_DIAGNOSES.filter(d =>
      d.code.toLowerCase().includes(query.toLowerCase()) ||
      d.description.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const addDiagnosis = (diagnosis, type = 'secondary') => {
    if (diagnoses.find(d => d.code === diagnosis.code)) return;
    
    setDiagnoses(prev => [...prev, { ...diagnosis, type }]);
    setSearchQuery('');
    setSearchResults([]);
    setShowDiagnosisSearch(false);
  };

  const removeDiagnosis = (code) => {
    setDiagnoses(prev => prev.filter(d => d.code !== code));
  };

  const setPrimaryDiagnosis = (code) => {
    setDiagnoses(prev => prev.map(d => ({
      ...d,
      type: d.code === code ? 'primary' : 'secondary'
    })));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await axios.post('/api/emr/visits/notes', {
        visitId,
        patientId,
        clinicId,
        ...notes,
        diagnoses
      });

      if (response.data.success) {
        onSave?.(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="doctor-notes">
        <div className="notes-loading">
          <div className="spinner"></div>
          <p>Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-notes">
      {/* Header */}
      <div className="notes-header">
        <h2>
          <span className="header-icon">📝</span>
          Clinical Notes & Diagnosis
        </h2>
        <div className="header-actions">
          {onClose && (
            <button className="btn-close" onClick={onClose}>×</button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="notes-content">
        {/* Voice Help */}
        {isSupported && (
          <div className="voice-help-banner">
            🎤 Click the mic button next to any field to dictate. Say "full stop" for period, "new line" for line break.
          </div>
        )}

        {/* Clinical Notes */}
        <div className="notes-section">
          <div className="section-label-row">
            <label>Clinical Notes</label>
            {isSupported && (
              <button
                type="button"
                className={`voice-btn ${isListening && activeVoiceField === 'clinicalNotes' ? 'active' : ''}`}
                onClick={() => toggleVoice('clinicalNotes')}
                title="Voice input"
              >
                {isListening && activeVoiceField === 'clinicalNotes' ? '⏹️' : '🎤'}
              </button>
            )}
          </div>
          <textarea
            value={notes.clinicalNotes}
            onChange={(e) => setNotes(prev => ({ ...prev, clinicalNotes: e.target.value }))}
            placeholder="Document patient's presenting complaints, history of present illness..."
            rows={4}
            className={isListening && activeVoiceField === 'clinicalNotes' ? 'listening' : ''}
          />
          {isListening && activeVoiceField === 'clinicalNotes' && (
            <div className="listening-indicator">🔴 Listening... {transcript}</div>
          )}
        </div>

        {/* Physical Examination */}
        <div className="notes-section">
          <div className="section-label-row">
            <label>Physical Examination</label>
            {isSupported && (
              <button
                type="button"
                className={`voice-btn ${isListening && activeVoiceField === 'examination' ? 'active' : ''}`}
                onClick={() => toggleVoice('examination')}
                title="Voice input"
              >
                {isListening && activeVoiceField === 'examination' ? '⏹️' : '🎤'}
              </button>
            )}
          </div>
          <textarea
            value={notes.examination}
            onChange={(e) => setNotes(prev => ({ ...prev, examination: e.target.value }))}
            placeholder="General appearance, vital signs, system-wise examination findings..."
            rows={4}
            className={isListening && activeVoiceField === 'examination' ? 'listening' : ''}
          />
          {isListening && activeVoiceField === 'examination' && (
            <div className="listening-indicator">🔴 Listening... {transcript}</div>
          )}
        </div>

        {/* Diagnosis Section */}
        <div className="notes-section diagnosis-section">
          <div className="section-header">
            <label>Diagnosis (ICD-10)</label>
            <button 
              className="btn-add-diagnosis"
              onClick={() => setShowDiagnosisSearch(true)}
            >
              + Add Diagnosis
            </button>
          </div>

          {/* Diagnosis List */}
          {diagnoses.length > 0 && (
            <div className="diagnosis-list">
              {diagnoses.map((d, idx) => (
                <div key={d.code} className={`diagnosis-item ${d.type}`}>
                  <div className="diagnosis-info">
                    <span className="diagnosis-code">{d.code}</span>
                    <span className="diagnosis-desc">{d.description}</span>
                  </div>
                  <div className="diagnosis-actions">
                    {d.type !== 'primary' && (
                      <button 
                        className="btn-primary-diagnosis"
                        onClick={() => setPrimaryDiagnosis(d.code)}
                        title="Set as primary"
                      >
                        ★
                      </button>
                    )}
                    {d.type === 'primary' && (
                      <span className="primary-badge">Primary</span>
                    )}
                    <button 
                      className="btn-remove-diagnosis"
                      onClick={() => removeDiagnosis(d.code)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Diagnosis Search */}
          {showDiagnosisSearch && (
            <div className="diagnosis-search">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchDiagnosis(e.target.value)}
                placeholder="Search by ICD-10 code or description..."
                autoFocus
              />
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map(d => (
                    <div 
                      key={d.code} 
                      className="search-result-item"
                      onClick={() => addDiagnosis(d)}
                    >
                      <span className="result-code">{d.code}</span>
                      <span className="result-desc">{d.description}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="common-diagnoses">
                <span className="common-label">Common:</span>
                {COMMON_DIAGNOSES.slice(0, 5).map(d => (
                  <button 
                    key={d.code}
                    className="common-diagnosis-btn"
                    onClick={() => addDiagnosis(d)}
                  >
                    {d.code}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Impression */}
        <div className="notes-section">
          <div className="section-label-row">
            <label>Clinical Impression</label>
            {isSupported && (
              <button
                type="button"
                className={`voice-btn ${isListening && activeVoiceField === 'impression' ? 'active' : ''}`}
                onClick={() => toggleVoice('impression')}
                title="Voice input"
              >
                {isListening && activeVoiceField === 'impression' ? '⏹️' : '🎤'}
              </button>
            )}
          </div>
          <textarea
            value={notes.impression}
            onChange={(e) => setNotes(prev => ({ ...prev, impression: e.target.value }))}
            placeholder="Summary of clinical findings and differential diagnosis..."
            rows={3}
            className={isListening && activeVoiceField === 'impression' ? 'listening' : ''}
          />
          {isListening && activeVoiceField === 'impression' && (
            <div className="listening-indicator">🔴 Listening... {transcript}</div>
          )}
        </div>

        {/* Plan */}
        <div className="notes-section">
          <div className="section-label-row">
            <label>Treatment Plan</label>
            {isSupported && (
              <button
                type="button"
                className={`voice-btn ${isListening && activeVoiceField === 'plan' ? 'active' : ''}`}
                onClick={() => toggleVoice('plan')}
                title="Voice input"
              >
                {isListening && activeVoiceField === 'plan' ? '⏹️' : '🎤'}
              </button>
            )}
          </div>
          <textarea
            value={notes.plan}
            onChange={(e) => setNotes(prev => ({ ...prev, plan: e.target.value }))}
            placeholder="Medications, investigations, follow-up instructions..."
            rows={3}
            className={isListening && activeVoiceField === 'plan' ? 'listening' : ''}
          />
          {isListening && activeVoiceField === 'plan' && (
            <div className="listening-indicator">🔴 Listening... {transcript}</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="notes-footer">
        <button className="btn-cancel" onClick={onClose}>
          Cancel
        </button>
        <button 
          className="btn-save" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : '💾 Save Notes'}
        </button>
      </div>
    </div>
  );
};

export default DoctorNotes;
