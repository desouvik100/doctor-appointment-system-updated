/**
 * Property-Based Tests for DICOM Parser Service
 * Feature: advanced-imaging
 * Property 2: DICOM Metadata Extraction Accuracy
 * Validates: Requirements 1.2, 10.2
 */

const fc = require('fast-check');
const {
  parseDate,
  formatPatientName,
  isValidDicomExtension,
  VALID_MODALITIES
} = require('../services/dicomParserService');

describe('DICOM Parser Service - Property Tests', () => {
  
  // Property 2: DICOM Metadata Extraction Accuracy
  describe('Property 2: DICOM Metadata Extraction Accuracy', () => {
    
    // Test date parsing accuracy
    test('parseDate correctly parses valid DICOM dates (YYYYMMDD format)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1900, max: 2100 }), // year
          fc.integer({ min: 1, max: 12 }),       // month
          fc.integer({ min: 1, max: 28 }),       // day (use 28 to avoid month-end issues)
          (year, month, day) => {
            const dateString = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
            const result = parseDate(dateString);
            
            expect(result).not.toBeNull();
            expect(result.getFullYear()).toBe(year);
            expect(result.getMonth()).toBe(month - 1); // JS months are 0-indexed
            expect(result.getDate()).toBe(day);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    // Test patient name formatting
    test('formatPatientName correctly formats DICOM names (Last^First^Middle)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('^') && s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('^') && s.trim().length > 0),
          (lastName, firstName) => {
            const dicomName = `${lastName}^${firstName}`;
            const result = formatPatientName(dicomName);
            
            expect(result).not.toBeNull();
            expect(result).toContain(firstName.trim());
            expect(result).toContain(lastName.trim());
          }
        ),
        { numRuns: 100 }
      );
    });
    
    // Test that valid modalities are recognized
    test('all valid DICOM modalities are in the allowed set', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_MODALITIES),
          (modality) => {
            expect(VALID_MODALITIES).toContain(modality);
            expect(typeof modality).toBe('string');
            expect(modality.length).toBeGreaterThanOrEqual(2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // Additional unit tests for edge cases
  describe('Date Parsing Edge Cases', () => {
    test('returns null for invalid date strings', () => {
      expect(parseDate(null)).toBeNull();
      expect(parseDate('')).toBeNull();
      expect(parseDate('invalid')).toBeNull();
      expect(parseDate('2024')).toBeNull();
      expect(parseDate('202401')).toBeNull();
    });
    
    test('handles dates with extra characters', () => {
      const result = parseDate('20240115extra');
      expect(result).not.toBeNull();
      expect(result.getFullYear()).toBe(2024);
    });
  });
  
  describe('Patient Name Formatting Edge Cases', () => {
    test('returns null for empty or null names', () => {
      expect(formatPatientName(null)).toBeNull();
      expect(formatPatientName('')).toBeNull();
      expect(formatPatientName('   ')).toBeNull();
    });
    
    test('handles single name component', () => {
      expect(formatPatientName('Smith')).toBe('Smith');
    });
    
    test('handles name with middle name', () => {
      const result = formatPatientName('Smith^John^William');
      expect(result).toBe('John William Smith');
    });
  });
  
  describe('File Extension Validation', () => {
    test('accepts valid DICOM extensions', () => {
      expect(isValidDicomExtension('image.dcm')).toBe(true);
      expect(isValidDicomExtension('image.dicom')).toBe(true);
      expect(isValidDicomExtension('image.dic')).toBe(true);
      expect(isValidDicomExtension('IMAGE.DCM')).toBe(true);
    });
    
    test('accepts files without extension (common for DICOM)', () => {
      expect(isValidDicomExtension('IM000001')).toBe(true);
    });
    
    test('rejects invalid extensions', () => {
      expect(isValidDicomExtension('image.jpg')).toBe(false);
      expect(isValidDicomExtension('image.png')).toBe(false);
      expect(isValidDicomExtension('document.pdf')).toBe(false);
    });
    
    test('handles null/undefined', () => {
      expect(isValidDicomExtension(null)).toBe(false);
      expect(isValidDicomExtension(undefined)).toBe(false);
    });
  });
});
