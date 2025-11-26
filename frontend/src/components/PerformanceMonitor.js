import React, { useEffect, useState, useRef } from 'react';

const PerformanceMonitor = ({ enabled = process.env.NODE_ENV === 'development' }) => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    renderTime: 0,
    isLowEnd: false
  });
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const renderStartRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let animationId;
    
    // Detect low-end device
    const detectLowEndDevice = () => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      const isLowEnd = 
        navigator.hardwareConcurrency <= 2 || // 2 or fewer CPU cores
        (performance.memory && performance.memory.jsHeapSizeLimit < 1073741824) || // Less than 1GB heap
        !gl || // No WebGL support
        /Android.*Chrome\/[0-5]/.test(navigator.userAgent); // Old Android Chrome
      
      return isLowEnd;
    };

    const isLowEnd = detectLowEndDevice();
    
    // Apply low-end optimizations
    if (isLowEnd) {
      document.body.classList.add('low-memory-mode');
      
      // Reduce animation frame rate for low-end devices
      const style = document.createElement('style');
      style.textContent = `
        * {
          animation-duration: 0.1s !important;
          transition-duration: 0.1s !important;
        }
      `;
      document.head.appendChild(style);
    }

    const measurePerformance = () => {
      const now = performance.now();
      frameCountRef.current++;
      
      // Calculate FPS every second
      if (now - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
        
        // Get memory usage if available
        const memory = performance.memory 
          ? Math.round(performance.memory.usedJSHeapSize / 1048576) // Convert to MB
          : 0;
        
        const renderTime = now - renderStartRef.current;
        
        setMetrics({
          fps,
          memory,
          renderTime: Math.round(renderTime),
          isLowEnd
        });
        
        // Warn if performance is poor
        if (fps < 30) {
          console.warn(`Low FPS detected: ${fps}fps`);
        }
        
        if (memory > 100) {
          console.warn(`High memory usage: ${memory}MB`);
        }
        
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      renderStartRef.current = performance.now();
      animationId = requestAnimationFrame(measurePerformance);
    };

    measurePerformance();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      document.body.classList.remove('low-memory-mode');
    };
  }, [enabled]);

  // Auto-optimize based on performance
  useEffect(() => {
    if (metrics.fps > 0 && metrics.fps < 30) {
      // Enable performance mode for low FPS
      document.body.classList.add('low-memory-mode');
    } else if (metrics.fps > 50) {
      // Disable performance mode for good FPS
      document.body.classList.remove('low-memory-mode');
    }
  }, [metrics.fps]);

  if (!enabled || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.15)',
      color: 'rgba(255, 255, 255, 0.6)',
      padding: '0.4rem 0.6rem',
      borderRadius: '6px',
      fontSize: '0.7rem',
      fontFamily: 'monospace',
      zIndex: 9999,
      minWidth: '100px',
      backdropFilter: 'blur(4px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'opacity 0.3s ease',
      opacity: 0.4,
      pointerEvents: 'none'
    }}>
      <div style={{ 
        color: metrics.fps >= 60 ? 'rgba(34, 197, 94, 0.8)' : 
               metrics.fps >= 45 ? 'rgba(251, 191, 36, 0.8)' : 
               'rgba(239, 68, 68, 0.8)'
      }}>
        FPS: {metrics.fps}
      </div>
      {metrics.memory > 0 && (
        <div style={{ 
          color: metrics.memory > 100 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255, 255, 255, 0.5)',
          fontSize: '0.65rem'
        }}>
          {metrics.memory}MB
        </div>
      )}
      {metrics.isLowEnd && (
        <div style={{ 
          color: 'rgba(251, 191, 36, 0.7)',
          fontSize: '0.6rem'
        }}>
          Low-End
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;