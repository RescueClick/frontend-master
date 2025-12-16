import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';

/**
 * Custom hook for real-time data fetching with polling
 * @param {Function} fetchAction - Redux thunk action to dispatch
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Polling interval in milliseconds (default: 30000 = 30s)
 * @param {boolean} options.enabled - Whether polling is enabled (default: true)
 * @param {Array} options.dependencies - Additional dependencies to trigger refetch
 * @param {Function} options.onSuccess - Callback on successful fetch
 * @param {Function} options.onError - Callback on error
 */
export const useRealtimeData = (
  fetchAction,
  options = {}
) => {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    dependencies = [],
    onSuccess,
    onError,
  } = options;

  const dispatch = useDispatch();
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current || !enabled) return;

    try {
      const result = await dispatch(fetchAction());
      if (result.type?.endsWith('/fulfilled') && onSuccess) {
        onSuccess(result.payload);
      } else if (result.type?.endsWith('/rejected') && onError) {
        onError(result.payload || result.error);
      }
    } catch (error) {
      if (onError) onError(error);
    }
  }, [dispatch, fetchAction, enabled, onSuccess, onError]);

  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch
    fetchData();

    // Set up polling if enabled
    if (enabled && interval > 0) {
      intervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          fetchData();
        }
      }, interval);
    }

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchData, enabled, interval, ...dependencies]);

  // Manual refetch function
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { refetch };
};

/**
 * Hook for manual refetch after mutations
 */
export const useRefetch = (fetchAction) => {
  const dispatch = useDispatch();

  const refetch = useCallback(async () => {
    try {
      await dispatch(fetchAction());
    } catch (error) {
      console.error('Refetch error:', error);
    }
  }, [dispatch, fetchAction]);

  return refetch;
};

