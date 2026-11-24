

const fc = require('fast-check');
const { calculateBMI, getBMICategory } = require('../services/vitalsService');

describe('BMI Calculation Property Tests', () => {
  
  describe('Property 3: BMI Calculation Correctness', () => {
    
    test('BMI calculation should be mathematically correct for all valid inputs', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 30, max: 200 }).filter(w => !isNaN(w) && isFinite(w)), 
          fc.float({ min: 120, max: 250 }).filter(h => !isNaN(h) && isFinite(h)), 
          (weightKg, heightCm) => {
            const bmi = calculateBMI(weightKg, 'kg', heightCm, 'cm');
            const heightM = heightCm / 100;
            const expectedBMI = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
            expect(bmi).toBe(expectedBMI);
            expect(bmi).toBeGreaterThan(0);
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
          fc.float({ min: 66, max: 440 }), 
          fc.float({ min: 39, max: 98 }), 
          (weightLbs, heightInches) => {
            const bmiFromLbsInches = calculateBMI(weightLbs, 'lbs', heightInches, 'ft');
            const weightKg = weightLbs / 2.20462;
            const heightCm = heightInches * 2.54;
            const bmiFromKgCm = calculateBMI(weightKg, 'kg', heightCm, 'cm');
            expect(Math.abs(bmiFromLbsInches - bmiFromKgCm)).toBeLessThanOrEqual(0.3);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('BMI calculation should be consistent with same units', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 30, max: 200 }), 
          fc.float({ min: 100, max: 250 }), 
          (weight, height) => {
            const bmi1 = calculateBMI(weight, 'kg', height, 'cm');
            const bmi2 = calculateBMI(weight, 'kg', height, 'cm');
            expect(bmi1).toBe(bmi2);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('BMI calculation should handle edge cases correctly', () => {
      const minBMI = calculateBMI(30, 'kg', 250, 'cm'); 
      expect(minBMI).toBeGreaterThan(0);
      expect(minBMI).toBeLessThan(20);
      const maxBMI = calculateBMI(200, 'kg', 100, 'cm'); 
      expect(maxBMI).toBeGreaterThan(100);
      expect(calculateBMI(null, 'kg', 170, 'cm')).toBeNull();
      expect(calculateBMI(70, 'kg', null, 'cm')).toBeNull();
      expect(calculateBMI(70, 'kg', 0, 'cm')).toBeNull();
    });
    
    test('BMI categories should be correctly assigned', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 10, max: 50 }), 
          (bmi) => {
            const category = getBMICategory(bmi);
            expect(['underweight', 'normal', 'overweight', 'obese']).toContain(category);
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
          fc.float({ min: 30, max: 199 }), 
          fc.float({ min: 1, max: 50 }), 
          fc.float({ min: 100, max: 250 }).filter(h => !isNaN(h) && isFinite(h)), 
          (weight1, increment, height) => {
            const weight2 = weight1 + increment;
            const bmi1 = calculateBMI(weight1, 'kg', height, 'cm');
            const bmi2 = calculateBMI(weight2, 'kg', height, 'cm');
            if (bmi1 === null || bmi2 === null) return true;
            expect(bmi2).toBeGreaterThan(bmi1);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('BMI calculation should be inversely monotonic with height', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 30, max: 200 }).filter(w => !isNaN(w) && isFinite(w)), 
          fc.float({ min: 100, max: 240 }), 
          fc.float({ min: 2, max: 50 }), 
          (weight, height1, increment) => {
            const height2 = height1 + increment;
            const bmi1 = calculateBMI(weight, 'kg', height1, 'cm');
            const bmi2 = calculateBMI(weight, 'kg', height2, 'cm');
            if (bmi1 === null || bmi2 === null) return true;
            expect(bmi2).toBeLessThan(bmi1);
          }
        ),
        { numRuns: 100 }
      );
    });
    
  });
  
});