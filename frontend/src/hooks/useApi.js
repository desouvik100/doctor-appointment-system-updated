/**
 * useApi — Generic hook for API calls with loading/error/data state
 * Usage:
 *   const { data, loading, error, execute } = useApi(appointmentService.getMyAppointments);
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { showError } from '../utils/errorHandling';

/**
 * Core API hook
 */
export const useApi = (apiFunc, { immediate = false, onSuccess = null, onError = null, showToast = true } = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (...args) => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunc(...args);

      if (!mountedRef.current) return;

      if (result?.success === false) {
        const errMsg = result.error || 'Request failed';
        setError(errMsg);
        if (showToast) showError(errMsg);
        onError?.(errMsg);
        return null;
      }

      const responseData = result?.data ?? result;
      setData(responseData);
      onSuccess?.(responseData);
      return responseData;
    } catch (err) {
      if (!mountedRef.current) return;
      const errMsg = err?.response?.data?.message || err?.message || 'Something went wrong';
      setError(errMsg);
      if (showToast) showError(err);
      onError?.(err);
      return null;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [apiFunc, onSuccess, onError, showToast]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (immediate) execute();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset, setData };
};

/**
 * Paginated API hook
 */
export const usePaginatedApi = (apiFunc, { pageSize = 10 } = {}) => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchPage = useCallback(async (pageNum = 1, reset = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunc({ page: pageNum, limit: pageSize });
      const data = result?.data ?? result;
      const newItems = data?.items || data?.data || (Array.isArray(data) ? data : []);
      const totalCount = data?.total || data?.count || newItems.length;

      setTotal(totalCount);
      setItems(prev => reset ? newItems : [...prev, ...newItems]);
      setHasMore(newItems.length === pageSize);
      setPage(pageNum);
    } catch (err) {
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [apiFunc, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (!loading && hasMore) fetchPage(page + 1);
  }, [loading, hasMore, page, fetchPage]);

  const refresh = useCallback(() => fetchPage(1, true), [fetchPage]);

  return { items, loading, error, hasMore, total, page, loadMore, refresh, fetchPage };
};

/**
 * Polling hook — re-fetches data at an interval
 */
export const usePolling = (apiFunc, interval = 30000, { enabled = true } = {}) => {
  const { data, loading, error, execute } = useApi(apiFunc, { immediate: enabled });
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    intervalRef.current = setInterval(execute, interval);
    return () => clearInterval(intervalRef.current);
  }, [enabled, interval, execute]);

  return { data, loading, error, refresh: execute };
};

/**
 * Debounced search hook
 */
export const useSearch = (searchFunc, delay = 400) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await searchFunc(query);
        const data = result?.data ?? result;
        setResults(Array.isArray(data) ? data : data?.items || []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, delay);

    return () => clearTimeout(timerRef.current);
  }, [query, searchFunc, delay]);

  return { query, setQuery, results, loading };
};

export default useApi;
