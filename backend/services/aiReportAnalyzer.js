// backend/services/aiReportAnalyzer.js
// AI-Powered Medical Report Image Analyzer
// Analyzes uploaded lab report images to detect health conditions

const fs = require('fs');
const path = require('path');

// ============================================
// MEDICAL REFERENCE RANGES & CONDITIONS
// ============================================

// Comprehensive normal ranges for various tests
const medicalReferenceRanges = {
  // Diabetes Panel
  glucose_fasting: { min: 70, max: 100, unit: 'mg/dL', name: 'Fasting Blood Glucose', category: 'diabetes' },
  glucose_random: { min: 70, max: 140, unit: 'mg/dL', name: 'Random Blood Glucose', category: 'diabetes' },
  glucose_pp: { min: 70, max: 140, unit: 'mg/dL', name: 'Post-Prandial Glucose', category: 'diabetes' },
  hba1c: { min: 4.0, max: 5.6, unit: '%', name: 'HbA1c (Glycated Hemoglobin)', category: 'diabetes' },
  fasting_insulin: { min: 2.6, max: 24.9, unit: 'µIU/mL', name: 'Fasting Insulin', category: 'diabetes' },
  
  // Lipid Profile
  cholesterol_total: { min: 0, max: 200, unit: 'mg/dL', name: 'Total Cholesterol', category: 'lipid' },
  cholesterol_ldl: { min: 0, max: 100, unit: 'mg/dL', name: 'LDL Cholesterol', category: 'lipid' },
  cholesterol_hdl: { min: 40, max: 60, unit: 'mg/dL', name: 'HDL Cholesterol', category: 'lipid', inverse: true },
  triglycerides: { min: 0, max: 150, unit: 'mg/dL', name: 'Triglycerides', category: 'lipid' },
  vldl: { min: 5, max: 40, unit: 'mg/dL', name: 'VLDL Cholesterol', category: 'lipid' },
  
  // Complete Blood Count (CBC)
  hemoglobin: { min: 12, max: 17, unit: 'g/dL', name: 'Hemoglobin', category: 'cbc' },
  rbc: { min: 4.5, max: 5.5, unit: 'million/mcL', name: 'RBC Count', category: 'cbc' },
  wbc: { min: 4000, max: 11000, unit: '/mcL', name: 'WBC Count', category: 'cbc' },
  platelets: { min: 150000, max: 400000, unit: '/mcL', name: 'Platelet Count', category: 'cbc' },
  hematocrit: { min: 36, max: 50, unit: '%', name: 'Hematocrit', category: 'cbc' },
  mcv: { min: 80, max: 100, unit: 'fL', name: 'MCV', category: 'cbc' },
  mch: { min: 27, max: 33, unit: 'pg', name: 'MCH', category: 'cbc' },
  mchc: { min: 32, max: 36, unit: 'g/dL', name: 'MCHC', category: 'cbc' },

  // Kidney Function
  creatinine: { min: 0.6, max: 1.2, unit: 'mg/dL', name: 'Creatinine', category: 'kidney' },
  urea: { min: 7, max: 20, unit: 'mg/dL', name: 'Blood Urea', category: 'kidney' },
  bun: { min: 7, max: 20, unit: 'mg/dL', name: 'BUN', category: 'kidney' },
  uric_acid: { min: 3.5, max: 7.2, unit: 'mg/dL', name: 'Uric Acid', category: 'kidney' },
  egfr: { min: 90, max: 120, unit: 'mL/min', name: 'eGFR', category: 'kidney' },
  
  // Liver Function
  bilirubin_total: { min: 0.1, max: 1.2, unit: 'mg/dL', name: 'Total Bilirubin', category: 'liver' },
  bilirubin_direct: { min: 0, max: 0.3, unit: 'mg/dL', name: 'Direct Bilirubin', category: 'liver' },
  sgpt: { min: 7, max: 56, unit: 'U/L', name: 'SGPT/ALT', category: 'liver' },
  sgot: { min: 10, max: 40, unit: 'U/L', name: 'SGOT/AST', category: 'liver' },
  alp: { min: 44, max: 147, unit: 'U/L', name: 'Alkaline Phosphatase', category: 'liver' },
  ggt: { min: 9, max: 48, unit: 'U/L', name: 'GGT', category: 'liver' },
  albumin: { min: 3.5, max: 5.0, unit: 'g/dL', name: 'Albumin', category: 'liver' },
  protein_total: { min: 6.0, max: 8.3, unit: 'g/dL', name: 'Total Protein', category: 'liver' },
  
  // Thyroid Panel
  tsh: { min: 0.4, max: 4.0, unit: 'mIU/L', name: 'TSH', category: 'thyroid' },
  t3: { min: 80, max: 200, unit: 'ng/dL', name: 'T3', category: 'thyroid' },
  t4: { min: 5, max: 12, unit: 'mcg/dL', name: 'T4', category: 'thyroid' },
  ft3: { min: 2.3, max: 4.2, unit: 'pg/mL', name: 'Free T3', category: 'thyroid' },
  ft4: { min: 0.8, max: 1.8, unit: 'ng/dL', name: 'Free T4', category: 'thyroid' },
  
  // Vitamins & Minerals
  vitamin_d: { min: 30, max: 100, unit: 'ng/mL', name: 'Vitamin D', category: 'vitamin' },
  vitamin_b12: { min: 200, max: 900, unit: 'pg/mL', name: 'Vitamin B12', category: 'vitamin' },
  iron: { min: 60, max: 170, unit: 'mcg/dL', name: 'Serum Iron', category: 'vitamin' },
  ferritin: { min: 12, max: 300, unit: 'ng/mL', name: 'Ferritin', category: 'vitamin' },
  calcium: { min: 8.5, max: 10.5, unit: 'mg/dL', name: 'Calcium', category: 'vitamin' },
  phosphorus: { min: 2.5, max: 4.5, unit: 'mg/dL', name: 'Phosphorus', category: 'vitamin' },
  magnesium: { min: 1.7, max: 2.2, unit: 'mg/dL', name: 'Magnesium', category: 'vitamin' },
  sodium: { min: 136, max: 145, unit: 'mEq/L', name: 'Sodium', category: 'electrolyte' },
  potassium: { min: 3.5, max: 5.0, unit: 'mEq/L', name: 'Potassium', category: 'electrolyte' },
  chloride: { min: 98, max: 106, unit: 'mEq/L', name: 'Chloride', category: 'electrolyte' }
};


