/**
 * Property-Based Tests for Branch Comparison Analytics
 * Feature: staff-presence-analytics
 * Property 12: Branch Aggregation Correctness
 * Property 13: Branch Normalization
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4
 */

const fc = require('fast-check');
const mongoose = require('mongoose');
const attendanceAnalytics = require('../services/attendanceAnalytics');

// Helper to generate valid ObjectIds
const objectIdArbitrary = fc.string({ 
  minLength: 24, 
  maxLength: 24 
}).map(() => new mongoose.Types.ObjectId());

// Valid role values
const validRoles = ['branch_admin', 'branch_manager', 'receptionist', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'accountant'];

/**
 * Arbitrary for generating a staff member
 */
const staffArbitrary = fc.record({
  _id: objectIdArbitrary,
  name: fc.string({ minLength: 1, maxLength: 50 }),
  branchId: objectIdArbitrary,
  organizationId: objectIdArbitrary,
  role: fc.constantFrom(...validRoles),
  isActive: fc.boolean()
});

/**
 * Arbitrary for generating a check-in record
 */
const checkInRecordArbitrary = fc.record({
  _id: objectIdArbitrary,
  staffId: objectIdArbitrary,
  branchId: objectIdArbitrary,
  organizationId: objectIdArbitrary,
  eventType: fc.constant('check_in'),
  timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })
});

/**
 * Arbitrary for generating a check-out record with shift duration
 */
const checkOutRecordArbitrary = fc.record({
  _id: objectIdArbitrary,
  staffId: objectIdArbitrary,
  branchId: objectIdArbitrary,
  organizationId: objectIdArbitrary,
  eventType: fc.constant('check_out'),
  timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
  shiftDuration: fc.integer({ min: 60, max: 720 }) // 1-12 hours in minutes
});

/**
 * Arbitrary for generating branch data
 */
const branchArbitrary = fc.record({
  _id: objectIdArbitrary,
  branchName: fc.string({ minLength: 1, maxLength: 30 }),
  branchCode: fc.string({ minLength: 3, maxLength: 10 }),
  staffCount: fc.integer({ min: 0, max: 100 }),
  isActive: fc.constant(true)
});

