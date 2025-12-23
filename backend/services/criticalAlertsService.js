/**
 * Critical Alerts Service
 * Clinical decision support for vital thresholds and patient safety
 * Requirements: 9.1, 9.3
 */

const { VITAL_RANGES, validateVitalValue } = require('./vitalsService');

/**
 * Critical threshold definitions with clinical context
 * Requirements: 9.1
 */
const CRITICAL_THRESHOLDS = {
  bloodPressure: {
    hypertensiveCrisis: {
      systolic: 180,
      diastolic: 120,
      severity: 'critical',
      alert: 'HYPERTENSIVE CRISIS',
      action: 'Immediate medical attention required. Risk of stroke, heart attack, or organ damage.',
      color: '#DC2626'
    },
    severeHypertension: {
      systolic: 160,
      diastolic: 100,
      severity: 'high',
      alert: 'Severe Hypertension',
      action: 'Urgent evaluation needed. Consider immediate treatment.',
      color: '#EA580C'
    },
    hypotension: {
      systolic: 90,
      diastolic: 60,
      severity: 'high',
      alert: 'Hypotension',
      action: 'Evaluate for shock, dehydration, or medication effects.',
      color: '#EA580C'
    },
    severeHypotension: {
      systolic: 80,
      diastolic: 50,
      severity: 'critical',
      alert: 'SEVERE HYPOTENSION',
      action: 'Immediate intervention required. Risk of organ hypoperfusion.',
      color: '#DC2626'
    }
  },
  spo2: {
    severeHypoxia: {
      value: 88,
      severity: 'critical',
      alert: 'SEVERE HYPOXIA',
      action: 'Immediate oxygen supplementation required. Consider intubation.',
      color: '#DC2626'
    },
    moderateHypoxia: {
      value: 90,
      severity: 'high',
      alert: 'Hypoxia',
      action: 'Administer supplemental oxygen. Evaluate respiratory status.',
      color: '#EA580C'
    },
    mildHypoxia: {
      value: 94,
      severity: 'moderate',
      alert: 'Low Oxygen Saturation',
      action: 'Monitor closely. Consider supplemental oxygen if symptomatic.',
      color: '#CA8A04'
    }
  },
  pulse: {
    severeTachycardia: {
      value: 150,
      severity: 'critical',
      alert: 'SEVERE TACHYCARDIA',
      action: 'Immediate evaluation. Consider ECG and cardiac monitoring.',
      color: '#DC2626'
    },
    tachycardia: {
      value: 120,
      severity: 'high',
      alert: 'Tachycardia',
      action: 'Evaluate for underlying cause. Consider ECG.',
      color: '#EA580C'
    },
    severeBradycardia: {
      value: 40,
      severity: 'critical',
      alert: 'SEVERE BRADYCARDIA',
      action: 'Immediate evaluation. Consider atropine or pacing.',
      color: '#DC2626'
    },
    bradycardia: {
      value: 50,
      severity: 'high',
      alert: 'Bradycardia',
      action: 'Evaluate for medication effects or cardiac conduction issues.',
      color: '#EA580C'
    }
  },
  temperature: {
    hyperthermia: {
      fahrenheit: 104,
      celsius: 40,
      severity: 'critical',
      alert: 'HYPERTHERMIA',
      action: 'Immediate cooling measures. Evaluate for heat stroke or infection.',
      color: '#DC2626'
    },
    highFever: {
      fahrenheit: 103,
      celsius: 39.4,
      severity: 'high',
      alert: 'High Fever',
      action: 'Antipyretics and evaluation for infection source.',
      color: '#EA580C'
    },
    fever: {
      fahrenheit: 100.4,
      celsius: 38,
      severity: 'moderate',
      alert: 'Fever',
      action: 'Monitor and evaluate for infection.',
      color: '#CA8A04'
    },
    hypothermia: {
      fahrenheit: 95,
      celsius: 35,
      severity: 'critical',
      alert: 'HYPOTHERMIA',
      action: 'Immediate warming measures. Evaluate for exposure or metabolic causes.',
      color: '#DC2626'
    }
  },
  respiratoryRate: {
    severeDistress: {
      high: 30,
      low: 8,
      severity: 'critical',
      alertHigh: 'SEVERE RESPIRATORY DISTRESS',
      alertLow: 'RESPIRATORY DEPRESSION',
      actionHigh: 'Immediate respiratory support. Consider intubation.',
      actionLow: 'Immediate intervention. Consider naloxone if opioid-related.',
      color: '#DC2626'
    },
    distress: {
      high: 24,
      low: 10,
      severity: 'high',
      alertHigh: 'Tachypnea',
      alertLow: 'Bradypnea',
      actionHigh: 'Evaluate respiratory status and oxygen needs.',
      actionLow: 'Monitor closely. Evaluate for CNS depression.',
      color: '#EA580C'
    }
  },
  bloodSugar: {
    severeHyperglycemia: {
      value: 400,
      severity: 'critical',
      alert: 'SEVERE HYPERGLYCEMIA',
      action: 'Immediate insulin therapy. Evaluate for DKA or HHS.',
      color: '#DC2626'
    },
    hyperglycemia: {
      value: 250,
      severity: 'high',
      alert: 'Hyperglycemia',
      action: 'Insulin adjustment needed. Check ketones.',
      color: '#EA580C'
    },
    hypoglycemia: {
      value: 70,
      severity: 'high',
      alert: 'Hypoglycemia',
      action: 'Administer glucose. Evaluate medication dosing.',
      color: '#EA580C'
    },
    severeHypoglycemia: {
      value: 50,
      severity: 'critical',
      alert: 'SEVERE HYPOGLYCEMIA',
      action: 'Immediate glucose administration. Consider glucagon.',
      color: '#DC2626'
    }
  }
};

