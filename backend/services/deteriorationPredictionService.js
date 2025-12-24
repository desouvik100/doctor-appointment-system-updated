/**
 * Patient Deterioration Prediction Service
 * ML-based early warning system for patient health deterioration
 * Uses vital signs, lab results, and clinical data to predict risk
 */

// Risk thresholds
const RISK_LEVELS = {
  CRITICAL: { min: 0.8, label: 'Critical', color: '#dc2626', action: 'Immediate intervention required' },
  HIGH: { min: 0.6, label: 'High Risk', color: '#ea580c', action: 'Urgent review needed' },
  MODERATE: { min: 0.4, label: 'Moderate Risk', color: '#ca8a04', action: 'Close monitoring recommended' },
  LOW: { min: 0.2, label: 'Low Risk', color: '#2563eb', action: 'Continue routine care' },
  MINIMAL: { min: 0, label: 'Minimal Risk', color: '#16a34a', action: 'No immediate concerns' }
};

// NEWS2 (National Early Warning Score 2) parameters
const NEWS2_PARAMS = {
  respiratoryRate: [
    { range: [25, Infinity], score: 3 },
    { range: [21, 24], score: 2 },
    { range: [12, 20], score: 0 },
    { range: [9, 11], score: 1 },
    { range: [0, 8], score: 3 }
  ],
  spo2: [
    { range: [96, 100], score: 0 },
    { range: [94, 95], score: 1 },
    { range: [92, 93], score: 2 },
    { range: [0, 91], score: 3 }
  ],
  temperature: [
    { range: [39.1, Infinity], score: 2 },
    { range: [38.1, 39.0], score: 1 },
    { range: [36.1, 38.0], score: 0 },
    { range: [35.1, 36.0], score: 1 },
    { range: [0, 35.0], score: 3 }
  ],
  systolicBP: [
    { range: [220, Infinity], score: 3 },
    { range: [111, 219], score: 0 },
    { range: [101, 110], score: 1 },
    { range: [91, 100], score: 2 },
    { range: [0, 90], score: 3 }
  ],
  heartRate: [
    { range: [131, Infinity], score: 3 },
    { range: [111, 130], score: 2 },
    { range: [91, 110], score: 1 },
    { range: [51, 90], score: 0 },
    { range: [41, 50], score: 1 },
    { range: [0, 40], score: 3 }
  ],
  consciousness: {
    'alert': 0,
    'verbal': 3,
    'pain': 3,
    'unresponsive': 3,
    'confused': 3
  }
};

/**
 * Calculate NEWS2 score from vitals
 * @param {Object} vitals - Patient vital signs
 * @returns {Object} NEWS2 score and breakdown
 */
function calculateNEWS2Score(vitals) {
  const scores = {};
  let totalScore = 0;

  // Respiratory Rate
  if (vitals.respiratoryRate) {
    const rr = parseFloat(vitals.respiratoryRate);
    scores.respiratoryRate = getParameterScore(NEWS2_PARAMS.respiratoryRate, rr);
    totalScore += scores.respiratoryRate;
  }

  // SpO2
  if (vitals.spo2) {
    const spo2 = parseFloat(vitals.spo2);
    scores.spo2 = getParameterScore(NEWS2_PARAMS.spo2, spo2);
    totalScore += scores.spo2;
  }

  // Temperature
  if (vitals.temperature) {
    let temp = parseFloat(vitals.temperature);
    // Convert Fahrenheit to Celsius if needed
    if (temp > 50) temp = (temp - 32) * 5/9;
    scores.temperature = getParameterScore(NEWS2_PARAMS.temperature, temp);
    totalScore += scores.temperature;
  }

  // Systolic Blood Pressure
  if (vitals.bloodPressure || vitals.systolicBP) {
    let systolic = vitals.systolicBP;
    if (!systolic && vitals.bloodPressure) {
      systolic = parseInt(vitals.bloodPressure.split('/')[0]);
    }
    if (systolic) {
      scores.systolicBP = getParameterScore(NEWS2_PARAMS.systolicBP, systolic);
      totalScore += scores.systolicBP;
    }
  }

  // Heart Rate / Pulse
  if (vitals.heartRate || vitals.pulse) {
    const hr = parseFloat(vitals.heartRate || vitals.pulse);
    scores.heartRate = getParameterScore(NEWS2_PARAMS.heartRate, hr);
    totalScore += scores.heartRate;
  }

  // Consciousness (AVPU)
  if (vitals.consciousness) {
    const level = vitals.consciousness.toLowerCase();
    scores.consciousness = NEWS2_PARAMS.consciousness[level] || 0;
    totalScore += scores.consciousness;
  }

  // Supplemental oxygen
  if (vitals.supplementalOxygen === true || vitals.onOxygen === true) {
    scores.supplementalOxygen = 2;
    totalScore += 2;
  }

  return {
    totalScore,
    breakdown: scores,
    clinicalRisk: getNEWS2Risk(totalScore)
  };
}

