import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import './SymptomChip.css';

const DURATION_OPTIONS = [
  { value: 'days', label: '1-3 days' },
  { value: 'week', label: '~1 week' },
  { value: 'weeks', label: '2-3 weeks' },
  { value: 'month', label: '~1 month' },
  { value: 'months', label: '>1 month' }
];

const SymptomChip = ({ 
  symptom, 
  selected, 
  onToggle, 
  onDetailsChange,
  duration,
  severity,
  compact = false 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const triggerHaptic = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (e) {
        // Haptics not available
      }
    }
  };
  
  const handleToggle = () => {
    triggerHaptic();
    onToggle(symptom);
    if (!selected) {
      setShowDetails(true);
    } else {
      setShowDetails(false);
    }
  };
  
  const handleDurationChange = (value) => {
    triggerHaptic();
    onDetailsChange({ duration: value, severity: severity || 3 });
  };
  
  const handleSeverityChange = (value) => {
    triggerHaptic();
    onDetailsChange({ duration: duration || 'days', severity: value });
  };
  
  const getSeverityLabel = (val) => {
    const labels = ['', 'Mild', 'Mild-Mod', 'Moderate', 'Mod-Severe', 'Severe'];
    return labels[val] || '';
  };
  
  const getSeverityColor = (val) => {
    const colors = ['', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];
    return colors[val] || '#94a3b8';
  };

  return (
    <div className={`symptom-chip-container ${selected ? 'selected' : ''} ${compact ? 'compact' : ''}`}>
      <button 
        className={`symptom-chip ${selected ? 'active' : ''}`}
        onClick={handleToggle}
        type="button"
      >
        <span className="symptom-name">{symptom}</span>
        <span className={`symptom-indicator ${selected ? 'yes' : 'no'}`}>
          {selected ? '✓' : ''}
        </span>
      </button>
      
      {selected && showDetails && !compact && (
        <div className="symptom-details">
          <div className="detail-section">
            <label>Duration</label>
            <div className="duration-options">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`duration-btn ${duration === opt.value ? 'active' : ''}`}
                  onClick={() => handleDurationChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="detail-section">
            <label>Severity</label>
            <div className="severity-slider-container">
              <input
                type="range"
                min="1"
                max="5"
                value={severity || 3}
                onChange={(e) => handleSeverityChange(parseInt(e.target.value))}
                className="severity-slider"
                style={{ 
                  '--severity-color': getSeverityColor(severity || 3)
                }}
              />
              <div className="severity-labels">
                <span>Mild</span>
                <span 
                  className="severity-current"
                  style={{ color: getSeverityColor(severity || 3) }}
                >
                  {getSeverityLabel(severity || 3)}
                </span>
                <span>Severe</span>
              </div>
            </div>
          </div>
          
          <button 
            type="button"
            className="details-done-btn"
            onClick={() => setShowDetails(false)}
          >
            Done
          </button>
        </div>
      )}
      
      {selected && !showDetails && duration && (
        <div className="symptom-summary" onClick={() => setShowDetails(true)}>
          <span className="summary-duration">{DURATION_OPTIONS.find(d => d.value === duration)?.label}</span>
          <span 
            className="summary-severity"
            style={{ backgroundColor: getSeverityColor(severity || 3) }}
          >
            {getSeverityLabel(severity || 3)}
          </span>
        </div>
      )}
    </div>
  );
};

export default SymptomChip;