/**
 * High-risk medications for elderly patients (age > 65)
 * Requirements: 9.3
 */
const ELDERLY_HIGH_RISK_MEDICATIONS = {
  benzodiazepines: {
    drugs: ['diazepam', 'lorazepam', 'alprazolam', 'clonazepam', 'temazepam', 'midazolam'],
    risk: 'Increased risk of falls, cognitive impairment, and delirium',
    recommendation: 'Avoid if possible. Use lowest effective dose for shortest duration.',
    severity: 'high'
  },
  anticholinergics: {
    drugs: ['diphenhydramine', 'hydroxyzine', 'oxybutynin', 'tolterodine', 'amitriptyline'],
    risk: 'Cognitive impairment, confusion, constipation, urinary retention',
    recommendation: 'Avoid. Use alternatives with less anticholinergic activity.',
    severity: 'high'
  },
  nsaids: {
    drugs: ['ibuprofen', 'naproxen', 'diclofenac', 'indomethacin', 'ketorolac', 'meloxicam'],
    risk: 'GI bleeding, renal impairment, cardiovascular events',
    recommendation: 'Use lowest effective dose for shortest duration. Consider acetaminophen.',
    severity: 'moderate'
  },
  opioids: {
    drugs: ['morphine', 'oxycodone', 'hydrocodone', 'fentanyl', 'tramadol', 'codeine'],
    risk: 'Falls, respiratory depression, constipation, cognitive impairment',
    recommendation: 'Start low, go slow. Use non-opioid alternatives when possible.',
    severity: 'high'
  },
  antipsychotics: {
    drugs: ['haloperidol', 'risperidone', 'olanzapine', 'quetiapine', 'aripiprazole'],
    risk: 'Increased mortality in dementia patients, falls, stroke risk',
    recommendation: 'Avoid in dementia. Use only for approved indications.',
    severity: 'high'
  },
  sulfonylureas: {
    drugs: ['glyburide', 'glipizide', 'glimepiride'],
    risk: 'Prolonged hypoglycemia',
    recommendation: 'Avoid glyburide. Use shorter-acting agents with caution.',
    severity: 'moderate'
  },
  muscle_relaxants: {
    drugs: ['cyclobenzaprine', 'methocarbamol', 'carisoprodol', 'metaxalone'],
    risk: 'Sedation, falls, anticholinergic effects',
    recommendation: 'Avoid. Effectiveness questionable in elderly.',
    severity: 'moderate'
  }
};

/**
 * Generate critical alerts for vitals
 * @param {Object} vitals - Vitals object
 * @returns {Array} Array of critical alerts
 */
