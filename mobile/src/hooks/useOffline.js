

import { useState, useEffect, useCallback } from 'react';
// import { debounce } from '../utils/helpers';
import { offlineManager } from '../services/offline';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(offlineManager.isOnline);

  useEffect(() => {
    const unsubscribe = offlineManager.addListener(setIsOnline);
    return unsubscribe;
  }, []);

  return isOnline;
};

export const useCachedData = (key, fetchFn, options = {}) => {
  const { 
    cacheDuration = 60 * 60 * 1000, 
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
      if (!force) {
        const cached = await offlineManager.getCachedData(key);
        if (cached) {
          setData(cached);
          setIsStale(false);
          setLoading(false);
          return cached;
        }
      }
      if (isOnline) {
        const freshData = await fetchFn();
        await offlineManager.cacheData(key, freshData, cacheDuration);
        setData(freshData);
        setIsStale(false);
        setLoading(false);
        return freshData;
      }
     const staleData = await offlineManager.getCachedDataForce(key);
      if (staleData) {
        setData(staleData);
        setIsStale(true);
        setLoading(false);
        return staleData;
      }
      setLoading(false);
      return null;
    } catch (err) {
      setError(err);
      setLoading(false);
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

export const useOfflineAction = () => {
  const isOnline = useOnlineStatus(); 
  const [pendingCount, setPendingCount] = useState(offlineManager.getPendingCount());

  useEffect(() => {
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
