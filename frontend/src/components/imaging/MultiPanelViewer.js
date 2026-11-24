/**
 * Multi-Panel Viewer Component
 * Supports 2x1, 1x2, and 2x2 layouts for image comparison
 */

import React, { useState, useCallback, useEffect } from 'react';
import DicomViewer from './DicomViewer';
import './MultiPanelViewer.css';

const LAYOUTS = [
  { id: '1x1', label: '1×1', rows: 1, cols: 1, icon: 'fa-square' },
  { id: '2x1', label: '2×1', rows: 1, cols: 2, icon: 'fa-columns' },
  { id: '1x2', label: '1×2', rows: 2, cols: 1, icon: 'fa-bars' },
  { id: '2x2', label: '2×2', rows: 2, cols: 2, icon: 'fa-th-large' }
];

const MultiPanelViewer = ({
  studies = [],
  patientId,
  onStudySelect,
  initialLayout = '1x1'
}) => {
  const [layout, setLayout] = useState(initialLayout);
  const [panels, setPanels] = useState([{ studyId: null, imageUrl: null, metadata: {} }]);
  const [activePanel, setActivePanel] = useState(0);
  const [syncEnabled, setSyncEnabled] = useState(false);
  
  // Synchronized state across panels
  const [syncedZoom, setSyncedZoom] = useState(1.0);
  const [syncedPan, setSyncedPan] = useState({ x: 0, y: 0 });
  const [syncedWindowLevel, setSyncedWindowLevel] = useState({ ww: 400, wc: 40 });
  const [syncedSlice, setSyncedSlice] = useState(0);

  // Update panels when layout changes
  useEffect(() => {
    const layoutConfig = LAYOUTS.find(l => l.id === layout);
    if (!layoutConfig) return;
    
    const panelCount = layoutConfig.rows * layoutConfig.cols;
    
    setPanels(prev => {
      if (prev.length === panelCount) return prev;
      
      if (prev.length < panelCount) {
        // Add empty panels
        const newPanels = [...prev];
        while (newPanels.length < panelCount) {
          newPanels.push({ studyId: null, imageUrl: null, metadata: {} });
        }
        return newPanels;
      } else {
        // Remove excess panels
        return prev.slice(0, panelCount);
      }
    });
    
    // Reset active panel if out of bounds
    if (activePanel >= panelCount) {
      setActivePanel(0);
    }
  }, [layout, activePanel]);

  // Handle study selection for a panel
  const handleStudySelect = useCallback((panelIndex, study) => {
    setPanels(prev => {
      const newPanels = [...prev];
      newPanels[panelIndex] = {
        studyId: study.studyId,
        imageUrl: study.imageUrl,
        metadata: study.metadata || {}
      };
      return newPanels;
    });
    
    if (onStudySelect) {
      onStudySelect(study, panelIndex);
    }
  }, [onStudySelect]);

  // Handle synchronized zoom change
  const handleZoomChange = useCallback((zoom, panelIndex) => {
    if (syncEnabled) {
      setSyncedZoom(zoom);
    }
  }, [syncEnabled]);

  // Handle synchronized pan change
  const handlePanChange = useCallback((pan, panelIndex) => {
    if (syncEnabled) {
      setSyncedPan(pan);
    }
  }, [syncEnabled]);

  // Handle synchronized window/level change
  const handleWindowLevelChange = useCallback((wl, panelIndex) => {
    if (syncEnabled) {
      setSyncedWindowLevel(wl);
    }
  }, [syncEnabled]);

  // Handle synchronized slice change
  const handleSliceChange = useCallback((slice, panelIndex) => {
    if (syncEnabled) {
      setSyncedSlice(slice);
    }
  }, [syncEnabled]);

  // Get layout configuration
  const layoutConfig = LAYOUTS.find(l => l.id === layout) || LAYOUTS[0];

  return (
    <div className="multi-panel-viewer">
      {/* Toolbar */}
      <div className="mpv-toolbar">
        <div className="toolbar-section">
          <span className="section-label">Layout</span>
          <div className="layout-buttons">
            {LAYOUTS.map(l => (
              <button
                key={l.id}
                className={`layout-btn ${layout === l.id ? 'active' : ''}`}
                onClick={() => setLayout(l.id)}
                title={l.label}
              >
                <i className={`fas ${l.icon}`}></i>
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-section">
          <label className="sync-toggle">
            <input
              type="checkbox"
              checked={syncEnabled}
              onChange={e => setSyncEnabled(e.target.checked)}
            />
            <span>Sync Panels</span>
          </label>
        </div>

        {syncEnabled && (
          <div className="sync-info">
            <i className="fas fa-link"></i>
            <span>Zoom, pan, W/L, and slice navigation synchronized</span>
          </div>
        )}
      </div>

      {/* Panel grid */}
      <div 
        className="panel-grid"
        style={{
          gridTemplateColumns: `repeat(${layoutConfig.cols}, 1fr)`,
          gridTemplateRows: `repeat(${layoutConfig.rows}, 1fr)`
        }}
      >
        {panels.map((panel, index) => (
          <div
            key={index}
            className={`panel-container ${activePanel === index ? 'active' : ''}`}
            onClick={() => setActivePanel(index)}
          >
            <div className="panel-header">
              <span className="panel-label">Panel {index + 1}</span>
              {panel.studyId && (
                <button
                  className="clear-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStudySelect(index, { studyId: null, imageUrl: null, metadata: {} });
                  }}
                  title="Clear panel"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            {panel.imageUrl ? (
              <DicomViewer
                studyId={panel.studyId}
                patientId={patientId}
                imageUrl={panel.imageUrl}
                metadata={panel.metadata}
                showToolbar={activePanel === index}
                showMetadata={true}
              />
            ) : (
              <div className="empty-panel">
                <i className="fas fa-image"></i>
                <p>Select a study to display</p>
                
                {studies.length > 0 && (
                  <div className="study-selector">
                    <select
                      onChange={(e) => {
                        const study = studies.find(s => s.studyId === e.target.value);
                        if (study) handleStudySelect(index, study);
                      }}
                      value=""
                    >
                      <option value="" disabled>Choose study...</option>
                      {studies.map(study => (
                        <option key={study.studyId} value={study.studyId}>
                          {study.metadata?.studyDate 
                            ? new Date(study.metadata.studyDate).toLocaleDateString()
                            : 'Unknown date'
                          } - {study.metadata?.modality || 'Unknown'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Imaging history sidebar */}
      {studies.length > 0 && (
        <div className="imaging-history">
          <h4>Imaging History</h4>
          <div className="history-list">
            {studies.map(study => (
              <div
                key={study.studyId}
                className="history-item"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('study', JSON.stringify(study));
                }}
                onClick={() => handleStudySelect(activePanel, study)}
              >
                <div className="history-thumbnail">
                  {study.thumbnailUrl ? (
                    <img src={study.thumbnailUrl} alt="Study thumbnail" />
                  ) : (
                    <i className="fas fa-x-ray"></i>
                  )}
                </div>
                <div className="history-info">
                  <span className="history-date">
                    {study.metadata?.studyDate 
                      ? new Date(study.metadata.studyDate).toLocaleDateString()
                      : 'Unknown'
                    }
                  </span>
                  <span className="history-modality">{study.metadata?.modality || 'Unknown'}</span>
                  <span className="history-description">
                    {study.metadata?.studyDescription || 'No description'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiPanelViewer;
