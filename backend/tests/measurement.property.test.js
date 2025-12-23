/**
 * Property-Based Tests for Measurement Service
 * Feature: advanced-imaging
 * Properties 5, 6, 7, 8, 10, 11, 12
 */

const fc = require('fast-check');
const {
  calculateDistance,
  calculateAngle,
  calculateRectangleArea,
  calculateEllipseArea,
  clampZoom,
  clampSliceIndex,
  applyWindowLevel
} = require('../services/measurementService');

describe('Measurement Service - Property Tests', () => {
  
  // Property 10: Distance Measurement Accuracy
  describe('Property 10: Distance Measurement Accuracy', () => {
    test('distance calculation matches expected formula within 0.1mm precision', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 1000, noNaN: true }),
          fc.float({ min: 0, max: 1000, noNaN: true }),
          fc.float({ min: 0, max: 1000, noNaN: true }),
          fc.float({ min: 0, max: 1000, noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: 2, noNaN: true }),
          (x1, y1, x2, y2, pixelSpacing) => {
            const calculated = calculateDistance(x1, y1, x2, y2, pixelSpacing);
            const expected = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) * pixelSpacing;
            
            expect(Math.abs(calculated - expected)).toBeLessThan(0.1);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('distance is always non-negative', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -1000, max: 1000, noNaN: true }),
          fc.float({ min: -1000, max: 1000, noNaN: true }),
          fc.float({ min: -1000, max: 1000, noNaN: true }),
          fc.float({ min: -1000, max: 1000, noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: 2, noNaN: true }),
          (x1, y1, x2, y2, pixelSpacing) => {
            const distance = calculateDistance(x1, y1, x2, y2, pixelSpacing);
            expect(distance).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('distance is symmetric', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 500, noNaN: true }),
          fc.float({ min: 0, max: 500, noNaN: true }),
          fc.float({ min: 0, max: 500, noNaN: true }),
          fc.float({ min: 0, max: 500, noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: 2, noNaN: true }),
          (x1, y1, x2, y2, pixelSpacing) => {
            const d1 = calculateDistance(x1, y1, x2, y2, pixelSpacing);
            const d2 = calculateDistance(x2, y2, x1, y1, pixelSpacing);
            expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // Property 11: Angle Measurement Accuracy
  describe('Property 11: Angle Measurement Accuracy', () => {
    test('angle is between 0 and 180 degrees', () => {
      fc.assert(
        fc.property(
          fc.record({ x: fc.float({ min: -100, max: 100, noNaN: true }), y: fc.float({ min: -100, max: 100, noNaN: true }) }),
          fc.record({ x: fc.float({ min: -100, max: 100, noNaN: true }), y: fc.float({ min: -100, max: 100, noNaN: true }) }),
          fc.record({ x: fc.float({ min: -100, max: 100, noNaN: true }), y: fc.float({ min: -100, max: 100, noNaN: true }) }),
          (pointA, pointB, pointC) => {
            const angle = calculateAngle(pointA, pointB, pointC);
            expect(angle).toBeGreaterThanOrEqual(0);
            expect(angle).toBeLessThanOrEqual(180);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('right angle calculation is accurate within 0.1 degrees', () => {
      // Test with known right angle
      const pointA = { x: 0, y: 10 };
      const pointB = { x: 0, y: 0 };
      const pointC = { x: 10, y: 0 };
      
      const angle = calculateAngle(pointA, pointB, pointC);
      expect(Math.abs(angle - 90)).toBeLessThan(0.1);
    });
    
    test('straight line angle is 180 degrees', () => {
      const pointA = { x: -10, y: 0 };
      const pointB = { x: 0, y: 0 };
      const pointC = { x: 10, y: 0 };
      
      const angle = calculateAngle(pointA, pointB, pointC);
      expect(Math.abs(angle - 180)).toBeLessThan(0.1);
    });
  });
  
  // Property 12: Area Measurement Accuracy
  describe('Property 12: Area Measurement Accuracy', () => {
    test('rectangle area calculation is accurate within 1mm²', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 500, noNaN: true }),
          fc.float({ min: 1, max: 500, noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: 2, noNaN: true }),
          (width, height, pixelSpacing) => {
            const calculated = calculateRectangleArea(width, height, pixelSpacing);
            const expected = width * height * pixelSpacing * pixelSpacing;
            
            expect(Math.abs(calculated - expected)).toBeLessThan(1);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('ellipse area calculation follows π*a*b formula', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 200, noNaN: true }),
          fc.float({ min: 1, max: 200, noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: 2, noNaN: true }),
          (radiusX, radiusY, pixelSpacing) => {
            const calculated = calculateEllipseArea(radiusX, radiusY, pixelSpacing);
            const expected = Math.PI * radiusX * radiusY * pixelSpacing * pixelSpacing;
            
            expect(Math.abs(calculated - expected)).toBeLessThan(1);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('area is always non-negative', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -500, max: 500, noNaN: true }),
          fc.float({ min: -500, max: 500, noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: 2, noNaN: true }),
          (width, height, pixelSpacing) => {
            const area = calculateRectangleArea(width, height, pixelSpacing);
            expect(area).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // Property 6: Zoom Range Validation
  describe('Property 6: Zoom Range Validation', () => {
    test('zoom is clamped to valid range [0.25, 4.0]', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -10, max: 10, noNaN: true }),
          (zoom) => {
            const clamped = clampZoom(zoom);
            expect(clamped).toBeGreaterThanOrEqual(0.25);
            expect(clamped).toBeLessThanOrEqual(4.0);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('values within range are unchanged', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0.25, max: 4.0, noNaN: true }),
          (zoom) => {
            const clamped = clampZoom(zoom);
            expect(Math.abs(clamped - zoom)).toBeLessThan(0.001);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // Property 8: Slice Navigation Bounds
  describe('Property 8: Slice Navigation Bounds', () => {
    test('slice index is clamped to valid range [0, N-1]', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 500 }),
          fc.integer({ min: 1, max: 300 }),
          (index, totalSlices) => {
            const clamped = clampSliceIndex(index, totalSlices);
            expect(clamped).toBeGreaterThanOrEqual(0);
            expect(clamped).toBeLessThanOrEqual(totalSlices - 1);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('valid indices are unchanged', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (totalSlices) => {
            fc.assert(
              fc.property(
                fc.integer({ min: 0, max: totalSlices - 1 }),
                (index) => {
                  const clamped = clampSliceIndex(index, totalSlices);
                  expect(clamped).toBe(index);
                }
              ),
              { numRuns: 10 }
            );
          }
        ),
        { numRuns: 10 }
      );
    });
  });
  
  // Property 7: Window/Level Application
  describe('Property 7: Window/Level Application', () => {
    test('output is always in range [0, 255]', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -2000, max: 4000 }),
          fc.integer({ min: 1, max: 4000 }),
          fc.integer({ min: -1000, max: 3000 }),
          (pixelValue, windowWidth, windowCenter) => {
            const result = applyWindowLevel(pixelValue, windowWidth, windowCenter);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(255);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('values below window are 0', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 2000 }),
          fc.integer({ min: 0, max: 2000 }),
          (windowWidth, windowCenter) => {
            const minValue = windowCenter - windowWidth / 2;
            const result = applyWindowLevel(minValue - 100, windowWidth, windowCenter);
            expect(result).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    test('values above window are 255', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 2000 }),
          fc.integer({ min: 0, max: 2000 }),
          (windowWidth, windowCenter) => {
            const maxValue = windowCenter + windowWidth / 2;
            const result = applyWindowLevel(maxValue + 100, windowWidth, windowCenter);
            expect(result).toBe(255);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // Edge cases
  describe('Edge Cases', () => {
    test('distance with zero pixel spacing throws error', () => {
      expect(() => calculateDistance(0, 0, 10, 10, 0)).toThrow();
    });
    
    test('area with zero pixel spacing throws error', () => {
      expect(() => calculateRectangleArea(10, 10, 0)).toThrow();
    });
    
    test('angle with coincident points returns 0', () => {
      const point = { x: 5, y: 5 };
      const angle = calculateAngle(point, point, point);
      expect(angle).toBe(0);
    });
  });
});
