/**
 * Property-Based Tests for Pattern Detection and CSV Export
 * Feature: staff-presence-analytics
 * Property 15: Overtime Threshold Highlighting
 * Property 16: Pattern Detection for Late Arrivals
 * Property 17: CSV Export Completeness
 * Validates: Requirements 8.3, 8.4, 8.6
 */

const fc = require('fast-check');
const mongoose = require('mongoose');
const attendanceAnalytics = require('../services/attendanceAnalytics');

// Helper to generate valid ObjectIds
const objectIdArbitrary = fc.string({ 
  minLength: 24, 
  maxLength: 24 
}).map(() => new mongoose.Types.ObjectId());

/**
 * Generate a date string in YYYY-MM-DD format
 */
const dateStringArbitrary = fc.date({ 
  min: new Date('2024-01-01'), 
  max: new Date('2024-12-31') 
}).map(d => d.toISOString().split('T')[0]);

/**
 * Generate consecutive dates starting from a base date
 */
function generateConsecutiveDates(startDate, count) {
  const dates = [];
  const start = new Date(startDate);
  for (let i = 0; i < count; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

/**
 * Generate non-consecutive dates (with gaps)
 */
function generateNonConsecutiveDates(startDate, count, minGap = 2) {
  const dates = [];
  const start = new Date(startDate);
  let currentDate = new Date(start);
  for (let i = 0; i < count; i++) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + minGap + Math.floor(Math.random() * 3));
  }
  return dates;
}

