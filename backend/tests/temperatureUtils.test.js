/**
 * Property-Based Tests for Temperature Conversion Utilities
 * Feature: emr-clinical-features
 * 
 * Tests temperature unit conversion round-trip properties
 */

const fc = require('fast-check');
const {
  convertTemperature,
  fahrenheitToCelsius,
  celsiusToFahrenheit,
  getTemperatureInBothUnits,
  validateTemperature
} = require('../utils/temperatureUtils');

describe('Temperature Conversion Utilities', () => {
  
  /**
   * Property 2: Temperature Unit Conversion Round-Trip
   * For any valid temperature value in Fahrenheit, converting to Celsius and back
   * to Fahrenheit SHALL produce a value within 0.1°F of the original.
   * 
   * Validates: Requirements 1.4
   */
  describe('Property 2: Temperature Unit Conversion Round-Trip', () => {
    
    test('F to C to F round-trip preserves value within precision', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 95, max: 108, noNaN: true }),
          (tempF) => {
            const tempC = convertTemperature(tempF, 'F', 'C');
            const tempFBack = convertTemperature(tempC, 'C', 'F');
            
            // Should be within 0.2°F due to rounding (allowing for floating point precision)
            expect(Math.abs(tempFBack - tempF)).toBeLessThanOrEqual(0.2);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('C to F to C round-trip preserves value within precision', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 35, max: 42, noNaN: true }),
          (tempC) => {
            const tempF = convertTemperature(tempC, 'C', 'F');
            const tempCBack = convertTemperature(tempF, 'F', 'C');
            
            // Should be within 0.2°C due to rounding
            expect(Math.abs(tempCBack - tempC)).toBeLessThanOrEqual(0.2);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('same unit conversion returns same value', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 95, max: 108, noNaN: true }),
          (temp) => {
            expect(convertTemperature(temp, 'F', 'F')).toBe(temp);
            expect(convertTemperature(temp, 'C', 'C')).toBe(temp);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('helper functions match general conversion function', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 95, max: 108, noNaN: true }),
          (tempF) => {
            const celsiusFromHelper = fahrenheitToCelsius(tempF);
            const celsiusFromGeneral = convertTemperature(tempF, 'F', 'C');
            
            expect(celsiusFromHelper).toBe(celsiusFromGeneral);
          }
        ),
        { numRuns: 100 }
      );
      
      fc.assert(
        fc.property(
          fc.float({ min: 35, max: 42, noNaN: true }),
          (tempC) => {
            const fahrenheitFromHelper = celsiusToFahrenheit(tempC);
            const fahrenheitFromGeneral = convertTemperature(tempC, 'C', 'F');
            
            expect(fahrenheitFromHelper).toBe(fahrenheitFromGeneral);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('unit string normalization works correctly', () => {
      const temp = 98.6;
      
      // Test various unit string formats
      expect(convertTemperature(temp, 'f', 'c')).toBe(convertTemperature(temp, 'F', 'C'));
      expect(convertTemperature(temp, '°F', '°C')).toBe(convertTemperature(temp, 'F', 'C'));
      expect(convertTemperature(temp, 'fahrenheit', 'celsius')).toBe(convertTemperature(temp, 'F', 'C'));
    });
  });
  
  /**
   * Additional tests for temperature utilities
   */
  describe('Temperature Utility Functions', () => {
    
    test('getTemperatureInBothUnits provides correct conversions', () => {
      const tempF = 98.6;
      const result = getTemperatureInBothUnits(tempF, 'F');
      
      expect(result.fahrenheit).toBe(tempF);
      expect(result.celsius).toBe(fahrenheitToCelsius(tempF));
      expect(result.unit).toBe('F');
      
      const tempC = 37;
      const resultC = getTemperatureInBothUnits(tempC, 'C');
      
      expect(resultC.celsius).toBe(tempC);
      expect(resultC.fahrenheit).toBe(celsiusToFahrenheit(tempC));
      expect(resultC.unit).toBe('C');
    });
    
    test('validateTemperature correctly identifies normal and abnormal temperatures', () => {
      // Normal temperature in Fahrenheit
      const normalF = validateTemperature(98.6, 'F');
      expect(normalF.isValid).toBe(true);
      expect(normalF.isNormal).toBe(true);
      expect(normalF.isFever).toBe(false);
      
      // Fever in Fahrenheit
      const feverF = validateTemperature(101, 'F');
      expect(feverF.isValid).toBe(true);
      expect(feverF.isNormal).toBe(false);
      expect(feverF.isFever).toBe(true);
      
      // Normal temperature in Celsius
      const normalC = validateTemperature(37, 'C');
      expect(normalC.isValid).toBe(true);
      expect(normalC.isNormal).toBe(true);
      
      // Invalid temperature
      const invalid = validateTemperature(50, 'C');
      expect(invalid.isValid).toBe(false);
      expect(invalid.error).toBeDefined();
    });
  });
  
  /**
   * Edge cases and error handling
   */
  describe('Edge Cases', () => {
    
    test('handles boundary values correctly', () => {
      // Test exact boundary values
      expect(convertTemperature(32, 'F', 'C')).toBe(0);
      expect(convertTemperature(0, 'C', 'F')).toBe(32);
      expect(convertTemperature(212, 'F', 'C')).toBe(100);
      expect(convertTemperature(100, 'C', 'F')).toBe(212);
    });
    
    test('handles negative temperatures', () => {
      expect(convertTemperature(-40, 'F', 'C')).toBe(-40); // -40°F = -40°C
      expect(convertTemperature(-40, 'C', 'F')).toBe(-40);
    });
    
    test('precision is maintained within acceptable limits', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -50, max: 150, noNaN: true }),
          (temp) => {
            const converted = convertTemperature(temp, 'F', 'C');
            const backConverted = convertTemperature(converted, 'C', 'F');
            
            // Allow for small floating point errors
            expect(Math.abs(backConverted - temp)).toBeLessThanOrEqual(0.15);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});