function generateVitalAlerts(vitals) {
  const alerts = [];
  
  // Blood Pressure alerts
  if (vitals.bloodPressure) {
    const { systolic, diastolic } = vitals.bloodPressure;
    
    if (systolic !== undefined && systolic !== null) {
      // Check for hypertensive crisis
      if (systolic >= CRITICAL_THRESHOLDS.bloodPressure.hypertensiveCrisis.systolic ||
          (diastolic && diastolic >= CRITICAL_THRESHOLDS.bloodPressure.hypertensiveCrisis.diastolic)) {
        alerts.push({
          type: 'vital',
          vital: 'bloodPressure',
          value: `${systolic}/${diastolic || '?'}`,
          ...CRITICAL_THRESHOLDS.bloodPressure.hypertensiveCrisis
        });
      } else if (systolic >= CRITICAL_THRESHOLDS.bloodPressure.severeHypertension.systolic ||
                 (diastolic && diastolic >= CRITICAL_THRESHOLDS.bloodPressure.severeHypertension.diastolic)) {
        alerts.push({
          type: 'vital',
          vital: 'bloodPressure',
          value: `${systolic}/${diastolic || '?'}`,
          ...CRITICAL_THRESHOLDS.bloodPressure.severeHypertension
        });
      }
      
      // Check for hypotension
      if (systolic <= CRITICAL_THRESHOLDS.bloodPressure.severeHypotension.systolic) {
        alerts.push({
          type: 'vital',
          vital: 'bloodPressure',
          value: `${systolic}/${diastolic || '?'}`,
          ...CRITICAL_THRESHOLDS.bloodPressure.severeHypotension
        });
      } else if (systolic <= CRITICAL_THRESHOLDS.bloodPressure.hypotension.systolic) {
        alerts.push({
          type: 'vital',
          vital: 'bloodPressure',
          value: `${systolic}/${diastolic || '?'}`,
          ...CRITICAL_THRESHOLDS.bloodPressure.hypotension
        });
      }
    }
  }
  
  // SpO2 alerts
  if (vitals.spo2?.value !== undefined && vitals.spo2?.value !== null) {
    const spo2 = vitals.spo2.value;
    
    if (spo2 <= CRITICAL_THRESHOLDS.spo2.severeHypoxia.value) {
      alerts.push({
        type: 'vital',
        vital: 'spo2',
        value: spo2,
        ...CRITICAL_THRESHOLDS.spo2.severeHypoxia
      });
    } else if (spo2 <= CRITICAL_THRESHOLDS.spo2.moderateHypoxia.value) {
      alerts.push({
        type: 'vital',
        vital: 'spo2',
        value: spo2,
        ...CRITICAL_THRESHOLDS.spo2.moderateHypoxia
      });
    } else if (spo2 <= CRITICAL_THRESHOLDS.spo2.mildHypoxia.value) {
      alerts.push({
        type: 'vital',
        vital: 'spo2',
        value: spo2,
        ...CRITICAL_THRESHOLDS.spo2.mildHypoxia
      });
    }
  }
  
  // Pulse alerts
  if (vitals.pulse?.value !== undefined && vitals.pulse?.value !== null) {
    const pulse = vitals.pulse.value;
    
    if (pulse >= CRITICAL_THRESHOLDS.pulse.severeTachycardia.value) {
      alerts.push({
        type: 'vital',
        vital: 'pulse',
        value: pulse,
        ...CRITICAL_THRESHOLDS.pulse.severeTachycardia
      });
    } else if (pulse >= CRITICAL_THRESHOLDS.pulse.tachycardia.value) {
      alerts.push({
        type: 'vital',
        vital: 'pulse',
        value: pulse,
        ...CRITICAL_THRESHOLDS.pulse.tachycardia
      });
    } else if (pulse <= CRITICAL_THRESHOLDS.pulse.severeBradycardia.value) {
      alerts.push({
        type: 'vital',
        vital: 'pulse',
        value: pulse,
        ...CRITICAL_THRESHOLDS.pulse.severeBradycardia
      });
    } else if (pulse <= CRITICAL_THRESHOLDS.pulse.bradycardia.value) {
      alerts.push({
        type: 'vital',
        vital: 'pulse',
        value: pulse,
        ...CRITICAL_THRESHOLDS.pulse.bradycardia
      });
    }
  }
  
  // Temperature alerts
  if (vitals.temperature?.value !== undefined && vitals.temperature?.value !== null) {
    const temp = vitals.temperature.value;
    const unit = vitals.temperature.unit === '°C' || vitals.temperature.unit === 'C' ? 'celsius' : 'fahrenheit';
    
    const thresholds = CRITICAL_THRESHOLDS.temperature;
    
    if (temp >= thresholds.hyperthermia[unit]) {
      alerts.push({
        type: 'vital',
        vital: 'temperature',
        value: `${temp}°${unit === 'celsius' ? 'C' : 'F'}`,
        severity: thresholds.hyperthermia.severity,
        alert: thresholds.hyperthermia.alert,
        action: thresholds.hyperthermia.action,
        color: thresholds.hyperthermia.color
      });
    } else if (temp >= thresholds.highFever[unit]) {
      alerts.push({
        type: 'vital',
        vital: 'temperature',
        value: `${temp}°${unit === 'celsius' ? 'C' : 'F'}`,
        severity: thresholds.highFever.severity,
        alert: thresholds.highFever.alert,
        action: thresholds.highFever.action,
        color: thresholds.highFever.color
      });
    } else if (temp >= thresholds.fever[unit]) {
      alerts.push({
        type: 'vital',
        vital: 'temperature',
        value: `${temp}°${unit === 'celsius' ? 'C' : 'F'}`,
        severity: thresholds.fever.severity,
        alert: thresholds.fever.alert,
        action: thresholds.fever.action,
        color: thresholds.fever.color
      });
    } else if (temp <= thresholds.hypothermia[unit]) {
      alerts.push({
        type: 'vital',
        vital: 'temperature',
        value: `${temp}°${unit === 'celsius' ? 'C' : 'F'}`,
        severity: thresholds.hypothermia.severity,
        alert: thresholds.hypothermia.alert,
        action: thresholds.hypothermia.action,
        color: thresholds.hypothermia.color
      });
    }
  }
  
  // Respiratory Rate alerts
  if (vitals.respiratoryRate?.value !== undefined && vitals.respiratoryRate?.value !== null) {
    const rr = vitals.respiratoryRate.value;
    const thresholds = CRITICAL_THRESHOLDS.respiratoryRate;
    
    if (rr >= thresholds.severeDistress.high) {
      alerts.push({
        type: 'vital',
        vital: 'respiratoryRate',
        value: rr,
        severity: thresholds.severeDistress.severity,
        alert: thresholds.severeDistress.alertHigh,
        action: thresholds.severeDistress.actionHigh,
        color: thresholds.severeDistress.color
      });
    } else if (rr <= thresholds.severeDistress.low) {
      alerts.push({
        type: 'vital',
        vital: 'respiratoryRate',
        value: rr,
        severity: thresholds.severeDistress.severity,
        alert: thresholds.severeDistress.alertLow,
        action: thresholds.severeDistress.actionLow,
        color: thresholds.severeDistress.color
      });
    } else if (rr >= thresholds.distress.high) {
      alerts.push({
        type: 'vital',
        vital: 'respiratoryRate',
        value: rr,
        severity: thresholds.distress.severity,
        alert: thresholds.distress.alertHigh,
        action: thresholds.distress.actionHigh,
        color: thresholds.distress.color
      });
    } else if (rr <= thresholds.distress.low) {
      alerts.push({
        type: 'vital',
        vital: 'respiratoryRate',
        value: rr,
        severity: thresholds.distress.severity,
        alert: thresholds.distress.alertLow,
        action: thresholds.distress.actionLow,
        color: thresholds.distress.color
      });
    }
  }
  
  // Blood Sugar alerts
  if (vitals.bloodSugar?.value !== undefined && vitals.bloodSugar?.value !== null) {
    const sugar = vitals.bloodSugar.value;
    const thresholds = CRITICAL_THRESHOLDS.bloodSugar;
    
    if (sugar >= thresholds.severeHyperglycemia.value) {
      alerts.push({
        type: 'vital',
        vital: 'bloodSugar',
        value: sugar,
        ...thresholds.severeHyperglycemia
      });
    } else if (sugar >= thresholds.hyperglycemia.value) {
      alerts.push({
        type: 'vital',
        vital: 'bloodSugar',
        value: sugar,
        ...thresholds.hyperglycemia
      });
    } else if (sugar <= thresholds.severeHypoglycemia.value) {
      alerts.push({
        type: 'vital',
        vital: 'bloodSugar',
        value: sugar,
        ...thresholds.severeHypoglycemia
      });
    } else if (sugar <= thresholds.hypoglycemia.value) {
      alerts.push({
        type: 'vital',
        vital: 'bloodSugar',
        value: sugar,
        ...thresholds.hypoglycemia
      });
    }
  }
  
  // Sort by severity (critical first)
  const severityOrder = { critical: 1, high: 2, moderate: 3, low: 4 };
  alerts.sort((a, b) => (severityOrder[a.severity] || 5) - (severityOrder[b.severity] || 5));
  
  return alerts;
}