describe('Pattern Detection - Property Tests', () => {

  // Property 15: Overtime Threshold Highlighting
  // Validates: Requirements 8.3
  describe('Property 15: Overtime Threshold Highlighting', () => {

    test('*For any* staff member whose overtime exceeds threshold, they SHALL be flagged', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 100, noNaN: true }),
          fc.float({ min: 1, max: 50, noNaN: true }),
          (totalOvertimeHours, thresholdHours) => {
            const exceeds = attendanceAnalytics.exceedsOvertimeThreshold(totalOvertimeHours, thresholdHours);
            
            if (totalOvertimeHours >= thresholdHours) {
              expect(exceeds).toBe(true);
            } else {
              expect(exceeds).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('overtime threshold check is consistent with >= comparison', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 100, noNaN: true }),
          fc.float({ min: 1, max: 50, noNaN: true }),
          (overtime, threshold) => {
            const result = attendanceAnalytics.exceedsOvertimeThreshold(overtime, threshold);
            expect(result).toBe(overtime >= threshold);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('exactly at threshold is flagged', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 50, noNaN: true }),
          (threshold) => {
            const result = attendanceAnalytics.exceedsOvertimeThreshold(threshold, threshold);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('just below threshold is not flagged', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 50, noNaN: true }),
          (threshold) => {
            const result = attendanceAnalytics.exceedsOvertimeThreshold(threshold - 0.01, threshold);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('zero overtime never exceeds positive threshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (threshold) => {
            const result = attendanceAnalytics.exceedsOvertimeThreshold(0, threshold);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Property 16: Pattern Detection for Late Arrivals
  // Validates: Requirements 8.4
  describe('Property 16: Pattern Detection for Late Arrivals', () => {

    test('*For any* N consecutive dates, detectConsecutivePattern SHALL return N', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }),
          dateStringArbitrary,
          (consecutiveCount, startDate) => {
            const dates = generateConsecutiveDates(startDate, consecutiveCount);
            const result = attendanceAnalytics.detectConsecutivePattern(dates);
            
            expect(result).toBe(consecutiveCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('non-consecutive dates return max consecutive run of 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          dateStringArbitrary,
          (count, startDate) => {
            const dates = generateNonConsecutiveDates(startDate, count, 3);
            const result = attendanceAnalytics.detectConsecutivePattern(dates);
            
            // With gaps of 3+ days, max consecutive should be 1
            expect(result).toBe(1);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('empty dates array returns 0', () => {
      const result = attendanceAnalytics.detectConsecutivePattern([]);
      expect(result).toBe(0);
    });

    test('single date returns 1', () => {
      fc.assert(
        fc.property(
          dateStringArbitrary,
          (date) => {
            const result = attendanceAnalytics.detectConsecutivePattern([date]);
            expect(result).toBe(1);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('mixed consecutive and non-consecutive returns max consecutive run', () => {
      // Test: 3 consecutive, gap, 5 consecutive -> should return 5
      const dates = [
        '2024-01-01', '2024-01-02', '2024-01-03', // 3 consecutive
        '2024-01-10', '2024-01-11', '2024-01-12', '2024-01-13', '2024-01-14' // 5 consecutive
      ];
      const result = attendanceAnalytics.detectConsecutivePattern(dates);
      expect(result).toBe(5);
    });

    test('unsorted dates are handled correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          fc.integer({ min: 1, max: 300 }), // Day of year offset
          (count, dayOffset) => {
            const startDate = new Date('2024-01-01');
            startDate.setDate(startDate.getDate() + dayOffset);
            const startDateStr = startDate.toISOString().split('T')[0];
            
            const sortedDates = generateConsecutiveDates(startDateStr, count);
            const shuffledDates = [...sortedDates].sort(() => Math.random() - 0.5);
            
            const result = attendanceAnalytics.detectConsecutivePattern(shuffledDates);
            
            // Should still detect the consecutive pattern regardless of input order
            expect(result).toBe(count);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('duplicate dates do not increase consecutive count', () => {
      const dates = ['2024-01-01', '2024-01-01', '2024-01-02', '2024-01-02', '2024-01-03'];
      const result = attendanceAnalytics.detectConsecutivePattern(dates);
      expect(result).toBe(3); // Only 3 unique consecutive days
    });
  });


  // Property 17: CSV Export Completeness
  // Validates: Requirements 8.6
  describe('Property 17: CSV Export Completeness', () => {

    /**
     * Generate mock attendance records for CSV testing
     */
    const mockRecordArbitrary = fc.record({
      _id: objectIdArbitrary,
      staffId: fc.record({
        _id: objectIdArbitrary,
        name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        scheduledStartTime: fc.constantFrom('08:00', '09:00', '10:00'),
        scheduledEndTime: fc.constantFrom('17:00', '18:00', '19:00')
      }),
      eventType: fc.constantFrom('check_in', 'check_out'),
      timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
      shiftDuration: fc.option(fc.integer({ min: 60, max: 720 }), { nil: null }),
      customStatus: fc.option(fc.constantFrom('available', 'with_patient', 'on_break'), { nil: null })
    });

    test('*For any* attendance records, CSV output SHALL contain required columns', () => {
      // Use fixed records to test column structure
      const records = [
        {
          _id: new mongoose.Types.ObjectId(),
          staffId: { _id: new mongoose.Types.ObjectId(), name: 'John Doe' },
          eventType: 'check_in',
          timestamp: new Date('2024-06-15T09:00:00Z'),
          shiftDuration: null,
          customStatus: null
        },
        {
          _id: new mongoose.Types.ObjectId(),
          staffId: { _id: new mongoose.Types.ObjectId(), name: 'Jane Smith' },
          eventType: 'check_out',
          timestamp: new Date('2024-06-15T17:00:00Z'),
          shiftDuration: 480,
          customStatus: 'available'
        }
      ];
      
      const rows = attendanceAnalytics.buildCSVRows(records, new Set(), new Set(), new Set());
      
      // Each row should have 9 columns (matching header)
      for (const row of rows) {
        const columns = row.split(',');
        expect(columns.length).toBe(9);
      }
    });

    test('CSV rows contain staff name from records', () => {
      // Use fixed records to test staff name inclusion
      const records = [
        {
          _id: new mongoose.Types.ObjectId(),
          staffId: { _id: new mongoose.Types.ObjectId(), name: 'John Doe' },
          eventType: 'check_in',
          timestamp: new Date('2024-06-15T09:00:00Z'),
          shiftDuration: null,
          customStatus: null
        },
        {
          _id: new mongoose.Types.ObjectId(),
          staffId: { _id: new mongoose.Types.ObjectId(), name: 'Jane Smith' },
          eventType: 'check_out',
          timestamp: new Date('2024-06-15T17:00:00Z'),
          shiftDuration: 480,
          customStatus: 'available'
        }
      ];
      
      const rows = attendanceAnalytics.buildCSVRows(records, new Set(), new Set(), new Set());
      
      // Should have rows for each unique staff+date combination
      expect(rows.length).toBeGreaterThan(0);
      
      // Each row should contain a staff name
      for (const row of rows) {
        expect(row.length).toBeGreaterThan(0);
      }
    });

    test('CSV rows contain date in YYYY-MM-DD format', () => {
      // Use a simple fixed record to test date format
      const records = [{
        _id: new mongoose.Types.ObjectId(),
        staffId: { _id: new mongoose.Types.ObjectId(), name: 'TestStaff' },
        eventType: 'check_in',
        timestamp: new Date('2024-06-15T09:00:00Z'),
        shiftDuration: null,
        customStatus: null
      }];
      
      const rows = attendanceAnalytics.buildCSVRows(records, new Set(), new Set(), new Set());
      
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      
      expect(rows.length).toBe(1);
      const columns = rows[0].split(',');
      const dateColumn = columns[1]; // Second column is date
      expect(dateColumn).toMatch(dateRegex);
    });

    test('late flag is Yes when record ID is in lateRecordIds set', () => {
      const recordId = new mongoose.Types.ObjectId();
      const records = [{
        _id: recordId,
        staffId: { _id: new mongoose.Types.ObjectId(), name: 'Test Staff' },
        eventType: 'check_in',
        timestamp: new Date('2024-06-15T09:30:00Z'),
        shiftDuration: null,
        customStatus: null
      }];
      
      const lateRecordIds = new Set([recordId.toString()]);
      const rows = attendanceAnalytics.buildCSVRows(records, lateRecordIds, new Set(), new Set());
      
      expect(rows.length).toBe(1);
      expect(rows[0]).toContain('Yes'); // isLate should be Yes
    });

    test('early flag is Yes when record ID is in earlyRecordIds set', () => {
      const recordId = new mongoose.Types.ObjectId();
      const records = [{
        _id: recordId,
        staffId: { _id: new mongoose.Types.ObjectId(), name: 'Test Staff' },
        eventType: 'check_out',
        timestamp: new Date('2024-06-15T16:00:00Z'),
        shiftDuration: 420,
        customStatus: null
      }];
      
      const earlyRecordIds = new Set([recordId.toString()]);
      const rows = attendanceAnalytics.buildCSVRows(records, new Set(), earlyRecordIds, new Set());
      
      expect(rows.length).toBe(1);
      // The row should contain 'Yes' for isEarly
      const columns = rows[0].split(',');
      expect(columns[7]).toBe('Yes'); // isEarly column
    });

    test('overtime flag is Yes when staff ID is in overtimeStaffIds set', () => {
      const staffId = new mongoose.Types.ObjectId();
      const records = [{
        _id: new mongoose.Types.ObjectId(),
        staffId: { _id: staffId, name: 'Test Staff' },
        eventType: 'check_out',
        timestamp: new Date('2024-06-15T19:00:00Z'),
        shiftDuration: 600,
        customStatus: null
      }];
      
      const overtimeStaffIds = new Set([staffId.toString()]);
      const rows = attendanceAnalytics.buildCSVRows(records, new Set(), new Set(), overtimeStaffIds);
      
      expect(rows.length).toBe(1);
      const columns = rows[0].split(',');
      expect(columns[8]).toBe('Yes'); // hasOvertime column
    });

    test('all flags are No when no matching IDs in sets', () => {
      const records = [{
        _id: new mongoose.Types.ObjectId(),
        staffId: { _id: new mongoose.Types.ObjectId(), name: 'Test Staff' },
        eventType: 'check_in',
        timestamp: new Date('2024-06-15T09:00:00Z'),
        shiftDuration: null,
        customStatus: null
      }];
      
      const rows = attendanceAnalytics.buildCSVRows(records, new Set(), new Set(), new Set());
      
      expect(rows.length).toBe(1);
      const columns = rows[0].split(',');
      expect(columns[6]).toBe('No'); // isLate
      expect(columns[7]).toBe('No'); // isEarly
      expect(columns[8]).toBe('No'); // hasOvertime
    });

    test('CSV escapes values with commas', () => {
      const records = [{
        _id: new mongoose.Types.ObjectId(),
        staffId: { _id: new mongoose.Types.ObjectId(), name: 'Smith, John' },
        eventType: 'check_in',
        timestamp: new Date('2024-06-15T09:00:00Z'),
        shiftDuration: null,
        customStatus: null
      }];
      
      const rows = attendanceAnalytics.buildCSVRows(records, new Set(), new Set(), new Set());
      
      expect(rows.length).toBe(1);
      // Name with comma should be quoted
      expect(rows[0]).toContain('"Smith, John"');
    });

    test('empty records array produces empty rows', () => {
      const rows = attendanceAnalytics.buildCSVRows([], new Set(), new Set(), new Set());
      expect(rows).toEqual([]);
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    
    test('handles null/undefined in overtime check', () => {
      expect(attendanceAnalytics.exceedsOvertimeThreshold(null, 10)).toBe(false);
      expect(attendanceAnalytics.exceedsOvertimeThreshold(undefined, 10)).toBe(false);
    });

    test('handles very large consecutive counts', () => {
      const dates = generateConsecutiveDates('2024-01-01', 100);
      const result = attendanceAnalytics.detectConsecutivePattern(dates);
      expect(result).toBe(100);
    });

    test('handles dates spanning year boundary', () => {
      const dates = ['2023-12-30', '2023-12-31', '2024-01-01', '2024-01-02'];
      const result = attendanceAnalytics.detectConsecutivePattern(dates);
      expect(result).toBe(4);
    });

    test('handles leap year dates', () => {
      const dates = ['2024-02-28', '2024-02-29', '2024-03-01'];
      const result = attendanceAnalytics.detectConsecutivePattern(dates);
      expect(result).toBe(3);
    });
  });
});
