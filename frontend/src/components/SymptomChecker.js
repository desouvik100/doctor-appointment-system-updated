import React, { useState } from 'react';
import './SymptomChecker.css';

const SymptomChecker = ({ onBookAppointment }) => {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const commonSymptoms = [
    'Headache', 'Fever', 'Cough', 'Fatigue', 
    'Chest Pain', 'Shortness of Breath', 'Nausea', 'Dizziness'
  ];

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ai/symptom-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        severity: 'moderate',
        recommendation: 'Please consult with a healthcare professional for proper diagnosis.',
        suggestedSpecialty: 'General Practitioner',
        urgency: 'Schedule an appointment within 24-48 hours'
      });
    }
    setLoading(false);
  };

  const addSymptom = (symptom) => {
    setSymptoms(prev => prev ? `${prev}, ${symptom}` : symptom);
  };

  return (
    <div className="symptom-checker">
      <div className="symptom-checker__header">
        <div className="symptom-checker__icon">
          <i className="fas fa-robot"></i>
        </div>
        <h3 className="symptom-checker__title">AI Symptom Checker</h3>
        <p className="symptom-checker__subtitle">Describe your symptoms and get instant AI-powered health recommendations</p>
      </div>

      <div className="symptom-checker__input-section">
        <label className="symptom-checker__label">What symptoms are you experiencing?</label>
        <textarea
          className="symptom-checker__textarea"
          placeholder="E.g., I have a persistent headache and mild fever for 2 days..."
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          rows="4"
        />
        
        <div className="symptom-checker__quick-add">
          <p className="symptom-checker__quick-label">Quick add:</p>
          <div className="symptom-checker__quick-buttons">
            {commonSymptoms.map(symptom => (
              <button
                key={symptom}
                className="symptom-checker__quick-btn"
                onClick={() => addSymptom(symptom)}
                type="button"
              >
                <i className="fas fa-plus"></i> {symptom}
              </button>
            ))}
          </div>
        </div>

        <button
          className="symptom-checker__analyze-btn"
          onClick={analyzeSymptoms}
          disabled={loading || !symptoms.trim()}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Analyzing...
            </>
          ) : (
            <>
              <i className="fas fa-search"></i>
              Analyze Symptoms
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="symptom-checker__result">
          <div className="symptom-checker__result-header">
            <i className="fas fa-check-circle"></i>
            <h4>Analysis Complete</h4>
          </div>
          
          <div className="symptom-checker__result-content">
            <div className="symptom-checker__result-item">
              <strong>Recommendation:</strong>
              <p>{result.recommendation}</p>
            </div>
            
            <div className="symptom-checker__result-item">
              <strong>Suggested Specialty:</strong>
              <p>{result.suggestedSpecialty}</p>
            </div>
            
            <div className="symptom-checker__result-item">
              <strong>Urgency:</strong>
              <p>{result.urgency}</p>
            </div>
          </div>

          <div className="symptom-checker__actions">
            <button className="symptom-checker__action-btn symptom-checker__action-btn--primary" onClick={onBookAppointment}>
              <i className="fas fa-calendar-plus"></i>
              Book {result.suggestedSpecialty} Now
            </button>
            <button className="symptom-checker__action-btn symptom-checker__action-btn--secondary" onClick={() => setResult(null)}>
              <i className="fas fa-redo"></i>
              Check Different Symptoms
            </button>
          </div>

          <div className="symptom-checker__disclaimer">
            <i className="fas fa-exclamation-triangle"></i>
            <small>This is an AI-powered preliminary assessment. Always consult a healthcare professional for accurate diagnosis.</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;


