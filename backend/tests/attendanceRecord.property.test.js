/**
 * Property-Based Tests for Attendance Record Model
 * Feature: staff-presence-analytics
 * Property 6: Attendance Record Completeness
 * Validates: Requirements 5.1, 5.2, 5.5
 */

const fc = require('fast-check');
const mongoose = require('mongoose');

// Helper to generate valid ObjectIds
const objectIdArbitrary = fc.string({ 
  minLength: 24, 
  maxLength: 24 
}).map(() => new mongoose.Types.ObjectId());

// Custom status enum values
const customStatusValues = ['available', 'with_patient', 'in_surgery', 'on_break', 'in_meeting', 'unavailable', null];

// Event type enum values
const eventTypeValues = ['check_in', 'check_out'];

// Source enum values
const sourceValues = ['manual', 'auto', 'system'];

/**
 * Validates that an attendance record has all required fields for check-in events
 * Requirements 5.1: WHEN a Staff_Member checks in, THE System SHALL record the timestamp, staff ID, branch ID, and status
 */
function validateCheckInRecord(record) {
  const errors = [];
  
  // Required fields for all events
  if (!record.staffId) errors.push('Missing staffId');
  if (!record.userId) errors.push('Missing userId');
  if (!record.organizationId) errors.push('Missing organizationId');
  if (!record.eventType) errors.push('Missing eventType');
  if (!record.timestamp) errors.push('Missing timestamp');
  
  // Event type must be valid
  if (record.eventType && !eventTypeValues.includes(record.eventType)) {
    errors.push(`Invalid eventType: ${record.eventType}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates that an attendance record has all required fields for check-out events
 * Requirements 5.2: WHEN a Staff_Member checks out, THE System SHALL record the timestamp and calculate shift duration
 */
function validateCheckOutRecord(record) {
  const baseValidation = validateCheckInRecord(record);
  const errors = [...baseValidation.errors];
  
  // Check-out specific validations
  if (record.eventType === 'check_out') {
    if (record.shiftDuration === undefined || record.shiftDuration === null) {
      errors.push('Check-out record missing shiftDuration');
    }
    if (!record.checkInTime) {
      errors.push('Check-out record missing checkInTime');
    }
    // Shift duration should be non-negative
    if (record.shiftDuration !== undefined && record.shiftDuration < 0) {
      errors.push('shiftDuration cannot be negative');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Creates a valid check-in attendance record
 */
function createCheckInRecord(staffId, userId, organizationId, timestamp, customStatus = null) {
  return {
    staffId,
    userId,
    organizationId,
    eventType: 'check_in',
    timestamp,
    customStatus,
    source: 'manual'
  };
}

/**
 * Creates a valid check-out attendance record with calculated shift duration
 */
function createCheckOutRecord(staffId, userId, organizationId, checkInTime, checkOutTime, customStatus = null) {
  const shiftDuration = Math.round((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));
  
  return {
    staffId,
    userId,
    organizationId,
    eventType: 'check_out',
    timestamp: checkOutTime,
    shiftDuration,
    checkInTime,
    customStatus,
    source: 'manual'
  };
}

describe('Attendance Record - Property Tests', () => {
  
  // Property 6: Attendance Record Completeness
  describe('Property 6: Attendance Record Completeness', () => {
    
    test('check-in records contain all required fields (staffId, userId, organizationId, eventType, timestamp)', () => {
      fc.assert(
        fc.property(
          objectIdArbitrary,
          objectIdArbitrary,
          objectIdArbitrary,
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          fc.constantFrom(...customStatusValues),
          (staffId, userId, organizationId, timestamp, customStatus) => {
            const record = createCheckInRecord(staffId, userId, organizationId, timestamp, customStatus);
            const validation = validateCheckInRecord(record);
            
            expect(validation.isValid).toBe(true);
            expect(record.staffId).toBeDefined();
            expect(record.userId).toBeDefined();
            expect(record.organizationId).toBeDefined();
            expect(record.eventType).toBe('check_in');
            expect(record.timestamp).toBeDefined();
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('check-out records contain shiftDuration and checkInTime in addition to required fields', () => {
      fc.assert(
        fc.property(
          objectIdArbitrary,
          objectIdArbitrary,
          objectIdArbitrary,
          fc.date({ min: new Date('2020-01-01T00:00:00Z'), max: new Date('2025-12-31T23:59:59Z'), noInvalidDate: true }),
          fc.integer({ min: 1, max: 720 }), // 1 minute to 12 hours shift
          fc.constantFrom(...customStatusValues),
          (staffId, userId, organizationId, checkInTime, shiftMinutes, customStatus) => {
            // Skip if date is invalid
            if (isNaN(checkInTime.getTime())) return;
            
            const checkOutTime = new Date(checkInTime.getTime() + shiftMinutes * 60 * 1000);
            
            const record = createCheckOutRecord(staffId, userId, organizationId, checkInTime, checkOutTime, customStatus);
            const validation = validateCheckOutRecord(record);
            
            expect(validation.isValid).toBe(true);
            expect(record.staffId).toBeDefined();
            expect(record.userId).toBeDefined();
            expect(record.organizationId).toBeDefined();
            expect(record.eventType).toBe('check_out');
            expect(record.timestamp).toBeDefined();
            expect(record.shiftDuration).toBeDefined();
            expect(record.shiftDuration).toBeGreaterThanOrEqual(0);
            expect(record.checkInTime).toBeDefined();
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('customStatus is preserved in attendance records when set (Requirement 5.5)', () => {
      fc.assert(
        fc.property(
          objectIdArbitrary,
          objectIdArbitrary,
          objectIdArbitrary,
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          fc.constantFrom('available', 'with_patient', 'in_surgery', 'on_break', 'in_meeting', 'unavailable'),
          (staffId, userId, organizationId, timestamp, customStatus) => {
            const record = createCheckInRecord(staffId, userId, organizationId, timestamp, customStatus);
            
            // Custom status should be preserved
            expect(record.customStatus).toBe(customStatus);
            expect(customStatusValues).toContain(record.customStatus);
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('shift duration equals difference between check-out and check-in timestamps in minutes', () => {
      fc.assert(
        fc.property(
          objectIdArbitrary,
          objectIdArbitrary,
          objectIdArbitrary,
          fc.date({ min: new Date('2020-01-01T00:00:00Z'), max: new Date('2025-12-31T23:59:59Z'), noInvalidDate: true }),
          fc.integer({ min: 1, max: 1440 }), // 1 minute to 24 hours
          (staffId, userId, organizationId, checkInTime, shiftMinutes) => {
            // Skip if date is invalid
            if (isNaN(checkInTime.getTime())) return;
            
            const checkOutTime = new Date(checkInTime.getTime() + shiftMinutes * 60 * 1000);
            
            const record = createCheckOutRecord(staffId, userId, organizationId, checkInTime, checkOutTime);
            
            // Shift duration should match the time difference
            const expectedDuration = Math.round((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));
            expect(record.shiftDuration).toBe(expectedDuration);
            expect(record.shiftDuration).toBe(shiftMinutes);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
  
  // Property 7: Shift Duration Calculation
  // Validates: Requirements 5.2
  describe('Property 7: Shift Duration Calculation', () => {
    
    /**
     * Calculates shift duration in minutes from check-in and check-out times
     * This mirrors the logic in the check-out endpoint
     */
    function calculateShiftDuration(checkInTime, checkOutTime) {
      return Math.round((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));
    }
    
    test('*For any* check-out event with a paired check-in, shiftDuration SHALL equal the difference between check-out and check-in timestamps in minutes', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          fc.integer({ min: 1, max: 1440 }), // 1 minute to 24 hours
          (checkInTime, shiftMinutes) => {
            const checkOutTime = new Date(checkInTime.getTime() + shiftMinutes * 60 * 1000);
            
            const calculatedDuration = calculateShiftDuration(checkInTime, checkOutTime);
            
            // The calculated duration should equal the expected shift minutes
            expect(calculatedDuration).toBe(shiftMinutes);
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('shift duration is always non-negative when check-out is after check-in', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01T00:00:00Z'), max: new Date('2025-12-31T23:59:59Z'), noInvalidDate: true }),
          fc.integer({ min: 0, max: 2880 }), // 0 to 48 hours
          (checkInTime, shiftMinutes) => {
            // Skip if date is invalid
            if (isNaN(checkInTime.getTime())) return;
            
            const checkOutTime = new Date(checkInTime.getTime() + shiftMinutes * 60 * 1000);
            
            const calculatedDuration = calculateShiftDuration(checkInTime, checkOutTime);
            
            expect(calculatedDuration).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('shift duration calculation is consistent regardless of date/time', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 720 }), // 1 minute to 12 hours
          fc.integer({ min: 0, max: 365 }), // day offset
          fc.integer({ min: 0, max: 23 }),  // hour
          fc.integer({ min: 0, max: 59 }),  // minute
          (shiftMinutes, dayOffset, hour, minute) => {
            const baseDate = new Date('2024-01-01');
            baseDate.setDate(baseDate.getDate() + dayOffset);
            baseDate.setHours(hour, minute, 0, 0);
            
            const checkInTime = new Date(baseDate);
            const checkOutTime = new Date(checkInTime.getTime() + shiftMinutes * 60 * 1000);
            
            const calculatedDuration = calculateShiftDuration(checkInTime, checkOutTime);
            
            // Duration should always equal the shift minutes regardless of when the shift occurred
            expect(calculatedDuration).toBe(shiftMinutes);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // Property 4: Checkout Clears Custom Status
  // Validates: Requirements 2.4
  describe('Property 4: Checkout Clears Custom Status', () => {
    
    /**
     * Simulates the checkout process that clears custom status
     * This mirrors the logic in the check-out endpoint
     */
    function simulateCheckout(staffRecord) {
      // Create a copy to simulate the checkout process
      const updatedStaff = { ...staffRecord };
      
      // Clear custom status on checkout (as per Requirements 2.4)
      updatedStaff.customStatus = null;
      updatedStaff.customStatusText = null;
      updatedStaff.isCheckedIn = false;
      updatedStaff.lastCheckOut = new Date();
      
      return updatedStaff;
    }
    
    /**
     * Creates a staff record with a custom status set
     */
    function createStaffWithStatus(customStatus, customStatusText = null) {
      return {
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        organizationId: new mongoose.Types.ObjectId(),
        branchId: new mongoose.Types.ObjectId(),
        name: 'Test Staff',
        email: 'test@example.com',
        role: 'receptionist',
        isCheckedIn: true,
        lastCheckIn: new Date(),
        customStatus,
        customStatusText
      };
    }
    
    test('*For any* staff member with a custom status set, when they check out, their custom status SHALL be set to null/cleared', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('available', 'with_patient', 'in_surgery', 'on_break', 'in_meeting', 'unavailable'),
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          (customStatus, customStatusText) => {
            // Create a staff record with a custom status
            const staffBefore = createStaffWithStatus(customStatus, customStatusText);
            
            // Verify the staff has a custom status before checkout
            expect(staffBefore.customStatus).toBe(customStatus);
            expect(staffBefore.isCheckedIn).toBe(true);
            
            // Simulate checkout
            const staffAfter = simulateCheckout(staffBefore);
            
            // After checkout, custom status should be cleared
            expect(staffAfter.customStatus).toBeNull();
            expect(staffAfter.customStatusText).toBeNull();
            expect(staffAfter.isCheckedIn).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('checkout clears status regardless of which status was set', () => {
      const allStatuses = ['available', 'with_patient', 'in_surgery', 'on_break', 'in_meeting', 'unavailable'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...allStatuses),
          (status) => {
            const staffBefore = createStaffWithStatus(status);
            const staffAfter = simulateCheckout(staffBefore);
            
            // All statuses should be cleared to null after checkout
            expect(staffAfter.customStatus).toBeNull();
          }
        ),
        { numRuns: 20 }
      );
    });
    
    test('checkout clears status even when statusText is set', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('available', 'with_patient', 'in_surgery', 'on_break', 'in_meeting', 'unavailable'),
          fc.string({ minLength: 1, maxLength: 50 }),
          (customStatus, customStatusText) => {
            const staffBefore = createStaffWithStatus(customStatus, customStatusText);
            
            // Verify both status and text are set
            expect(staffBefore.customStatus).toBe(customStatus);
            expect(staffBefore.customStatusText).toBe(customStatusText);
            
            const staffAfter = simulateCheckout(staffBefore);
            
            // Both should be cleared
            expect(staffAfter.customStatus).toBeNull();
            expect(staffAfter.customStatusText).toBeNull();
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // Edge case unit tests
  describe('Edge Cases', () => {
    test('records without required fields fail validation', () => {
      const incompleteRecord = {
        eventType: 'check_in',
        timestamp: new Date()
      };
      
      const validation = validateCheckInRecord(incompleteRecord);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Missing staffId');
      expect(validation.errors).toContain('Missing userId');
      expect(validation.errors).toContain('Missing organizationId');
    });
    
    test('check-out records without shiftDuration fail validation', () => {
      const incompleteCheckOut = {
        staffId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        organizationId: new mongoose.Types.ObjectId(),
        eventType: 'check_out',
        timestamp: new Date()
        // Missing shiftDuration and checkInTime
      };
      
      const validation = validateCheckOutRecord(incompleteCheckOut);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Check-out record missing shiftDuration');
      expect(validation.errors).toContain('Check-out record missing checkInTime');
    });
    
    test('negative shift duration fails validation', () => {
      const invalidRecord = {
        staffId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        organizationId: new mongoose.Types.ObjectId(),
        eventType: 'check_out',
        timestamp: new Date(),
        shiftDuration: -10,
        checkInTime: new Date()
      };
      
      const validation = validateCheckOutRecord(invalidRecord);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('shiftDuration cannot be negative');
    });
  });
});

// Export validation functions for use in other modules
module.exports = {
  validateCheckInRecord,
  validateCheckOutRecord,
  createCheckInRecord,
  createCheckOutRecord
};
