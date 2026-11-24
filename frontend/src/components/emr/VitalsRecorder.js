/**
 * VitalsRecorder Component
 * Records patient vital signs with real-time validation and abnormal highlighting
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */

import React, { useState, useEffect, useCallback } from 'react';
import SmartAlertPanel from './SmartAlertPanel';
import './VitalsRecorder.css';

// Validation ranges matching backend
const VITAL_RANGES = {
  bloodPressure: {
    systolic: { validMin: 60, validMax: 250, normalMin: 90, normalMax: 140, criticalLow: 80, criticalHigh: 180 },
    diastolic: { validMin: 40, validMax: 150, normalMin: 60, normalMax: 90, criticalLow: 50, criticalHigh: 120 }
  },
  pulse: { validMin: 30, validMax: 220, normalMin: 60, normalMax: 100, criticalLow: 40, criticalHigh: 150 },
  temperature: {
    F: { validMin: 95, validMax: 108, normalMin: 97, normalMax: 99.5, criticalLow: 95, criticalHigh: 104 },
    C: { validMin: 35, validMax: 42, normalMin: 36.1, normalMax: 37.5, criticalLow: 35, criticalHigh: 40 }
  },
  spo2: { validMin: 70, validMax: 100, normalMin: 95, normalMax: 100, criticalLow: 90 },
  respiratoryRate: { validMin: 8, validMax: 60, normalMin: 12, normalMax: 20, criticalLow: 8, criticalHigh: 30 },
  bloodSugar: {
    fasting: { validMin: 50, validMax: 500, normalMin: 70, normalMax: 100, criticalLow: 50, criticalHigh: 400 },
    random: { validMin: 50, validMax: 500, normalMin: 70, normalMax: 140, criticalLow: 50, criticalHigh: 400 },
    postMeal: { validMin: 50, validMax: 500, normalMin: 70, normalMax: 140, criticalLow: 50, criticalHigh: 400 }
  }
};

