/**
 * Pull to Refresh Hook
 * Enables swipe-down refresh on mobile for both frontend and backend data
 * Fixed: Prevents repeated/multiple refreshes
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';

const usePullToRefresh = (onRefresh, options = {}) => {
  const {
    threshold = 80,           // Pull distance to trigger refresh
    maxPull = 120,            // Maximum pull distance
    resistance = 2.5,         // Pull resistance factor
    refreshTimeout = 10000,   // Max refresh time before auto-complete
    showToast = true,         // Show toast on refresh
    enabled = true,           // Enable/disable the hook
    cooldown = 2000           // Cooldown between refreshes (ms)
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef(null);
  const lastRefreshTime = useRef(0);
  const refreshLock = useRef(false);
  const isNative = Capacitor.isNativePlatform();

  const handleRefresh = useCallback(async () => {
    // Prevent multiple simultaneous refreshes
    if (refreshLock.current || isRefreshing || !onRefresh) return;
    
    // Cooldown check - prevent rapid repeated refreshes
    const now = Date.now();
    if (now - lastRefreshTime.current < cooldown) {
      console.log('🔄 Refresh cooldown active, skipping');
      setPullDistance(0);
      return;
    }
    
    refreshLock.current = true;
    lastRefreshTime.current = now;
    setIsRefreshing(true);
    setPullDistance(threshold);

    // Haptic feedback on native
    if (isNative) {
      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch (e) {
        // Haptics not available
      }
    }

    const refreshPromise = Promise.resolve(onRefresh());
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Refresh timeout')), refreshTimeout)
    );

    try {
      await Promise.race([refreshPromise, timeoutPromise]);
      if (showToast) {
        toast.success('Refreshed!', { duration: 1500, icon: '🔄' });
      }
    } catch (error) {
      console.error('Refresh error:', error);
      if (showToast) {
        toast.error('Refresh failed', { duration: 2000 });
      }
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      // Release lock after a short delay
      setTimeout(() => {
        refreshLock.current = false;
      }, 500);
    }
  }, [onRefresh, isRefreshing, threshold, refreshTimeout, showToast, isNative, cooldown]);


  const handleTouchStart = useCallback((e) => {
    if (!enabled || isRefreshing || refreshLock.current) return;
    
    const container = containerRef.current;
    const scrollTop = container?.scrollTop || window.scrollY || document.documentElement.scrollTop;
    
    // Only enable pull-to-refresh when at top of scroll (with small tolerance)
    if (scrollTop <= 5) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [enabled, isRefreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling || !enabled || isRefreshing || refreshLock.current) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0) {
      // Apply resistance to make pull feel natural
      const distance = Math.min(diff / resistance, maxPull);
      setPullDistance(distance);
      
      // Prevent default scroll when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    } else {
      // User is scrolling up, cancel pull
      setIsPulling(false);
      setPullDistance(0);
    }
  }, [isPulling, enabled, isRefreshing, resistance, maxPull]);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold && !isRefreshing && !refreshLock.current) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, handleRefresh]);

  // Attach event listeners
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current || document;
    const options = { passive: false };

    container.addEventListener('touchstart', handleTouchStart, options);
    container.addEventListener('touchmove', handleTouchMove, options);
    container.addEventListener('touchend', handleTouchEnd, options);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Calculate indicator styles
  const indicatorStyle = {
    transform: `translateY(${Math.min(pullDistance, maxPull)}px)`,
    opacity: Math.min(pullDistance / threshold, 1),
    transition: isPulling ? 'none' : 'all 0.3s ease'
  };

  const progress = Math.min((pullDistance / threshold) * 100, 100);

  return {
    containerRef,
    isRefreshing,
    isPulling,
    pullDistance,
    progress,
    indicatorStyle,
    triggerRefresh: handleRefresh
  };
};

export default usePullToRefresh;
