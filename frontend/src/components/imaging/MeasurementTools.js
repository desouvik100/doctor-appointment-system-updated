/**
 * Measurement Tools Component
 * Provides distance, angle, and area measurement tools for DICOM images
 */

import React, { useState, useCallback } from 'react';
import './MeasurementTools.css';

// Measurement calculation functions (matching backend measurementService)
const calculateDistance = (x1, y1, x2, y2, pixelSpacing = 1) => {
  if (pixelSpacing <= 0) throw new Error('Pixel spacing must be positive');
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy) * pixelSpacing;
};

const calculateAngle = (pointA, pointB, pointC) => {
  const baX = pointA.x - pointB.x;
  const baY = pointA.y - pointB.y;
  const bcX = pointC.x - pointB.x;
  const bcY = pointC.y - pointB.y;
  
  const dotProduct = baX * bcX + baY * bcY;
  const magnitudeBA = Math.sqrt(baX * baX + baY * baY);
  const magnitudeBC = Math.sqrt(bcX * bcX + bcY * bcY);
  
  if (magnitudeBA === 0 || magnitudeBC === 0) return 0;
  
  const cosAngle = Math.max(-1, Math.min(1, dotProduct / (magnitudeBA * magnitudeBC)));
  return Math.acos(cosAngle) * (180 / Math.PI);
};

const calculateRectangleArea = (width, height, pixelSpacing = 1) => {
  if (pixelSpacing <= 0) throw new Error('Pixel spacing must be positive');
  return Math.abs(width) * Math.abs(height) * pixelSpacing * pixelSpacing;
};

const calculateEllipseArea = (radiusX, radiusY, pixelSpacing = 1) => {
  if (pixelSpacing <= 0) throw new Error('Pixel spacing must be positive');
  return Math.PI * Math.abs(radiusX) * Math.abs(radiusY) * pixelSpacing * pixelSpacing;
};

const TOOLS = [
  { id: 'length', icon: 'fa-ruler', label: 'Length', description: 'Measure distance between two points' },
  { id: 'angle', icon: 'fa-drafting-compass', label: 'Angle', description: 'Measure angle between three points' },
  { id: 'rectangle', icon: 'fa-vector-square', label: 'Rectangle ROI', description: 'Measure rectangular area' },
  { id: 'ellipse', icon: 'fa-circle', label: 'Ellipse ROI', description: 'Measure elliptical area' },
  { id: 'text', icon: 'fa-font', label: 'Text', description: 'Add text annotation' },
  { id: 'arrow', icon: 'fa-arrow-right', label: 'Arrow', description: 'Add arrow pointer with label' }
];

const MeasurementTools = ({
  activeTool,
  onToolSelect,
  pixelSpacing = 1,
  measurements = [],
  onMeasurementAdd,
  onMeasurementDelete,
  onMeasurementUpdate,
  readOnly = false
}) => {
  const [showMeasurementList, setShowMeasurementList] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextDialog, setShowTextDialog] = useState(false);

  const handleToolClick = useCallback((toolId) => {
    if (readOnly) return;
    
    if (toolId === 'text' || toolId === 'arrow') {
      setShowTextDialog(true);
    }
    
    onToolSelect(toolId);
  }, [onToolSelect, readOnly]);

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      // Pass text to parent for annotation creation
      if (onMeasurementAdd) {
        onMeasurementAdd({
          toolType: activeTool,
          data: { text: textInput.trim() }
        });
      }
    }
    setTextInput('');
    setShowTextDialog(false);
  }, [textInput, activeTool, onMeasurementAdd]);

  const formatMeasurement = (measurement) => {
    if (!measurement) return '';
    
    switch (measurement.toolType) {
      case 'length':
        return `${measurement.data?.measurement?.value?.toFixed(1) || 0} mm`;
      case 'angle':
        return `${measurement.data?.measurement?.value?.toFixed(1) || 0}°`;
      case 'rectangle':
      case 'ellipse':
        return `${measurement.data?.measurement?.value?.toFixed(1) || 0} mm²`;
      case 'text':
      case 'arrow':
        return measurement.data?.text || '';
      default:
        return '';
    }
  };

  const getToolIcon = (toolType) => {
    const tool = TOOLS.find(t => t.id === toolType);
    return tool?.icon || 'fa-question';
  };

  return (
    <div className="measurement-tools">
      {/* Tool buttons */}
      <div className="tools-toolbar">
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            className={`tool-btn ${activeTool === tool.id ? 'active' : ''} ${readOnly ? 'disabled' : ''}`}
            onClick={() => handleToolClick(tool.id)}
            title={tool.description}
            disabled={readOnly}
            aria-pressed={activeTool === tool.id}
          >
            <i className={`fas ${tool.icon}`}></i>
            <span className="tool-label">{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Measurements list toggle */}
      <div className="measurements-section">
        <button 
          className="measurements-toggle"
          onClick={() => setShowMeasurementList(!showMeasurementList)}
          aria-expanded={showMeasurementList}
        >
          <i className={`fas fa-chevron-${showMeasurementList ? 'up' : 'down'}`}></i>
          <span>Measurements ({measurements.length})</span>
        </button>

        {showMeasurementList && (
          <div className="measurements-list">
            {measurements.length === 0 ? (
              <div className="no-measurements">
                <i className="fas fa-ruler-combined"></i>
                <p>No measurements yet</p>
              </div>
            ) : (
              measurements.map((m, index) => (
                <div key={m.annotationId || index} className="measurement-item">
                  <div className="measurement-icon">
                    <i className={`fas ${getToolIcon(m.toolType)}`}></i>
                  </div>
                  <div className="measurement-info">
                    <span className="measurement-type">{m.toolType}</span>
                    <span className="measurement-value">{formatMeasurement(m)}</span>
                  </div>
                  {!readOnly && (
                    <div className="measurement-actions">
                      <button
                        className="action-btn"
                        onClick={() => onMeasurementUpdate && onMeasurementUpdate(m.annotationId, { visible: !m.visible })}
                        title={m.visible ? 'Hide' : 'Show'}
                      >
                        <i className={`fas fa-eye${m.visible ? '' : '-slash'}`}></i>
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => onMeasurementDelete && onMeasurementDelete(m.annotationId)}
                        title="Delete"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Text input dialog */}
      {showTextDialog && (
        <div className="text-dialog-overlay" onClick={() => setShowTextDialog(false)}>
          <div className="text-dialog" onClick={e => e.stopPropagation()}>
            <h4>{activeTool === 'arrow' ? 'Arrow Label' : 'Text Annotation'}</h4>
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Enter text..."
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
            />
            <div className="dialog-actions">
              <button className="btn-cancel" onClick={() => setShowTextDialog(false)}>
                Cancel
              </button>
              <button className="btn-submit" onClick={handleTextSubmit}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pixel spacing info */}
      <div className="pixel-spacing-info">
        <span>Pixel Spacing: {pixelSpacing.toFixed(3)} mm/px</span>
      </div>
    </div>
  );
};

// Export calculation functions for use elsewhere
export {
  calculateDistance,
  calculateAngle,
  calculateRectangleArea,
  calculateEllipseArea
};

export default MeasurementTools;
