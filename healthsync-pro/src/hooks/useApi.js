
/**
 * useApi — Generic API hook for React Native
 * Handles loading, error, data state with automatic cleanup
 */
import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Core API hook
 * @param {Function} apiFunc - The API function to call
 * @param {Object} options
 * @param {boolean} options.immediate - Call immediately on mount
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onError - Error callback
 */
const useApi = (apiFunc, { immediate = false, onSuccess = null, onError = null } = {}) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (...args) => {
    if (!mountedRef.current) return null;
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunc(...args);
      if (!mountedRef.current) return null;

      // Handle standardized error response
      if (result?.success === false) {
        const errMsg = result.message || 'Request failed';
        setError(errMsg);
        onError?.(errMsg);
        return null;
      }

      const responseData = result?.data ?? result;
      setData(responseData);
      onSuccess?.(responseData);
      return responseData;
    } catch (err) {
      if (!mountedRef.current) return null;
      const errMsg = err?.message || 'Something went wrong';
      setError(errMsg);
      onError?.(err);
      return null;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [apiFunc]); // eslint-disable-line react-hooks/exhaustive-deps

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
export const usePaginatedApi = (apiFunc, { pageSize = 20 } = {}) => {
  const [items, setItems]   = useState([]);
  const [page, setPage]     = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [total, setTotal]   = useState(0);

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

  return { items, loading, error, hasMore, total, page, loadMore, refresh };
};

export default useApi;