// Condition detection rules
const conditionRules = {
  diabetes: {
    name: 'Diabetes',
    checks: [
      { test: 'glucose_fasting', threshold: 126, condition: '>=', severity: 'diabetic' },
      { test: 'glucose_fasting', threshold: 100, condition: '>=', severity: 'prediabetic' },
      { test: 'hba1c', threshold: 6.5, condition: '>=', severity: 'diabetic' },
      { test: 'hba1c', threshold: 5.7, condition: '>=', severity: 'prediabetic' },
      { test: 'glucose_pp', threshold: 200, condition: '>=', severity: 'diabetic' },
      { test: 'glucose_pp', threshold: 140, condition: '>=', severity: 'prediabetic' }
    ],
    recommendations: {
      diabetic: [
        '🚨 Your blood sugar levels indicate diabetes. Please consult an Endocrinologist immediately.',
        'Monitor blood sugar levels daily',
        'Follow a strict low-carb, low-sugar diet',
        'Regular exercise (30 min daily)',
        'Take prescribed medications as directed',
        'Regular HbA1c tests every 3 months'
      ],
      prediabetic: [
        '⚠️ Your levels indicate prediabetes. Lifestyle changes can prevent progression.',
        'Reduce sugar and refined carbohydrate intake',
        'Increase physical activity to 150 min/week',
        'Maintain healthy weight (BMI < 25)',
        'Retest in 3 months',
        'Consider consulting a dietitian'
      ]
    }
  },
  
  anemia: {
    name: 'Anemia',
    checks: [
      { test: 'hemoglobin', threshold: 12, condition: '<', severity: 'mild', gender: 'female' },
      { test: 'hemoglobin', threshold: 13, condition: '<', severity: 'mild', gender: 'male' },
      { test: 'hemoglobin', threshold: 10, condition: '<', severity: 'moderate' },
      { test: 'hemoglobin', threshold: 8, condition: '<', severity: 'severe' }
    ],
    recommendations: {
      severe: [
        '🚨 Severe anemia detected. Seek immediate medical attention.',
        'May require blood transfusion',
        'Consult a Hematologist urgently'
      ],
      moderate: [
        '⚠️ Moderate anemia detected. Consult a doctor.',
        'Iron-rich foods: spinach, red meat, beans',
        'Vitamin C to improve iron absorption',
        'May need iron supplements'
      ],
      mild: [
        'Mild anemia detected.',
        'Include iron-rich foods in diet',
        'Consider iron supplements after consulting doctor'
      ]
    }
  },

  
  hyperlipidemia: {
    name: 'High Cholesterol',
    checks: [
      { test: 'cholesterol_total', threshold: 240, condition: '>=', severity: 'high' },
      { test: 'cholesterol_total', threshold: 200, condition: '>=', severity: 'borderline' },
      { test: 'cholesterol_ldl', threshold: 160, condition: '>=', severity: 'high' },
      { test: 'cholesterol_ldl', threshold: 130, condition: '>=', severity: 'borderline' },
      { test: 'triglycerides', threshold: 200, condition: '>=', severity: 'high' },
      { test: 'triglycerides', threshold: 150, condition: '>=', severity: 'borderline' }
    ],
    recommendations: {
      high: [
        '🚨 High cholesterol levels detected. Consult a Cardiologist.',
        'Avoid saturated and trans fats',
        'Increase fiber intake',
        'Regular cardiovascular exercise',
        'May need statin medication'
      ],
      borderline: [
        '⚠️ Borderline high cholesterol. Lifestyle changes recommended.',
        'Reduce fried and processed foods',
        'Eat more fruits, vegetables, whole grains',
        'Exercise 30 minutes daily',
        'Retest in 3-6 months'
      ]
    }
  },
  
  thyroid_hypo: {
    name: 'Hypothyroidism',
    checks: [
      { test: 'tsh', threshold: 4.5, condition: '>', severity: 'hypothyroid' },
      { test: 'tsh', threshold: 10, condition: '>', severity: 'severe_hypothyroid' }
    ],
    recommendations: {
      severe_hypothyroid: [
        '🚨 Severe hypothyroidism detected. See an Endocrinologist immediately.',
        'Thyroid hormone replacement therapy needed',
        'Regular monitoring required'
      ],
      hypothyroid: [
        '⚠️ Hypothyroidism detected.',
        'Consult an Endocrinologist',
        'May need thyroid medication (Levothyroxine)',
        'Avoid goitrogens (raw cruciferous vegetables)',
        'Regular TSH monitoring'
      ]
    }
  },
  
  thyroid_hyper: {
    name: 'Hyperthyroidism',
    checks: [
      { test: 'tsh', threshold: 0.4, condition: '<', severity: 'hyperthyroid' }
    ],
    recommendations: {
      hyperthyroid: [
        '⚠️ Hyperthyroidism suspected (low TSH).',
        'Consult an Endocrinologist',
        'Further tests (T3, T4) recommended',
        'Treatment options: medication, radioiodine, surgery'
      ]
    }
  },

  
  kidney_disease: {
    name: 'Kidney Disease',
    checks: [
      { test: 'creatinine', threshold: 1.3, condition: '>', severity: 'elevated' },
      { test: 'creatinine', threshold: 2.0, condition: '>', severity: 'high' },
      { test: 'egfr', threshold: 60, condition: '<', severity: 'moderate_ckd' },
      { test: 'egfr', threshold: 30, condition: '<', severity: 'severe_ckd' },
      { test: 'urea', threshold: 25, condition: '>', severity: 'elevated' }
    ],
    recommendations: {
      severe_ckd: [
        '🚨 Severe kidney function impairment. See a Nephrologist urgently.',
        'May need dialysis evaluation',
        'Strict protein and sodium restriction'
      ],
      moderate_ckd: [
        '⚠️ Moderate kidney disease detected.',
        'Consult a Nephrologist',
        'Control blood pressure and diabetes',
        'Limit protein intake',
        'Stay hydrated'
      ],
      elevated: [
        'Kidney markers slightly elevated.',
        'Stay well hydrated',
        'Avoid NSAIDs',
        'Control blood pressure',
        'Retest in 1-2 months'
      ],
      high: [
        '⚠️ Significantly elevated kidney markers.',
        'Consult a Nephrologist',
        'Avoid nephrotoxic medications',
        'Monitor blood pressure closely'
      ]
    }
  },
  
  liver_disease: {
    name: 'Liver Disease',
    checks: [
      { test: 'sgpt', threshold: 56, condition: '>', severity: 'elevated' },
      { test: 'sgpt', threshold: 200, condition: '>', severity: 'high' },
      { test: 'sgot', threshold: 40, condition: '>', severity: 'elevated' },
      { test: 'sgot', threshold: 200, condition: '>', severity: 'high' },
      { test: 'bilirubin_total', threshold: 1.2, condition: '>', severity: 'elevated' },
      { test: 'bilirubin_total', threshold: 3.0, condition: '>', severity: 'high' }
    ],
    recommendations: {
      high: [
        '🚨 Significantly elevated liver enzymes. See a Gastroenterologist.',
        'Avoid alcohol completely',
        'Stop any hepatotoxic medications',
        'Liver ultrasound recommended'
      ],
      elevated: [
        '⚠️ Liver enzymes elevated.',
        'Avoid alcohol',
        'Reduce fatty foods',
        'Check for hepatitis',
        'Retest in 4-6 weeks'
      ]
    }
  },
  
  vitamin_d_deficiency: {
    name: 'Vitamin D Deficiency',
    checks: [
      { test: 'vitamin_d', threshold: 20, condition: '<', severity: 'deficient' },
      { test: 'vitamin_d', threshold: 30, condition: '<', severity: 'insufficient' }
    ],
    recommendations: {
      deficient: [
        '⚠️ Vitamin D deficiency detected.',
        'Vitamin D3 supplementation (60,000 IU weekly for 8 weeks)',
        'Sun exposure 15-20 min daily',
        'Foods: fatty fish, egg yolks, fortified milk'
      ],
      insufficient: [
        'Vitamin D levels insufficient.',
        'Daily Vitamin D3 supplement (1000-2000 IU)',
        'Increase sun exposure',
        'Retest in 3 months'
      ]
    }
  }
};