/**
 * Get score for a parameter based on ranges
 */
function getParameterScore(ranges, value) {
  for (const range of ranges) {
    if (value >= range.range[0] && value <= range.range[1]) {
      return range.score;
    }
  }
  return 0;
}

/**
 * Get clinical risk level from NEWS2 score
 */
function getNEWS2Risk(score) {
  if (score >= 7) return { level: 'critical', response: 'Emergency response', color: '#dc2626' };
  if (score >= 5) return { level: 'high', response: 'Urgent response', color: '#ea580c' };
  if (score >= 3) return { level: 'medium', response: 'Urgent ward review', color: '#ca8a04' };
  if (score >= 1) return { level: 'low', response: 'Ward-based response', color: '#2563eb' };
  return { level: 'minimal', response: 'Routine monitoring', color: '#16a34a' };
}

/**
 * Analyze lab results for deterioration indicators
 * @param {Array} labResults - Recent lab results
 * @returns {Object} Lab-based risk assessment
 */
function analyzeLabResults(labResults) {
  if (!labResults || labResults.length === 0) {
    return { score: 0, alerts: [], trends: [] };
  }

  const alerts = [];
  const trends = [];
  let riskScore = 0;

  // Critical lab value thresholds
  const criticalValues = {
    hemoglobin: { low: 7, high: 20, unit: 'g/dL' },
    potassium: { low: 2.5, high: 6.5, unit: 'mEq/L' },
    sodium: { low: 120, high: 160, unit: 'mEq/L' },
    glucose: { low: 40, high: 500, unit: 'mg/dL' },
    creatinine: { high: 4.0, unit: 'mg/dL' },
    wbc: { low: 2, high: 30, unit: 'K/uL' },
    platelets: { low: 50, high: 1000, unit: 'K/uL' },
    lactate: { high: 4, unit: 'mmol/L' },
    troponin: { high: 0.4, unit: 'ng/mL' },
    bilirubin: { high: 15, unit: 'mg/dL' },
    inr: { high: 4.5, unit: '' },
    ph: { low: 7.2, high: 7.6, unit: '' }
  };

  for (const result of labResults) {
    const testName = result.testName?.toLowerCase().replace(/\s+/g, '');
    const value = parseFloat(result.value);

    if (isNaN(value)) continue;

    // Check each critical value
    for (const [key, thresholds] of Object.entries(criticalValues)) {
      if (testName.includes(key)) {
        if (thresholds.low && value < thresholds.low) {
          alerts.push({
            type: 'critical_low',
            test: result.testName,
            value: `${value} ${thresholds.unit}`,
            threshold: `< ${thresholds.low}`,
            severity: 'critical'
          });
          riskScore += 0.3;
        }
        if (thresholds.high && value > thresholds.high) {
          alerts.push({
            type: 'critical_high',
            test: result.testName,
            value: `${value} ${thresholds.unit}`,
            threshold: `> ${thresholds.high}`,
            severity: 'critical'
          });
          riskScore += 0.3;
        }
      }
    }

    // Track trends if we have historical data
    if (result.previousValue) {
      const change = ((value - result.previousValue) / result.previousValue) * 100;
      if (Math.abs(change) > 20) {
        trends.push({
          test: result.testName,
          change: change.toFixed(1) + '%',
          direction: change > 0 ? 'increasing' : 'decreasing',
          concern: Math.abs(change) > 50
        });
        if (Math.abs(change) > 50) riskScore += 0.1;
      }
    }
  }

  return {
    score: Math.min(riskScore, 1),
    alerts,
    trends,
    hasCriticalValues: alerts.some(a => a.severity === 'critical')
  };
}

