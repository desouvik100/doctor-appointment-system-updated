

const fc = require('fast-check');
const mongoose = require('mongoose');
const objectIdArbitrary = fc.string({ 
  minLength: 24, 
  maxLength: 24 
}).map(() => new mongoose.Types.ObjectId());
const eventTypeValues = ['check_in', 'check_out'];

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
  if (eventType === 'check_out') {
    const checkInTime = new Date(timestamp.getTime() - (8 * 60 * 60 * 1000)); 
    record.checkInTime = checkInTime;
    record.shiftDuration = 480; 
  }
  
  return record;
}

function filterByDateRange(records, startDate, endDate) {
  return records.filter(record => {
    const timestamp = new Date(record.timestamp);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return timestamp >= start && timestamp <= end;
  });
}

function isWithinDateRange(timestamp, startDate, endDate) {
  const ts = new Date(timestamp);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  return ts >= start && ts <= end;
}

function randomDateInRange(start, end) {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

describe('Date Range Query Filtering - Property Tests', () => {
  describe('Property 8: Date Range Query Filtering', () => {
    
    test('*For any* attendance history query with a date range, all returned records SHALL have timestamps within the specified start and end dates (inclusive)', () => {
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
            { minLength: 1, maxLength: 50 }
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
            expect(filteredRecords.length).toBeLessThanOrEqual(records.length);
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
            const recordTimestamp = new Date('2024-01-15');
            const record = createAttendanceRecord(staffId, userId, orgId, branchId, recordTimestamp, eventType);
            const startDate = new Date('2024-06-01');
            const endDate = new Date('2024-06-30');
            
            const filteredRecords = filterByDateRange([record], startDate, endDate);
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
            const startDate = new Date('2024-03-15');
            const endDate = new Date('2024-03-20');
            const recordTimestamp = new Date('2024-03-15');
            recordTimestamp.setHours(hour, minute, 0, 0);
            
            const record = createAttendanceRecord(staffId, userId, orgId, branchId, recordTimestamp, eventType);
            const filteredRecords = filterByDateRange([record], startDate, endDate);
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
            const recordTimestamp = new Date('2024-03-20');
            recordTimestamp.setHours(hour, minute, 0, 0);
            
            const record = createAttendanceRecord(staffId, userId, orgId, branchId, recordTimestamp, eventType);
            const filteredRecords = filterByDateRange([record], startDate, endDate);
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
          fc.integer({ min: 1, max: 28 }), 
          (recordData, day) => {
            const records = recordData.map(([staffId, userId, orgId, branchId, timestamp, eventType]) => 
              createAttendanceRecord(staffId, userId, orgId, branchId, timestamp, eventType)
            );
            const queryDate = new Date(`2024-03-${day.toString().padStart(2, '0')}`);
            const filteredRecords = filterByDateRange(records, queryDate, queryDate);
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
            const startDate = new Date('2024-06-15');
            const endDate = new Date('2024-06-01');
            
            const filteredRecords = filterByDateRange(records, startDate, endDate);
            expect(filteredRecords.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  describe('Combined Date Range and Other Filters', () => {

    function filterByDateRangeAndStaff(records, startDate, endDate, staffId) {
      return filterByDateRange(records, startDate, endDate)
        .filter(record => record.staffId.toString() === staffId.toString());
    }

    function filterByDateRangeAndBranch(records, startDate, endDate, branchId) {
      return filterByDateRange(records, startDate, endDate)
        .filter(record => record.branchId.toString() === branchId.toString());
    }
    
    test('date range filter combined with staffId filter returns correct subset', () => {
      fc.assert(
        fc.property(
          objectIdArbitrary, 
          fc.array(
            fc.tuple(
              fc.boolean(), 
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
          objectIdArbitrary, 
          fc.array(
            fc.tuple(
              fc.boolean(), 
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
      const recordTimestamp = new Date('2024-03-14');
      recordTimestamp.setHours(12, 0, 0, 0);
      const record = createAttendanceRecord(staffId, userId, orgId, branchId, recordTimestamp, 'check_out');
      
      const filteredRecords = filterByDateRange([record], startDate, endDate);
      
      expect(filteredRecords.length).toBe(0);
    });
  });
});
module.exports = {
  filterByDateRange,
  isWithinDateRange,
  createAttendanceRecord
};