/**
 * Check medications for elderly patient safety
 * @param {Array} medications - Array of medication names
 * @param {number} patientAge - Patient's age
 * @returns {Array} Array of elderly safety alerts
 */
function checkElderlyMedicationSafety(medications, patientAge) {
  const alerts = [];
  
  if (!medications || !Array.isArray(medications) || patientAge < 65) {
    return alerts;
  }
  
  const normalizedMeds = medications.map(m => m.toLowerCase().trim());
  
  for (const [category, info] of Object.entries(ELDERLY_HIGH_RISK_MEDICATIONS)) {
    for (const drug of info.drugs) {
      if (normalizedMeds.some(m => m.includes(drug) || drug.includes(m))) {
        alerts.push({
          type: 'elderly_safety',
          category,
          drug,
          severity: info.severity,
          alert: `High-Risk Medication for Elderly: ${drug}`,
          risk: info.risk,
          recommendation: info.recommendation,
          color: info.severity === 'high' ? '#EA580C' : '#CA8A04'
        });
      }
    }
  }
  
  // Sort by severity
  const severityOrder = { high: 1, moderate: 2, low: 3 };
  alerts.sort((a, b) => (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4));
  
  return alerts;
}

/**
 * Escalate interaction severity for elderly patients
 * @param {Array} interactions - Drug interactions
 * @param {number} patientAge - Patient's age
 * @returns {Array} Interactions with escalated severity for elderly
 */