/**
 * Analyze patient history for risk factors
 * @param {Object} patient - Patient data with medical history
 * @returns {Object} History-based risk factors
 */
function analyzePatientHistory(patient) {
  const riskFactors = [];
  let riskScore = 0;

  const history = patient.medicalHistory || {};
  const conditions = history.conditions || [];
  const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : null;

  // Age-based risk
  if (age) {
    if (age >= 80) { riskScore += 0.15; riskFactors.push({ factor: 'Age ≥ 80', weight: 'high' }); }
    else if (age >= 65) { riskScore += 0.1; riskFactors.push({ factor: 'Age 65-79', weight: 'moderate' }); }
  }

  // High-risk conditions
  const highRiskConditions = [
    { pattern: /sepsis/i, weight: 0.25, label: 'History of sepsis' },
    { pattern: /heart failure|chf/i, weight: 0.2, label: 'Heart failure' },
    { pattern: /copd|chronic obstructive/i, weight: 0.15, label: 'COPD' },
    { pattern: /diabetes/i, weight: 0.1, label: 'Diabetes' },
    { pattern: /kidney|renal|ckd/i, weight: 0.15, label: 'Chronic kidney disease' },
    { pattern: /cancer|malignancy|oncology/i, weight: 0.2, label: 'Active malignancy' },
    { pattern: /immunocompromised|immunosuppressed|hiv/i, weight: 0.2, label: 'Immunocompromised' },
    { pattern: /stroke|cva/i, weight: 0.15, label: 'History of stroke' },
    { pattern: /liver|cirrhosis|hepatic/i, weight: 0.15, label: 'Liver disease' }
  ];

  for (const condition of conditions) {
    const conditionStr = typeof condition === 'string' ? condition : condition.name || '';
    for (const risk of highRiskConditions) {
      if (risk.pattern.test(conditionStr)) {
        riskScore += risk.weight;
        riskFactors.push({ factor: risk.label, weight: 'high', source: conditionStr });
      }
    }
  }

  // Recent hospitalization
  if (history.recentHospitalization || history.hospitalizedLast30Days) {
    riskScore += 0.15;
    riskFactors.push({ factor: 'Recent hospitalization', weight: 'moderate' });
  }

  // Polypharmacy (>5 medications)
  const medications = patient.currentMedications || history.medications || [];
  if (medications.length > 5) {
    riskScore += 0.1;
    riskFactors.push({ factor: `Polypharmacy (${medications.length} medications)`, weight: 'moderate' });
  }

  return {
    score: Math.min(riskScore, 0.5), // Cap history contribution at 0.5
    riskFactors,
    hasHighRiskConditions: riskFactors.some(f => f.weight === 'high')
  };
}

function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Main prediction function - combines all risk factors
 * @param {Object} params - Patient data, vitals, labs
 * @returns {Object} Comprehensive deterioration risk assessment
 */
