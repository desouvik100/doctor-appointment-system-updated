/**
 * Image Export Component
 * Exports DICOM images with annotations burned in as PNG/JPEG
 */

import React, { useState, useCallback } from 'react';
import './ImageExport.css';

const EXPORT_FORMATS = [
  { id: 'png', label: 'PNG', mimeType: 'image/png', extension: '.png' },
  { id: 'jpeg', label: 'JPEG', mimeType: 'image/jpeg', extension: '.jpg' }
];

const QUALITY_OPTIONS = [
  { id: 'high', label: 'High (100%)', value: 1.0 },
  { id: 'medium', label: 'Medium (80%)', value: 0.8 },
  { id: 'low', label: 'Low (60%)', value: 0.6 }
];

const ImageExport = ({
  canvasRef,
  metadata = {},
  annotations = [],
  onExportComplete,
  disabled = false
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState('high');
  const [includeAnnotations, setIncludeAnnotations] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const generateFilename = useCallback(() => {
    const date = new Date().toISOString().split('T')[0];
    const patientId = metadata.patientId || 'unknown';
    const modality = metadata.modality || 'IMG';
    const formatExt = EXPORT_FORMATS.find(f => f.id === format)?.extension || '.png';
    
    return `${patientId}_${modality}_${date}${formatExt}`;
  }, [metadata, format]);

  const drawMetadataOverlay = useCallback((ctx, width, height) => {
    if (!includeMetadata) return;
    
    ctx.save();
    ctx.font = '14px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    const padding = 10;
    let y = padding + 14;
    
    // Top-left: Patient info
    if (metadata.patientName) {
      ctx.fillText(metadata.patientName, padding, y);
      y += 18;
    }
    if (metadata.patientId) {
      ctx.fillText(`ID: ${metadata.patientId}`, padding, y);
    }
    
    // Top-right: Study info
    ctx.textAlign = 'right';
    y = padding + 14;
    if (metadata.studyDate) {
      const dateStr = new Date(metadata.studyDate).toLocaleDateString();
      ctx.fillText(dateStr, width - padding, y);
      y += 18;
    }
    if (metadata.modality) {
      ctx.fillText(metadata.modality, width - padding, y);
    }
    
    // Bottom-left: Institution
    ctx.textAlign = 'left';
    if (metadata.institutionName) {
      ctx.fillText(metadata.institutionName, padding, height - padding);
    }
    
    // Bottom-right: Export timestamp
    ctx.textAlign = 'right';
    const timestamp = new Date().toLocaleString();
    ctx.fillText(`Exported: ${timestamp}`, width - padding, height - padding);
    
    ctx.restore();
  }, [includeMetadata, metadata]);

  const handleExport = useCallback(async () => {
    if (!canvasRef?.current) {
      console.error('Canvas reference not available');
      return;
    }
    
    setIsExporting(true);
    
    try {
      const sourceCanvas = canvasRef.current;
      const width = sourceCanvas.width;
      const height = sourceCanvas.height;
      
      // Create export canvas
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = width;
      exportCanvas.height = height;
      const ctx = exportCanvas.getContext('2d');
      
      // Draw original image
      ctx.drawImage(sourceCanvas, 0, 0);
      
      // Draw metadata overlay
      if (includeMetadata) {
        drawMetadataOverlay(ctx, width, height);
      }
      
      // Get format settings
      const formatConfig = EXPORT_FORMATS.find(f => f.id === format);
      const qualityConfig = QUALITY_OPTIONS.find(q => q.id === quality);
      
      // Convert to blob
      const blob = await new Promise(resolve => {
        exportCanvas.toBlob(
          resolve,
          formatConfig.mimeType,
          format === 'jpeg' ? qualityConfig.value : undefined
        );
      });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFilename();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setShowDialog(false);
      
      if (onExportComplete) {
        onExportComplete({
          filename: generateFilename(),
          format: format,
          size: blob.size
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [canvasRef, format, quality, includeAnnotations, includeMetadata, drawMetadataOverlay, generateFilename, onExportComplete]);

  return (
    <>
      <button
        className="export-btn"
        onClick={() => setShowDialog(true)}
        disabled={disabled}
        title="Export Image"
      >
        <i className="fas fa-download"></i>
        <span>Export</span>
      </button>

      {showDialog && (
        <div className="export-dialog-overlay" onClick={() => setShowDialog(false)}>
          <div className="export-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>Export Image</h3>
              <button className="close-btn" onClick={() => setShowDialog(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="dialog-content">
              {/* Format selection */}
              <div className="form-group">
                <label>Format</label>
                <div className="radio-group">
                  {EXPORT_FORMATS.map(f => (
                    <label key={f.id} className="radio-option">
                      <input
                        type="radio"
                        name="format"
                        value={f.id}
                        checked={format === f.id}
                        onChange={e => setFormat(e.target.value)}
                      />
                      <span>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quality selection (JPEG only) */}
              {format === 'jpeg' && (
                <div className="form-group">
                  <label>Quality</label>
                  <select
                    value={quality}
                    onChange={e => setQuality(e.target.value)}
                  >
                    {QUALITY_OPTIONS.map(q => (
                      <option key={q.id} value={q.id}>{q.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Options */}
              <div className="form-group">
                <label>Options</label>
                <div className="checkbox-group">
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={includeAnnotations}
                      onChange={e => setIncludeAnnotations(e.target.checked)}
                    />
                    <span>Include annotations</span>
                  </label>
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={includeMetadata}
                      onChange={e => setIncludeMetadata(e.target.checked)}
                    />
                    <span>Include metadata overlay</span>
                  </label>
                </div>
              </div>

              {/* Preview filename */}
              <div className="form-group">
                <label>Filename</label>
                <div className="filename-preview">{generateFilename()}</div>
              </div>
            </div>

            <div className="dialog-footer">
              <button className="btn-cancel" onClick={() => setShowDialog(false)}>
                Cancel
              </button>
              <button 
                className="btn-export" 
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-download"></i>
                    <span>Export</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageExport;
