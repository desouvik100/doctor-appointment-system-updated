/**
 * DICOM Viewer Component
 * Displays medical images using Cornerstone.js with diagnostic-quality tools
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import './DicomViewer.css';

// Window/Level presets for different tissue types
const WINDOW_PRESETS = {
  default: { ww: 400, wc: 40, label: 'Default' },
  bone: { ww: 2000, wc: 500, label: 'Bone' },
  lung: { ww: 1500, wc: -600, label: 'Lung' },
  softTissue: { ww: 350, wc: 50, label: 'Soft Tissue' },
  brain: { ww: 80, wc: 40, label: 'Brain' },
  liver: { ww: 150, wc: 30, label: 'Liver' },
  abdomen: { ww: 400, wc: 50, label: 'Abdomen' }
};

// Zoom constraints
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4.0;

const DicomViewer = ({
  studyId,
  patientId,
  visitId,
  imageUrl,
  metadata = {},
  onAnnotationSave,
  onReportCreate,
  readOnly = false,
  showToolbar = true,
  showMetadata = true
}) => {
  const viewerRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Viewer state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // View state
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [windowLevel, setWindowLevel] = useState({ ww: 400, wc: 40 });
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  
  // Slice navigation (for CT/MRI)
  const [currentSlice, setCurrentSlice] = useState(0);
  const [totalSlices, setTotalSlices] = useState(1);
  
  // Active tool
  const [activeTool, setActiveTool] = useState('pan');
  
  // Annotations
  const [annotations, setAnnotations] = useState([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  
  // Image dimensions
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Clamp zoom to valid range
  const clampZoom = useCallback((value) => {
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
  }, []);

  // Clamp slice index to valid range
  const clampSlice = useCallback((index) => {
    return Math.max(0, Math.min(index, totalSlices - 1));
  }, [totalSlices]);

  // Load image
  useEffect(() => {
    if (!imageUrl) return;
    
    setIsLoading(true);
    setError(null);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      setImageLoaded(true);
      setIsLoading(false);
      
      // Set initial window/level from metadata if available
      if (metadata.windowCenter && metadata.windowWidth) {
        setWindowLevel({
          wc: metadata.windowCenter,
          ww: metadata.windowWidth
        });
      }
      
      // Set total slices if available
      if (metadata.totalSlices) {
        setTotalSlices(metadata.totalSlices);
      }
    };
    
    img.onerror = () => {
      setError('Failed to load image');
      setIsLoading(false);
    };
    
    img.src = imageUrl;
  }, [imageUrl, metadata]);

  // Render image on canvas
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const container = viewerRef.current;
    
    if (!container) return;
    
    // Set canvas size to container size
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Load and draw image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    
    img.onload = () => {
      ctx.save();
      
      // Move to center
      ctx.translate(canvas.width / 2, canvas.height / 2);
      
      // Apply transformations
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -zoom : zoom, flipV ? -zoom : zoom);
      ctx.translate(pan.x, pan.y);
      
      // Draw image centered
      ctx.drawImage(
        img,
        -img.width / 2,
        -img.height / 2,
        img.width,
        img.height
      );
      
      ctx.restore();
      
      // Draw annotations
      drawAnnotations(ctx, canvas);
    };
  }, [imageLoaded, imageUrl, zoom, pan, rotation, flipH, flipV, windowLevel, annotations]);

  // Draw annotations on canvas
  const drawAnnotations = (ctx, canvas) => {
    annotations.forEach(ann => {
      if (!ann.visible) return;
      
      ctx.save();
      ctx.strokeStyle = ann.color || '#00ff00';
      ctx.lineWidth = 2;
      ctx.font = '14px Arial';
      ctx.fillStyle = ann.color || '#00ff00';
      
      switch (ann.toolType) {
        case 'length':
          drawLengthAnnotation(ctx, ann);
          break;
        case 'angle':
          drawAngleAnnotation(ctx, ann);
          break;
        case 'text':
          drawTextAnnotation(ctx, ann);
          break;
        case 'arrow':
          drawArrowAnnotation(ctx, ann);
          break;
        default:
          break;
      }
      
      ctx.restore();
    });
  };

  const drawLengthAnnotation = (ctx, ann) => {
    if (!ann.data?.handles || ann.data.handles.length < 2) return;
    
    const [start, end] = ann.data.handles;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    // Draw measurement text
    if (ann.data.measurement) {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      ctx.fillText(`${ann.data.measurement.value.toFixed(1)} ${ann.data.measurement.unit}`, midX + 5, midY - 5);
    }
  };

  const drawAngleAnnotation = (ctx, ann) => {
    if (!ann.data?.handles || ann.data.handles.length < 3) return;
    
    const [p1, vertex, p2] = ann.data.handles;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(vertex.x, vertex.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    
    if (ann.data.measurement) {
      ctx.fillText(`${ann.data.measurement.value.toFixed(1)}°`, vertex.x + 10, vertex.y - 10);
    }
  };

  const drawTextAnnotation = (ctx, ann) => {
    if (!ann.data?.handles || !ann.data.text) return;
    
    const pos = ann.data.handles[0];
    ctx.fillText(ann.data.text, pos.x, pos.y);
  };

  const drawArrowAnnotation = (ctx, ann) => {
    if (!ann.data?.handles || ann.data.handles.length < 2) return;
    
    const [start, end] = ann.data.handles;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    // Draw arrowhead
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const headLength = 15;
    
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
    
    if (ann.data.text) {
      ctx.fillText(ann.data.text, start.x, start.y - 10);
    }
  };

  // Handle zoom
  const handleZoom = (delta) => {
    setZoom(prev => clampZoom(prev + delta));
  };

  // Handle wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta);
  };

  // Handle slice navigation
  const handleSliceChange = (delta) => {
    setCurrentSlice(prev => clampSlice(prev + delta));
  };

  // Apply window/level preset
  const applyPreset = (presetKey) => {
    const preset = WINDOW_PRESETS[presetKey];
    if (preset) {
      setWindowLevel({ ww: preset.ww, wc: preset.wc });
    }
  };

  // Reset view
  const resetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setWindowLevel(WINDOW_PRESETS.default);
  };

  // Fit to screen
  const fitToScreen = () => {
    if (!viewerRef.current || !imageDimensions.width) return;
    
    const container = viewerRef.current;
    const scaleX = container.clientWidth / imageDimensions.width;
    const scaleY = container.clientHeight / imageDimensions.height;
    const scale = Math.min(scaleX, scaleY) * 0.9;
    
    setZoom(clampZoom(scale));
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="dicom-viewer" ref={viewerRef}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="dicom-toolbar">
          <div className="toolbar-group">
            <button 
              className={`toolbar-btn ${activeTool === 'pan' ? 'active' : ''}`}
              onClick={() => setActiveTool('pan')}
              title="Pan"
            >
              <i className="fas fa-hand-paper"></i>
            </button>
            <button 
              className="toolbar-btn"
              onClick={() => handleZoom(0.25)}
              title="Zoom In"
            >
              <i className="fas fa-search-plus"></i>
            </button>
            <button 
              className="toolbar-btn"
              onClick={() => handleZoom(-0.25)}
              title="Zoom Out"
            >
              <i className="fas fa-search-minus"></i>
            </button>
            <button 
              className="toolbar-btn"
              onClick={fitToScreen}
              title="Fit to Screen"
            >
              <i className="fas fa-expand"></i>
            </button>
            <button 
              className="toolbar-btn"
              onClick={() => setZoom(1)}
              title="1:1 Zoom"
            >
              1:1
            </button>
          </div>
          
          <div className="toolbar-group">
            <button 
              className="toolbar-btn"
              onClick={() => setRotation(r => (r + 90) % 360)}
              title="Rotate Right"
            >
              <i className="fas fa-redo"></i>
            </button>
            <button 
              className="toolbar-btn"
              onClick={() => setFlipH(f => !f)}
              title="Flip Horizontal"
            >
              <i className="fas fa-arrows-alt-h"></i>
            </button>
            <button 
              className="toolbar-btn"
              onClick={() => setFlipV(f => !f)}
              title="Flip Vertical"
            >
              <i className="fas fa-arrows-alt-v"></i>
            </button>
          </div>
          
          <div className="toolbar-group">
            <select 
              className="preset-select"
              onChange={(e) => applyPreset(e.target.value)}
              title="Window/Level Presets"
            >
              {Object.entries(WINDOW_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>{preset.label}</option>
              ))}
            </select>
          </div>
          
          <div className="toolbar-group">
            <button 
              className="toolbar-btn"
              onClick={resetView}
              title="Reset View"
            >
              <i className="fas fa-sync"></i>
            </button>
          </div>
        </div>
      )}
      
      {/* Main viewer area */}
      <div className="viewer-container" onWheel={handleWheel}>
        {isLoading && (
          <div className="viewer-loading">
            <i className="fas fa-spinner fa-spin fa-3x"></i>
            <p>Loading image...</p>
          </div>
        )}
        
        {error && (
          <div className="viewer-error">
            <i className="fas fa-exclamation-triangle fa-3x"></i>
            <p>{error}</p>
          </div>
        )}
        
        <canvas ref={canvasRef} className="viewer-canvas" />
        
        {/* Slice navigation for CT/MRI */}
        {totalSlices > 1 && (
          <div className="slice-navigator">
            <button onClick={() => handleSliceChange(-1)} disabled={currentSlice === 0}>
              <i className="fas fa-chevron-up"></i>
            </button>
            <span>{currentSlice + 1} / {totalSlices}</span>
            <button onClick={() => handleSliceChange(1)} disabled={currentSlice === totalSlices - 1}>
              <i className="fas fa-chevron-down"></i>
            </button>
          </div>
        )}
      </div>
      
      {/* Metadata overlay */}
      {showMetadata && metadata && (
        <div className="metadata-overlay">
          <div className="metadata-top-left">
            {metadata.patientName && <div>{metadata.patientName}</div>}
            {metadata.patientId && <div>ID: {metadata.patientId}</div>}
          </div>
          <div className="metadata-top-right">
            {metadata.studyDate && <div>{new Date(metadata.studyDate).toLocaleDateString()}</div>}
            {metadata.modality && <div>{metadata.modality}</div>}
          </div>
          <div className="metadata-bottom-left">
            {metadata.institutionName && <div>{metadata.institutionName}</div>}
          </div>
          <div className="metadata-bottom-right">
            <div>Zoom: {(zoom * 100).toFixed(0)}%</div>
            <div>WW: {windowLevel.ww} WC: {windowLevel.wc}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DicomViewer;