async function predictDeterioration(params) {
  const { patient, vitals, labResults, recentVitals = [] } = params;

  // Calculate NEWS2 score from current vitals
  const news2 = vitals ? calculateNEWS2Score(vitals) : { totalScore: 0, breakdown: {}, clinicalRisk: getNEWS2Risk(0) };

  // Analyze lab results
  const labAnalysis = analyzeLabResults(labResults);

  // Analyze patient history
  const historyAnalysis = patient ? analyzePatientHistory(patient) : { score: 0, riskFactors: [] };

  // Analyze vital sign trends
  const vitalTrends = analyzeVitalTrends(recentVitals);

  // Calculate composite risk score (0-1)
  const weights = {
    news2: 0.4,      // 40% weight to NEWS2
    labs: 0.25,      // 25% weight to lab values
    history: 0.2,    // 20% weight to patient history
    trends: 0.15     // 15% weight to vital trends
  };

  const news2Normalized = Math.min(news2.totalScore / 15, 1); // Normalize NEWS2 (max ~15)
  
  const compositeScore = 
    (news2Normalized * weights.news2) +
    (labAnalysis.score * weights.labs) +
    (historyAnalysis.score * weights.history) +
    (vitalTrends.score * weights.trends);

  // Determine risk level
  const riskLevel = getRiskLevel(compositeScore);

  // Generate alerts
  const alerts = generateAlerts(news2, labAnalysis, historyAnalysis, vitalTrends, riskLevel);

  // Generate recommendations
  const recommendations = generateRecommendations(riskLevel, news2, labAnalysis);

  return {
    timestamp: new Date().toISOString(),
    riskScore: Math.round(compositeScore * 100) / 100,
    riskLevel: riskLevel.label,
    riskColor: riskLevel.color,
    action: riskLevel.action,
    
    components: {
      news2: {
        score: news2.totalScore,
        breakdown: news2.breakdown,
        risk: news2.clinicalRisk
      },
      labAnalysis: {
        score: Math.round(labAnalysis.score * 100) / 100,
        alerts: labAnalysis.alerts,
        trends: labAnalysis.trends
      },
      historyAnalysis: {
        score: Math.round(historyAnalysis.score * 100) / 100,
        riskFactors: historyAnalysis.riskFactors
      },
      vitalTrends: {
        score: Math.round(vitalTrends.score * 100) / 100,
        concerns: vitalTrends.concerns
      }
    },
    
    alerts,
    recommendations,
    
    requiresImmediateAttention: compositeScore >= 0.8 || news2.totalScore >= 7,
    requiresUrgentReview: compositeScore >= 0.6 || news2.totalScore >= 5
  };
}

/**
 * Analyze trends in vital signs over time
 */
function analyzeVitalTrends(recentVitals) {
  if (!recentVitals || recentVitals.length < 2) {
    return { score: 0, concerns: [] };
  }

  const concerns = [];
  let score = 0;

  // Sort by timestamp (most recent first)
  const sorted = [...recentVitals].sort((a, b) => 
    new Date(b.timestamp || b.recordedAt) - new Date(a.timestamp || a.recordedAt)
  );

  const latest = sorted[0];
  const previous = sorted[1];

  // Check for concerning trends
  const trendChecks = [
    { 
      param: 'heartRate', 
      alias: 'pulse',
      threshold: 20, 
      message: 'Rapid heart rate increase' 
    },
    { 
      param: 'respiratoryRate', 
      threshold: 5, 
      message: 'Increasing respiratory rate' 
    },
    { 
      param: 'spo2', 
      threshold: -3, 
      message: 'Declining oxygen saturation',
      inverse: true 
    },
    { 
      param: 'temperature', 
      threshold: 1, 
      message: 'Rising temperature' 
    }
  ];

  for (const check of trendChecks) {
    const latestVal = parseFloat(latest[check.param] || latest[check.alias]);
    const prevVal = parseFloat(previous[check.param] || previous[check.alias]);

    if (!isNaN(latestVal) && !isNaN(prevVal)) {
      const change = latestVal - prevVal;
      const concerning = check.inverse ? change <= check.threshold : change >= check.threshold;

      if (concerning) {
        concerns.push({
          parameter: check.param,
          change: change > 0 ? `+${change}` : change,
          message: check.message,
          severity: Math.abs(change) > Math.abs(check.threshold * 2) ? 'high' : 'moderate'
        });
        score += 0.15;
      }
    }
  }

  // Check for sustained abnormalities
  const abnormalCount = sorted.filter(v => {
    const hr = parseFloat(v.heartRate || v.pulse);
    const rr = parseFloat(v.respiratoryRate);
    const spo2 = parseFloat(v.spo2);
    return (hr && (hr > 100 || hr < 50)) || 
           (rr && (rr > 22 || rr < 10)) || 
           (spo2 && spo2 < 94);
  }).length;

  if (abnormalCount >= 3) {
    concerns.push({
      parameter: 'multiple',
      message: 'Sustained abnormal vitals',
      severity: 'high'
    });
    score += 0.2;
  }

  return {
    score: Math.min(score, 0.5),
    concerns,
    dataPoints: sorted.length
  };
}

/**
 * Get risk level from composite score
 */
function getRiskLevel(score) {
  for (const [key, level] of Object.entries(RISK_LEVELS)) {
    if (score >= level.min) {
      return { key, ...level };
    }
  }
  return { key: 'MINIMAL', ...RISK_LEVELS.MINIMAL };
}

/**
 * Generate prioritized alerts
 */
