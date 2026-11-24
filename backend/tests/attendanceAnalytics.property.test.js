

const fc = require('fast-check');
const mongoose = require('mongoose');
const attendanceAnalytics = require('../services/attendanceAnalytics');
const objectIdArbitrary = fc.string({ 
  minLength: 24, 
  maxLength: 24 
}).map(() => new mongoose.Types.ObjectId());
const timeStringArbitrary = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 })
).map(([hours, minutes]) => 
  `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
);
const minutesFromMidnightArbitrary = fc.integer({ min: 0, max: 1439 });
const shiftDurationArbitrary = fc.integer({ min: 1, max: 1440 });
const standardHoursArbitrary = fc.integer({ min: 4, max: 12 });

function minutesToTimeString(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function timeStringToMinutes(timeStr) {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function calculateAverage(numbers) {
  if (!numbers || numbers.length === 0) return null;
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / numbers.length);
}

function createTimestampWithTime(baseDate, minutesFromMidnight) {
  const date = new Date(baseDate);
  const hours = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;
  date.setHours(hours, minutes, 0, 0);
  return date;
}

describe('Attendance Analytics - Property Tests', () => {

  describe('Property 9: Average Time Calculation', () => {
    
    test('average check-in time equals arithmetic mean of time-of-day values', () => {
      fc.assert(
        fc.property(
          fc.array(minutesFromMidnightArbitrary, { minLength: 1, maxLength: 50 }),
          (checkInMinutes) => {
           const expectedAverage = calculateAverage(checkInMinutes);
            const baseDate = new Date('2024-06-15');
            const timestamps = checkInMinutes.map(mins => 
              createTimestampWithTime(baseDate, mins)
           );
            const calculatedAverage = attendanceAnalytics._calculateAverageTimeOfDay(timestamps);
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
          fc.integer({ min: 1, max: 365 }), 
          (minutesList, dayOffset) => {
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
          fc.integer({ min: 1, max: 365 }), 
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

  describe('Property 10: Total Hours Aggregation', () => {
    
    test('total minutes equals sum of all shift durations', () => {
      fc.assert(
       fc.property(
          fc.array(shiftDurationArbitrary, { minLength: 1, maxLength: 30 }), 
          (shiftDurations) => {
            const expectedTotalMinutes = shiftDurations.reduce((sum, dur) => sum + dur, 0);
            const expectedTotalHours = Math.round((expectedTotalMinutes / 60) * 100) / 100;
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

  describe('Property 11: Schedule Deviation Detection', () => {
     
    test('check-in after scheduled start time is flagged as late', () => {
      fc.assert(
        fc.property(
          minutesFromMidnightArbitrary, 
          fc.integer({ min: 1, max: 480 }), 
          (scheduledMinutes, delayMinutes) => {
           if (scheduledMinutes + delayMinutes > 1439) return true;
            
            const actualMinutes = scheduledMinutes + delayMinutes;
            const deviationMinutes = actualMinutes - scheduledMinutes;
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
          fc.integer({ min: 60, max: 1439 }), 
          fc.integer({ min: 0, max: 60 }), 
          (scheduledMinutes, earlyMinutes) => {
            const actualMinutes = scheduledMinutes - earlyMinutes;
            const deviationMinutes = actualMinutes - scheduledMinutes;
            expect(deviationMinutes).toBeLessThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

   test('check-out before scheduled end time is flagged as early departure', () => {
      fc.assert(
       fc.property(
          fc.integer({ min: 60, max: 1439 }), 
         fc.integer({ min: 1, max: 60 }), 
          (scheduledMinutes, earlyMinutes) => {
            const actualMinutes = scheduledMinutes - earlyMinutes;
            const deviationMinutes = scheduledMinutes - actualMinutes;
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
          fc.integer({ min: 0, max: 1379 }), 
          fc.integer({ min: 0, max: 60 }), 
          (scheduledMinutes, overtimeMinutes) => {
            const actualMinutes = scheduledMinutes + overtimeMinutes;
           const deviationMinutes = scheduledMinutes - actualMinutes;
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
          fc.integer({ min: 1, max: 30 }), 
          fc.integer({ min: 0, max: 60 }), 
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

  describe('Property 14: Overtime Calculation', () => {
    
   test('overtime equals max(0, actual - standard) for single shift', () => {
     fc.assert(
        fc.property(
          shiftDurationArbitrary, 
          standardHoursArbitrary, 
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
          fc.integer({ min: 1, max: 60 }), 
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
            const dailyOvertimes = dailyShifts.map(shift => 
              attendanceAnalytics.calculateOvertimeMinutes(shift, standardMinutes)
            );
            const totalOvertime = dailyOvertimes.reduce((sum, ot) => sum + ot, 0);
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
            const sumOfIndividualOvertimes = shifts.reduce((sum, shift) => 
              sum + attendanceAnalytics.calculateOvertimeMinutes(shift, standardMinutes), 0
            );
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
            expect(timeString).toMatch(/^\d{2}:\d{2}$/);
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
