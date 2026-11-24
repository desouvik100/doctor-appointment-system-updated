import React from 'react';
import './AIRecommendations.css';

const AIRecommendations = ({ 
  recommendations = [], 
  onSelectSpecialization,
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="ai-rec-container loading">
        <div className="ai-rec-header">
          <span className="ai-icon">🤖</span>
          <h3>Analyzing symptoms...</h3>
        </div>
        <div className="ai-rec-loading">
          <div className="loading-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.85) return '#22c55e';
    if (confidence >= 0.7) return '#84cc16';
    if (confidence >= 0.5) return '#eab308';
    return '#94a3b8';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.85) return 'Highly Recommended';
    if (confidence >= 0.7) return 'Recommended';
    if (confidence >= 0.5) return 'Consider';
    return 'Optional';
  };

  return (
    <div className="ai-rec-container">
      <div className="ai-rec-header">
        <span className="ai-icon">🤖</span>
        <div>
          <h3>AI Doctor Recommendations</h3>
          <p>Based on your symptoms</p>
        </div>
      </div>

      <div className="ai-rec-list">
        {recommendations.map((rec, index) => (
          <div 
            key={index} 
            className={`ai-rec-card ${index === 0 ? 'primary' : ''}`}
            onClick={() => onSelectSpecialization && onSelectSpecialization(rec.specialization)}
          >
            <div className="rec-rank">#{index + 1}</div>
            <div className="rec-content">
              <div className="rec-spec-name">{rec.specialization}</div>
              {rec.reason && <div className="rec-reason">{rec.reason}</div>}
            </div>
            <div className="rec-confidence">
              <div 
                className="confidence-bar"
                style={{ 
                  width: `${rec.confidence * 100}%`,
                  backgroundColor: getConfidenceColor(rec.confidence)
                }}
              />
              <span 
                className="confidence-label"
                style={{ color: getConfidenceColor(rec.confidence) }}
              >
                {getConfidenceLabel(rec.confidence)}
              </span>
              <span className="confidence-percent">
                {Math.round(rec.confidence * 100)}%
              </span>
            </div>
            {onSelectSpecialization && (
              <div className="rec-action">
                <span className="action-arrow">→</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="ai-rec-disclaimer">
        <span className="disclaimer-icon">ℹ️</span>
        <p>
          These recommendations are based on AI analysis of your symptoms. 
          Please consult with a healthcare professional for proper diagnosis.
        </p>
      </div>
    </div>
  );
};

export default AIRecommendations;
