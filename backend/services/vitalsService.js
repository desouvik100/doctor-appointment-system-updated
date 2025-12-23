/**
 * Vitals Service
 * Handles vitals validation, range checking, abnormal flagging, and unit conversions
 */

// Validation ranges for vital signs
const VITAL_RANGES = {
  bloodPressure: {
    systolic: {
      validMin: 60,
      validMax: 250,
      normalMin: 90,
      normalMax: 140,
      criticalLow: 80,
      criticalHigh: 180
    },
    diastolic: {
      validMin: 40,
      validMax: 150,
      normalMin: 60,
      normalMax: 90,
      criticalLow: 50,
      criticalHigh: 120
    }
  },
  pulse: {
    validMin: 30,
    validMax: 220,
    normalMin: 60,
    normalMax: 100,
    criticalLow: 40,
    criticalHigh: 150
  },
  temperature: {
    fahrenheit: {
      validMin: 95,
      validMax: 108,
      normalMin: 97,
      normalMax: 99.5,
      criticalLow: 95,
      criticalHigh: 104
    },
    celsius: {
      validMin: 35,
      validMax: 42,
      normalMin: 36.1,
      normalMax: 37.5,
      criticalLow: 35,
      criticalHigh: 40
    }
  },
  spo2: {
    validMin: 70,
    validMax: 100,
    normalMin: 95,
    normalMax: 100,
    criticalLow: 90,
    criticalHigh: null
  },
  respiratoryRate: {
    validMin: 8,
    validMax: 60,
    normalMin: 12,
    normalMax: 20,
    criticalLow: 8,
    criticalHigh: 30
  },
  bloodSugar: {
    fasting: {
      validMin: 50,
      validMax: 500,
      normalMin: 70,
      normalMax: 100,
      preDiabeticMax: 126,
      criticalLow: 50,
      criticalHigh: 400
    },
    random: {
      validMin: 50,
      validMax: 500,
      normalMin: 70,
      normalMax: 140,
      criticalLow: 50,
      criticalHigh: 400
    },
    postMeal: {
      validMin: 50,
      validMax: 500,
      normalMin: 70,
      normalMax: 140,
      criticalLow: 50,
      criticalHigh: 400
    }
  }
};

/**
 * Convert temperature between Fahrenheit and Celsius
 */
function convertTemperature(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  
  if (fromUnit === 'F' && toUnit === 'C') {
    return Math.round(((value - 32) * 5 / 9) * 10) / 10;
  } else if (fromUnit === 'C' && toUnit === 'F') {
    return Math.round((value * 9 / 5 + 32) * 10) / 10;
  }
  
  return value;
}

/**
 * Convert weight between kg and lbs
 */
function convertWeight(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  
  if (fromUnit === 'kg' && toUnit === 'lbs') {
    return Math.round(value * 2.20462 * 10) / 10;
  } else if (fromUnit === 'lbs' && toUnit === 'kg') {
    return Math.round(value / 2.20462 * 10) / 10;
  }
  
  return value;
}

/**
 * Convert height between cm and feet/inches
 */
function convertHeight(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  
  if (fromUnit === 'cm' && toUnit === 'ft') {
    const totalInches = value / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches, total: Math.round(totalInches * 10) / 10 };
  } else if (fromUnit === 'ft' && toUnit === 'cm') {
    // Assuming value is in inches or { feet, inches }
    const totalInches = typeof value === 'object' ? (value.feet * 12 + value.inches) : value;
    return Math.round(totalInches * 2.54 * 10) / 10;
  }
  
  return value;
}

/**
 * Calculate BMI from weight and height
 */
function calculateBMI(weight, weightUnit, height, heightUnit) {
  // Convert to kg and cm
  const weightKg = weightUnit === 'lbs' ? convertWeight(weight, 'lbs', 'kg') : weight;
  const heightCm = heightUnit === 'ft' ? convertHeight(height, 'ft', 'cm') : height;
  
  if (!weightKg || !heightCm || heightCm === 0) return null;
  
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  
  return Math.round(bmi * 10) / 10;
}

/**
 * Get BMI category
 */
function getBMICategory(bmi) {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}


/**
 * Validate a single vital sign value
 */