// ============================================
// TEXT EXTRACTION PATTERNS
// ============================================

// Patterns to extract test values from OCR text
const extractionPatterns = {
  // Diabetes tests
  glucose_fasting: [
    /(?:fasting|fbs|fbg|fasting\s*blood\s*(?:sugar|glucose))[:\s]*(\d+\.?\d*)/i,
    /(?:glucose|blood\s*sugar)[,\s]*(?:fasting)[:\s]*(\d+\.?\d*)/i,
    /fbs[:\s]*(\d+\.?\d*)\s*(?:mg|mg\/dl)/i
  ],
  glucose_random: [
    /(?:random|rbs|rbg|random\s*blood\s*(?:sugar|glucose))[:\s]*(\d+\.?\d*)/i,
    /rbs[:\s]*(\d+\.?\d*)\s*(?:mg|mg\/dl)/i
  ],
  glucose_pp: [
    /(?:pp|ppbs|post\s*prandial|post\s*meal)[:\s]*(\d+\.?\d*)/i,
    /(?:2\s*hr|2hr|2\s*hour)[:\s]*(\d+\.?\d*)/i
  ],
  hba1c: [
    /(?:hba1c|hb\s*a1c|glycated\s*h(?:ae)?moglobin|a1c)[:\s]*(\d+\.?\d*)\s*%?/i,
    /a1c[:\s]*(\d+\.?\d*)/i
  ],
  
  // Lipid profile
  cholesterol_total: [
    /(?:total\s*cholesterol|cholesterol\s*total|t\.?\s*chol)[:\s]*(\d+\.?\d*)/i,
    /cholesterol[:\s]*(\d+\.?\d*)\s*(?:mg|mg\/dl)/i
  ],
  cholesterol_ldl: [
    /(?:ldl|ldl[\s-]*c(?:holesterol)?|low\s*density)[:\s]*(\d+\.?\d*)/i
  ],
  cholesterol_hdl: [
    /(?:hdl|hdl[\s-]*c(?:holesterol)?|high\s*density)[:\s]*(\d+\.?\d*)/i
  ],
  triglycerides: [
    /(?:triglycerides?|tg|trigs)[:\s]*(\d+\.?\d*)/i
  ],
  
  // CBC
  hemoglobin: [
    /(?:h(?:ae)?moglobin|hgb|hb)[:\s]*(\d+\.?\d*)\s*(?:g\/dl|gm\/dl|g%)?/i
  ],
  rbc: [
    /(?:rbc|red\s*blood\s*cells?|erythrocytes?)[:\s]*(\d+\.?\d*)/i
  ],
  wbc: [
    /(?:wbc|white\s*blood\s*cells?|leucocytes?|leukocytes?)[:\s]*(\d+\.?\d*)/i
  ],
  platelets: [
    /(?:platelets?|plt|thrombocytes?)[:\s]*(\d+\.?\d*)/i
  ],
  
  // Kidney
  creatinine: [
    /(?:creatinine|creat|s\.?\s*creatinine|serum\s*creatinine)[:\s]*(\d+\.?\d*)/i
  ],
  urea: [
    /(?:urea|blood\s*urea)[:\s]*(\d+\.?\d*)/i
  ],
  uric_acid: [
    /(?:uric\s*acid|s\.?\s*uric\s*acid)[:\s]*(\d+\.?\d*)/i
  ],
  
  // Liver
  sgpt: [
    /(?:sgpt|alt|alanine\s*(?:amino)?transaminase)[:\s]*(\d+\.?\d*)/i
  ],
  sgot: [
    /(?:sgot|ast|aspartate\s*(?:amino)?transaminase)[:\s]*(\d+\.?\d*)/i
  ],
  bilirubin_total: [
    /(?:total\s*bilirubin|bilirubin\s*total|t\.?\s*bil)[:\s]*(\d+\.?\d*)/i,
    /bilirubin[:\s]*(\d+\.?\d*)/i
  ],
  
  // Thyroid
  tsh: [
    /(?:tsh|thyroid\s*stimulating)[:\s]*(\d+\.?\d*)/i
  ],
  t3: [
    /(?:t3|triiodothyronine)[:\s]*(\d+\.?\d*)/i
  ],
  t4: [
    /(?:t4|thyroxine)[:\s]*(\d+\.?\d*)/i
  ],
  
  // Vitamins
  vitamin_d: [
    /(?:vitamin\s*d|vit\.?\s*d|25[\s-]*oh[\s-]*d)[:\s]*(\d+\.?\d*)/i
  ],
  vitamin_b12: [
    /(?:vitamin\s*b12|vit\.?\s*b12|b12|cobalamin)[:\s]*(\d+\.?\d*)/i
  ],
  iron: [
    /(?:serum\s*iron|s\.?\s*iron|iron)[:\s]*(\d+\.?\d*)/i
  ],
  calcium: [
    /(?:calcium|ca|s\.?\s*calcium)[:\s]*(\d+\.?\d*)/i
  ]
};


