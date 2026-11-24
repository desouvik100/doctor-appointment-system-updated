/**
 * Professional DICOM Viewer Component - Upgraded Version
 * Multi-panel medical imaging viewer with advanced diagnostic tools
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './ProfessionalDicomViewer.css';

// Window/Level presets
const WL_PRESETS = {
  ct_abdomen: { ww: 400, wc: 40, label: 'CT Abdomen' },
  ct_bone: { ww: 2000, wc: 500, label: 'CT Bone' },
  ct_lung: { ww: 1500, wc: -500, label: 'CT Lung' },
  ct_brain: { ww: 80, wc: 40, label: 'CT Brain' },
  ct_soft: { ww: 350, wc: 50, label: 'Soft Tissue' },
  ct_liver: { ww: 150, wc: 30, label: 'CT Liver' },
  mri_t1: { ww: 500, wc: 250, label: 'MRI T1' },
  mri_t2: { ww: 400, wc: 200, label: 'MRI T2' },
};

const TOOLS = [
  { id: 'window', icon: 'fa-adjust', label: 'Window/Level', description: 'Adjust brightness & contrast. Drag horizontally for width, vertically for level.' },
  { id: 'pan', icon: 'fa-hand-paper', label: 'Pan', description: 'Move the image. Click and drag to pan around.' },
  { id: 'zoom', icon: 'fa-search-plus', label: 'Zoom', description: 'Zoom in/out. Drag up to zoom in, down to zoom out.' },
  { id: 'scroll', icon: 'fa-layer-group', label: 'Scroll', description: 'Navigate slices. Drag or use scroll wheel to move through slices.' },
  { id: 'crosshair', icon: 'fa-crosshairs', label: 'Crosshair', description: 'Show crosshair for precise positioning.' },
  { id: 'measure', icon: 'fa-ruler', label: 'Measure', description: 'Measure distance between two points.' },
  { id: 'angle', icon: 'fa-drafting-compass', label: 'Angle', description: 'Measure angle between three points.' },
  { id: 'roi', icon: 'fa-draw-polygon', label: 'ROI', description: 'Draw region of interest for analysis.' },
];

const LAYOUTS = [
  { id: '1x1', rows: 1, cols: 1, label: '1×1' },
  { id: '1x2', rows: 1, cols: 2, label: '1×2' },
  { id: '2x1', rows: 2, cols: 1, label: '2×1' },
  { id: '2x2', rows: 2, cols: 2, label: '2×2' },
];

// Keyboard shortcuts
const SHORTCUTS = [
  { key: 'Space', action: 'Play/Pause Cine' },
  { key: '↑/↓', action: 'Previous/Next Slice' },
  { key: '+/-', action: 'Zoom In/Out' },
  { key: 'R', action: 'Reset View' },
  { key: 'I', action: 'Invert Colors' },
  { key: 'F', action: 'Fullscreen' },
  { key: 'H', action: 'Flip Horizontal' },
  { key: 'V', action: 'Flip Vertical' },
  { key: '1-4', action: 'Select Viewport' },
];


// Single viewport component with advanced features
const Viewport = ({ 
  series, 
  currentSlice, 
  onSliceChange, 
  zoom, 
  onZoomChange,
  pan,
  onPanChange,
  windowLevel,
  onWindowLevelChange,
  rotation,
  onRotationChange,
  flipH,
  flipV,
  invert,
  isActive,
  onActivate,
  studyInfo,
  activeTool,
  showCrosshair
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialValues, setInitialValues] = useState({});
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const currentImage = series?.images?.[currentSlice];
  const imageUrl = currentImage?.imageUrl;
  const totalSlices = series?.images?.length || 1;

  // Render image
  useEffect(() => {
    if (!imageUrl || !canvasRef.current || !containerRef.current) return;

    setIsLoading(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const container = containerRef.current;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -zoom : zoom, flipV ? -zoom : zoom);

      const scale = Math.min(
        (canvas.width * 0.85) / img.width,
        (canvas.height * 0.85) / img.height
      );

      ctx.drawImage(img, (-img.width * scale) / 2, (-img.height * scale) / 2, img.width * scale, img.height * scale);
      ctx.restore();

      // Apply invert filter
      if (invert) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i];
          data[i + 1] = 255 - data[i + 1];
          data[i + 2] = 255 - data[i + 2];
        }
        ctx.putImageData(imageData, 0, 0);
      }

      // Draw crosshair
      if (showCrosshair && activeTool === 'crosshair') {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(mousePos.x, 0);
        ctx.lineTo(mousePos.x, canvas.height);
        ctx.moveTo(0, mousePos.y);
        ctx.lineTo(canvas.width, mousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      setIsLoading(false);
    };

    img.onerror = () => setIsLoading(false);
    img.src = imageUrl;
  }, [imageUrl, zoom, pan, rotation, flipH, flipV, invert, windowLevel, showCrosshair, mousePos, activeTool]);


  // Mouse handlers
  const handleMouseDown = (e) => {
    if (!isActive) { onActivate(); return; }
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialValues({ zoom, pan: { ...pan }, ww: windowLevel.ww, wc: windowLevel.wc, rotation });
  };

  const handleMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    switch (activeTool) {
      case 'pan':
        onPanChange({ x: initialValues.pan.x + deltaX, y: initialValues.pan.y + deltaY });
        break;
      case 'zoom':
        onZoomChange(Math.max(0.1, Math.min(10, initialValues.zoom - deltaY * 0.01)));
        break;
      case 'window':
        onWindowLevelChange({ ww: Math.max(1, initialValues.ww + deltaX * 2), wc: initialValues.wc - deltaY * 2 });
        break;
      case 'scroll':
        if (totalSlices > 1) {
          const sliceDelta = Math.round(deltaY / 15);
          onSliceChange(Math.max(0, Math.min(currentSlice + sliceDelta, totalSlices - 1)));
          if (sliceDelta !== 0) setDragStart({ x: e.clientX, y: e.clientY });
        }
        break;
      default: break;
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e) => {
    e.preventDefault();
    if (activeTool === 'zoom') {
      onZoomChange(Math.max(0.1, Math.min(10, zoom + (e.deltaY > 0 ? -0.1 : 0.1))));
    } else if (totalSlices > 1) {
      onSliceChange(Math.max(0, Math.min(currentSlice + (e.deltaY > 0 ? 1 : -1), totalSlices - 1)));
    }
  };

  const getCursor = () => {
    const cursors = { pan: 'grab', zoom: 'zoom-in', window: 'crosshair', scroll: 'ns-resize', crosshair: 'crosshair', measure: 'crosshair' };
    return isDragging && activeTool === 'pan' ? 'grabbing' : (cursors[activeTool] || 'default');
  };

  if (!series) {
    return (
      <div className={`viewport empty ${isActive ? 'active' : ''}`} onClick={onActivate}>
        <div className="viewport-placeholder">
          <i className="fas fa-plus-circle"></i>
          <span>Select a series</span>
        </div>
      </div>
    );
  }


  return (
    <div 
      ref={containerRef}
      className={`viewport ${isActive ? 'active' : ''}`}
      style={{ cursor: getCursor() }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {isLoading && <div className="viewport-loading"><i className="fas fa-spinner fa-spin"></i></div>}
      <canvas ref={canvasRef} className="viewport-canvas" />
      
      {/* Overlays */}
      <div className="viewport-overlay top-left">
        <span className="patient-name">{studyInfo?.dicomPatientName || 'Anonymous'}</span>
        <span>{studyInfo?.modality}</span>
      </div>
      <div className="viewport-overlay top-right">
        <span>{series.seriesDescription || 'Series'}</span>
        <span className="study-date">{studyInfo?.studyDate ? new Date(studyInfo.studyDate).toLocaleDateString() : ''}</span>
      </div>
      <div className="viewport-overlay bottom-left">
        <span>W: {windowLevel.ww} L: {windowLevel.wc}</span>
        <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
        {rotation !== 0 && <span>Rot: {rotation}°</span>}
      </div>
      <div className="viewport-overlay bottom-right">
        <span className="slice-info">{currentSlice + 1} / {totalSlices}</span>
      </div>

      {/* Orientation markers */}
      <div className="orientation-marker left">R</div>
      <div className="orientation-marker right">L</div>
      <div className="orientation-marker top">A</div>
      <div className="orientation-marker bottom">P</div>

      {/* Slice slider */}
      {totalSlices > 1 && (
        <div className="slice-slider-container">
          <input
            type="range"
            min="0"
            max={totalSlices - 1}
            value={currentSlice}
            onChange={(e) => onSliceChange(parseInt(e.target.value))}
            className="slice-slider"
            orient="vertical"
          />
        </div>
      )}
    </div>
  );
};