function validateVitalValue(vitalType, value, options = {}) {
  const result = {
    isValid: false,
    isAbnormal: false,
    isCritical: false,
    error: null,
    abnormalDirection: null
  };
  
  if (value === null || value === undefined || isNaN(value)) {
    result.error = `Invalid ${vitalType} value`;
    return result;
  }
  
  let range;
  
  switch (vitalType) {
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
      const tempUnit = options.unit === 'C' ? 'celsius' : 'fahrenheit';
      range = VITAL_RANGES.temperature[tempUnit];
      break;
    case 'spo2':
      range = VITAL_RANGES.spo2;
      break;
    case 'respiratoryRate':
      range = VITAL_RANGES.respiratoryRate;
      break;
    case 'bloodSugar':
      const sugarType = options.type || 'random';
      range = VITAL_RANGES.bloodSugar[sugarType];
      break;
    default:
      result.isValid = true;
      return result;
  }
  
  // Check valid range
  if (value < range.validMin || value > range.validMax) {
    result.error = `${vitalType} value ${value} is outside valid range (${range.validMin}-${range.validMax})`;
    return result;
  }
  
  result.isValid = true;
  
  // Check normal range
  if (value < range.normalMin) {
    result.isAbnormal = true;
    result.abnormalDirection = 'low';
  } else if (value > range.normalMax) {
    result.isAbnormal = true;
    result.abnormalDirection = 'high';
  }
  
  // Check critical range
  if (range.criticalLow && value <= range.criticalLow) {
    result.isCritical = true;
    result.abnormalDirection = 'critical_low';
  } else if (range.criticalHigh && value >= range.criticalHigh) {
    result.isCritical = true;
    result.abnormalDirection = 'critical_high';
  }
  
  return result;
}

/**
 * Validate all vitals and return validation result with abnormal flags
 */
