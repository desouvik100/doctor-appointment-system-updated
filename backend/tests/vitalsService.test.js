

const fc = require('fast-check');
const {
  validateVitals,
  validateVitalValue,
  convertTemperature,
  calculateBMI,
  VITAL_RANGES
} = require('../services/vitalsService');

describe('Vitals Service', () => {

  describe('Property 1: Vitals Range Validation and Abnormal Flagging', () => {
    
    test('valid BP systolic values are accepted, abnormal values are flagged', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 60, max: 250 }),
          (systolic) => {
            const result = validateVitalValue('systolic', systolic);
            expect(result.isValid).toBe(true);
            const range = VITAL_RANGES.bloodPressure.systolic;
            const shouldBeAbnormal = systolic < range.normalMin || systolic > range.normalMax;
            expect(result.isAbnormal).toBe(shouldBeAbnormal);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('valid BP diastolic values are accepted, abnormal values are flagged', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 40, max: 150 }),
          (diastolic) => {
            const result = validateVitalValue('diastolic', diastolic);
            
            expect(result.isValid).toBe(true);
            
            const range = VITAL_RANGES.bloodPressure.diastolic;
            const shouldBeAbnormal = diastolic < range.normalMin || diastolic > range.normalMax;
            expect(result.isAbnormal).toBe(shouldBeAbnormal);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('valid pulse values are accepted, abnormal values are flagged', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 30, max: 220 }),
          (pulse) => {
            const result = validateVitalValue('pulse', pulse);
            
            expect(result.isValid).toBe(true);
            
            const range = VITAL_RANGES.pulse;
            const shouldBeAbnormal = pulse < range.normalMin || pulse > range.normalMax;
            expect(result.isAbnormal).toBe(shouldBeAbnormal);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('valid SpO2 values are accepted, abnormal values are flagged', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 70, max: 100 }),
          (spo2) => {
            const result = validateVitalValue('spo2', spo2);
            
            expect(result.isValid).toBe(true);
            
            const range = VITAL_RANGES.spo2;
            const shouldBeAbnormal = spo2 < range.normalMin;
            expect(result.isAbnormal).toBe(shouldBeAbnormal);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('valid blood sugar values are accepted, abnormal values are flagged', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 500 }),
          fc.constantFrom('fasting', 'random', 'postMeal'),
          (value, type) => {
            const result = validateVitalValue('bloodSugar', value, { type });
            
            expect(result.isValid).toBe(true);
            
            const range = VITAL_RANGES.bloodSugar[type];
            const shouldBeAbnormal = value < range.normalMin || value > range.normalMax;
            expect(result.isAbnormal).toBe(shouldBeAbnormal);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('invalid values outside valid range are rejected', () => {
      const lowSystolic = validateVitalValue('systolic', 50);
      expect(lowSystolic.isValid).toBe(false);
      const highSystolic = validateVitalValue('systolic', 260);
      expect(highSystolic.isValid).toBe(false);
      const lowPulse = validateVitalValue('pulse', 20);
      expect(lowPulse.isValid).toBe(false);
      const lowSpo2 = validateVitalValue('spo2', 60);
      expect(lowSpo2.isValid).toBe(false);
    });
  });

  describe('Property 2: Temperature Unit Conversion Round-Trip', () => {
    
    test('F to C to F round-trip preserves value within precision', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 95, max: 108, noNaN: true }),
          (tempF) => {
            const tempC = convertTemperature(tempF, 'F', 'C');
            const tempFBack = convertTemperature(tempC, 'C', 'F');
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
  });

  describe('Property 3: BMI Calculation Correctness', () => {
    
    test('BMI calculation is correct for kg/cm inputs', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 30, max: 200, noNaN: true }),  
          fc.float({ min: 100, max: 220, noNaN: true }), 
          (weightKg, heightCm) => {
            const calculatedBMI = calculateBMI(weightKg, 'kg', heightCm, 'cm');
            const heightM = heightCm / 100;
            const expectedBMI = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
            
            expect(calculatedBMI).toBe(expectedBMI);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('BMI calculation handles lbs to kg conversion', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 66, max: 440, noNaN: true }),  
          fc.float({ min: 100, max: 220, noNaN: true }), 
          (weightLbs, heightCm) => {
            const calculatedBMI = calculateBMI(weightLbs, 'lbs', heightCm, 'cm');
            const weightKg = Math.round(weightLbs / 2.20462 * 10) / 10;
            const heightM = heightCm / 100;
            const expectedBMI = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
            
            expect(calculatedBMI).toBe(expectedBMI);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('BMI returns null for invalid inputs', () => {
      expect(calculateBMI(null, 'kg', 170, 'cm')).toBeNull();
      expect(calculateBMI(70, 'kg', null, 'cm')).toBeNull();
      expect(calculateBMI(70, 'kg', 0, 'cm')).toBeNull();
    });
  });

  describe('validateVitals Integration', () => {
    
    test('validates complete vitals object correctly', () => {
      const vitals = {
        bloodPressure: { systolic: 120, diastolic: 80 },
        pulse: { value: 72 },
        temperature: { value: 98.6, unit: '°F' },
        spo2: { value: 98 },
        bloodSugar: { value: 95, type: 'fasting' },
        weight: { value: 70, unit: 'kg' },
        height: { value: 170, unit: 'cm' }
      };
      
      const result = validateVitals(vitals);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.abnormalFlags).toHaveLength(0);
      expect(result.validatedVitals.bmi).toBeDefined();
    });
    
    test('flags abnormal values correctly', () => {
      const vitals = {
        bloodPressure: { systolic: 160, diastolic: 100 }, 
        pulse: { value: 110 }, 
        spo2: { value: 92 } 
      };
      
      const result = validateVitals(vitals);
      
      expect(result.isValid).toBe(true);
      expect(result.abnormalFlags.length).toBeGreaterThan(0);
      expect(result.abnormalFlags).toContain('BP Systolic high');
      expect(result.abnormalFlags).toContain('BP Diastolic high');
      expect(result.abnormalFlags).toContain('Pulse high');
      expect(result.abnormalFlags).toContain('SpO2 low');
    });
  });
});