// Series thumbnail
const SeriesThumbnail = ({ series, isSelected, onClick, index }) => (
  <div className={`series-thumbnail ${isSelected ? 'selected' : ''}`} onClick={onClick}>
    <div className="thumbnail-header">
      <span className="modality-badge">{series.modality || 'OT'}</span>
      <span className="series-number">#{index + 1}</span>
    </div>
    <div className="thumbnail-image">
      {series.images?.[0]?.imageUrl ? (
        <img src={series.images[0].imageUrl} alt="Series preview" />
      ) : (
        <i className="fas fa-image"></i>
      )}
    </div>
    <div className="thumbnail-info">
      <span className="series-desc">{series.seriesDescription || 'Series'}</span>
      <span className="image-count">{series.images?.length || 0} img</span>
    </div>
  </div>
);


// Main Professional DICOM Viewer
const ProfessionalDicomViewer = ({ study, patientId, onBack }) => {
  const [layout, setLayout] = useState(LAYOUTS[0]);
  const [activeViewport, setActiveViewport] = useState(0);
  const [viewportStates, setViewportStates] = useState(
    Array(4).fill(null).map((_, i) => ({
      seriesIndex: i, slice: 0, zoom: 1, pan: { x: 0, y: 0 }, rotation: 0, flipH: false, flipV: false
    }))
  );
  const [activeTool, setActiveTool] = useState('pan');
  const [windowLevel, setWindowLevel] = useState({ ww: 400, wc: 40 });
  const [invert, setInvert] = useState(false);
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cineSpeed, setCineSpeed] = useState(10);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showToolHelp, setShowToolHelp] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef(null);

  const series = study?.series || [];
  const totalViewports = layout.rows * layout.cols;
  const currentTool = TOOLS.find(t => t.id === activeTool);

  // Viewport state updaters
  const updateViewport = useCallback((idx, updates) => {
    setViewportStates(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], ...updates };
      return updated;
    });
  }, []);

  // Cine mode
  useEffect(() => {
    if (!isPlaying) return;
    const state = viewportStates[activeViewport];
    const seriesData = series[state.seriesIndex];
    if (!seriesData?.images?.length) return;

    const interval = setInterval(() => {
      updateViewport(activeViewport, {
        slice: (state.slice + 1) % seriesData.images.length
      });
    }, 1000 / cineSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, cineSpeed, activeViewport, viewportStates, series, updateViewport]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Reset viewport
  const resetViewport = () => {
    updateViewport(activeViewport, { zoom: 1, pan: { x: 0, y: 0 }, rotation: 0, flipH: false, flipV: false });
    setWindowLevel({ ww: 400, wc: 40 });
    setInvert(false);
  };

  // Tool selection with help
  const handleToolSelect = (tool) => {
    setActiveTool(tool.id);
    setShowCrosshair(tool.id === 'crosshair');
    setShowToolHelp(true);
    setTimeout(() => setShowToolHelp(false), 3000);
  };


  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const state = viewportStates[activeViewport];
      const seriesData = series[state?.seriesIndex];
      
      switch(e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          setIsPlaying(p => !p);
          break;
        case 'arrowup':
          if (seriesData?.images) {
            updateViewport(activeViewport, { slice: Math.max(0, state.slice - 1) });
          }
          e.preventDefault();
          break;
        case 'arrowdown':
          if (seriesData?.images) {
            updateViewport(activeViewport, { slice: Math.min(state.slice + 1, seriesData.images.length - 1) });
          }
          e.preventDefault();
          break;
        case '+':
        case '=':
          updateViewport(activeViewport, { zoom: Math.min(10, state.zoom + 0.1) });
          break;
        case '-':
          updateViewport(activeViewport, { zoom: Math.max(0.1, state.zoom - 0.1) });
          break;
        case 'r':
          updateViewport(activeViewport, { zoom: 1, pan: { x: 0, y: 0 }, rotation: 0, flipH: false, flipV: false });
          setWindowLevel({ ww: 400, wc: 40 });
          setInvert(false);
          break;
        case 'i':
          setInvert(i => !i);
          break;
        case 'f':
          if (!document.fullscreenElement) {
            viewerRef.current?.requestFullscreen();
            setIsFullscreen(true);
          } else {
            document.exitFullscreen();
            setIsFullscreen(false);
          }
          break;
        case 'h':
          updateViewport(activeViewport, { flipH: !state.flipH });
          break;
        case 'v':
          updateViewport(activeViewport, { flipV: !state.flipV });
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          const vpIndex = parseInt(e.key) - 1;
          if (vpIndex < totalViewports) setActiveViewport(vpIndex);
          break;
        case 'escape':
          if (isFullscreen) document.exitFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeViewport, viewportStates, series, totalViewports, isFullscreen, updateViewport]);


  return (
    <div className="professional-dicom-viewer" ref={viewerRef}>
      {/* Toolbar */}
      <header className="viewer-toolbar">
        <div className="toolbar-left">
          <button className="toolbar-btn" onClick={onBack} title="Back"><i className="fas fa-arrow-left"></i></button>
          <div className="study-info">
            <span className="patient-name">{study?.dicomPatientName || 'Anonymous'}</span>
            <span className="study-desc">{study?.studyDescription || study?.modality}</span>
          </div>
        </div>

        <div className="toolbar-center">
          {/* Tools */}
          <div className="tool-group">
            {TOOLS.map(tool => (
              <button
                key={tool.id}
                className={`toolbar-btn ${activeTool === tool.id ? 'active' : ''}`}
                onClick={() => handleToolSelect(tool)}
                title={`${tool.label}: ${tool.description}`}
              >
                <i className={`fas ${tool.icon}`}></i>
              </button>
            ))}
          </div>

          <div className="toolbar-divider" />

          {/* Quick actions */}
          <div className="tool-group">
            <button className="toolbar-btn" onClick={() => updateViewport(activeViewport, { zoom: viewportStates[activeViewport].zoom + 0.25 })} title="Zoom In">
              <i className="fas fa-search-plus"></i>
            </button>
            <button className="toolbar-btn" onClick={() => updateViewport(activeViewport, { zoom: Math.max(0.1, viewportStates[activeViewport].zoom - 0.25) })} title="Zoom Out">
              <i className="fas fa-search-minus"></i>
            </button>
            <button className="toolbar-btn" onClick={() => updateViewport(activeViewport, { rotation: (viewportStates[activeViewport].rotation + 90) % 360 })} title="Rotate 90°">
              <i className="fas fa-redo"></i>
            </button>
            <button className={`toolbar-btn ${viewportStates[activeViewport].flipH ? 'active' : ''}`} onClick={() => updateViewport(activeViewport, { flipH: !viewportStates[activeViewport].flipH })} title="Flip Horizontal">
              <i className="fas fa-arrows-alt-h"></i>
            </button>
            <button className={`toolbar-btn ${viewportStates[activeViewport].flipV ? 'active' : ''}`} onClick={() => updateViewport(activeViewport, { flipV: !viewportStates[activeViewport].flipV })} title="Flip Vertical">
              <i className="fas fa-arrows-alt-v"></i>
            </button>
            <button className={`toolbar-btn ${invert ? 'active' : ''}`} onClick={() => setInvert(!invert)} title="Invert Colors (I)">
              <i className="fas fa-adjust"></i>
            </button>
          </div>

          <div className="toolbar-divider" />

          {/* Layout */}
          <div className="tool-group">
            {LAYOUTS.map(l => (
              <button key={l.id} className={`toolbar-btn ${layout.id === l.id ? 'active' : ''}`} onClick={() => setLayout(l)} title={`${l.label} Layout`}>
                {l.label}
              </button>
            ))}
          </div>

          <div className="toolbar-divider" />

          {/* W/L Presets */}
          <select className="preset-select" onChange={(e) => e.target.value && setWindowLevel(WL_PRESETS[e.target.value])} title="Window/Level Presets">
            <option value="">W/L Presets</option>
            {Object.entries(WL_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>{preset.label}</option>
            ))}
          </select>

          {/* Cine controls */}
          <div className="tool-group cine-controls">
            <button className={`toolbar-btn ${isPlaying ? 'active playing' : ''}`} onClick={() => setIsPlaying(!isPlaying)} title="Play/Pause Cine (Space)">
              <i className={`fas fa-${isPlaying ? 'pause' : 'play'}`}></i>
            </button>
            <input type="range" min="1" max="30" value={cineSpeed} onChange={(e) => setCineSpeed(parseInt(e.target.value))} className="cine-speed" title={`Speed: ${cineSpeed} fps`} />
          </div>
        </div>

        <div className="toolbar-right">
          <button className="toolbar-btn" onClick={resetViewport} title="Reset View (R)"><i className="fas fa-undo"></i></button>
          <button className="toolbar-btn" onClick={() => setShowShortcuts(!showShortcuts)} title="Keyboard Shortcuts"><i className="fas fa-keyboard"></i></button>
          <button className="toolbar-btn" onClick={toggleFullscreen} title="Fullscreen (F)"><i className={`fas fa-${isFullscreen ? 'compress' : 'expand'}`}></i></button>
        </div>
      </header>


      {/* Tool Help Banner */}
      {showToolHelp && currentTool && (
        <div className="tool-help-banner">
          <i className={`fas ${currentTool.icon}`}></i>
          <span className="tool-name">{currentTool.label}</span>
          <span className="tool-desc">{currentTool.description}</span>
          <button className="close-help" onClick={() => setShowToolHelp(false)}><i className="fas fa-times"></i></button>
        </div>
      )}

      {/* Shortcuts Panel */}
      {showShortcuts && (
        <div className="shortcuts-panel">
          <div className="shortcuts-header">
            <h4><i className="fas fa-keyboard"></i> Keyboard Shortcuts</h4>
            <button onClick={() => setShowShortcuts(false)}><i className="fas fa-times"></i></button>
          </div>
          <div className="shortcuts-list">
            {SHORTCUTS.map((s, i) => (
              <div key={i} className="shortcut-item">
                <kbd>{s.key}</kbd>
                <span>{s.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="viewer-main">
        {/* Series Sidebar */}
        <aside className={`series-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              <i className={`fas fa-chevron-${sidebarCollapsed ? 'right' : 'left'}`}></i>
            </button>
            {!sidebarCollapsed && <span>Series ({series.length})</span>}
          </div>
          {!sidebarCollapsed && (
            <div className="series-list">
              {series.map((s, idx) => (
                <SeriesThumbnail
                  key={s.seriesInstanceUID || idx}
                  series={s}
                  index={idx}
                  isSelected={viewportStates[activeViewport]?.seriesIndex === idx}
                  onClick={() => updateViewport(activeViewport, { seriesIndex: idx, slice: 0 })}
                />
              ))}
            </div>
          )}
        </aside>

        {/* Viewport Grid */}
        <div className="viewport-grid" style={{ gridTemplateRows: `repeat(${layout.rows}, 1fr)`, gridTemplateColumns: `repeat(${layout.cols}, 1fr)` }}>
          {Array.from({ length: totalViewports }).map((_, idx) => {
            const state = viewportStates[idx];
            const viewportSeries = series[state.seriesIndex];
            
            return (
              <Viewport
                key={idx}
                series={viewportSeries}
                studyInfo={study}
                currentSlice={state.slice}
                onSliceChange={(slice) => updateViewport(idx, { slice })}
                zoom={state.zoom}
                onZoomChange={(zoom) => updateViewport(idx, { zoom })}
                pan={state.pan}
                onPanChange={(pan) => updateViewport(idx, { pan })}
                rotation={state.rotation}
                onRotationChange={(rotation) => updateViewport(idx, { rotation })}
                flipH={state.flipH}
                flipV={state.flipV}
                invert={invert}
                windowLevel={windowLevel}
                onWindowLevelChange={setWindowLevel}
                isActive={activeViewport === idx}
                onActivate={() => setActiveViewport(idx)}
                activeTool={activeTool}
                showCrosshair={showCrosshair}
              />
            );
          })}
        </div>
      </div>

      {/* Status Bar */}
      <footer className="viewer-statusbar">
        <span><i className="fas fa-mouse-pointer"></i> {currentTool?.label || 'Pan'}</span>
        <span><i className="fas fa-adjust"></i> W:{windowLevel.ww} L:{windowLevel.wc}</span>
        <span><i className="fas fa-search"></i> {(viewportStates[activeViewport]?.zoom * 100).toFixed(0)}%</span>
        <span><i className="fas fa-th-large"></i> {layout.label}</span>
        {isPlaying && <span className="cine-indicator"><i className="fas fa-play"></i> {cineSpeed} fps</span>}
      </footer>
    </div>
  );
};

export default ProfessionalDicomViewer;
