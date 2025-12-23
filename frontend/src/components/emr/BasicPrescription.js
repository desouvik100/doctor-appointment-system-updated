/**
 * Basic Prescription Screen
 * For creating and managing prescriptions in EMR
 * Includes drug interaction checking (Requirements: 5.1-5.8, 10.3)
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../api/config';
import DrugInteractionChecker from './DrugInteractionChecker';
import { AllergyAlertBanner } from './AllergyAlert';
import InteractionOverrideModal from './InteractionOverrideModal';
import { useVoiceInput } from './VoiceInput';
import './BasicPrescription.css';

const BasicPrescription = ({ 
  clinicId, 
  visitId, 
  patientId, 
  doctorId,
  existingPrescription,
  patientAllergies = [],
  currentMedications = [],
  onSave, 
  onClose 
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [medicineSearch, setMedicineSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Drug interaction state
  const [showInteractionChecker, setShowInteractionChecker] = useState(false);
  const [interactionResults, setInteractionResults] = useState(null);
  const [overrideModal, setOverrideModal] = useState({ isOpen: false, interaction: null });
  const [overriddenInteractions, setOverriddenInteractions] = useState(new Set());
  const [interactionCheckPending, setInteractionCheckPending] = useState(false);

  const [prescription, setPrescription] = useState({
    diagnosis: '',
    medicines: [],
    instructions: '',
    followUpDate: '',
    followUpNotes: ''
  });

  // Voice input for diagnosis and instructions
  const [activeVoiceField, setActiveVoiceField] = useState(null);
  const { isListening, transcript, isSupported, start, stop } = useVoiceInput({
    language: 'en-IN',
    continuous: true,
    enableCommands: true,
    onResult: (text) => {
      if (activeVoiceField === 'diagnosis') {
        setPrescription(prev => ({
          ...prev,
          diagnosis: prev.diagnosis + (prev.diagnosis ? ' ' : '') + text
        }));
      } else if (activeVoiceField === 'instructions') {
        setPrescription(prev => ({
          ...prev,
          instructions: prev.instructions + (prev.instructions ? ' ' : '') + text
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

  const [newMedicine, setNewMedicine] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    timing: 'after_food',
    notes: ''
  });

  useEffect(() => {
    if (existingPrescription) {
      setPrescription({
        diagnosis: existingPrescription.diagnosis || '',
        medicines: existingPrescription.medicines || [],
        instructions: existingPrescription.instructions || '',
        followUpDate: existingPrescription.followUpDate?.split('T')[0] || '',
        followUpNotes: existingPrescription.followUpNotes || ''
      });
    }
  }, [existingPrescription]);

  // Check interactions when medicines change
  useEffect(() => {
    if (prescription.medicines.length > 0) {
      setInteractionCheckPending(true);
    } else {
      setInteractionCheckPending(false);
      setInteractionResults(null);
    }
  }, [prescription.medicines]);

  // Search medicines
  const searchMedicines = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await axios.get('/api/medicines/search', {
        params: { q: query, limit: 10 }
      });
      setSearchResults(response.data.medicines || response.data || []);
    } catch (err) {
      console.error('Medicine search error:', err);
      // Fallback to common medicines
      setSearchResults(getCommonMedicines(query));
    } finally {
      setSearching(false);
    }
  };

  const getCommonMedicines = (query) => {
    const common = [
      'Paracetamol 500mg', 'Paracetamol 650mg',
      'Ibuprofen 400mg', 'Ibuprofen 200mg',
      'Amoxicillin 500mg', 'Amoxicillin 250mg',
      'Azithromycin 500mg', 'Azithromycin 250mg',
      'Cetirizine 10mg', 'Levocetirizine 5mg',
      'Omeprazole 20mg', 'Pantoprazole 40mg',
      'Metformin 500mg', 'Metformin 850mg',
      'Amlodipine 5mg', 'Amlodipine 10mg',
      'Atorvastatin 10mg', 'Atorvastatin 20mg',
      'Vitamin D3 60000IU', 'Vitamin B12',
      'Calcium + Vitamin D3', 'Iron + Folic Acid'
    ];
    return common
      .filter(m => m.toLowerCase().includes(query.toLowerCase()))
      .map(name => ({ name }));
  };

  const addMedicine = (medicine = null) => {
    const med = medicine || newMedicine;
    if (!med.name) {
      setError('Medicine name is required');
      return;
    }

    setPrescription(prev => ({
      ...prev,
      medicines: [...prev.medicines, { ...med, id: Date.now() }]
    }));

    setNewMedicine({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      timing: 'after_food',
      notes: ''
    });
    setMedicineSearch('');
    setSearchResults([]);
    
    // Trigger interaction check
    setInteractionCheckPending(true);
  };

  const removeMedicine = (id) => {
    setPrescription(prev => ({
      ...prev,
      medicines: prev.medicines.filter(m => m.id !== id)
    }));
    // Reset interaction results when medicines change
    setInteractionResults(null);
    setOverriddenInteractions(new Set());
  };

  // Handle interaction check results
  const handleInteractionsChecked = useCallback((results) => {
    setInteractionResults(results);
    setInteractionCheckPending(false);
    
    // Show checker if there are issues
    if ((results.interactions?.length > 0) || (results.allergyAlerts?.length > 0)) {
      setShowInteractionChecker(true);
    }
  }, []);

  // Handle interaction override
  const handleOverride = (overrideData) => {
    if (overrideData.interaction) {
      setOverriddenInteractions(prev => new Set([...prev, overrideData.interaction.id]));
    }
    setOverrideModal({ isOpen: false, interaction: null });
  };

  // Check if prescription can be saved
  const canSavePrescription = () => {
    if (!interactionResults) return true; // No check done yet
    
    const { interactions = [], allergyAlerts = [] } = interactionResults;
    
    // Check for unhandled contraindicated interactions
    const hasUnhandledContraindicated = interactions.some(i => 
      i.severity === 'contraindicated' && !overriddenInteractions.has(i.id)
    );
    
    // Check for unhandled severe allergy alerts
    const hasUnhandledAllergyAlerts = allergyAlerts.some(a => 
      a.severity === 'severe' && !overriddenInteractions.has(a.id || `allergy-${a.allergen}`)
    );
    
    return !hasUnhandledContraindicated && !hasUnhandledAllergyAlerts;
  };

  // Get save button state
  const getSaveButtonState = () => {
    if (saving) return { disabled: true, text: 'Saving...' };
    if (interactionCheckPending) return { disabled: true, text: 'Checking Interactions...' };
    if (!canSavePrescription()) return { disabled: true, text: 'Resolve Interactions First' };
    return { disabled: false, text: 'Save Prescription' };
  };

  const handleSave = async () => {
    if (prescription.medicines.length === 0) {
      setError('Add at least one medicine');
      return;
    }

    // Check for unresolved interactions
    if (!canSavePrescription()) {
      setError('Please resolve all contraindicated interactions before saving');
      setShowInteractionChecker(true);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        clinicId,
        visitId,
        patientId,
        doctorId,
        ...prescription
      };

      const response = existingPrescription?._id
        ? await axios.put(`/api/prescriptions/${existingPrescription._id}`, payload)
        : await axios.post('/api/prescriptions', payload);

      if (response.data.success || response.data.prescription) {
        setSuccess('Prescription saved successfully!');
        setTimeout(() => {
          onSave && onSave(response.data.prescription || response.data);
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const frequencyOptions = [
    { value: 'OD', label: 'Once daily (OD)' },
    { value: 'BD', label: 'Twice daily (BD)' },
    { value: 'TDS', label: 'Three times daily (TDS)' },
    { value: 'QID', label: 'Four times daily (QID)' },
    { value: 'SOS', label: 'As needed (SOS)' },
    { value: 'HS', label: 'At bedtime (HS)' },
    { value: 'STAT', label: 'Immediately (STAT)' }
  ];

  const timingOptions = [
    { value: 'before_food', label: 'Before food' },
    { value: 'after_food', label: 'After food' },
    { value: 'with_food', label: 'With food' },
    { value: 'empty_stomach', label: 'Empty stomach' },
    { value: 'any_time', label: 'Any time' }
  ];

  const saveButtonState = getSaveButtonState();

  return (
    <div className="basic-prescription">
      {/* Header */}
      <div className="prescription__header">
        <h2>
          <span className="header-icon">💊</span>
          {existingPrescription ? 'Edit Prescription' : 'New Prescription'}
        </h2>
        <div className="header-actions">
          {prescription.medicines.length > 0 && (
            <button 
              className="btn-check-interactions"
              onClick={() => setShowInteractionChecker(true)}
              title="Check drug interactions"
            >
              🔍 Check Interactions
            </button>
          )}
          <button className="btn-print" onClick={handlePrint}>
            🖨️ Print
          </button>
          {onClose && (
            <button className="btn-close" onClick={onClose}>×</button>
          )}
        </div>
      </div>

      {/* Allergy Banner */}
      {patientAllergies.length > 0 && (
        <AllergyAlertBanner 
          allergies={patientAllergies}
          maxDisplay={3}
        />
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Interaction Status Indicator */}
      {interactionResults && (
        <div className={`interaction-status ${
          interactionResults.interactions?.length > 0 || interactionResults.allergyAlerts?.length > 0
            ? 'has-issues'
            : 'clear'
        }`}>
          {interactionResults.interactions?.length > 0 || interactionResults.allergyAlerts?.length > 0 ? (
            <>
              <span className="status-icon">⚠️</span>
              <span className="status-text">
                {interactionResults.interactions?.length || 0} interaction(s), {' '}
                {interactionResults.allergyAlerts?.length || 0} allergy alert(s) found
              </span>
              <button 
                className="view-details-btn"
                onClick={() => setShowInteractionChecker(true)}
              >
                View Details
              </button>
            </>
          ) : (
            <>
              <span className="status-icon">✅</span>
              <span className="status-text">No drug interactions detected</span>
            </>
          )}
        </div>
      )}

      <div className="prescription__content">
        {/* Diagnosis */}
        <div className="prescription__section">
          <div className="section-header-row">
            <h3>Diagnosis</h3>
            {isSupported && (
              <button
                type="button"
                className={`voice-btn ${isListening && activeVoiceField === 'diagnosis' ? 'active' : ''}`}
                onClick={() => toggleVoice('diagnosis')}
                title="Voice input"
              >
                {isListening && activeVoiceField === 'diagnosis' ? '⏹️ Stop' : '🎤 Speak'}
              </button>
            )}
          </div>
          {isListening && activeVoiceField === 'diagnosis' && (
            <div className="listening-indicator">🔴 Listening... {transcript}</div>
          )}
          <textarea
            value={prescription.diagnosis}
            onChange={(e) => setPrescription({ ...prescription, diagnosis: e.target.value })}
            placeholder="Enter diagnosis or click 🎤 to speak..."
            rows="2"
            className={isListening && activeVoiceField === 'diagnosis' ? 'listening' : ''}
          />
        </div>

        {/* Add Medicine */}
        <div className="prescription__section">
          <h3>Medicines</h3>
          
          <div className="medicine-search">
            <input
              type="text"
              value={medicineSearch}
              onChange={(e) => {
                setMedicineSearch(e.target.value);
                searchMedicines(e.target.value);
              }}
              placeholder="Search medicine..."
            />
            {searching && <span className="searching">Searching...</span>}
            
            {searchResults.length > 0 && (
              <div className="search-dropdown">
                {searchResults.map((med, idx) => (
                  <div 
                    key={idx}
                    className="search-item"
                    onClick={() => {
                      setNewMedicine({ ...newMedicine, name: med.name });
                      setMedicineSearch(med.name);
                      setSearchResults([]);
                    }}
                  >
                    {med.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="medicine-form">
            <div className="form-row">
              <input
                type="text"
                value={newMedicine.name}
                onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                placeholder="Medicine name"
              />
              <input
                type="text"
                value={newMedicine.dosage}
                onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
                placeholder="Dosage (e.g., 500mg)"
              />
            </div>
            <div className="form-row">
              <select
                value={newMedicine.frequency}
                onChange={(e) => setNewMedicine({ ...newMedicine, frequency: e.target.value })}
              >
                <option value="">Frequency</option>
                {frequencyOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={newMedicine.duration}
                onChange={(e) => setNewMedicine({ ...newMedicine, duration: e.target.value })}
                placeholder="Duration (e.g., 5 days)"
              />
              <select
                value={newMedicine.timing}
                onChange={(e) => setNewMedicine({ ...newMedicine, timing: e.target.value })}
              >
                {timingOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <input
                type="text"
                value={newMedicine.notes}
                onChange={(e) => setNewMedicine({ ...newMedicine, notes: e.target.value })}
                placeholder="Special instructions (optional)"
                className="full-width"
              />
              <button className="btn-add" onClick={() => addMedicine()}>
                + Add
              </button>
            </div>
          </div>

          {/* Medicine List */}
          <div className="medicine-list">
            {prescription.medicines.length === 0 ? (
              <p className="no-medicines">No medicines added yet</p>
            ) : (
              prescription.medicines.map((med, idx) => (
                <div key={med.id || idx} className="medicine-item">
                  <div className="medicine-info">
                    <span className="medicine-number">{idx + 1}.</span>
                    <div className="medicine-details">
                      <strong>{med.name}</strong>
                      {med.dosage && <span className="dosage">{med.dosage}</span>}
                      <div className="medicine-schedule">
                        {med.frequency && <span>{med.frequency}</span>}
                        {med.duration && <span>× {med.duration}</span>}
                        {med.timing && (
                          <span className="timing">
                            ({timingOptions.find(t => t.value === med.timing)?.label || med.timing})
                          </span>
                        )}
                      </div>
                      {med.notes && <p className="medicine-notes">{med.notes}</p>}
                    </div>
                  </div>
                  <button 
                    className="btn-remove"
                    onClick={() => removeMedicine(med.id)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="prescription__section">
          <div className="section-header-row">
            <h3>General Instructions</h3>
            {isSupported && (
              <button
                type="button"
                className={`voice-btn ${isListening && activeVoiceField === 'instructions' ? 'active' : ''}`}
                onClick={() => toggleVoice('instructions')}
                title="Voice input"
              >
                {isListening && activeVoiceField === 'instructions' ? '⏹️ Stop' : '🎤 Speak'}
              </button>
            )}
          </div>
          {isListening && activeVoiceField === 'instructions' && (
            <div className="listening-indicator">🔴 Listening... {transcript}</div>
          )}
          <textarea
            value={prescription.instructions}
            onChange={(e) => setPrescription({ ...prescription, instructions: e.target.value })}
            placeholder="Diet, lifestyle, precautions... or click 🎤 to speak"
            rows="3"
            className={isListening && activeVoiceField === 'instructions' ? 'listening' : ''}
          />
        </div>

        {/* Follow-up */}
        <div className="prescription__section">
          <h3>Follow-up</h3>
          <div className="followup-row">
            <div className="form-group">
              <label>Follow-up Date</label>
              <input
                type="date"
                value={prescription.followUpDate}
                onChange={(e) => setPrescription({ ...prescription, followUpDate: e.target.value })}
              />
            </div>
            <div className="form-group flex-1">
              <label>Notes</label>
              <input
                type="text"
                value={prescription.followUpNotes}
                onChange={(e) => setPrescription({ ...prescription, followUpNotes: e.target.value })}
                placeholder="Follow-up instructions..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="prescription__actions">
        {onClose && (
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        )}
        <button 
          className="btn-primary" 
          onClick={handleSave}
          disabled={saveButtonState.disabled}
        >
          {saveButtonState.text}
        </button>
      </div>

      {/* Drug Interaction Checker Modal */}
      {showInteractionChecker && prescription.medicines.length > 0 && (
        <div className="interaction-checker-overlay">
          <div className="interaction-checker-modal">
            <DrugInteractionChecker
              drugs={prescription.medicines.map(m => m.name)}
              currentMedications={currentMedications}
              patientAllergies={patientAllergies}
              visitId={visitId}
              patientId={patientId}
              onInteractionsChecked={handleInteractionsChecked}
              onOverride={(data) => {
                handleOverride(data);
                setShowInteractionChecker(false);
              }}
              onCancel={() => setShowInteractionChecker(false)}
            />
          </div>
        </div>
      )}

      {/* Override Modal */}
      <InteractionOverrideModal
        isOpen={overrideModal.isOpen}
        interaction={overrideModal.interaction}
        visitId={visitId}
        patientId={patientId}
        onOverride={handleOverride}
        onCancel={() => setOverrideModal({ isOpen: false, interaction: null })}
      />
    </div>
  );
};

export default BasicPrescription;
