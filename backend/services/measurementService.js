

function calculateDistance(x1, y1, x2, y2, pixelSpacing) {
  if (pixelSpacing <= 0) {
    throw new Error('Pixel spacing must be positive');
  }
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  const pixelDistance = Math.sqrt(dx * dx + dy * dy);
  
  return pixelDistance * pixelSpacing;
}

function calculateAngle(pointA, pointB, pointC) {
  const baX = pointA.x - pointB.x;
  const baY = pointA.y - pointB.y;
  const bcX = pointC.x - pointB.x;
  const bcY = pointC.y - pointB.y;
  const dotProduct = baX * bcX + baY * bcY;
  const magnitudeBA = Math.sqrt(baX * baX + baY * baY);
  const magnitudeBC = Math.sqrt(bcX * bcX + bcY * bcY);
  
  if (magnitudeBA === 0 || magnitudeBC === 0) {
    return 0;
  }
  const cosAngle = dotProduct / (magnitudeBA * magnitudeBC);
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));
  const angleRadians = Math.acos(clampedCos);
  const angleDegrees = angleRadians * (180 / Math.PI);
  
  return angleDegrees;
}

function calculateRectangleArea(width, height, pixelSpacing) {
  if (pixelSpacing <= 0) {
    throw new Error('Pixel spacing must be positive');
  }
  
  const widthMm = Math.abs(width) * pixelSpacing;
  const heightMm = Math.abs(height) * pixelSpacing;
  
  return widthMm * heightMm;
}

function calculateEllipseArea(radiusX, radiusY, pixelSpacing) {
  if (pixelSpacing <= 0) {
    throw new Error('Pixel spacing must be positive');
  }
  
  const radiusXMm = Math.abs(radiusX) * pixelSpacing;
  const radiusYMm = Math.abs(radiusY) * pixelSpacing;
  
  return Math.PI * radiusXMm * radiusYMm;
}

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
  return area * pixelSpacing * pixelSpacing;
}

function clampZoom(zoom, min = 0.25, max = 4.0) {
  return Math.max(min, Math.min(max, zoom));
}

function clampSliceIndex(index, totalSlices) {
  if (totalSlices <= 0) return 0;
  return Math.max(0, Math.min(index, totalSlices - 1));
}

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