// ============================================
// CORE ANALYSIS FUNCTIONS
// ============================================

/**
 * Extract test values from OCR text
 * @param {string} ocrText - Text extracted from report image
 * @returns {object} - Extracted test values
 */
function extractValuesFromText(ocrText) {
  const extractedValues = {};
  const text = ocrText.toLowerCase();
  
  for (const [testName, patterns] of Object.entries(extractionPatterns)) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = parseFloat(match[1]);
        if (!isNaN(value) && value > 0) {
          extractedValues[testName] = value;
          break; // Use first match
        }
      }
    }
  }
  
  return extractedValues;
}

/**
 * Analyze extracted values against reference ranges
 * @param {object} values - Extracted test values
 * @param {object} patientInfo - Optional patient info (age, gender)
 * @returns {object} - Analysis results
 */
function analyzeExtractedValues(values, patientInfo = {}) {
  const results = {
    tests: [],
    conditions: [],
    overallStatus: 'normal',
    riskLevel: 'low',
    recommendations: [],
    summary: '',
    detectedConditions: []
  };
  
  // Analyze each test value
  for (const [testKey, value] of Object.entries(values)) {
    const reference = medicalReferenceRanges[testKey];
    if (!reference) continue;
    
    const testResult = {
      name: reference.name,
      value: value,
      unit: reference.unit,
      normalRange: `${reference.min} - ${reference.max}`,
      status: 'normal',
      category: reference.category
    };
    
    // Check if value is abnormal
    if (reference.inverse) {
      // For HDL, higher is better
      if (value < reference.min) {
        testResult.status = 'low';
        testResult.interpretation = `Low ${reference.name} - below optimal`;
      } else if (value >= reference.min && value <= reference.max) {
        testResult.status = 'normal';
      } else {
        testResult.status = 'high';
        testResult.interpretation = `Good ${reference.name} level`;
      }
    } else {
      if (value < reference.min) {
        testResult.status = 'low';
        testResult.deviation = ((reference.min - value) / reference.min * 100).toFixed(1);
        testResult.interpretation = `Below normal range`;
      } else if (value > reference.max) {
        testResult.status = 'high';
        testResult.deviation = ((value - reference.max) / reference.max * 100).toFixed(1);
        testResult.interpretation = `Above normal range`;
      }
    }
    
    results.tests.push(testResult);
  }
  
  // Detect conditions
  for (const [conditionKey, condition] of Object.entries(conditionRules)) {
    for (const check of condition.checks) {
      const value = values[check.test];
      if (value === undefined) continue;
      
      let conditionMet = false;
      switch (check.condition) {
        case '>=': conditionMet = value >= check.threshold; break;
        case '>': conditionMet = value > check.threshold; break;
        case '<=': conditionMet = value <= check.threshold; break;
        case '<': conditionMet = value < check.threshold; break;
      }
      
      if (conditionMet) {
        // Check gender-specific conditions
        if (check.gender && patientInfo.gender && check.gender !== patientInfo.gender) {
          continue;
        }
        
        const existingCondition = results.detectedConditions.find(c => c.name === condition.name);
        if (!existingCondition || getSeverityLevel(check.severity) > getSeverityLevel(existingCondition.severity)) {
          if (existingCondition) {
            results.detectedConditions = results.detectedConditions.filter(c => c.name !== condition.name);
          }
          
          results.detectedConditions.push({
            name: condition.name,
            severity: check.severity,
            triggeredBy: check.test,
            value: value,
            threshold: check.threshold,
            recommendations: condition.recommendations[check.severity] || []
          });
        }
      }
    }
  }
  
  // Determine overall status
  const abnormalTests = results.tests.filter(t => t.status !== 'normal');
  const criticalConditions = results.detectedConditions.filter(c => 
    c.severity.includes('severe') || c.severity.includes('diabetic') || c.severity.includes('high')
  );
  
  if (criticalConditions.length > 0) {
    results.overallStatus = 'critical';
    results.riskLevel = 'high';
  } else if (results.detectedConditions.length > 0) {
    results.overallStatus = 'attention_needed';
    results.riskLevel = 'moderate';
  } else if (abnormalTests.length > 0) {
    results.overallStatus = 'minor_concerns';
    results.riskLevel = 'low';
  }
  
  // Compile recommendations
  results.detectedConditions.forEach(condition => {
    results.recommendations.push(...condition.recommendations);
  });
  
  // Generate summary
  results.summary = generateSummary(results);
  
  return results;
}

