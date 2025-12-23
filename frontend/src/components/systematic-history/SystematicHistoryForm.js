import React, { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import SymptomChip from './SymptomChip';
import axios from '../../api/config';
import './SystematicHistoryForm.css';

// Body systems configuration (will be fetched from backend)
const DEFAULT_BODY_SYSTEMS = {
  general: { name: 'General', icon: '🌡️', order: 1, symptoms: ['Fever', 'Fatigue', 'Weight Loss', 'Weakness', 'Appetite Changes'] },
  respiratory: { name: 'Respiratory', icon: '🫁', order: 2, symptoms: ['Cough', 'Breathlessness', 'Wheezing', 'Chest Tightness'] },
  cardiovascular: { name: 'Cardiovascular', icon: '❤️', order: 3, symptoms: ['Chest Pain', 'Palpitations', 'Leg Swelling', 'Dizziness'] },
  gastrointestinal: { name: 'Gastrointestinal', icon: '🫃', order: 4, symptoms: ['Nausea', 'Vomiting', 'Abdominal Pain', 'Diarrhea', 'Constipation'] },
  genitourinary: { name: 'Genitourinary', icon: '🚿', order: 5, symptoms: ['Painful Urination', 'Frequent Urination', 'Blood in Urine'] },
  neurological: { name: 'Neurological', icon: '🧠', order: 6, symptoms: ['Headache', 'Dizziness', 'Numbness', 'Vision Changes'] },
  musculoskeletal: { name: 'Musculoskeletal', icon: '🦴', order: 7, symptoms: ['Joint Pain', 'Muscle Pain', 'Stiffness', 'Back Pain'] },
  skin: { name: 'Skin', icon: '🖐️', order: 8, symptoms: ['Rash', 'Itching', 'Discoloration', 'Hair Loss'] },
  endocrine: { name: 'Endocrine', icon: '⚖️', order: 9, symptoms: ['Excessive Thirst', 'Heat Intolerance', 'Cold Intolerance', 'Mood Changes'] }
};

const STEPS = [
  { id: 'chief', title: 'Chief Complaint', type: 'text' },
  { id: 'general', title: 'General', type: 'symptoms' },
  { id: 'respiratory', title: 'Respiratory', type: 'symptoms' },
  { id: 'cardiovascular', title: 'Cardiovascular', type: 'symptoms' },
  { id: 'gastrointestinal', title: 'Gastrointestinal', type: 'symptoms' },
  { id: 'genitourinary', title: 'Genitourinary', type: 'symptoms' },
  { id: 'neurological', title: 'Neurological', type: 'symptoms' },
  { id: 'musculoskeletal', title: 'Musculoskeletal', type: 'symptoms' },
  { id: 'skin', title: 'Skin', type: 'symptoms' },
  { id: 'endocrine', title: 'Endocrine', type: 'symptoms' },
  { id: 'pastHistory', title: 'Past History', type: 'history' },
  { id: 'medications', title: 'Medications', type: 'medications' },
  { id: 'allergies', title: 'Allergies', type: 'allergies' },
  { id: 'review', title: 'Review', type: 'review' }
];

const SystematicHistoryForm = ({ 
  userId, 
  appointmentId, 
  onComplete, 
  onSkip,
  previousHistory 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [bodySystems, setBodySystems] = useState(DEFAULT_BODY_SYSTEMS);
  const [commonConditions, setCommonConditions] = useState([]);
  const [commonMedications, setCommonMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '' });
  
  // Form data state
  const [formData, setFormData] = useState({
    chiefComplaint: '',
    general: { symptoms: [], reviewed: false },
    respiratory: { symptoms: [], reviewed: false },
    cardiovascular: { symptoms: [], reviewed: false },
    gastrointestinal: { symptoms: [], reviewed: false },
    genitourinary: { symptoms: [], reviewed: false },
    neurological: { symptoms: [], reviewed: false },
    musculoskeletal: { symptoms: [], reviewed: false },
    skin: { symptoms: [], reviewed: false },
    endocrine: { symptoms: [], reviewed: false },
    pastHistory: { conditions: [], surgeries: [], hospitalizations: [] },
    currentMedications: [],
    allergies: { drugs: [], food: [], other: [] },
    additionalNotes: ''
  });

  // Fetch configuration from backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get('/api/systematic-history/config');
        if (response.data.success) {
          setBodySystems(response.data.bodySystems || DEFAULT_BODY_SYSTEMS);
          setCommonConditions(response.data.commonConditions || []);
          setCommonMedications(response.data.commonMedications || []);
        }
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    };
    fetchConfig();
  }, []);

  // Pre-fill from previous history
  useEffect(() => {
    if (previousHistory) {
      setFormData(prev => ({
        ...prev,
        pastHistory: previousHistory.pastHistory || prev.pastHistory,
        currentMedications: previousHistory.currentMedications || prev.currentMedications,
        allergies: previousHistory.allergies || prev.allergies
      }));
    }
  }, [previousHistory]);

  // Auto-save to localStorage
  useEffect(() => {
    const saveKey = `systematic_history_draft_${userId}`;
    localStorage.setItem(saveKey, JSON.stringify(formData));
  }, [formData, userId]);

  // Load draft on mount
  useEffect(() => {
    const saveKey = `systematic_history_draft_${userId}`;
    const saved = localStorage.getItem(saveKey);
    if (saved && !previousHistory) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
      } catch (e) {
        // Invalid saved data
      }
    }
  }, [userId, previousHistory]);

  const triggerHaptic = async (style = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style });
      } catch (e) {}
    }
  };

  const handleSymptomToggle = useCallback((system, symptomName) => {
    setFormData(prev => {
      const systemData = prev[system] || { symptoms: [], reviewed: false };
      const existingIndex = systemData.symptoms.findIndex(s => s.name === symptomName);
      
      let newSymptoms;
      if (existingIndex >= 0) {
        // Remove symptom
        newSymptoms = systemData.symptoms.filter(s => s.name !== symptomName);
      } else {
        // Add symptom
        newSymptoms = [...systemData.symptoms, { 
          name: symptomName, 
          present: true, 
          duration: 'days', 
          severity: 3 
        }];
      }
      
      return {
        ...prev,
        [system]: { ...systemData, symptoms: newSymptoms }
      };
    });
  }, []);

  const handleSymptomDetails = useCallback((system, symptomName, details) => {
    setFormData(prev => {
      const systemData = prev[system] || { symptoms: [], reviewed: false };
      const newSymptoms = systemData.symptoms.map(s => 
        s.name === symptomName ? { ...s, ...details } : s
      );
      return {
        ...prev,
        [system]: { ...systemData, symptoms: newSymptoms }
      };
    });
  }, []);

  const handleNext = () => {
    triggerHaptic();
    // Mark current system as reviewed
    const currentStepData = STEPS[currentStep];
    if (currentStepData.type === 'symptoms') {
      setFormData(prev => ({
        ...prev,
        [currentStepData.id]: { ...prev[currentStepData.id], reviewed: true }
      }));
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    triggerHaptic();
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSkipSection = () => {
    triggerHaptic();
    const currentStepData = STEPS[currentStep];
    if (currentStepData.type === 'symptoms') {
      setFormData(prev => ({
        ...prev,
        [currentStepData.id]: { symptoms: [], reviewed: true, notes: '' }
      }));
    }
    handleNext();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    triggerHaptic(ImpactStyle.Medium);
    
    try {
      const response = await axios.post('/api/systematic-history', {
        ...formData,
        appointmentId
      });
      
      if (response.data.success) {
        // Clear draft
        localStorage.removeItem(`systematic_history_draft_${userId}`);
        
        triggerHaptic(ImpactStyle.Heavy);
        onComplete(response.data.history, response.data.recommendations);
      }
    } catch (error) {
      console.error('Error submitting history:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderProgressBar = () => {
    const progress = ((currentStep + 1) / STEPS.length) * 100;
    return (
      <div className="sh-progress-container">
        <div className="sh-progress-bar">
          <div className="sh-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="sh-progress-text">
          Step {currentStep + 1} of {STEPS.length}
        </div>
      </div>
    );
  };

  const renderStepIndicators = () => (
    <div className="sh-step-indicators">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const hasSymptoms = step.type === 'symptoms' && 
          formData[step.id]?.symptoms?.length > 0;
        
        return (
          <div 
            key={step.id}
            className={`sh-step-dot ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${hasSymptoms ? 'has-data' : ''}`}
            onClick={() => index <= currentStep && setCurrentStep(index)}
          />
        );
      })}
    </div>
  );

  const renderChiefComplaint = () => (
    <div className="sh-step-content">
      <h3 className="sh-step-title">What brings you in today?</h3>
      <p className="sh-step-subtitle">Describe your main concern in a few words</p>
      <textarea
        className="sh-chief-complaint"
        placeholder="e.g., Persistent headache for 3 days, Stomach pain after eating..."
        value={formData.chiefComplaint}
        onChange={(e) => setFormData(prev => ({ ...prev, chiefComplaint: e.target.value }))}
        rows={4}
      />
    </div>
  );

  const renderSymptomSection = (systemKey) => {
    const system = bodySystems[systemKey];
    if (!system) return null;
    
    const systemData = formData[systemKey] || { symptoms: [], reviewed: false };
    const selectedSymptoms = systemData.symptoms || [];
    
    return (
      <div className="sh-step-content">
        <div className="sh-system-header">
          <span className="sh-system-icon">{system.icon}</span>
          <h3 className="sh-step-title">{system.name} Symptoms</h3>
        </div>
        <p className="sh-step-subtitle">Select any symptoms you're experiencing</p>
        
        <div className="sh-symptoms-grid">
          {system.symptoms.map(symptom => {
            const selected = selectedSymptoms.find(s => s.name === symptom);
            return (
              <SymptomChip
                key={symptom}
                symptom={symptom}
                selected={!!selected}
                duration={selected?.duration}
                severity={selected?.severity}
                onToggle={() => handleSymptomToggle(systemKey, symptom)}
                onDetailsChange={(details) => handleSymptomDetails(systemKey, symptom, details)}
              />
            );
          })}
        </div>
        
        {selectedSymptoms.length === 0 && (
          <button 
            type="button" 
            className="sh-skip-btn"
            onClick={handleSkipSection}
          >
            No symptoms in this area → Skip
          </button>
        )}
      </div>
    );
  };

  const renderPastHistory = () => (
    <div className="sh-step-content">
      <h3 className="sh-step-title">Past Medical History</h3>
      <p className="sh-step-subtitle">Select any conditions you have or had</p>
      
      <div className="sh-condition-chips">
        {commonConditions.map(condition => {
          const isSelected = formData.pastHistory.conditions.includes(condition);
          return (
            <button
              key={condition}
              type="button"
              className={`sh-condition-chip ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                triggerHaptic();
                setFormData(prev => ({
                  ...prev,
                  pastHistory: {
                    ...prev.pastHistory,
                    conditions: isSelected 
                      ? prev.pastHistory.conditions.filter(c => c !== condition)
                      : [...prev.pastHistory.conditions, condition]
                  }
                }));
              }}
            >
              {condition}
              {isSelected && <span className="check">✓</span>}
            </button>
          );
        })}
      </div>
      
      <div className="sh-input-group">
        <label>Other conditions (comma separated)</label>
        <input
          type="text"
          placeholder="e.g., PCOS, Migraine"
          onBlur={(e) => {
            const others = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
            setFormData(prev => ({
              ...prev,
              pastHistory: {
                ...prev.pastHistory,
                conditions: [...new Set([...prev.pastHistory.conditions, ...others])]
              }
            }));
          }}
        />
      </div>
    </div>
  );

  const renderMedications = () => {
    return (
      <div className="sh-step-content">
        <h3 className="sh-step-title">Current Medications</h3>
        <p className="sh-step-subtitle">List medicines you're currently taking</p>
        
        {formData.currentMedications.length > 0 && (
          <div className="sh-medications-list">
            {formData.currentMedications.map((med, index) => (
              <div key={index} className="sh-medication-item">
                <span className="med-name">{med.name}</span>
                {med.dosage && <span className="med-dosage">{med.dosage}</span>}
                {med.frequency && <span className="med-freq">{med.frequency}</span>}
                <button 
                  type="button"
                  className="med-remove"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      currentMedications: prev.currentMedications.filter((_, i) => i !== index)
                    }));
                  }}
                >×</button>
              </div>
            ))}
          </div>
        )}
        
        <div className="sh-add-medication">
          <input
            type="text"
            placeholder="Medicine name"
            list="medication-suggestions"
            value={newMed.name}
            onChange={(e) => setNewMed(prev => ({ ...prev, name: e.target.value }))}
          />
          <datalist id="medication-suggestions">
            {commonMedications.map(med => (
              <option key={med} value={med} />
            ))}
          </datalist>
          <input
            type="text"
            placeholder="Dosage"
            value={newMed.dosage}
            onChange={(e) => setNewMed(prev => ({ ...prev, dosage: e.target.value }))}
          />
          <button
            type="button"
            className="sh-add-btn"
            onClick={() => {
              if (newMed.name.trim()) {
                setFormData(prev => ({
                  ...prev,
                  currentMedications: [...prev.currentMedications, newMed]
                }));
                setNewMed({ name: '', dosage: '', frequency: '' });
              }
            }}
          >
            + Add
          </button>
        </div>
      </div>
    );
  };

  const renderAllergies = () => (
    <div className="sh-step-content">
      <h3 className="sh-step-title">Allergies</h3>
      <p className="sh-step-subtitle">List any known allergies</p>
      
      <div className="sh-allergy-section">
        <label>Drug Allergies</label>
        <input
          type="text"
          placeholder="e.g., Penicillin, Sulfa drugs"
          value={formData.allergies.drugs.join(', ')}
          onChange={(e) => {
            const drugs = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
            setFormData(prev => ({
              ...prev,
              allergies: { ...prev.allergies, drugs }
            }));
          }}
        />
      </div>
      
      <div className="sh-allergy-section">
        <label>Food Allergies</label>
        <input
          type="text"
          placeholder="e.g., Peanuts, Shellfish"
          value={formData.allergies.food.join(', ')}
          onChange={(e) => {
            const food = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
            setFormData(prev => ({
              ...prev,
              allergies: { ...prev.allergies, food }
            }));
          }}
        />
      </div>
      
      <div className="sh-allergy-section">
        <label>Other Allergies</label>
        <input
          type="text"
          placeholder="e.g., Latex, Dust"
          value={formData.allergies.other.join(', ')}
          onChange={(e) => {
            const other = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
            setFormData(prev => ({
              ...prev,
              allergies: { ...prev.allergies, other }
            }));
          }}
        />
      </div>
    </div>
  );

  const renderReview = () => {
    const affectedSystems = Object.keys(bodySystems).filter(
      key => formData[key]?.symptoms?.length > 0
    );
    
    return (
      <div className="sh-step-content sh-review">
        <h3 className="sh-step-title">Review Your Information</h3>
        
        {formData.chiefComplaint && (
          <div className="sh-review-section">
            <h4>Chief Complaint</h4>
            <p>{formData.chiefComplaint}</p>
          </div>
        )}
        
        <div className="sh-review-section">
          <h4>Symptoms by System</h4>
          {affectedSystems.length > 0 ? (
            <div className="sh-review-systems">
              {affectedSystems.map(system => (
                <div key={system} className="sh-review-system">
                  <span className="system-icon">{bodySystems[system].icon}</span>
                  <span className="system-name">{bodySystems[system].name}:</span>
                  <span className="system-symptoms">
                    {formData[system].symptoms.map(s => s.name).join(', ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-symptoms">No symptoms reported</p>
          )}
        </div>
        
        {formData.pastHistory.conditions.length > 0 && (
          <div className="sh-review-section">
            <h4>Past History</h4>
            <p>{formData.pastHistory.conditions.join(', ')}</p>
          </div>
        )}
        
        {formData.currentMedications.length > 0 && (
          <div className="sh-review-section">
            <h4>Current Medications</h4>
            <p>{formData.currentMedications.map(m => m.name).join(', ')}</p>
          </div>
        )}
        
        {(formData.allergies.drugs.length > 0 || formData.allergies.food.length > 0) && (
          <div className="sh-review-section sh-allergies-warning">
            <h4>⚠️ Allergies</h4>
            <p>
              {[...formData.allergies.drugs, ...formData.allergies.food, ...formData.allergies.other].join(', ')}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderCurrentStep = () => {
    const step = STEPS[currentStep];
    
    switch (step.type) {
      case 'text':
        return renderChiefComplaint();
      case 'symptoms':
        return renderSymptomSection(step.id);
      case 'history':
        return renderPastHistory();
      case 'medications':
        return renderMedications();
      case 'allergies':
        return renderAllergies();
      case 'review':
        return renderReview();
      default:
        return null;
    }
  };

  return (
    <div className="systematic-history-form">
      <div className="sh-header">
        <h2>📋 Health History</h2>
        {onSkip && (
          <button type="button" className="sh-skip-all" onClick={onSkip}>
            Skip for now
          </button>
        )}
      </div>
      
      {renderProgressBar()}
      {renderStepIndicators()}
      
      <div className="sh-form-body">
        {renderCurrentStep()}
      </div>
      
      <div className="sh-navigation">
        {currentStep > 0 && (
          <button type="button" className="sh-nav-btn back" onClick={handleBack}>
            ← Back
          </button>
        )}
        
        {currentStep < STEPS.length - 1 ? (
          <button type="button" className="sh-nav-btn next" onClick={handleNext}>
            Next →
          </button>
        ) : (
          <button 
            type="button" 
            className="sh-nav-btn submit" 
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : '✓ Submit History'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SystematicHistoryForm;
