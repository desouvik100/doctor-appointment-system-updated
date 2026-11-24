/**
 * Pull to Refresh Component
 * Wrap content to enable swipe-down refresh on mobile
 */

import React from 'react';
import usePullToRefresh from '../hooks/usePullToRefresh';
import './PullToRefresh.css';

const PullToRefresh = ({ 
  children, 
  onRefresh, 
  enabled = true,
  threshold = 80,
  className = ''
}) => {
  const {
    containerRef,
    isRefreshing,
    isPulling,
    pullDistance,
    progress,
    indicatorStyle
  } = usePullToRefresh(onRefresh, { enabled, threshold });

  return (
    <div 
      ref={containerRef}
      className={`ptr-container ${className}`}
    >
      {/* Pull Indicator */}
      <div 
        className={`ptr-indicator ${isRefreshing ? 'refreshing' : ''} ${isPulling ? 'pulling' : ''}`}
        style={indicatorStyle}
      >
        <div className="ptr-spinner-container">
          {isRefreshing ? (
            <div className="ptr-spinner">
              <svg viewBox="0 0 24 24" className="ptr-spinner-svg">
                <circle cx="12" cy="12" r="10" fill="none" strokeWidth="3" />
              </svg>
            </div>
          ) : (
            <div className="ptr-arrow" style={{ 
              transform: `rotate(${progress >= 100 ? 180 : 0}deg)`,
              opacity: pullDistance > 10 ? 1 : 0
            }}>
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path 
                  d="M12 4v12m0 0l-4-4m4 4l4-4" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
          )}
        </div>
        <span className="ptr-text">
          {isRefreshing ? 'Refreshing...' : progress >= 100 ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>

      {/* Content */}
      <div 
        className="ptr-content"
        style={{ 
          transform: isPulling || isRefreshing ? `translateY(${Math.min(pullDistance, 60)}px)` : 'none',
          transition: isPulling ? 'none' : 'transform 0.3s ease'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
