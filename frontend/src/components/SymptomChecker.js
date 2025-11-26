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
    <div className="symptom-checker-container">
      <div className="symptom-checker-card">
        <div className="symptom-header">
          <div className="symptom-icon">
            <i className="fas fa-stethoscope"></i>
          </div>
          <h3>AI Symptom Checker</h3>
          <p>Describe your symptoms and get instant AI-powered health recommendations</p>
        </div>

        <div className="symptom-input-section">
          <label>What symptoms are you experiencing?</label>
          <textarea
            className="symptom-input"
            placeholder="E.g., I have a persistent headache and mild fever for 2 days..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows="4"
          />
          
          <div className="quick-symptoms">
            <small className="text-muted">Quick add:</small>
            <div className="symptom-tags">
              {commonSymptoms.map(symptom => (
                <button
                  key={symptom}
                  className="symptom-tag"
                  onClick={() => addSymptom(symptom)}
                  type="button"
                >
                  + {symptom}
                </button>
              ))}
            </div>
          </div>

          <button
            className="analyze-btn"
            onClick={analyzeSymptoms}
            disabled={loading || !symptoms.trim()}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin me-2"></i>
                Analyzing...
              </>
            ) : (
              <>
                <i className="fas fa-brain me-2"></i>
                Analyze Symptoms
              </>
            )}
          </button>
        </div>

        {result && (
          <div className={`symptom-result severity-${result.severity}`}>
            <div className="result-header">
              <i className={`fas fa-${result.severity === 'high' ? 'exclamation-triangle' : result.severity === 'moderate' ? 'info-circle' : 'check-circle'}`}></i>
              <h4>Analysis Complete</h4>
            </div>
            
            <div className="result-content">
              <div className="result-item">
                <strong>Recommendation:</strong>
                <p>{result.recommendation}</p>
              </div>
              
              <div className="result-item">
                <strong>Suggested Specialty:</strong>
                <p>{result.suggestedSpecialty}</p>
              </div>
              
              <div className="result-item">
                <strong>Urgency:</strong>
                <p>{result.urgency}</p>
              </div>
            </div>

            <div className="result-actions">
              <button className="book-specialist-btn" onClick={onBookAppointment}>
                <i className="fas fa-calendar-check me-2"></i>
                Book {result.suggestedSpecialty} Now
              </button>
              <button className="secondary-btn" onClick={() => setResult(null)}>
                Check Different Symptoms
              </button>
            </div>

            <div className="disclaimer">
              <i className="fas fa-info-circle me-2"></i>
              <small>This is an AI-powered preliminary assessment. Always consult a healthcare professional for accurate diagnosis.</small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SymptomChecker;