function generateAlerts(news2, labAnalysis, historyAnalysis, vitalTrends, riskLevel) {
  const alerts = [];

  // NEWS2 alerts
  if (news2.totalScore >= 7) {
    alerts.push({
      type: 'critical',
      category: 'NEWS2',
      title: 'Critical NEWS2 Score',
      message: `NEWS2 score of ${news2.totalScore} indicates critical illness`,
      action: 'Activate emergency response team',
      priority: 1
    });
  } else if (news2.totalScore >= 5) {
    alerts.push({
      type: 'urgent',
      category: 'NEWS2',
      title: 'High NEWS2 Score',
      message: `NEWS2 score of ${news2.totalScore} requires urgent review`,
      action: 'Urgent clinical review within 30 minutes',
      priority: 2
    });
  }

  // Lab alerts
  for (const labAlert of labAnalysis.alerts) {
    alerts.push({
      type: labAlert.severity === 'critical' ? 'critical' : 'warning',
      category: 'Laboratory',
      title: `${labAlert.type === 'critical_high' ? 'Critically High' : 'Critically Low'} ${labAlert.test}`,
      message: `${labAlert.test}: ${labAlert.value} (threshold: ${labAlert.threshold})`,
      action: 'Review and address immediately',
      priority: labAlert.severity === 'critical' ? 1 : 3
    });
  }

  // Vital trend alerts
  for (const concern of vitalTrends.concerns) {
    if (concern.severity === 'high') {
      alerts.push({
        type: 'warning',
        category: 'Vital Trends',
        title: concern.message,
        message: `${concern.parameter}: ${concern.change}`,
        action: 'Increase monitoring frequency',
        priority: 3
      });
    }
  }

  // High-risk condition alerts
  if (historyAnalysis.hasHighRiskConditions) {
    alerts.push({
      type: 'info',
      category: 'Risk Factors',
      title: 'High-Risk Patient',
      message: `Patient has ${historyAnalysis.riskFactors.filter(f => f.weight === 'high').length} high-risk conditions`,
      action: 'Consider lower threshold for escalation',
      priority: 4
    });
  }

  // Sort by priority
  return alerts.sort((a, b) => a.priority - b.priority);
}

/**
 * Generate clinical recommendations
 */
function generateRecommendations(riskLevel, news2, labAnalysis) {
  const recommendations = [];

  if (riskLevel.key === 'CRITICAL') {
    recommendations.push(
      { action: 'Activate rapid response/emergency team', urgency: 'immediate' },
      { action: 'Continuous vital sign monitoring', urgency: 'immediate' },
      { action: 'Senior clinician review', urgency: 'immediate' },
      { action: 'Consider ICU transfer', urgency: 'urgent' }
    );
  } else if (riskLevel.key === 'HIGH') {
    recommendations.push(
      { action: 'Urgent clinical review within 30 minutes', urgency: 'urgent' },
      { action: 'Increase vital sign monitoring to hourly', urgency: 'urgent' },
      { action: 'Review medications and fluid balance', urgency: 'soon' }
    );
  } else if (riskLevel.key === 'MODERATE') {
    recommendations.push(
      { action: 'Clinical review within 1 hour', urgency: 'soon' },
      { action: 'Vital signs every 4 hours minimum', urgency: 'routine' },
      { action: 'Review care plan', urgency: 'routine' }
    );
  }

  // Lab-specific recommendations
  if (labAnalysis.hasCriticalValues) {
    recommendations.push(
      { action: 'Repeat critical lab values', urgency: 'urgent' },
      { action: 'Review and correct electrolyte abnormalities', urgency: 'urgent' }
    );
  }

  // NEWS2-specific recommendations
  if (news2.breakdown.spo2 >= 2) {
    recommendations.push({ action: 'Assess airway and breathing', urgency: 'immediate' });
  }
  if (news2.breakdown.consciousness >= 3) {
    recommendations.push({ action: 'Neurological assessment', urgency: 'immediate' });
  }

  return recommendations;
}

module.exports = {
  predictDeterioration,
  calculateNEWS2Score,
  analyzeLabResults,
  analyzePatientHistory,
  analyzeVitalTrends,
  getRiskLevel,
  RISK_LEVELS,
  NEWS2_PARAMS
};
