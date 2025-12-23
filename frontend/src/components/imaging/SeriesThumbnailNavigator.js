/**
 * Series Thumbnail Navigator Component
 * Displays thumbnails for multi-series DICOM studies
 */

import React, { useState, useEffect } from 'react';
import './SeriesThumbnailNavigator.css';

const SeriesThumbnailNavigator = ({
  series = [],
  selectedSeriesId,
  onSeriesSelect,
  orientation = 'vertical'
}) => {
  const [thumbnails, setThumbnails] = useState({});
  const [loadingStates, setLoadingStates] = useState({});

  // Load thumbnails for each series
  useEffect(() => {
    series.forEach(s => {
      if (s.thumbnailUrl && !thumbnails[s.seriesInstanceUID]) {
        setLoadingStates(prev => ({ ...prev, [s.seriesInstanceUID]: true }));
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setThumbnails(prev => ({ ...prev, [s.seriesInstanceUID]: s.thumbnailUrl }));
          setLoadingStates(prev => ({ ...prev, [s.seriesInstanceUID]: false }));
        };
        img.onerror = () => {
          setLoadingStates(prev => ({ ...prev, [s.seriesInstanceUID]: false }));
        };
        img.src = s.thumbnailUrl;
      }
    });
  }, [series, thumbnails]);

  const handleSeriesClick = (seriesId) => {
    if (onSeriesSelect) {
      onSeriesSelect(seriesId);
    }
  };

  const handleKeyDown = (e, seriesId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSeriesClick(seriesId);
    }
  };

  if (!series || series.length === 0) {
    return null;
  }

  return (
    <div className={`series-navigator ${orientation}`}>
      <div className="series-header">
        <span className="series-count">{series.length} Series</span>
      </div>
      
      <div className="series-list">
        {series.map((s, index) => (
          <div
            key={s.seriesInstanceUID || index}
            className={`series-item ${selectedSeriesId === s.seriesInstanceUID ? 'selected' : ''}`}
            onClick={() => handleSeriesClick(s.seriesInstanceUID)}
            onKeyDown={(e) => handleKeyDown(e, s.seriesInstanceUID)}
            tabIndex={0}
            role="button"
            aria-pressed={selectedSeriesId === s.seriesInstanceUID}
            aria-label={`Series ${index + 1}: ${s.seriesDescription || s.modality || 'Unknown'}`}
          >
            <div className="thumbnail-container">
              {loadingStates[s.seriesInstanceUID] ? (
                <div className="thumbnail-loading">
                  <i className="fas fa-spinner fa-spin"></i>
                </div>
              ) : thumbnails[s.seriesInstanceUID] ? (
                <img 
                  src={thumbnails[s.seriesInstanceUID]} 
                  alt={`Series ${index + 1} thumbnail`}
                  className="series-thumbnail"
                />
              ) : (
                <div className="thumbnail-placeholder">
                  <i className="fas fa-image"></i>
                </div>
              )}
              
              {/* Image count badge */}
              {s.numberOfImages > 0 && (
                <span className="image-count-badge">{s.numberOfImages}</span>
              )}
            </div>
            
            <div className="series-info">
              <div className="series-number">S{index + 1}</div>
              {s.seriesDescription && (
                <div className="series-description" title={s.seriesDescription}>
                  {s.seriesDescription}
                </div>
              )}
              {s.modality && (
                <div className="series-modality">{s.modality}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeriesThumbnailNavigator;
