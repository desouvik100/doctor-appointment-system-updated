/**
 * Property-Based Tests for Patient Validation Service
 * Feature: advanced-imaging
 * Property 3: Patient ID Validation
 * Validates: Requirements 1.3
 */

const fc = require('fast-check');
const {
  validatePatientMatch,
  normalizeString,
  normalizePatientId,
  calculateSimilarity,
  datesMatch
} = require('../services/patientValidationService');

describe('Patient Validation Service - Property Tests', () => {
  
  // Property 3: Patient ID Validation
  describe('Property 3: Patient ID Validation', () => {
    
    test('matching patient IDs result in high confidence match', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 20 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
          fc.string({ minLength: 2, maxLength: 30 }).filter(s => s.trim().length > 0),
          (patientId, name) => {
            const dicomPatient = {
              patientId: patientId,
              patientName: name,
              birthDate: new Date('1990-01-15'),
              sex: 'M'
            };
            
            const emrPatient = {
              _id: { toString: () => patientId },
              name: name,
              dateOfBirth: new Date('1990-01-15'),
              gender: 'male'
            };
            
            const result = validatePatientMatch(dicomPatient, emrPatient);
            
            // When all fields match, confidence should be high
            expect(result.confidence).toBeGreaterThanOrEqual(0.9);
            expect(result.isMatch).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('mismatched patient IDs require confirmation', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 20 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
          fc.string({ minLength: 5, maxLength: 20 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
          fc.string({ minLength: 2, maxLength: 30 }).filter(s => s.trim().length > 0),
          (dicomId, emrId, name) => {
            // Ensure IDs are different
            fc.pre(normalizePatientId(dicomId) !== normalizePatientId(emrId));
            
            const dicomPatient = {
              patientId: dicomId,
              patientName: name,
              birthDate: new Date('1990-01-15'),
              sex: 'M'
            };
            
            const emrPatient = {
              _id: { toString: () => emrId },
              name: name,
              dateOfBirth: new Date('1990-01-15'),
              gender: 'male'
            };
            
            const result = validatePatientMatch(dicomPatient, emrPatient);
            
            // When patient IDs don't match, should have warning
            expect(result.warnings.length).toBeGreaterThan(0);
            expect(result.warnings.some(w => w.includes('Patient ID') || w.includes('match'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('completely different patients have low confidence', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 15 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
          fc.string({ minLength: 5, maxLength: 15 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z]+$/.test(s)),
          fc.string({ minLength: 3, maxLength: 20 }).filter(s => /^[a-zA-Z]+$/.test(s)),
          (dicomId, emrId, dicomName, emrName) => {
            // Ensure everything is different
            fc.pre(normalizePatientId(dicomId) !== normalizePatientId(emrId));
            fc.pre(calculateSimilarity(dicomName, emrName) < 0.5);
            
            const dicomPatient = {
              patientId: dicomId,
              patientName: dicomName,
              birthDate: new Date('1990-01-15'),
              sex: 'M'
            };
            
            const emrPatient = {
              _id: { toString: () => emrId },
              name: emrName,
              dateOfBirth: new Date('1985-06-20'),
              gender: 'female'
            };
            
            const result = validatePatientMatch(dicomPatient, emrPatient);
            
            // Completely different patients should have low confidence
            expect(result.confidence).toBeLessThan(0.6);
            expect(result.isMatch).toBe(false);
            expect(result.requiresConfirmation).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // Helper function tests
  describe('String Normalization', () => {
    test('normalization is idempotent', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 50 }),
          (str) => {
            const once = normalizeString(str);
            const twice = normalizeString(once);
            expect(once).toBe(twice);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('normalized strings are lowercase alphanumeric only', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 50 }),
          (str) => {
            const normalized = normalizeString(str);
            expect(normalized).toMatch(/^[a-z0-9]*$/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  describe('Similarity Calculation', () => {
    test('identical strings have similarity of 1', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          (str) => {
            const similarity = calculateSimilarity(str, str);
            expect(similarity).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('similarity is symmetric', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (str1, str2) => {
            const sim1 = calculateSimilarity(str1, str2);
            const sim2 = calculateSimilarity(str2, str1);
            expect(Math.abs(sim1 - sim2)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('similarity is between 0 and 1', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 30 }),
          fc.string({ maxLength: 30 }),
          (str1, str2) => {
            const similarity = calculateSimilarity(str1, str2);
            expect(similarity).toBeGreaterThanOrEqual(0);
            expect(similarity).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  describe('Date Matching', () => {
    test('same dates match', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1950, max: 2020 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 28 }),
          (year, month, day) => {
            const date1 = new Date(year, month - 1, day);
            const date2 = new Date(year, month - 1, day);
            expect(datesMatch(date1, date2)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('different dates do not match', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1950, max: 2020 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 27 }),
          (year, month, day) => {
            const date1 = new Date(year, month - 1, day);
            const date2 = new Date(year, month - 1, day + 1);
            expect(datesMatch(date1, date2)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // Edge case unit tests
  describe('Edge Cases', () => {
    test('handles null/undefined inputs gracefully', () => {
      expect(validatePatientMatch(null, null).isMatch).toBe(false);
      expect(validatePatientMatch({}, {}).isMatch).toBe(false);
      expect(validatePatientMatch(null, { name: 'Test' }).isMatch).toBe(false);
    });
    
    test('handles missing fields gracefully', () => {
      const result = validatePatientMatch(
        { patientId: '123' },
        { _id: { toString: () => '456' } }
      );
      expect(result.isMatch).toBe(false);
      expect(result.requiresConfirmation).toBe(true);
    });
  });
});