function escalateInteractionsForElderly(interactions, patientAge) {
  if (!interactions || !Array.isArray(interactions) || patientAge < 65) {
    return interactions;
  }
  
  return interactions.map(interaction => {
    const escalated = { ...interaction };
    
    // Escalate moderate to major for elderly
    if (interaction.severity === 'moderate') {
      escalated.originalSeverity = 'moderate';
      escalated.severity = 'major';
      escalated.severityLevel = 2;
      escalated.elderlyEscalated = true;
      escalated.escalationReason = 'Severity escalated due to patient age > 65';
    }
    
    // Add elderly warning for major interactions
    if (interaction.severity === 'major') {
      escalated.elderlyWarning = 'Increased risk in elderly patients. Consider alternatives or dose reduction.';
    }
    
    return escalated;
  });
}

/**
 * Comprehensive clinical decision support check
 * @param {Object} params - Check parameters
 * @returns {Object} Clinical decision support results
 */
function performClinicalCheck(params) {
  const { vitals, medications, patientAge, allergies, currentMedications } = params;
  
  const result = {
    vitalAlerts: [],
    elderlyMedicationAlerts: [],
    hasCriticalAlerts: false,
    hasHighAlerts: false,
    summary: ''
  };
  
  // Generate vital alerts
  if (vitals) {
    result.vitalAlerts = generateVitalAlerts(vitals);
    result.hasCriticalAlerts = result.vitalAlerts.some(a => a.severity === 'critical');
    result.hasHighAlerts = result.vitalAlerts.some(a => a.severity === 'high');
  }
  
  // Check elderly medication safety
  if (medications && patientAge >= 65) {
    result.elderlyMedicationAlerts = checkElderlyMedicationSafety(medications, patientAge);
    if (result.elderlyMedicationAlerts.some(a => a.severity === 'high')) {
      result.hasHighAlerts = true;
    }
  }
  
  // Generate summary
  const criticalCount = result.vitalAlerts.filter(a => a.severity === 'critical').length;
  const highCount = result.vitalAlerts.filter(a => a.severity === 'high').length + 
                    result.elderlyMedicationAlerts.filter(a => a.severity === 'high').length;
  
  if (criticalCount > 0) {
    result.summary = `${criticalCount} CRITICAL ALERT(S) - Immediate attention required`;
  } else if (highCount > 0) {
    result.summary = `${highCount} high-priority alert(s) requiring attention`;
  } else if (result.vitalAlerts.length > 0 || result.elderlyMedicationAlerts.length > 0) {
    result.summary = 'Alerts present - review recommended';
  } else {
    result.summary = 'No critical alerts';
  }
  
  return result;
}

/**
 * Get all critical thresholds
 * @returns {Object} All critical thresholds
 */
function getCriticalThresholds() {
  return CRITICAL_THRESHOLDS;
}

/**
 * Get elderly high-risk medications
 * @returns {Object} Elderly high-risk medications
 */
function getElderlyHighRiskMedications() {
  return ELDERLY_HIGH_RISK_MEDICATIONS;
}

module.exports = {
  CRITICAL_THRESHOLDS,
  ELDERLY_HIGH_RISK_MEDICATIONS,
  generateVitalAlerts,
  checkElderlyMedicationSafety,
  escalateInteractionsForElderly,
  performClinicalCheck,
  getCriticalThresholds,
  getElderlyHighRiskMedications
};