const VitalsRecorder = ({ visitId, patientId, patient, onSave, onCancel, initialVitals = null }) => {
  const [vitals, setVitals] = useState({
    bloodPressure: { systolic: '', diastolic: '' },
    pulse: { value: '' },
    temperature: { value: '', unit: 'F' },
    spo2: { value: '' },
    respiratoryRate: { value: '' },
    bloodSugar: { value: '', type: 'random' },
    weight: { value: '', unit: 'kg' },
    height: { value: '', unit: 'cm' }
  });
  
  const [validation, setValidation] = useState({ errors: {}, warnings: {}, criticals: {} });
  const [bmi, setBmi] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showSmartAlert, setShowSmartAlert] = useState(false);
  const [savedVitals, setSavedVitals] = useState(null);

  // Initialize with existing vitals
  useEffect(() => {
    if (initialVitals) {
      setVitals(prev => ({
        ...prev,
        bloodPressure: initialVitals.bloodPressure || prev.bloodPressure,
        pulse: initialVitals.pulse || prev.pulse,
        temperature: initialVitals.temperature || prev.temperature,
        spo2: initialVitals.spo2 || prev.spo2,
        respiratoryRate: initialVitals.respiratoryRate || prev.respiratoryRate,
        bloodSugar: initialVitals.bloodSugar || prev.bloodSugar,
        weight: initialVitals.weight || prev.weight,
        height: initialVitals.height || prev.height
      }));
    }
  }, [initialVitals]);

  // Validate a single vital value
  const validateValue = useCallback((type, value, options = {}) => {
    if (value === '' || value === null || value === undefined) {
      return { valid: true, status: 'empty' };
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return { valid: false, status: 'invalid', message: 'Invalid number' };
    }

    let range;
    switch (type) {
      case 'systolic':
        range = VITAL_RANGES.bloodPressure.systolic;
        break;
      case 'diastolic':
        range = VITAL_RANGES.bloodPressure.diastolic;
        break;
      case 'pulse':
        range = VITAL_RANGES.pulse;
        break;
      case 'temperature':
        range = VITAL_RANGES.temperature[options.unit || 'F'];
        break;
      case 'spo2':
        range = VITAL_RANGES.spo2;
        break;
      case 'respiratoryRate':
        range = VITAL_RANGES.respiratoryRate;
        break;
      case 'bloodSugar':
        range = VITAL_RANGES.bloodSugar[options.type || 'random'];
        break;
      default:
        return { valid: true, status: 'normal' };
    }

    if (numValue < range.validMin || numValue > range.validMax) {
      return { valid: false, status: 'invalid', message: `Must be ${range.validMin}-${range.validMax}` };
    }

    if (range.criticalLow && numValue <= range.criticalLow) {
      return { valid: true, status: 'critical', direction: 'low' };
    }
    if (range.criticalHigh && numValue >= range.criticalHigh) {
      return { valid: true, status: 'critical', direction: 'high' };
    }
    if (numValue < range.normalMin) {
      return { valid: true, status: 'abnormal', direction: 'low' };
    }
    if (numValue > range.normalMax) {
      return { valid: true, status: 'abnormal', direction: 'high' };
    }

    return { valid: true, status: 'normal' };
  }, []);

  // Calculate BMI
  const calculateBMI = useCallback((weight, weightUnit, height, heightUnit) => {
    if (!weight || !height) return null;
    
    let weightKg = parseFloat(weight);
    let heightCm = parseFloat(height);
    
    if (isNaN(weightKg) || isNaN(heightCm) || heightCm === 0) return null;
    
    if (weightUnit === 'lbs') weightKg = weightKg / 2.20462;
    if (heightUnit === 'ft') heightCm = heightCm * 30.48;
    
    const heightM = heightCm / 100;
    return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  }, []);

  // Update validation when vitals change
  useEffect(() => {
    const newErrors = {};
    const newWarnings = {};
    const newCriticals = {};

    // Validate BP
    const sysResult = validateValue('systolic', vitals.bloodPressure.systolic);
    const diaResult = validateValue('diastolic', vitals.bloodPressure.diastolic);
    if (!sysResult.valid) newErrors.systolic = sysResult.message;
    if (!diaResult.valid) newErrors.diastolic = diaResult.message;
    if (sysResult.status === 'abnormal') newWarnings.systolic = sysResult.direction;
    if (diaResult.status === 'abnormal') newWarnings.diastolic = diaResult.direction;
    if (sysResult.status === 'critical') newCriticals.systolic = sysResult.direction;
    if (diaResult.status === 'critical') newCriticals.diastolic = diaResult.direction;

    // Validate pulse
    const pulseResult = validateValue('pulse', vitals.pulse.value);
    if (!pulseResult.valid) newErrors.pulse = pulseResult.message;
    if (pulseResult.status === 'abnormal') newWarnings.pulse = pulseResult.direction;
    if (pulseResult.status === 'critical') newCriticals.pulse = pulseResult.direction;

    // Validate temperature
    const tempResult = validateValue('temperature', vitals.temperature.value, { unit: vitals.temperature.unit });
    if (!tempResult.valid) newErrors.temperature = tempResult.message;
    if (tempResult.status === 'abnormal') newWarnings.temperature = tempResult.direction;
    if (tempResult.status === 'critical') newCriticals.temperature = tempResult.direction;

    // Validate SpO2
    const spo2Result = validateValue('spo2', vitals.spo2.value);
    if (!spo2Result.valid) newErrors.spo2 = spo2Result.message;
    if (spo2Result.status === 'abnormal') newWarnings.spo2 = spo2Result.direction;
    if (spo2Result.status === 'critical') newCriticals.spo2 = spo2Result.direction;

    // Validate respiratory rate
    const rrResult = validateValue('respiratoryRate', vitals.respiratoryRate.value);
    if (!rrResult.valid) newErrors.respiratoryRate = rrResult.message;
    if (rrResult.status === 'abnormal') newWarnings.respiratoryRate = rrResult.direction;
    if (rrResult.status === 'critical') newCriticals.respiratoryRate = rrResult.direction;

    // Validate blood sugar
    const bsResult = validateValue('bloodSugar', vitals.bloodSugar.value, { type: vitals.bloodSugar.type });
    if (!bsResult.valid) newErrors.bloodSugar = bsResult.message;
    if (bsResult.status === 'abnormal') newWarnings.bloodSugar = bsResult.direction;
    if (bsResult.status === 'critical') newCriticals.bloodSugar = bsResult.direction;

    setValidation({ errors: newErrors, warnings: newWarnings, criticals: newCriticals });

    // Calculate BMI
    const newBmi = calculateBMI(vitals.weight.value, vitals.weight.unit, vitals.height.value, vitals.height.unit);
    setBmi(newBmi);
  }, [vitals, validateValue, calculateBMI]);

  // Handle input changes
  const handleChange = (field, subfield, value) => {
    setVitals(prev => ({
      ...prev,
      [field]: { ...prev[field], [subfield]: value }
    }));
  };

  // Temperature conversion
  const convertTemperature = (value, fromUnit, toUnit) => {
    if (!value || fromUnit === toUnit) return value;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    
    if (fromUnit === 'F' && toUnit === 'C') {
      return Math.round(((numValue - 32) * 5 / 9) * 10) / 10;
    } else {
      return Math.round((numValue * 9 / 5 + 32) * 10) / 10;
    }
  };

  const handleTempUnitToggle = () => {
    const newUnit = vitals.temperature.unit === 'F' ? 'C' : 'F';
    const convertedValue = convertTemperature(vitals.temperature.value, vitals.temperature.unit, newUnit);
    setVitals(prev => ({
      ...prev,
      temperature: { value: convertedValue, unit: newUnit }
    }));
  };

  // Weight conversion
  const handleWeightUnitToggle = () => {
    const newUnit = vitals.weight.unit === 'kg' ? 'lbs' : 'kg';
    let convertedValue = vitals.weight.value;
    if (vitals.weight.value) {
      const numValue = parseFloat(vitals.weight.value);
      if (!isNaN(numValue)) {
        convertedValue = newUnit === 'lbs' 
          ? Math.round(numValue * 2.20462 * 10) / 10
          : Math.round(numValue / 2.20462 * 10) / 10;
      }
    }
    setVitals(prev => ({
      ...prev,
      weight: { value: convertedValue, unit: newUnit }
    }));
  };

  // Get input class based on validation status
  const getInputClass = (field) => {
    if (validation.criticals[field]) return 'vitals-input vitals-critical';
    if (validation.warnings[field]) return 'vitals-input vitals-abnormal';
    if (validation.errors[field]) return 'vitals-input vitals-error';
    return 'vitals-input';
  };

  // Get BMI category
  const getBMICategory = (bmiValue) => {
    if (!bmiValue) return null;
    if (bmiValue < 18.5) return { label: 'Underweight', class: 'bmi-underweight' };
    if (bmiValue < 25) return { label: 'Normal', class: 'bmi-normal' };
    if (bmiValue < 30) return { label: 'Overweight', class: 'bmi-overweight' };
    return { label: 'Obese', class: 'bmi-obese' };
  };

  // Handle save
  const handleSave = async () => {
    if (Object.keys(validation.errors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      const vitalsData = {
        bloodPressure: vitals.bloodPressure.systolic ? {
          systolic: parseFloat(vitals.bloodPressure.systolic),
          diastolic: parseFloat(vitals.bloodPressure.diastolic)
        } : undefined,
        pulse: vitals.pulse.value ? { value: parseFloat(vitals.pulse.value) } : undefined,
        temperature: vitals.temperature.value ? {
          value: parseFloat(vitals.temperature.value),
          unit: vitals.temperature.unit === 'C' ? '°C' : '°F'
        } : undefined,
        spo2: vitals.spo2.value ? { value: parseFloat(vitals.spo2.value) } : undefined,
        respiratoryRate: vitals.respiratoryRate.value ? { value: parseFloat(vitals.respiratoryRate.value) } : undefined,
        bloodSugar: vitals.bloodSugar.value ? {
          value: parseFloat(vitals.bloodSugar.value),
          type: vitals.bloodSugar.type,
          unit: 'mg/dL'
        } : undefined,
        weight: vitals.weight.value ? {
          value: parseFloat(vitals.weight.value),
          unit: vitals.weight.unit
        } : undefined,
        height: vitals.height.value ? {
          value: parseFloat(vitals.height.value),
          unit: vitals.height.unit
        } : undefined
      };

      // Remove undefined fields
      Object.keys(vitalsData).forEach(key => {
        if (vitalsData[key] === undefined) delete vitalsData[key];
      });

      // Format vitals for SmartAlertPanel
      const formattedVitals = {
        bloodPressure: vitals.bloodPressure.systolic ? `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}` : undefined,
        heartRate: vitals.pulse.value || undefined,
        pulse: vitals.pulse.value || undefined,
        temperature: vitals.temperature.value || undefined,
        spo2: vitals.spo2.value || undefined,
        respiratoryRate: vitals.respiratoryRate.value || undefined
      };
      
      setSavedVitals(formattedVitals);
      setShowSmartAlert(true);

      if (onSave) {
        await onSave(vitalsData);
      }
    } finally {
      setSaving(false);
    }
  };

  const bmiCategory = getBMICategory(bmi);
  const hasCriticals = Object.keys(validation.criticals).length > 0;
  const hasWarnings = Object.keys(validation.warnings).length > 0;

  return (
    <div className="vitals-recorder">
      <div className="vitals-header">
        <h2>📊 Record Vitals</h2>
        {(hasCriticals || hasWarnings) && (
          <div className="vitals-alerts">
            {hasCriticals && (
              <span className="alert-badge alert-critical">⚠️ Critical values detected</span>
            )}
            {hasWarnings && !hasCriticals && (
              <span className="alert-badge alert-warning">⚡ Abnormal values detected</span>
            )}
          </div>
        )}
      </div>

      <div className="vitals-grid">
        {/* Blood Pressure */}
        <div className="vitals-card">
          <div className="vitals-card-header">
            <span className="vitals-icon">🩺</span>
            <span className="vitals-label">Blood Pressure</span>
          </div>
          <div className="vitals-bp-inputs">
            <div className="vitals-field">
              <input
                type="number"
                className={getInputClass('systolic')}
                placeholder="Systolic"
                value={vitals.bloodPressure.systolic}
                onChange={(e) => handleChange('bloodPressure', 'systolic', e.target.value)}
                aria-label="Systolic blood pressure"
              />
              {validation.errors.systolic && <span className="vitals-error-text">{validation.errors.systolic}</span>}
            </div>
            <span className="bp-separator">/</span>
            <div className="vitals-field">
              <input
                type="number"
                className={getInputClass('diastolic')}
                placeholder="Diastolic"
                value={vitals.bloodPressure.diastolic}
                onChange={(e) => handleChange('bloodPressure', 'diastolic', e.target.value)}
                aria-label="Diastolic blood pressure"
              />
              {validation.errors.diastolic && <span className="vitals-error-text">{validation.errors.diastolic}</span>}
            </div>
            <span className="vitals-unit">mmHg</span>
          </div>
          <div className="vitals-range">Normal: 90-140 / 60-90</div>
        </div>

        {/* Pulse */}
        <div className="vitals-card">
          <div className="vitals-card-header">
            <span className="vitals-icon">💓</span>
            <span className="vitals-label">Pulse Rate</span>
          </div>
          <div className="vitals-input-group">
            <input
              type="number"
              className={getInputClass('pulse')}
              placeholder="Enter pulse"
              value={vitals.pulse.value}
              onChange={(e) => handleChange('pulse', 'value', e.target.value)}
              aria-label="Pulse rate"
            />
            <span className="vitals-unit">bpm</span>
          </div>
          {validation.errors.pulse && <span className="vitals-error-text">{validation.errors.pulse}</span>}
          <div className="vitals-range">Normal: 60-100 bpm</div>
        </div>

        {/* Temperature */}
        <div className="vitals-card">
          <div className="vitals-card-header">
            <span className="vitals-icon">🌡️</span>
            <span className="vitals-label">Temperature</span>
          </div>
          <div className="vitals-input-group">
            <input
              type="number"
              step="0.1"
              className={getInputClass('temperature')}
              placeholder="Enter temp"
              value={vitals.temperature.value}
              onChange={(e) => handleChange('temperature', 'value', e.target.value)}
              aria-label="Temperature"
            />
            <button 
              type="button" 
              className="unit-toggle"
              onClick={handleTempUnitToggle}
              aria-label={`Switch to ${vitals.temperature.unit === 'F' ? 'Celsius' : 'Fahrenheit'}`}
            >
              °{vitals.temperature.unit}
            </button>
          </div>
          {validation.errors.temperature && <span className="vitals-error-text">{validation.errors.temperature}</span>}
          <div className="vitals-range">
            Normal: {vitals.temperature.unit === 'F' ? '97-99.5°F' : '36.1-37.5°C'}
          </div>
        </div>

        {/* SpO2 */}
        <div className="vitals-card">
          <div className="vitals-card-header">
            <span className="vitals-icon">🫁</span>
            <span className="vitals-label">SpO2</span>
          </div>
          <div className="vitals-input-group">
            <input
              type="number"
              className={getInputClass('spo2')}
              placeholder="Enter SpO2"
              value={vitals.spo2.value}
              onChange={(e) => handleChange('spo2', 'value', e.target.value)}
              aria-label="Oxygen saturation"
            />
            <span className="vitals-unit">%</span>
          </div>
          {validation.errors.spo2 && <span className="vitals-error-text">{validation.errors.spo2}</span>}
          <div className="vitals-range">Normal: 95-100%</div>
        </div>

        {/* Respiratory Rate */}
        <div className="vitals-card">
          <div className="vitals-card-header">
            <span className="vitals-icon">🌬️</span>
            <span className="vitals-label">Respiratory Rate</span>
          </div>
          <div className="vitals-input-group">
            <input
              type="number"
              className={getInputClass('respiratoryRate')}
              placeholder="Enter RR"
              value={vitals.respiratoryRate.value}
              onChange={(e) => handleChange('respiratoryRate', 'value', e.target.value)}
              aria-label="Respiratory rate"
            />
            <span className="vitals-unit">/min</span>
          </div>
          {validation.errors.respiratoryRate && <span className="vitals-error-text">{validation.errors.respiratoryRate}</span>}
          <div className="vitals-range">Normal: 12-20/min</div>
        </div>

        {/* Blood Sugar */}
        <div className="vitals-card">
          <div className="vitals-card-header">
            <span className="vitals-icon">🩸</span>
            <span className="vitals-label">Blood Sugar</span>
          </div>
          <div className="vitals-input-group">
            <input
              type="number"
              className={getInputClass('bloodSugar')}
              placeholder="Enter value"
              value={vitals.bloodSugar.value}
              onChange={(e) => handleChange('bloodSugar', 'value', e.target.value)}
              aria-label="Blood sugar"
            />
            <span className="vitals-unit">mg/dL</span>
          </div>
          <select
            className="vitals-select"
            value={vitals.bloodSugar.type}
            onChange={(e) => handleChange('bloodSugar', 'type', e.target.value)}
            aria-label="Blood sugar type"
          >
            <option value="fasting">Fasting</option>
            <option value="random">Random</option>
            <option value="postMeal">Post Meal</option>
          </select>
          {validation.errors.bloodSugar && <span className="vitals-error-text">{validation.errors.bloodSugar}</span>}
          <div className="vitals-range">
            Normal: {vitals.bloodSugar.type === 'fasting' ? '70-100' : '70-140'} mg/dL
          </div>
        </div>

        {/* Weight */}
        <div className="vitals-card">
          <div className="vitals-card-header">
            <span className="vitals-icon">⚖️</span>
            <span className="vitals-label">Weight</span>
          </div>
          <div className="vitals-input-group">
            <input
              type="number"
              step="0.1"
              className="vitals-input"
              placeholder="Enter weight"
              value={vitals.weight.value}
              onChange={(e) => handleChange('weight', 'value', e.target.value)}
              aria-label="Weight"
            />
            <button 
              type="button" 
              className="unit-toggle"
              onClick={handleWeightUnitToggle}
              aria-label={`Switch to ${vitals.weight.unit === 'kg' ? 'pounds' : 'kilograms'}`}
            >
              {vitals.weight.unit}
            </button>
          </div>
        </div>

        {/* Height */}
        <div className="vitals-card">
          <div className="vitals-card-header">
            <span className="vitals-icon">📏</span>
            <span className="vitals-label">Height</span>
          </div>
          <div className="vitals-input-group">
            <input
              type="number"
              step="0.1"
              className="vitals-input"
              placeholder="Enter height"
              value={vitals.height.value}
              onChange={(e) => handleChange('height', 'value', e.target.value)}
              aria-label="Height"
            />
            <span className="vitals-unit">{vitals.height.unit}</span>
          </div>
        </div>
      </div>

      {/* BMI Display */}
      {bmi && (
        <div className="bmi-display">
          <span className="bmi-label">Calculated BMI:</span>
          <span className={`bmi-value ${bmiCategory?.class || ''}`}>
            {bmi} - {bmiCategory?.label}
          </span>
        </div>
      )}

      {/* Smart Alert Panel - ML-based deterioration prediction */}
      {showSmartAlert && savedVitals && (
        <div className="smart-alert-section">
          <SmartAlertPanel
            patientId={patientId}
            patient={patient}
            vitals={savedVitals}
            compact={false}
          />
        </div>
      )}

      {/* Actions */}
      <div className="vitals-actions">
        {onCancel && (
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          type="button"
          className="btn-save"
          onClick={handleSave}
          disabled={saving || Object.keys(validation.errors).length > 0}
        >
          {saving ? 'Saving...' : '💾 Save Vitals'}
        </button>
      </div>
    </div>
  );
};

export default VitalsRecorder;
