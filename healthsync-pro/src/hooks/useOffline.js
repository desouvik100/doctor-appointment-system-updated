/**
 * useOffline Hook - React hook for offline status and caching
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineManager } from '../services/offline';

/**
 * Hook to track online/offline status
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(offlineManager.isOnline);

  useEffect(() => {
    const unsubscribe = offlineManager.addListener(setIsOnline);
    return unsubscribe;
  }, []);

  return isOnline;
};

/**
 * Hook for cached data with automatic refresh
 */
export const useCachedData = (key, fetchFn, options = {}) => {
  const { 
    cacheDuration = 60 * 60 * 1000, // 1 hour default
    refreshOnMount = true,
    refreshOnFocus = false,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const isOnline = useOnlineStatus();

  const refresh = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);

    try {
      // Try to get cached data first
      if (!force) {
        const cached = await offlineManager.getCachedData(key);
        if (cached) {
          setData(cached);
          setIsStale(false);
          setLoading(false);
          return cached;
        }
      }

      // If online, fetch fresh data
      if (isOnline) {
        const freshData = await fetchFn();
        await offlineManager.cacheData(key, freshData, cacheDuration);
        setData(freshData);
        setIsStale(false);
        setLoading(false);
        return freshData;
      }

      // If offline, try to get stale cached data
      const staleData = await offlineManager.getCachedDataForce(key);
      if (staleData) {
        setData(staleData);
        setIsStale(true);
        setLoading(false);
        return staleData;
      }

      // No data available
      setLoading(false);
      return null;
    } catch (err) {
      setError(err);
      setLoading(false);
      
      // Try to use stale cache on error
      const staleData = await offlineManager.getCachedDataForce(key);
      if (staleData) {
        setData(staleData);
        setIsStale(true);
      }
      
      throw err;
    }
  }, [key, fetchFn, cacheDuration, isOnline]);

  useEffect(() => {
    if (refreshOnMount) {
      refresh();
    }
  }, []);

  return {
    data,
    loading,
    error,
    isStale,
    isOnline,
    refresh,
  };
};

/**
 * Hook for queuing offline actions
 */
export const useOfflineAction = () => {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(offlineManager.getPendingCount());

  useEffect(() => {
    // Update pending count when online status changes
    setPendingCount(offlineManager.getPendingCount());
  }, [isOnline]);

  const queueAction = useCallback(async (action) => {
    const actionId = await offlineManager.queueAction(action);
    setPendingCount(offlineManager.getPendingCount());
    return actionId;
  }, []);

  const syncNow = useCallback(async () => {
    await offlineManager.syncPendingActions();
    setPendingCount(offlineManager.getPendingCount());
  }, []);

  return {
    isOnline,
    pendingCount,
    queueAction,
    syncNow,
  };
};

export default {
  useOnlineStatus,
  useCachedData,
  useOfflineAction,
};