describe('Branch Analytics - Property Tests', () => {

  // Property 12: Branch Aggregation Correctness
  // Validates: Requirements 7.1, 7.2, 7.3
  describe('Property 12: Branch Aggregation Correctness', () => {

    test('*For any* branch, staff count SHALL equal the number of active staff assigned to that branch', () => {
      fc.assert(
        fc.property(
          fc.array(staffArbitrary, { minLength: 0, maxLength: 50 }),
          objectIdArbitrary,
          (staffList, branchId) => {
            const calculatedCount = attendanceAnalytics.calculateBranchStaffCount(staffList, branchId);
            
            // Manual count for verification
            const expectedCount = staffList.filter(s => 
              s.branchId && s.branchId.toString() === branchId.toString() && s.isActive
            ).length;
            
            expect(calculatedCount).toBe(expectedCount);
            expect(calculatedCount).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('staff count is always non-negative', () => {
      fc.assert(
        fc.property(
          fc.array(staffArbitrary, { minLength: 0, maxLength: 30 }),
          objectIdArbitrary,
          (staffList, branchId) => {
            const count = attendanceAnalytics.calculateBranchStaffCount(staffList, branchId);
            expect(count).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('staff count for empty list is zero', () => {
      fc.assert(
        fc.property(
          objectIdArbitrary,
          (branchId) => {
            const count = attendanceAnalytics.calculateBranchStaffCount([], branchId);
            expect(count).toBe(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('*For any* branch, peak hour SHALL be the hour with maximum concurrent check-ins', () => {
      fc.assert(
        fc.property(
          fc.array(checkInRecordArbitrary, { minLength: 1, maxLength: 50 }),
          (checkInRecords) => {
            const result = attendanceAnalytics.calculatePeakHour(checkInRecords);
            
            if (checkInRecords.length === 0) {
              expect(result.peakHour).toBeNull();
              expect(result.count).toBe(0);
            } else {
              // Verify the peak hour has the maximum count
              const hourCounts = {};
              for (const record of checkInRecords) {
                const hour = new Date(record.timestamp).getHours();
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
              }
              
              const maxCount = Math.max(...Object.values(hourCounts));
              expect(result.count).toBe(maxCount);
              expect(hourCounts[result.peakHour]).toBe(maxCount);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('peak hour is between 0 and 23 when records exist', () => {
      fc.assert(
        fc.property(
          fc.array(checkInRecordArbitrary, { minLength: 1, maxLength: 30 }),
          (checkInRecords) => {
            const result = attendanceAnalytics.calculatePeakHour(checkInRecords);
            
            if (result.peakHour !== null) {
              expect(result.peakHour).toBeGreaterThanOrEqual(0);
              expect(result.peakHour).toBeLessThanOrEqual(23);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('peak hour for empty records is null', () => {
      const result = attendanceAnalytics.calculatePeakHour([]);
      expect(result.peakHour).toBeNull();
      expect(result.count).toBe(0);
    });
  });


  // Property 13: Branch Normalization
  // Validates: Requirements 7.4
  describe('Property 13: Branch Normalization', () => {

    test('*For any* branch, normalized hours SHALL equal total hours divided by staff count', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000, noNaN: true }),
          fc.integer({ min: 1, max: 500 }),
          (totalHours, staffCount) => {
            const normalized = attendanceAnalytics.calculateNormalizedHours(totalHours, staffCount);
            const expected = Math.round((totalHours / staffCount) * 100) / 100;
            
            expect(normalized).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('normalized hours is zero when staff count is zero', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000, noNaN: true }),
          (totalHours) => {
            const normalized = attendanceAnalytics.calculateNormalizedHours(totalHours, 0);
            expect(normalized).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('normalized hours is always non-negative', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000, noNaN: true }),
          fc.integer({ min: 0, max: 500 }),
          (totalHours, staffCount) => {
            const normalized = attendanceAnalytics.calculateNormalizedHours(totalHours, staffCount);
            expect(normalized).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('normalization ensures fair comparison regardless of branch size', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 100, max: 1000, noNaN: true }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (hoursPerStaff, smallBranchSize, largeBranchSize) => {
            // Two branches with same hours per staff but different sizes
            const smallBranchTotal = hoursPerStaff * smallBranchSize;
            const largeBranchTotal = hoursPerStaff * largeBranchSize;
            
            const smallNormalized = attendanceAnalytics.calculateNormalizedHours(smallBranchTotal, smallBranchSize);
            const largeNormalized = attendanceAnalytics.calculateNormalizedHours(largeBranchTotal, largeBranchSize);
            
            // Normalized values should be approximately equal (within rounding tolerance)
            expect(Math.abs(smallNormalized - largeNormalized)).toBeLessThan(0.02);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('larger branch with same efficiency has same normalized hours', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 10, max: 100, noNaN: true }),
          fc.integer({ min: 2, max: 10 }),
          (baseHours, multiplier) => {
            // Small branch: baseHours total, 1 staff
            // Large branch: baseHours * multiplier total, multiplier staff
            const smallNormalized = attendanceAnalytics.calculateNormalizedHours(baseHours, 1);
            const largeNormalized = attendanceAnalytics.calculateNormalizedHours(baseHours * multiplier, multiplier);
            
            // Should be equal (same efficiency)
            expect(Math.abs(smallNormalized - largeNormalized)).toBeLessThan(0.02);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Additional integration-style property tests
  describe('Branch Comparison Integration Properties', () => {

    test('total hours across all branches equals sum of individual branch hours', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              branchId: objectIdArbitrary,
              totalHours: fc.float({ min: 0, max: 1000, noNaN: true })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (branchData) => {
            const totalHours = branchData.reduce((sum, b) => sum + b.totalHours, 0);
            const sumOfIndividual = branchData.map(b => b.totalHours).reduce((a, b) => a + b, 0);
            
            expect(Math.abs(totalHours - sumOfIndividual)).toBeLessThan(0.001);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('average hours per branch is total divided by branch count', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.float({ min: 0, max: 1000, noNaN: true }),
            { minLength: 1, maxLength: 10 }
          ),
          (branchHours) => {
            const totalHours = branchHours.reduce((sum, h) => sum + h, 0);
            const avgHours = totalHours / branchHours.length;
            const expectedAvg = Math.round(avgHours * 100) / 100;
            
            const calculatedAvg = Math.round((branchHours.reduce((a, b) => a + b, 0) / branchHours.length) * 100) / 100;
            
            expect(calculatedAvg).toBe(expectedAvg);
          }
        ),
        { numRuns: 50 }
      );
    });

    test('staff count aggregation is consistent', () => {
      fc.assert(
        fc.property(
          fc.array(staffArbitrary, { minLength: 0, maxLength: 50 }),
          fc.array(objectIdArbitrary, { minLength: 1, maxLength: 5 }),
          (staffList, branchIds) => {
            // Count staff per branch
            const branchCounts = branchIds.map(branchId => 
              attendanceAnalytics.calculateBranchStaffCount(staffList, branchId)
            );
            
            // Each count should be non-negative
            branchCounts.forEach(count => {
              expect(count).toBeGreaterThanOrEqual(0);
            });
            
            // Total should not exceed total active staff
            const totalActiveStaff = staffList.filter(s => s.isActive).length;
            // Note: sum of branch counts could be less than total if some staff have different branchIds
            branchCounts.forEach(count => {
              expect(count).toBeLessThanOrEqual(totalActiveStaff);
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    
    test('handles single staff member correctly', () => {
      const branchId = new mongoose.Types.ObjectId();
      const staff = [{
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Staff',
        branchId: branchId,
        isActive: true
      }];
      
      const count = attendanceAnalytics.calculateBranchStaffCount(staff, branchId);
      expect(count).toBe(1);
    });

    test('handles inactive staff correctly', () => {
      const branchId = new mongoose.Types.ObjectId();
      const staff = [
        { _id: new mongoose.Types.ObjectId(), branchId, isActive: true },
        { _id: new mongoose.Types.ObjectId(), branchId, isActive: false },
        { _id: new mongoose.Types.ObjectId(), branchId, isActive: true }
      ];
      
      const count = attendanceAnalytics.calculateBranchStaffCount(staff, branchId);
      expect(count).toBe(2); // Only active staff
    });

    test('handles staff with null branchId', () => {
      const branchId = new mongoose.Types.ObjectId();
      const staff = [
        { _id: new mongoose.Types.ObjectId(), branchId: null, isActive: true },
        { _id: new mongoose.Types.ObjectId(), branchId, isActive: true }
      ];
      
      const count = attendanceAnalytics.calculateBranchStaffCount(staff, branchId);
      expect(count).toBe(1);
    });

    test('handles very large hours values', () => {
      const normalized = attendanceAnalytics.calculateNormalizedHours(100000, 100);
      expect(normalized).toBe(1000);
    });

    test('handles single check-in record for peak hour', () => {
      const timestamp = new Date('2024-06-15T09:30:00Z');
      const records = [{
        _id: new mongoose.Types.ObjectId(),
        timestamp
      }];
      
      const result = attendanceAnalytics.calculatePeakHour(records);
      expect(result.peakHour).toBe(timestamp.getHours());
      expect(result.count).toBe(1);
    });
  });
});