function getSeverityLevel(severity) {
  const levels = {
    'mild': 1, 'insufficient': 1, 'borderline': 1,
    'moderate': 2, 'elevated': 2, 'prediabetic': 2,
    'high': 3, 'deficient': 3, 'hypothyroid': 3, 'hyperthyroid': 3,
    'severe': 4, 'diabetic': 4, 'severe_hypothyroid': 4, 'severe_ckd': 4, 'moderate_ckd': 3
  };
  return levels[severity] || 0;
}


/**
 * Generate human-readable summary
 */
function generateSummary(results) {
  const parts = [];
  
  // Overall status
  switch (results.overallStatus) {
    case 'critical':
      parts.push('🚨 ATTENTION REQUIRED: Your report shows values that need immediate medical attention.');
      break;
    case 'attention_needed':
      parts.push('⚠️ Some values in your report need attention. Please consult a doctor.');
      break;
    case 'minor_concerns':
      parts.push('ℹ️ Your report shows some minor variations from normal ranges.');
      break;
    default:
      parts.push('✅ Your report values are within normal ranges.');
  }
  
  // Detected conditions
  if (results.detectedConditions.length > 0) {
    parts.push('\n\n📋 Detected Conditions:');
    results.detectedConditions.forEach(c => {
      parts.push(`• ${c.name} (${c.severity.replace('_', ' ')})`);
    });
  }
  
  // Abnormal tests count
  const abnormal = results.tests.filter(t => t.status !== 'normal');
  if (abnormal.length > 0) {
    parts.push(`\n\n📊 ${abnormal.length} test(s) outside normal range.`);
  }
  
  return parts.join('');
}

