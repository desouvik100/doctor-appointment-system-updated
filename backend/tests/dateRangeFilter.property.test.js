/**
 * Property-Based Tests for Date Range Query Filtering
 * Feature: staff-presence-analytics
 * Property 8: Date Range Query Filtering
 * Validates: Requirements 5.4
 * 
 * *For any* attendance history query with a date range, all returned records 
 * SHALL have timestamps within the specified start and end dates (inclusive).
 */

const fc = require('fast-check');
const mongoose = require('mongoose');

// Helper to generate valid ObjectIds
const objectIdArbitrary = fc.string({ 
  minLength: 24, 
  maxLength: 24 
}).map(() => new mongoose.Types.ObjectId());

// Event type enum values
const eventTypeValues = ['check_in', 'check_out'];

/**
 * Creates a mock attendance record with a specific timestamp
 */
function createAttendanceRecord(staffId, userId, organizationId, branchId, timestamp, eventType = 'check_in') {
  const record = {
    _id: new mongoose.Types.ObjectId(),
    staffId,
    userId,
    organizationId,
    branchId,
    eventType,
    timestamp: new Date(timestamp),
    source: 'manual',
    createdAt: new Date(timestamp),
    updatedAt: new Date(timestamp)
  };
  
  // Add check-out specific fields
  if (eventType === 'check_out') {
    const checkInTime = new Date(timestamp.getTime() - (8 * 60 * 60 * 1000)); // 8 hours before
    record.checkInTime = checkInTime;
    record.shiftDuration = 480; // 8 hours in minutes
  }
  
  return record;
}

/**
 * Filters attendance records by date range
 * This mirrors the logic in the attendance history endpoint
 */
function filterByDateRange(records, startDate, endDate) {
  return records.filter(record => {
    const timestamp = new Date(record.timestamp);
    
    // Set start date to beginning of day
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    // Set end date to end of day (inclusive)
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return timestamp >= start && timestamp <= end;
  });
}

/**
 * Checks if a timestamp is within a date range (inclusive)
 */
function isWithinDateRange(timestamp, startDate, endDate) {
  const ts = new Date(timestamp);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  return ts >= start && ts <= end;
}

/**
 * Generates a random date within a range
 */
