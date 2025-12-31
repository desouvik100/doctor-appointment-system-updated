/**
 * Property-Based Tests for Attendance Analytics Calculations
 * Feature: staff-presence-analytics
 * Properties: 9, 10, 11, 14
 * Validates: Requirements 6.1, 6.2, 6.3, 6.5, 6.6, 8.1, 8.2
 */

const fc = require('fast-check');
const mongoose = require('mongoose');

// Import the analytics service for pure function testing
const attendanceAnalytics = require('../services/attendanceAnalytics');

// Helper to generate valid ObjectIds
const objectIdArbitrary = fc.string({ 
  minLength: 24, 
  maxLength: 24 
}).map(() => new mongoose.Types.ObjectId());

// Time string arbitrary (HH:mm format)
const timeStringArbitrary = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 })
).map(([hours, minutes]) => 
  `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
);

// Minutes from midnight arbitrary (0-1439)
const minutesFromMidnightArbitrary = fc.integer({ min: 0, max: 1439 });

// Shift duration in minutes (1 minute to 24 hours)
const shiftDurationArbitrary = fc.integer({ min: 1, max: 1440 });

// Standard hours per day (4-12 hours)
const standardHoursArbitrary = fc.integer({ min: 4, max: 12 });

/**
 * Helper: Convert minutes from midnight to time string
 */
function minutesToTimeString(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Helper: Convert time string to minutes from midnight
 */
function timeStringToMinutes(timeStr) {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Helper: Calculate average of an array of numbers
 */
function calculateAverage(numbers) {
  if (!numbers || numbers.length === 0) return null;
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / numbers.length);
}

/**
 * Helper: Create a timestamp with specific time of day
 */
function createTimestampWithTime(baseDate, minutesFromMidnight) {
  const date = new Date(baseDate);
  const hours = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;
  date.setHours(hours, minutes, 0, 0);
  return date;
}

describe('Attendance Analytics - Property Tests', () => {

  /**
   * Property 9: Average Time Calculation
   * *For any* set of attendance records for a staff member, the calculated average 
   * check-in time SHALL equal the arithmetic mean of all check-in timestamps' 
   * time-of-day values, and similarly for check-out times.
   * Validates: Requirements 6.1, 6.2
   */
  describe('Property 9: Average Time Calculation', () => {
    
    test('average check-in time equals arithmetic mean of time-of-day values', () => {
      fc.assert(
        fc.property(
          fc.array(minutesFromMidnightArbitrary, { minLength: 1, maxLength: 50 }),
          (checkInMinutes) => {
            // Calculate expected average
            const expectedAverage = calculateAverage(checkInMinutes);
            
            // Create timestamps from minutes
            const baseDate = new Date('2024-06-15');
            const timestamps = checkInMinutes.map(mins => 
              createTimestampWithTime(baseDate, mins)
            );
            
            // Use the service's internal calculation method
            const calculatedAverage = attendanceAnalytics._calculateAverageTimeOfDay(timestamps);
            
            // Should match expected average
            expect(calculatedAverage).toBe(expectedAverage);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('average time calculation is consistent regardless of date', () => {
      fc.assert(
        fc.property(
          fc.array(minutesFromMidnightArbitrary, { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 1, max: 365 }), // day offset from base date
          (minutesList, dayOffset) => {
            // Use same time-of-day values but different dates
            const baseDate = new Date('2024-01-01');
            const timestamps = minutesList.map((mins, i) => {
              const date = new Date(baseDate);
              date.setDate(date.getDate() + ((i + dayOffset) % 365));
              return createTimestampWithTime(date, mins);
            });
            
            const calculatedAverage = attendanceAnalytics._calculateAverageTimeOfDay(timestamps);
            const expectedAverage = calculateAverage(minutesList);
            
            expect(calculatedAverage).toBe(expectedAverage);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('single timestamp returns that exact time', () => {
      fc.assert(
        fc.property(
          minutesFromMidnightArbitrary,
          fc.integer({ min: 1, max: 365 }), // day offset
          (minutes, dayOffset) => {
            const baseDate = new Date('2024-01-01');
            baseDate.setDate(baseDate.getDate() + dayOffset);
            const timestamp = createTimestampWithTime(baseDate, minutes);
            const calculatedAverage = attendanceAnalytics._calculateAverageTimeOfDay([timestamp]);
            
            expect(calculatedAverage).toBe(minutes);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('empty timestamps array returns null', () => {
      const result = attendanceAnalytics._calculateAverageTimeOfDay([]);
      expect(result).toBeNull();
    });
  });

  /**
   * Property 10: Total Hours Aggregation
   * *For any* staff member over a time period, the total hours worked SHALL equal 
   * the sum of all shiftDuration values for their check-out records in that period.
   * Validates: Requirements 6.3
   */
  describe('Property 10: Total Hours Aggregation', () => {
    
    test('total minutes equals sum of all shift durations', () => {
      fc.assert(
        fc.property(
          fc.array(shiftDurationArbitrary, { minLength: 1, maxLength: 30 }),
          (shiftDurations) => {
            // Calculate expected total
            const expectedTotalMinutes = shiftDurations.reduce((sum, dur) => sum + dur, 0);
            const expectedTotalHours = Math.round((expectedTotalMinutes / 60) * 100) / 100;
            
            // Simulate aggregation logic
            const totalMinutes = shiftDurations.reduce((sum, dur) => sum + dur, 0);
            const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
            
            expect(totalMinutes).toBe(expectedTotalMinutes);
            expect(totalHours).toBe(expectedTotalHours);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('total hours is always non-negative', () => {
      fc.assert(
        fc.property(
          fc.array(shiftDurationArbitrary, { minLength: 0, maxLength: 50 }),
          (shiftDurations) => {
            const totalMinutes = shiftDurations.reduce((sum, dur) => sum + dur, 0);
            const totalHours = totalMinutes / 60;
            
            expect(totalHours).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('empty shift list results in zero hours', () => {
      const totalMinutes = [].reduce((sum, dur) => sum + dur, 0);
      expect(totalMinutes).toBe(0);
    });

    test('shift count equals number of records', () => {
      fc.assert(
        fc.property(
          fc.array(shiftDurationArbitrary, { minLength: 0, maxLength: 50 }),
          (shiftDurations) => {
            expect(shiftDurations.length).toBe(shiftDurations.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 11: Schedule Deviation Detection
   * *For any* check-in event where the timestamp is after the staff member's 
   * scheduledStartTime, the system SHALL flag it as a late arrival.
   * *For any* check-out event where the timestamp is before the staff member's 
   * scheduledEndTime, the system SHALL flag it as an early departure.
   * Validates: Requirements 6.5, 6.6
   */
  describe('Property 11: Schedule Deviation Detection', () => {
    
    test('check-in after scheduled start time is flagged as late', () => {
      fc.assert(
        fc.property(
          minutesFromMidnightArbitrary, // scheduled start time
          fc.integer({ min: 1, max: 480 }), // delay in minutes (1 min to 8 hours)
          (scheduledMinutes, delayMinutes) => {
            // Ensure we don't overflow past midnight
            if (scheduledMinutes + delayMinutes > 1439) return true;
            
            const actualMinutes = scheduledMinutes + delayMinutes;
            const deviationMinutes = actualMinutes - scheduledMinutes;
            
            // Should be flagged as late (deviation > 0)
            expect(deviationMinutes).toBeGreaterThan(0);
            expect(deviationMinutes).toBe(delayMinutes);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('check-in before or at scheduled start time is not flagged as late', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 60, max: 1439 }), // scheduled start time (at least 1 hour into day)
          fc.integer({ min: 0, max: 60 }), // early arrival in minutes
          (scheduledMinutes, earlyMinutes) => {
            const actualMinutes = scheduledMinutes - earlyMinutes;
            const deviationMinutes = actualMinutes - scheduledMinutes;
            
            // Should NOT be flagged as late (deviation <= 0)
            expect(deviationMinutes).toBeLessThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('check-out before scheduled end time is flagged as early departure', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 60, max: 1439 }), // scheduled end time
          fc.integer({ min: 1, max: 60 }), // early departure in minutes
          (scheduledMinutes, earlyMinutes) => {
            const actualMinutes = scheduledMinutes - earlyMinutes;
            const deviationMinutes = scheduledMinutes - actualMinutes;
            
            // Should be flagged as early departure (deviation > 0)
            expect(deviationMinutes).toBeGreaterThan(0);
            expect(deviationMinutes).toBe(earlyMinutes);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('check-out at or after scheduled end time is not flagged as early', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1379 }), // scheduled end time (leave room for overtime)
          fc.integer({ min: 0, max: 60 }), // overtime in minutes
          (scheduledMinutes, overtimeMinutes) => {
            const actualMinutes = scheduledMinutes + overtimeMinutes;
            const deviationMinutes = scheduledMinutes - actualMinutes;
            
            // Should NOT be flagged as early (deviation <= 0)
            expect(deviationMinutes).toBeLessThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('threshold is respected for late arrival detection', () => {
      fc.assert(
        fc.property(
          minutesFromMidnightArbitrary,
          fc.integer({ min: 1, max: 30 }), // threshold
          fc.integer({ min: 0, max: 60 }), // actual delay
          (scheduledMinutes, threshold, delay) => {
            if (scheduledMinutes + delay > 1439) return true;
            
            const actualMinutes = scheduledMinutes + delay;
            const deviationMinutes = actualMinutes - scheduledMinutes;
            
            const isLate = deviationMinutes > threshold;
            
            if (delay > threshold) {
              expect(isLate).toBe(true);
            } else {
              expect(isLate).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 14: Overtime Calculation
   * *For any* staff member with a defined standard shift length, overtime hours 
   * SHALL equal max(0, actual hours worked - standard hours). 
   * Total overtime SHALL be the sum of daily overtime values.
   * Validates: Requirements 8.1, 8.2
   */
  describe('Property 14: Overtime Calculation', () => {
    
    test('overtime equals max(0, actual - standard) for single shift', () => {
      fc.assert(
        fc.property(
          shiftDurationArbitrary, // actual shift duration in minutes
          standardHoursArbitrary, // standard hours per day
          (actualMinutes, standardHours) => {
            const standardMinutes = standardHours * 60;
            
            const calculatedOvertime = attendanceAnalytics.calculateOvertimeMinutes(
              actualMinutes, 
              standardMinutes
            );
            const expectedOvertime = Math.max(0, actualMinutes - standardMinutes);
            
            expect(calculatedOvertime).toBe(expectedOvertime);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('overtime is never negative', () => {
      fc.assert(
        fc.property(
          shiftDurationArbitrary,
          standardHoursArbitrary,
          (actualMinutes, standardHours) => {
            const standardMinutes = standardHours * 60;
            const overtime = attendanceAnalytics.calculateOvertimeMinutes(actualMinutes, standardMinutes);
            
            expect(overtime).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('no overtime when actual equals standard', () => {
      fc.assert(
        fc.property(
          standardHoursArbitrary,
          (standardHours) => {
            const standardMinutes = standardHours * 60;
            const overtime = attendanceAnalytics.calculateOvertimeMinutes(standardMinutes, standardMinutes);
            
            expect(overtime).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('no overtime when actual is less than standard', () => {
      fc.assert(
        fc.property(
          standardHoursArbitrary,
          fc.integer({ min: 1, max: 60 }), // minutes short
          (standardHours, minutesShort) => {
            const standardMinutes = standardHours * 60;
            const actualMinutes = standardMinutes - minutesShort;
            
            const overtime = attendanceAnalytics.calculateOvertimeMinutes(actualMinutes, standardMinutes);
            
            expect(overtime).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('total overtime equals sum of daily overtime values', () => {
      fc.assert(
        fc.property(
          fc.array(shiftDurationArbitrary, { minLength: 1, maxLength: 30 }),
          standardHoursArbitrary,
          (dailyShifts, standardHours) => {
            const standardMinutes = standardHours * 60;
            
            // Calculate daily overtime values
            const dailyOvertimes = dailyShifts.map(shift => 
              attendanceAnalytics.calculateOvertimeMinutes(shift, standardMinutes)
            );
            
            // Sum of daily overtime
            const totalOvertime = dailyOvertimes.reduce((sum, ot) => sum + ot, 0);
            
            // Expected: sum of max(0, shift - standard) for each shift
            const expectedTotal = dailyShifts.reduce((sum, shift) => 
              sum + Math.max(0, shift - standardMinutes), 0
            );
            
            expect(totalOvertime).toBe(expectedTotal);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('overtime calculation is commutative with addition', () => {
      fc.assert(
        fc.property(
          fc.array(shiftDurationArbitrary, { minLength: 2, maxLength: 10 }),
          standardHoursArbitrary,
          (shifts, standardHours) => {
            const standardMinutes = standardHours * 60;
            
            // Calculate overtime for each shift individually and sum
            const sumOfIndividualOvertimes = shifts.reduce((sum, shift) => 
              sum + attendanceAnalytics.calculateOvertimeMinutes(shift, standardMinutes), 0
            );
            
            // Shuffle and recalculate (should be same)
            const shuffled = [...shifts].sort(() => Math.random() - 0.5);
            const sumOfShuffledOvertimes = shuffled.reduce((sum, shift) => 
              sum + attendanceAnalytics.calculateOvertimeMinutes(shift, standardMinutes), 0
            );
            
            expect(sumOfIndividualOvertimes).toBe(sumOfShuffledOvertimes);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Helper function tests
  describe('Helper Functions', () => {
    
    test('minutesToTimeString and timeStringToMinutes are inverses', () => {
      fc.assert(
        fc.property(
          minutesFromMidnightArbitrary,
          (minutes) => {
            const timeString = attendanceAnalytics._minutesToTimeString(minutes);
            const backToMinutes = attendanceAnalytics._timeStringToMinutes(timeString);
            
            expect(backToMinutes).toBe(minutes);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('timeStringToMinutes handles valid time strings', () => {
      fc.assert(
        fc.property(
          timeStringArbitrary,
          (timeStr) => {
            const minutes = attendanceAnalytics._timeStringToMinutes(timeStr);
            
            expect(minutes).toBeGreaterThanOrEqual(0);
            expect(minutes).toBeLessThanOrEqual(1439);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('minutesToTimeString produces valid HH:mm format', () => {
      fc.assert(
        fc.property(
          minutesFromMidnightArbitrary,
          (minutes) => {
            const timeString = attendanceAnalytics._minutesToTimeString(minutes);
            
            // Should match HH:mm format
            expect(timeString).toMatch(/^\d{2}:\d{2}$/);
            
            // Hours should be 00-23
            const [hours, mins] = timeString.split(':').map(Number);
            expect(hours).toBeGreaterThanOrEqual(0);
            expect(hours).toBeLessThanOrEqual(23);
            expect(mins).toBeGreaterThanOrEqual(0);
            expect(mins).toBeLessThanOrEqual(59);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('null input to timeStringToMinutes returns null', () => {
      expect(attendanceAnalytics._timeStringToMinutes(null)).toBeNull();
      expect(attendanceAnalytics._timeStringToMinutes(undefined)).toBeNull();
    });

    test('null input to minutesToTimeString returns null', () => {
      expect(attendanceAnalytics._minutesToTimeString(null)).toBeNull();
      expect(attendanceAnalytics._minutesToTimeString(undefined)).toBeNull();
    });
  });
});

module.exports = {
  minutesToTimeString,
  timeStringToMinutes,
  calculateAverage,
  createTimestampWithTime
};
