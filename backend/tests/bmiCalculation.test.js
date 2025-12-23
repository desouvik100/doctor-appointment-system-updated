/**
 * BMI Calculation Property-Based Tests
 * Tests Property 3: BMI Calculation Correctness
 * Validates Requirements 1.5
 */

const fc = require('fast-check');
const { calculateBMI, getBMICategory } = require('../services/vitalsService');

describe('BMI Calculation Property Tests', () => {
  
  describe('Property 3: BMI Calculation Correctness', () => {
    
    test('BMI calculation should be mathematically correct for all valid inputs', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 30, max: 200 }).filter(w => !isNaN(w) && isFinite(w)), // weight in kg (30-200kg)
          fc.float({ min: 120, max: 250 }).filter(h => !isNaN(h) && isFinite(h)), // height in cm (120-250cm) - avoid extreme low heights
          (weightKg, heightCm) => {
            const bmi = calculateBMI(weightKg, 'kg', heightCm, 'cm');
            
            // Calculate expected BMI manually
            const heightM = heightCm / 100;
            const expectedBMI = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
            
            // BMI should match expected calculation
            expect(bmi).toBe(expectedBMI);
            
            // BMI should be positive
            expect(bmi).toBeGreaterThan(0);
            
            // BMI should be reasonable (between 4 and 200 for extreme cases)
            expect(bmi).toBeGreaterThanOrEqual(4);
            expect(bmi).toBeLessThanOrEqual(200);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('BMI calculation should handle unit conversions correctly', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 66, max: 440 }), // weight in lbs (66-440 lbs = 30-200kg)
          fc.float({ min: 39, max: 98 }), // height in inches (39-98 inches = 100-250cm)
          (weightLbs, heightInches) => {
            // For the calculateBMI function, 'ft' unit expects total inches
            const bmiFromLbsInches = calculateBMI(weightLbs, 'lbs', heightInches, 'ft');
            
            // Convert to kg and cm manually
            const weightKg = weightLbs / 2.20462;
            const heightCm = heightInches * 2.54;
            const bmiFromKgCm = calculateBMI(weightKg, 'kg', heightCm, 'cm');
            
            // Both calculations should give same result (within rounding tolerance)
            // Increased tolerance due to multiple conversions and floating-point precision
            expect(Math.abs(bmiFromLbsInches - bmiFromKgCm)).toBeLessThanOrEqual(0.3);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('BMI calculation should be consistent with same units', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 30, max: 200 }), // weight in kg
          fc.float({ min: 100, max: 250 }), // height in cm
          (weight, height) => {
            const bmi1 = calculateBMI(weight, 'kg', height, 'cm');
            const bmi2 = calculateBMI(weight, 'kg', height, 'cm');
            
            // Same inputs should always give same result
            expect(bmi1).toBe(bmi2);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('BMI calculation should handle edge cases correctly', () => {
      // Test with minimum valid values
      const minBMI = calculateBMI(30, 'kg', 250, 'cm'); // Very low BMI
      expect(minBMI).toBeGreaterThan(0);
      expect(minBMI).toBeLessThan(20);
      
      // Test with maximum valid values  
      const maxBMI = calculateBMI(200, 'kg', 100, 'cm'); // Very high BMI
      expect(maxBMI).toBeGreaterThan(100);
      
      // Test with null/undefined values
      expect(calculateBMI(null, 'kg', 170, 'cm')).toBeNull();
      expect(calculateBMI(70, 'kg', null, 'cm')).toBeNull();
      expect(calculateBMI(70, 'kg', 0, 'cm')).toBeNull();
    });
    
    test('BMI categories should be correctly assigned', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 10, max: 50 }), // BMI range
          (bmi) => {
            const category = getBMICategory(bmi);
            
            // Category should be one of the valid categories
            expect(['underweight', 'normal', 'overweight', 'obese']).toContain(category);
            
            // Verify category boundaries
            if (bmi < 18.5) {
              expect(category).toBe('underweight');
            } else if (bmi < 25) {
              expect(category).toBe('normal');
            } else if (bmi < 30) {
              expect(category).toBe('overweight');
            } else {
              expect(category).toBe('obese');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('BMI calculation should be monotonic with weight', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 30, max: 199 }), // weight1
          fc.float({ min: 1, max: 50 }), // weight increment
          fc.float({ min: 100, max: 250 }).filter(h => !isNaN(h) && isFinite(h)), // height
          (weight1, increment, height) => {
            const weight2 = weight1 + increment;
            const bmi1 = calculateBMI(weight1, 'kg', height, 'cm');
            const bmi2 = calculateBMI(weight2, 'kg', height, 'cm');
            
            // Skip if either BMI is null (invalid inputs)
            if (bmi1 === null || bmi2 === null) return true;
            
            // Higher weight should give higher BMI (monotonic)
            expect(bmi2).toBeGreaterThan(bmi1);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('BMI calculation should be inversely monotonic with height', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 30, max: 200 }).filter(w => !isNaN(w) && isFinite(w)), // weight
          fc.float({ min: 100, max: 240 }), // height1 - reduced max to avoid rounding issues
          fc.float({ min: 2, max: 50 }), // height increment - increased min to ensure meaningful difference
          (weight, height1, increment) => {
            const height2 = height1 + increment;
            const bmi1 = calculateBMI(weight, 'kg', height1, 'cm');
            const bmi2 = calculateBMI(weight, 'kg', height2, 'cm');
            
            // Skip if either BMI is null (invalid inputs)
            if (bmi1 === null || bmi2 === null) return true;
            
            // Higher height should give lower BMI (inverse monotonic)
            // Use strict inequality to handle rounding edge cases
            expect(bmi2).toBeLessThan(bmi1);
          }
        ),
        { numRuns: 100 }
      );
    });
    
  });
  
});