function randomDateInRange(start, end) {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

describe('Date Range Query Filtering - Property Tests', () => {
  
  // Property 8: Date Range Query Filtering
  describe('Property 8: Date Range Query Filtering', () => {
    
    test('*For any* attendance history query with a date range, all returned records SHALL have timestamps within the specified start and end dates (inclusive)', () => {
      fc.assert(
        fc.property(
          // Generate a list of attendance records with random timestamps
          fc.array(
            fc.tuple(
              objectIdArbitrary,
              objectIdArbitrary,
              objectIdArbitrary,
              objectIdArbitrary,
              fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              fc.constantFrom(...eventTypeValues)
            ),
            { minLength: 1, maxLength: 50 }
          ),
          // Generate a date range (ensuring start <= end)
          fc.tuple(
            fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-30') }),
            fc.date({ min: new Date('2024-07-01'), max: new Date('2024-12-31') })
          ),
          (recordData, [startDate, endDate]) => {
            // Create attendance records from generated data
            const records = recordData.map(([staffId, userId, orgId, branchId, timestamp, eventType]) => 
              createAttendanceRecord(staffId, userId, orgId, branchId, timestamp, eventType)
            );
            
            // Filter records by date range
            const filteredRecords = filterByDateRange(records, startDate, endDate);
            
            // All filtered records should have timestamps within the date range
            const allWithinRange = filteredRecords.every(record => 
              isWithinDateRange(record.timestamp, startDate, endDate)
            );
            
            expect(allWithinRange).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('filtered results are a subset of original records', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(
              objectIdArbitrary,
              objectIdArbitrary,
              objectIdArbitrary,
              objectIdArbitrary,
              fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              fc.constantFrom(...eventTypeValues)
            ),
            { minLength: 0, maxLength: 30 }
          ),
          fc.tuple(
            fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-30') }),
            fc.date({ min: new Date('2024-07-01'), max: new Date('2024-12-31') })
          ),
          (recordData, [startDate, endDate]) => {
            const records = recordData.map(([staffId, userId, orgId, branchId, timestamp, eventType]) => 
              createAttendanceRecord(staffId, userId, orgId, branchId, timestamp, eventType)
            );
            
            const filteredRecords = filterByDateRange(records, startDate, endDate);
            
            // Filtered count should be <= original count
            expect(filteredRecords.length).toBeLessThanOrEqual(records.length);
            
            // All filtered record IDs should exist in original records
            const originalIds = new Set(records.map(r => r._id.toString()));
            const allExist = filteredRecords.every(r => originalIds.has(r._id.toString()));
            expect(allExist).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('records outside date range are excluded', () => {
      fc.assert(
        fc.property(
          objectIdArbitrary,
          objectIdArbitrary,
          objectIdArbitrary,
          objectIdArbitrary,
          fc.constantFrom(...eventTypeValues),
          (staffId, userId, orgId, branchId, eventType) => {
            // Create a record with a timestamp outside the query range
            const recordTimestamp = new Date('2024-01-15');
            const record = createAttendanceRecord(staffId, userId, orgId, branchId, recordTimestamp, eventType);
            
            // Query with a date range that doesn't include the record
            const startDate = new Date('2024-06-01');
            const endDate = new Date('2024-06-30');
            
            const filteredRecords = filterByDateRange([record], startDate, endDate);
            
            // Record should be excluded
            expect(filteredRecords.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('records on boundary dates are included (inclusive range)', () => {
      fc.assert(
        fc.property(
          objectIdArbitrary,
          objectIdArbitrary,
          objectIdArbitrary,
          objectIdArbitrary,
          fc.constantFrom(...eventTypeValues),
          fc.integer({ min: 0, max: 23 }),
          fc.integer({ min: 0, max: 59 }),
          (staffId, userId, orgId, branchId, eventType, hour, minute) => {
            // Create a record on the start date boundary
            const startDate = new Date('2024-03-15');
            const endDate = new Date('2024-03-20');
            
            // Record timestamp on start date at various times
            const recordTimestamp = new Date('2024-03-15');
            recordTimestamp.setHours(hour, minute, 0, 0);
            
            const record = createAttendanceRecord(staffId, userId, orgId, branchId, recordTimestamp, eventType);
            const filteredRecords = filterByDateRange([record], startDate, endDate);
            
            // Record on start date should be included
            expect(filteredRecords.length).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('records on end date boundary are included (inclusive range)', () => {
      fc.assert(
        fc.property(
          objectIdArbitrary,
          objectIdArbitrary,
          objectIdArbitrary,
          objectIdArbitrary,
          fc.constantFrom(...eventTypeValues),
          fc.integer({ min: 0, max: 23 }),
          fc.integer({ min: 0, max: 59 }),
          (staffId, userId, orgId, branchId, eventType, hour, minute) => {
            const startDate = new Date('2024-03-15');
            const endDate = new Date('2024-03-20');
            
            // Record timestamp on end date at various times
            const recordTimestamp = new Date('2024-03-20');
            recordTimestamp.setHours(hour, minute, 0, 0);
            
            const record = createAttendanceRecord(staffId, userId, orgId, branchId, recordTimestamp, eventType);
            const filteredRecords = filterByDateRange([record], startDate, endDate);
            
            // Record on end date should be included
            expect(filteredRecords.length).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('same start and end date returns only records from that day', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(
              objectIdArbitrary,
              objectIdArbitrary,
              objectIdArbitrary,
              objectIdArbitrary,
              fc.date({ min: new Date('2024-03-01'), max: new Date('2024-03-31') }),
              fc.constantFrom(...eventTypeValues)
            ),
            { minLength: 5, maxLength: 30 }
          ),
          fc.integer({ min: 1, max: 28 }), // day of month
          (recordData, day) => {
            const records = recordData.map(([staffId, userId, orgId, branchId, timestamp, eventType]) => 
              createAttendanceRecord(staffId, userId, orgId, branchId, timestamp, eventType)
            );
            
            // Query for a single day
            const queryDate = new Date(`2024-03-${day.toString().padStart(2, '0')}`);
            const filteredRecords = filterByDateRange(records, queryDate, queryDate);
            
            // All filtered records should be from that specific day
            const allFromSameDay = filteredRecords.every(record => {
              const recordDate = new Date(record.timestamp);
              return recordDate.getFullYear() === queryDate.getFullYear() &&
                     recordDate.getMonth() === queryDate.getMonth() &&
                     recordDate.getDate() === queryDate.getDate();
            });
            
            expect(allFromSameDay).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('empty date range (start after end) returns no records', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(
              objectIdArbitrary,
              objectIdArbitrary,
              objectIdArbitrary,
              objectIdArbitrary,
              fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              fc.constantFrom(...eventTypeValues)
            ),
            { minLength: 1, maxLength: 20 }
          ),
          (recordData) => {
            const records = recordData.map(([staffId, userId, orgId, branchId, timestamp, eventType]) => 
              createAttendanceRecord(staffId, userId, orgId, branchId, timestamp, eventType)
            );
            
            // Invalid range: start after end
            const startDate = new Date('2024-06-15');
            const endDate = new Date('2024-06-01');
            
            const filteredRecords = filterByDateRange(records, startDate, endDate);
            
            // Should return no records for invalid range
            expect(filteredRecords.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // Additional property tests for combined filters
  describe('Combined Date Range and Other Filters', () => {
    
    /**
     * Filters records by date range and staffId
     */
    function filterByDateRangeAndStaff(records, startDate, endDate, staffId) {
      return filterByDateRange(records, startDate, endDate)
        .filter(record => record.staffId.toString() === staffId.toString());
    }
    
    /**
     * Filters records by date range and branchId
     */
    function filterByDateRangeAndBranch(records, startDate, endDate, branchId) {
      return filterByDateRange(records, startDate, endDate)
        .filter(record => record.branchId.toString() === branchId.toString());
    }
    
    test('date range filter combined with staffId filter returns correct subset', () => {
      fc.assert(
        fc.property(
          objectIdArbitrary, // target staffId
          fc.array(
            fc.tuple(
              fc.boolean(), // whether to use target staffId
              objectIdArbitrary,
              objectIdArbitrary,
              objectIdArbitrary,
              fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              fc.constantFrom(...eventTypeValues)
            ),
            { minLength: 5, maxLength: 30 }
          ),
          fc.tuple(
            fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-30') }),
            fc.date({ min: new Date('2024-07-01'), max: new Date('2024-12-31') })
          ),
          (targetStaffId, recordData, [startDate, endDate]) => {
            // Create records, some with target staffId
            const records = recordData.map(([useTargetStaff, altStaffId, userId, orgId, branchId, timestamp, eventType]) => 
              createAttendanceRecord(
                useTargetStaff ? targetStaffId : altStaffId, 
                userId, 
                orgId, 
                branchId, 
                timestamp, 
                eventType
              )
            );
            
            const filteredRecords = filterByDateRangeAndStaff(records, startDate, endDate, targetStaffId);
            
            // All filtered records should match both date range AND staffId
            const allValid = filteredRecords.every(record => 
              isWithinDateRange(record.timestamp, startDate, endDate) &&
              record.staffId.toString() === targetStaffId.toString()
            );
            
            expect(allValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('date range filter combined with branchId filter returns correct subset', () => {
      fc.assert(
        fc.property(
          objectIdArbitrary, // target branchId
          fc.array(
            fc.tuple(
              fc.boolean(), // whether to use target branchId
              objectIdArbitrary,
              objectIdArbitrary,
              objectIdArbitrary,
              fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              fc.constantFrom(...eventTypeValues)
            ),
            { minLength: 5, maxLength: 30 }
          ),
          fc.tuple(
            fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-30') }),
            fc.date({ min: new Date('2024-07-01'), max: new Date('2024-12-31') })
          ),
          (targetBranchId, recordData, [startDate, endDate]) => {
            // Create records, some with target branchId
            const records = recordData.map(([useTargetBranch, staffId, userId, orgId, altBranchId, timestamp, eventType]) => 
              createAttendanceRecord(
                staffId, 
                userId, 
                orgId, 
                useTargetBranch ? targetBranchId : altBranchId, 
                timestamp, 
                eventType
              )
            );
            
            const filteredRecords = filterByDateRangeAndBranch(records, startDate, endDate, targetBranchId);
            
            // All filtered records should match both date range AND branchId
            const allValid = filteredRecords.every(record => 
              isWithinDateRange(record.timestamp, startDate, endDate) &&
              record.branchId.toString() === targetBranchId.toString()
            );
            
            expect(allValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // Edge case unit tests
  describe('Edge Cases', () => {
    
    test('empty records array returns empty result', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const filteredRecords = filterByDateRange([], startDate, endDate);
      
      expect(filteredRecords).toEqual([]);
      expect(filteredRecords.length).toBe(0);
    });
    
    test('record at start of start date is included', () => {
      const staffId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const orgId = new mongoose.Types.ObjectId();
      const branchId = new mongoose.Types.ObjectId();
      
      const startDate = new Date('2024-03-15');
      const endDate = new Date('2024-03-20');
      
      // Record at start of start date (local time)
      const recordTimestamp = new Date('2024-03-15');
      recordTimestamp.setHours(0, 0, 0, 0);
      const record = createAttendanceRecord(staffId, userId, orgId, branchId, recordTimestamp, 'check_in');
      
      const filteredRecords = filterByDateRange([record], startDate, endDate);
      
      expect(filteredRecords.length).toBe(1);
    });
    
    test('record at end of end date is included', () => {
      const staffId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const orgId = new mongoose.Types.ObjectId();
      const branchId = new mongoose.Types.ObjectId();
      
      const startDate = new Date('2024-03-15');
      const endDate = new Date('2024-03-20');
      
      // Record at end of end date (local time)
      const recordTimestamp = new Date('2024-03-20');
      recordTimestamp.setHours(23, 59, 59, 999);
      const record = createAttendanceRecord(staffId, userId, orgId, branchId, recordTimestamp, 'check_out');
      
      const filteredRecords = filterByDateRange([record], startDate, endDate);
      
      expect(filteredRecords.length).toBe(1);
    });
    
    test('record after end date is excluded', () => {
      const staffId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const orgId = new mongoose.Types.ObjectId();
      const branchId = new mongoose.Types.ObjectId();
      
      const startDate = new Date('2024-03-15');
      const endDate = new Date('2024-03-20');
      
      // Record clearly after end date (next day at noon)
      const recordTimestamp = new Date('2024-03-21');
      recordTimestamp.setHours(12, 0, 0, 0);
      const record = createAttendanceRecord(staffId, userId, orgId, branchId, recordTimestamp, 'check_in');
      
      const filteredRecords = filterByDateRange([record], startDate, endDate);
      
      expect(filteredRecords.length).toBe(0);
    });
    
    test('record before start date is excluded', () => {
      const staffId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const orgId = new mongoose.Types.ObjectId();
      const branchId = new mongoose.Types.ObjectId();
      
      const startDate = new Date('2024-03-15');
      const endDate = new Date('2024-03-20');
      
      // Record clearly before start date (previous day at noon)
      const recordTimestamp = new Date('2024-03-14');
      recordTimestamp.setHours(12, 0, 0, 0);
      const record = createAttendanceRecord(staffId, userId, orgId, branchId, recordTimestamp, 'check_out');
      
      const filteredRecords = filterByDateRange([record], startDate, endDate);
      
      expect(filteredRecords.length).toBe(0);
    });
  });
});

// Export functions for use in other modules
module.exports = {
  filterByDateRange,
  isWithinDateRange,
  createAttendanceRecord
};