/**
 * Main function to analyze a medical report image
 * @param {string} imageBase64 - Base64 encoded image or file path
 * @param {object} options - Analysis options
 * @returns {object} - Complete analysis results
 */
async function analyzeReportImage(imageBase64, options = {}) {
  try {
    const { patientInfo = {}, reportType = 'auto' } = options;
    
    // For now, we'll use a simulated OCR approach
    // In production, integrate with Google Vision API, AWS Textract, or Tesseract
    let ocrText = '';
    
    // Check if we have OCR service configured
    if (process.env.GOOGLE_VISION_API_KEY) {
      ocrText = await performGoogleVisionOCR(imageBase64);
    } else if (process.env.AWS_ACCESS_KEY_ID) {
      ocrText = await performAWSTextractOCR(imageBase64);
    } else {
      // Use local Tesseract if available, otherwise return instructions
      try {
        const Tesseract = require('tesseract.js');
        const result = await Tesseract.recognize(
          imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
          'eng',
          { logger: m => console.log(m.status) }
        );
        ocrText = result.data.text;
      } catch (tesseractError) {
        console.log('Tesseract not available, using manual input mode');
        return {
          success: false,
          requiresManualInput: true,
          message: 'OCR service not configured. Please enter values manually.',
          supportedTests: Object.keys(medicalReferenceRanges).map(key => ({
            key,
            name: medicalReferenceRanges[key].name,
            unit: medicalReferenceRanges[key].unit
          }))
        };
      }
    }
    
    console.log('📄 OCR Text extracted:', ocrText.substring(0, 500) + '...');
    
    // Extract values from OCR text
    const extractedValues = extractValuesFromText(ocrText);
    console.log('📊 Extracted values:', extractedValues);
    
    if (Object.keys(extractedValues).length === 0) {
      return {
        success: false,
        message: 'Could not extract any test values from the image. Please ensure the image is clear and contains lab report data.',
        ocrText: ocrText.substring(0, 1000),
        suggestion: 'Try uploading a clearer image or enter values manually.'
      };
    }
    
    // Analyze the extracted values
    const analysis = analyzeExtractedValues(extractedValues, patientInfo);
    
    return {
      success: true,
      extractedValues,
      analysis,
      ocrConfidence: calculateOCRConfidence(extractedValues),
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error analyzing report image:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Calculate OCR confidence based on extracted values
 */
function calculateOCRConfidence(extractedValues) {
  const totalPossible = Object.keys(extractionPatterns).length;
  const extracted = Object.keys(extractedValues).length;
  return Math.round((extracted / Math.min(totalPossible, 10)) * 100);
}


/**
 * Analyze manually entered report values
 * @param {object} values - Object with test names and values
 * @param {object} patientInfo - Patient information
 * @returns {object} - Analysis results
 */
function analyzeManualReport(values, patientInfo = {}) {
  try {
    // Normalize keys
    const normalizedValues = {};
    for (const [key, value] of Object.entries(values)) {
      const normalizedKey = key.toLowerCase().replace(/[\s-]/g, '_');
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        normalizedValues[normalizedKey] = numValue;
      }
    }
    
    const analysis = analyzeExtractedValues(normalizedValues, patientInfo);
    
    return {
      success: true,
      inputValues: normalizedValues,
      analysis,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get diabetes-specific analysis
 * @param {object} values - Test values
 * @returns {object} - Diabetes analysis
 */
function analyzeDiabetesReport(values) {
  const diabetesTests = ['glucose_fasting', 'glucose_pp', 'glucose_random', 'hba1c', 'fasting_insulin'];
  const relevantValues = {};
  
  for (const test of diabetesTests) {
    if (values[test] !== undefined) {
      relevantValues[test] = values[test];
    }
  }
  
  if (Object.keys(relevantValues).length === 0) {
    return {
      success: false,
      message: 'No diabetes-related values found in the report'
    };
  }
  
  const analysis = analyzeExtractedValues(relevantValues, {});
  
  // Add diabetes-specific interpretation
  let diabetesStatus = 'normal';
  let interpretation = '';
  
  const fasting = relevantValues.glucose_fasting;
  const hba1c = relevantValues.hba1c;
  const pp = relevantValues.glucose_pp;
  
  if (fasting) {
    if (fasting >= 126) {
      diabetesStatus = 'diabetic';
      interpretation = `Fasting glucose ${fasting} mg/dL indicates diabetes (≥126 mg/dL).`;
    } else if (fasting >= 100) {
      diabetesStatus = 'prediabetic';
      interpretation = `Fasting glucose ${fasting} mg/dL indicates prediabetes (100-125 mg/dL).`;
    } else {
      interpretation = `Fasting glucose ${fasting} mg/dL is normal (<100 mg/dL).`;
    }
  }
  
  if (hba1c) {
    if (hba1c >= 6.5) {
      diabetesStatus = 'diabetic';
      interpretation += ` HbA1c ${hba1c}% indicates diabetes (≥6.5%).`;
    } else if (hba1c >= 5.7) {
      if (diabetesStatus !== 'diabetic') diabetesStatus = 'prediabetic';
      interpretation += ` HbA1c ${hba1c}% indicates prediabetes (5.7-6.4%).`;
    } else {
      interpretation += ` HbA1c ${hba1c}% is normal (<5.7%).`;
    }
  }
  
  if (pp) {
    if (pp >= 200) {
      diabetesStatus = 'diabetic';
      interpretation += ` Post-prandial glucose ${pp} mg/dL indicates diabetes (≥200 mg/dL).`;
    } else if (pp >= 140) {
      if (diabetesStatus !== 'diabetic') diabetesStatus = 'prediabetic';
      interpretation += ` Post-prandial glucose ${pp} mg/dL indicates prediabetes (140-199 mg/dL).`;
    }
  }
  
  return {
    success: true,
    diabetesStatus,
    interpretation,
    values: relevantValues,
    analysis,
    recommendations: conditionRules.diabetes.recommendations[diabetesStatus] || [
      '✅ Your blood sugar levels are normal.',
      'Continue healthy lifestyle',
      'Annual screening recommended'
    ]
  };
}

/**
 * Get supported test types
 */
function getSupportedTests() {
  return Object.entries(medicalReferenceRanges).map(([key, ref]) => ({
    key,
    name: ref.name,
    unit: ref.unit,
    category: ref.category,
    normalRange: `${ref.min} - ${ref.max}`
  }));
}

/**
 * Get tests by category
 */
function getTestsByCategory(category) {
  return Object.entries(medicalReferenceRanges)
    .filter(([_, ref]) => ref.category === category)
    .map(([key, ref]) => ({
      key,
      name: ref.name,
      unit: ref.unit,
      normalRange: `${ref.min} - ${ref.max}`
    }));
}

// Placeholder for Google Vision OCR
async function performGoogleVisionOCR(imageBase64) {
  // Integration with Google Cloud Vision API
  // Requires: npm install @google-cloud/vision
  console.log('Google Vision OCR not implemented - use manual input');
  return '';
}

// Placeholder for AWS Textract OCR
async function performAWSTextractOCR(imageBase64) {
  // Integration with AWS Textract
  // Requires: npm install @aws-sdk/client-textract
  console.log('AWS Textract OCR not implemented - use manual input');
  return '';
}

module.exports = {
  analyzeReportImage,
  analyzeManualReport,
  analyzeDiabetesReport,
  extractValuesFromText,
  analyzeExtractedValues,
  getSupportedTests,
  getTestsByCategory,
  medicalReferenceRanges,
  conditionRules
};