function validateVitals(vitals) {
  const result = {
    isValid: true,
    errors: [],
    abnormalFlags: [],
    criticalFlags: [],
    validatedVitals: {}
  };
  
  // Validate blood pressure
  if (vitals.bloodPressure) {
    const { systolic, diastolic } = vitals.bloodPressure;
    
    if (systolic !== undefined && systolic !== null) {
      const systolicResult = validateVitalValue('systolic', systolic);
      if (!systolicResult.isValid) {
        result.isValid = false;
        result.errors.push(systolicResult.error);
      } else {
        if (systolicResult.isAbnormal) result.abnormalFlags.push(`BP Systolic ${systolicResult.abnormalDirection}`);
        if (systolicResult.isCritical) result.criticalFlags.push(`BP Systolic ${systolicResult.abnormalDirection}`);
        result.validatedVitals.bloodPressure = {
          ...vitals.bloodPressure,
          isAbnormal: systolicResult.isAbnormal
        };
      }
    }
    
    if (diastolic !== undefined && diastolic !== null) {
      const diastolicResult = validateVitalValue('diastolic', diastolic);
      if (!diastolicResult.isValid) {
        result.isValid = false;
        result.errors.push(diastolicResult.error);
      } else {
        if (diastolicResult.isAbnormal) result.abnormalFlags.push(`BP Diastolic ${diastolicResult.abnormalDirection}`);
        if (diastolicResult.isCritical) result.criticalFlags.push(`BP Diastolic ${diastolicResult.abnormalDirection}`);
        if (result.validatedVitals.bloodPressure) {
          result.validatedVitals.bloodPressure.isAbnormal = 
            result.validatedVitals.bloodPressure.isAbnormal || diastolicResult.isAbnormal;
        }
      }
    }
  }
  
  // Validate pulse
  if (vitals.pulse?.value !== undefined && vitals.pulse?.value !== null) {
    const pulseResult = validateVitalValue('pulse', vitals.pulse.value);
    if (!pulseResult.isValid) {
      result.isValid = false;
      result.errors.push(pulseResult.error);
    } else {
      if (pulseResult.isAbnormal) result.abnormalFlags.push(`Pulse ${pulseResult.abnormalDirection}`);
      if (pulseResult.isCritical) result.criticalFlags.push(`Pulse ${pulseResult.abnormalDirection}`);
      result.validatedVitals.pulse = {
        ...vitals.pulse,
        isAbnormal: pulseResult.isAbnormal
      };
    }
  }
  
  // Validate temperature
  if (vitals.temperature?.value !== undefined && vitals.temperature?.value !== null) {
    const unit = vitals.temperature.unit === '°C' || vitals.temperature.unit === 'C' ? 'C' : 'F';
    const tempResult = validateVitalValue('temperature', vitals.temperature.value, { unit });
    if (!tempResult.isValid) {
      result.isValid = false;
      result.errors.push(tempResult.error);
    } else {
      if (tempResult.isAbnormal) result.abnormalFlags.push(`Temperature ${tempResult.abnormalDirection}`);
      if (tempResult.isCritical) result.criticalFlags.push(`Temperature ${tempResult.abnormalDirection}`);
      result.validatedVitals.temperature = {
        ...vitals.temperature,
        isAbnormal: tempResult.isAbnormal
      };
    }
  }
  
  // Validate SpO2
  if (vitals.spo2?.value !== undefined && vitals.spo2?.value !== null) {
    const spo2Result = validateVitalValue('spo2', vitals.spo2.value);
    if (!spo2Result.isValid) {
      result.isValid = false;
      result.errors.push(spo2Result.error);
    } else {
      if (spo2Result.isAbnormal) result.abnormalFlags.push(`SpO2 ${spo2Result.abnormalDirection}`);
      if (spo2Result.isCritical) result.criticalFlags.push(`SpO2 ${spo2Result.abnormalDirection}`);
      result.validatedVitals.spo2 = {
        ...vitals.spo2,
        isAbnormal: spo2Result.isAbnormal
      };
    }
  }
  
  // Validate blood sugar
  if (vitals.bloodSugar?.value !== undefined && vitals.bloodSugar?.value !== null) {
    const sugarType = vitals.bloodSugar.type || 'random';
    const sugarResult = validateVitalValue('bloodSugar', vitals.bloodSugar.value, { type: sugarType });
    if (!sugarResult.isValid) {
      result.isValid = false;
      result.errors.push(sugarResult.error);
    } else {
      if (sugarResult.isAbnormal) result.abnormalFlags.push(`Blood Sugar ${sugarResult.abnormalDirection}`);
      if (sugarResult.isCritical) result.criticalFlags.push(`Blood Sugar ${sugarResult.abnormalDirection}`);
      result.validatedVitals.bloodSugar = {
        ...vitals.bloodSugar,
        isAbnormal: sugarResult.isAbnormal
      };
    }
  }
  
  // Validate respiratory rate
  if (vitals.respiratoryRate?.value !== undefined && vitals.respiratoryRate?.value !== null) {
    const rrResult = validateVitalValue('respiratoryRate', vitals.respiratoryRate.value);
    if (!rrResult.isValid) {
      result.isValid = false;
      result.errors.push(rrResult.error);
    } else {
      if (rrResult.isAbnormal) result.abnormalFlags.push(`Respiratory Rate ${rrResult.abnormalDirection}`);
      if (rrResult.isCritical) result.criticalFlags.push(`Respiratory Rate ${rrResult.abnormalDirection}`);
      result.validatedVitals.respiratoryRate = {
        ...vitals.respiratoryRate,
        isAbnormal: rrResult.isAbnormal
      };
    }
  }
  
  // Copy weight and height (no abnormal flagging for these)
  if (vitals.weight) result.validatedVitals.weight = vitals.weight;
  if (vitals.height) result.validatedVitals.height = vitals.height;
  
  // Calculate BMI if weight and height provided
  if (vitals.weight?.value && vitals.height?.value) {
    const bmi = calculateBMI(
      vitals.weight.value,
      vitals.weight.unit || 'kg',
      vitals.height.value,
      vitals.height.unit || 'cm'
    );
    result.validatedVitals.bmi = bmi;
  }
  
  // Store abnormal flags
  result.validatedVitals.abnormalFlags = result.abnormalFlags;
  
  return result;
}

module.exports = {
  VITAL_RANGES,
  validateVitals,
  validateVitalValue,
  convertTemperature,
  convertWeight,
  convertHeight,
  calculateBMI,
  getBMICategory
};
