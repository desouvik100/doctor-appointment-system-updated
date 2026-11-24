import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// Custom hook for memory-efficient data management
export const useOptimizedData = (fetchFunction, dependencies = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  // Memoized fetch function to prevent unnecessary calls
  const memoizedFetch = useCallback(async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first
      const cacheKey = JSON.stringify(dependencies);
      if (cacheRef.current.has(cacheKey)) {
        const cachedData = cacheRef.current.get(cacheKey);
        // Use cached data if less than 5 minutes old
        if (Date.now() - cachedData.timestamp < 300000) {
          setData(cachedData.data);
          setLoading(false);
          return;
        }
      }

      const result = await fetchFunction(abortControllerRef.current.signal);
      
      // Cache the result
      cacheRef.current.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      // Limit cache size to prevent memory leaks
      if (cacheRef.current.size > 10) {
        const firstKey = cacheRef.current.keys().next().value;
        cacheRef.current.delete(firstKey);
      }
      
      setData(result);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, ...dependencies]);

  useEffect(() => {
    memoizedFetch();
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [memoizedFetch]);

  // Clear cache function
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // Refresh function
  const refresh = useCallback(() => {
    clearCache();
    memoizedFetch();
  }, [clearCache, memoizedFetch]);

  return {
    data,
    loading,
    error,
    refresh,
    clearCache
  };
};

// Hook for paginated data
export const usePaginatedData = (data, pageSize = 50) => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    return Math.ceil(data.length / pageSize);
  }, [data.length, pageSize]);

  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    data: paginatedData,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};

// Hook for debounced search
export const useDebouncedSearch = (initialValue = '', delay = 300) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return [debouncedValue, setValue];
};

// Hook for intersection observer (lazy loading)
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState(null);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, options]);

  return [setElement, isIntersecting];
};

// Hook for performance monitoring
export const usePerformanceMonitor = () => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());

  useEffect(() => {
    renderCountRef.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;
    lastRenderTimeRef.current = now;

    // Log performance warnings in development
    if (process.env.NODE_ENV === 'development') {
      if (timeSinceLastRender > 16) { // More than 16ms = less than 60fps
        console.warn(`Slow render detected: ${timeSinceLastRender}ms`);
      }
      if (renderCountRef.current > 100) {
        console.warn(`High render count: ${renderCountRef.current}`);
      }
    }
  });

  return {
    renderCount: renderCountRef.current,
    lastRenderTime: lastRenderTimeRef.current
  };
};