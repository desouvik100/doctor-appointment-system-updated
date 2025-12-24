/**
 * Smart Alert Panel Component
 * Displays ML-based patient deterioration risk alerts
 */

import { useState, useEffect } from 'react';
import axios from '../../api/config';
import './SmartAlertPanel.css';

const RISK_COLORS = {
  Critical: '#dc2626',
  'High Risk': '#ea580c',
  'Moderate Risk': '#ca8a04',
  'Low Risk': '#2563eb',
  'Minimal Risk': '#16a34a'
};

const SmartAlertPanel = ({ 
  patientId, 
  vitals, 
  labResults, 
  patient,
  recentVitals = [],
  compact = false,
  onAlertClick 
}) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (vitals || labResults?.length > 0) {
      fetchPrediction();
    }
  }, [vitals, labResults, patient]);

  const fetchPrediction = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/smart-alerts/predict', {
        patient,
        vitals,
        labResults,
        recentVitals
      });

      if (response.data.success) {
        setPrediction(response.data.prediction);
      }
    } catch (err) {
      setError('Failed to analyze patient risk');
      console.error('Smart alert error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`smart-alert-panel loading ${compact ? 'compact' : ''}`}>
        <div className="loading-indicator">
          <span className="spinner">🔄</span>
          Analyzing patient data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`smart-alert-panel error ${compact ? 'compact' : ''}`}>
        <span>⚠️ {error}</span>
        <button onClick={fetchPrediction}>Retry</button>
      </div>
    );
  }

  if (!prediction) {
    return null;
  }

  const riskColor = RISK_COLORS[prediction.riskLevel] || '#6b7280';
  const isHighRisk = prediction.riskScore >= 0.6;

  return (
    <div 
      className={`smart-alert-panel ${compact ? 'compact' : ''} ${isHighRisk ? 'high-risk' : ''}`}
      style={{ '--risk-color': riskColor }}
    >
      {/* Risk Score Header */}
      <div className="alert-header" onClick={() => setExpanded(!expanded)}>
        <div className="risk-indicator">
          <div 
            className="risk-score-circle"
            style={{ 
              background: `conic-gradient(${riskColor} ${prediction.riskScore * 360}deg, #e5e7eb 0deg)` 
            }}
          >
            <span className="score-value">{Math.round(prediction.riskScore * 100)}%</span>
          </div>
          <div className="risk-info">
            <span className="risk-level" style={{ color: riskColor }}>
              {prediction.riskLevel}
            </span>
            <span className="risk-action">{prediction.action}</span>
          </div>
        </div>
        
        {prediction.alerts?.length > 0 && (
          <div className="alert-count">
            <span className="count-badge">{prediction.alerts.length}</span>
            alerts
          </div>
        )}
        
        <button className="expand-btn">
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="alert-details">
          {/* NEWS2 Score */}
          {prediction.components?.news2 && (
            <div className="detail-section news2">
              <h4>📊 NEWS2 Score: {prediction.components.news2.score}</h4>
              <div className="news2-breakdown">
                {Object.entries(prediction.components.news2.breakdown).map(([param, score]) => (
                  <div key={param} className={`param-score ${score >= 2 ? 'high' : ''}`}>
                    <span className="param-name">{formatParamName(param)}</span>
                    <span className="param-value">{score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Alerts */}
          {prediction.alerts?.length > 0 && (
            <div className="detail-section alerts">
              <h4>🚨 Active Alerts</h4>
              <div className="alerts-list">
                {prediction.alerts.map((alert, idx) => (
                  <div 
                    key={idx} 
                    className={`alert-item ${alert.type}`}
                    onClick={() => onAlertClick?.(alert)}
                  >
                    <span className="alert-category">{alert.category}</span>
                    <span className="alert-title">{alert.title}</span>
                    <span className="alert-message">{alert.message}</span>
                    {alert.action && (
                      <span className="alert-action">→ {alert.action}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lab Alerts */}
          {prediction.components?.labAnalysis?.alerts?.length > 0 && (
            <div className="detail-section labs">
              <h4>🧪 Critical Lab Values</h4>
              <div className="lab-alerts">
                {prediction.components.labAnalysis.alerts.map((lab, idx) => (
                  <div key={idx} className="lab-alert">
                    <span className="lab-test">{lab.test}</span>
                    <span className="lab-value">{lab.value}</span>
                    <span className="lab-threshold">{lab.threshold}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Factors */}
          {prediction.components?.historyAnalysis?.riskFactors?.length > 0 && (
            <div className="detail-section risk-factors">
              <h4>⚠️ Risk Factors</h4>
              <div className="factors-list">
                {prediction.components.historyAnalysis.riskFactors.map((factor, idx) => (
                  <span key={idx} className={`factor-badge ${factor.weight}`}>
                    {factor.factor}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {prediction.recommendations?.length > 0 && (
            <div className="detail-section recommendations">
              <h4>📋 Recommendations</h4>
              <ul className="recommendations-list">
                {prediction.recommendations.map((rec, idx) => (
                  <li key={idx} className={`rec-item ${rec.urgency}`}>
                    <span className="rec-urgency">{rec.urgency}</span>
                    {rec.action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {isHighRisk && !compact && (
        <div className="quick-actions">
          <button className="action-btn emergency">
            🚨 Call Rapid Response
          </button>
          <button className="action-btn review">
            👨‍⚕️ Request Senior Review
          </button>
        </div>
      )}

      <div className="alert-footer">
        <span className="timestamp">
          Updated: {new Date(prediction.timestamp).toLocaleTimeString()}
        </span>
        <button className="refresh-btn" onClick={fetchPrediction}>
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};

function formatParamName(param) {
  const names = {
    respiratoryRate: 'Resp Rate',
    spo2: 'SpO2',
    temperature: 'Temp',
    systolicBP: 'Systolic BP',
    heartRate: 'Heart Rate',
    consciousness: 'Consciousness',
    supplementalOxygen: 'On O2'
  };
  return names[param] || param;
}

export default SmartAlertPanel;
