/**
 * Temperature Conversion Utilities
 * Handles temperature unit conversions between Fahrenheit and Celsius
 */

/**
 * Convert temperature between Fahrenheit and Celsius
 * @param {number} value - Temperature value to convert
 * @param {string} fromUnit - Source unit ('F' or 'C')
 * @param {string} toUnit - Target unit ('F' or 'C')
 * @returns {number} Converted temperature value
 */
function convertTemperature(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  
  // Normalize unit strings - extract F or C from various formats
  const from = fromUnit.toUpperCase().includes('F') ? 'F' : 
               fromUnit.toUpperCase().includes('C') ? 'C' : 
               fromUnit.toUpperCase().charAt(0);
  const to = toUnit.toUpperCase().includes('F') ? 'F' : 
             toUnit.toUpperCase().includes('C') ? 'C' : 
             toUnit.toUpperCase().charAt(0);
  
  if (from === 'F' && to === 'C') {
    // Fahrenheit to Celsius: (F - 32) × 5/9
    return Math.round(((value - 32) * 5 / 9) * 10) / 10;
  } else if (from === 'C' && to === 'F') {
    // Celsius to Fahrenheit: C × 9/5 + 32
    return Math.round((value * 9 / 5 + 32) * 10) / 10;
  }
  
  return value;
}

/**
 * Convert Fahrenheit to Celsius
 * @param {number} fahrenheit - Temperature in Fahrenheit
 * @returns {number} Temperature in Celsius
 */
function fahrenheitToCelsius(fahrenheit) {
  return convertTemperature(fahrenheit, 'F', 'C');
}

/**
 * Convert Celsius to Fahrenheit
 * @param {number} celsius - Temperature in Celsius
 * @returns {number} Temperature in Fahrenheit
 */
function celsiusToFahrenheit(celsius) {
  return convertTemperature(celsius, 'C', 'F');
}

/**
 * Get temperature with both units
 * @param {number} value - Temperature value
 * @param {string} unit - Current unit ('F' or 'C')
 * @returns {object} Object with both Fahrenheit and Celsius values
 */
function getTemperatureInBothUnits(value, unit) {
  const normalizedUnit = unit.toUpperCase().charAt(0);
  
  if (normalizedUnit === 'F') {
    return {
      fahrenheit: value,
      celsius: fahrenheitToCelsius(value),
      unit: 'F'
    };
  } else {
    return {
      fahrenheit: celsiusToFahrenheit(value),
      celsius: value,
      unit: 'C'
    };
  }
}

/**
 * Validate temperature value for given unit
 * @param {number} value - Temperature value
 * @param {string} unit - Unit ('F' or 'C')
 * @returns {object} Validation result
 */
function validateTemperature(value, unit) {
  const normalizedUnit = unit.toUpperCase().charAt(0);
  
  const ranges = {
    F: { min: 95, max: 108, normal: { min: 97, max: 99.5 } },
    C: { min: 35, max: 42, normal: { min: 36.1, max: 37.5 } }
  };
  
  const range = ranges[normalizedUnit];
  if (!range) {
    return { isValid: false, error: 'Invalid temperature unit' };
  }
  
  if (value < range.min || value > range.max) {
    return { 
      isValid: false, 
      error: `Temperature ${value}°${normalizedUnit} is outside valid range (${range.min}-${range.max}°${normalizedUnit})` 
    };
  }
  
  const isNormal = value >= range.normal.min && value <= range.normal.max;
  
  return {
    isValid: true,
    isNormal,
    isFever: value > range.normal.max,
    isHypothermia: value < range.normal.min
  };
}

module.exports = {
  convertTemperature,
  fahrenheitToCelsius,
  celsiusToFahrenheit,
  getTemperatureInBothUnits,
  validateTemperature
};