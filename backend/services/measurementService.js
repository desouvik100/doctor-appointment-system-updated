/**
 * Measurement Service
 * Provides accurate measurement calculations for DICOM images
 */

/**
 * Calculate distance between two points in mm
 * @param {number} x1 - First point X coordinate (pixels)
 * @param {number} y1 - First point Y coordinate (pixels)
 * @param {number} x2 - Second point X coordinate (pixels)
 * @param {number} y2 - Second point Y coordinate (pixels)
 * @param {number} pixelSpacing - Pixel spacing in mm/pixel
 * @returns {number} Distance in mm
 */
function calculateDistance(x1, y1, x2, y2, pixelSpacing) {
  if (pixelSpacing <= 0) {
    throw new Error('Pixel spacing must be positive');
  }
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  const pixelDistance = Math.sqrt(dx * dx + dy * dy);
  
  return pixelDistance * pixelSpacing;
}

/**
 * Calculate angle at vertex B given three points A, B, C
 * @param {Object} pointA - First point {x, y}
 * @param {Object} pointB - Vertex point {x, y}
 * @param {Object} pointC - Third point {x, y}
 * @returns {number} Angle in degrees
 */
function calculateAngle(pointA, pointB, pointC) {
  // Vector BA
  const baX = pointA.x - pointB.x;
  const baY = pointA.y - pointB.y;
  
  // Vector BC
  const bcX = pointC.x - pointB.x;
  const bcY = pointC.y - pointB.y;
  
  // Dot product
  const dotProduct = baX * bcX + baY * bcY;
  
  // Magnitudes
  const magnitudeBA = Math.sqrt(baX * baX + baY * baY);
  const magnitudeBC = Math.sqrt(bcX * bcX + bcY * bcY);
  
  if (magnitudeBA === 0 || magnitudeBC === 0) {
    return 0;
  }
  
  // Angle in radians
  const cosAngle = dotProduct / (magnitudeBA * magnitudeBC);
  
  // Clamp to [-1, 1] to handle floating point errors
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));
  
  // Convert to degrees
  const angleRadians = Math.acos(clampedCos);
  const angleDegrees = angleRadians * (180 / Math.PI);
  
  return angleDegrees;
}

/**
 * Calculate area of a rectangle in mm²
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @param {number} pixelSpacing - Pixel spacing in mm/pixel
 * @returns {number} Area in mm²
 */
function calculateRectangleArea(width, height, pixelSpacing) {
  if (pixelSpacing <= 0) {
    throw new Error('Pixel spacing must be positive');
  }
  
  const widthMm = Math.abs(width) * pixelSpacing;
  const heightMm = Math.abs(height) * pixelSpacing;
  
  return widthMm * heightMm;
}

/**
 * Calculate area of an ellipse in mm²
 * @param {number} radiusX - X radius in pixels
 * @param {number} radiusY - Y radius in pixels
 * @param {number} pixelSpacing - Pixel spacing in mm/pixel
 * @returns {number} Area in mm²
 */
function calculateEllipseArea(radiusX, radiusY, pixelSpacing) {
  if (pixelSpacing <= 0) {
    throw new Error('Pixel spacing must be positive');
  }
  
  const radiusXMm = Math.abs(radiusX) * pixelSpacing;
  const radiusYMm = Math.abs(radiusY) * pixelSpacing;
  
  return Math.PI * radiusXMm * radiusYMm;
}

/**
 * Calculate area of a polygon using Shoelace formula
 * @param {Array<{x: number, y: number}>} points - Array of polygon vertices
 * @param {number} pixelSpacing - Pixel spacing in mm/pixel
 * @returns {number} Area in mm²
 */
function calculatePolygonArea(points, pixelSpacing) {
  if (pixelSpacing <= 0) {
    throw new Error('Pixel spacing must be positive');
  }
  
  if (!points || points.length < 3) {
    return 0;
  }
  
  let area = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  area = Math.abs(area) / 2;
  
  // Convert from pixels² to mm²
  return area * pixelSpacing * pixelSpacing;
}

/**
 * Clamp zoom value to valid range
 * @param {number} zoom - Zoom value
 * @param {number} min - Minimum zoom (default 0.25)
 * @param {number} max - Maximum zoom (default 4.0)
 * @returns {number} Clamped zoom value
 */
function clampZoom(zoom, min = 0.25, max = 4.0) {
  return Math.max(min, Math.min(max, zoom));
}

/**
 * Clamp slice index to valid range
 * @param {number} index - Slice index
 * @param {number} totalSlices - Total number of slices
 * @returns {number} Clamped slice index
 */
function clampSliceIndex(index, totalSlices) {
  if (totalSlices <= 0) return 0;
  return Math.max(0, Math.min(index, totalSlices - 1));
}

/**
 * Apply window/level transformation to pixel value
 * @param {number} pixelValue - Original pixel value
 * @param {number} windowWidth - Window width
 * @param {number} windowCenter - Window center
 * @returns {number} Transformed value (0-255)
 */
function applyWindowLevel(pixelValue, windowWidth, windowCenter) {
  const minValue = windowCenter - windowWidth / 2;
  const maxValue = windowCenter + windowWidth / 2;
  
  if (pixelValue <= minValue) {
    return 0;
  } else if (pixelValue >= maxValue) {
    return 255;
  } else {
    return Math.round(((pixelValue - minValue) / windowWidth) * 255);
  }
}

/**
 * Convert temperature between Fahrenheit and Celsius
 * (Utility function for consistency with other services)
 */
function convertTemperature(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  
  if (fromUnit === 'F' && toUnit === 'C') {
    return (value - 32) * 5 / 9;
  } else if (fromUnit === 'C' && toUnit === 'F') {
    return value * 9 / 5 + 32;
  }
  
  return value;
}

module.exports = {
  calculateDistance,
  calculateAngle,
  calculateRectangleArea,
  calculateEllipseArea,
  calculatePolygonArea,
  clampZoom,
  clampSliceIndex,
  applyWindowLevel,
  convertTemperature
};
