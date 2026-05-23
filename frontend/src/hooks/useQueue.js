/**
 * useQueue — Real-time queue tracking hook
 * Polls for queue position and estimated wait time
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../api/config';

const POLL_INTERVAL = 15000; // 15 seconds

export const useQueue = (appointmentId, options = {}) => {
  const { autoStart = true, pollInterval = POLL_INTERVAL } = options;

  const [queueInfo, setQueueInfo]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const intervalRef = useRef(null);
  const mountedRef  = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchQueueInfo = useCallback(async () => {
    if (!appointmentId) return;
    try {
      const res = await axios.get(`/api/appointments/${appointmentId}/queue-position`);
      if (mountedRef.current) {
        setQueueInfo(res.data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err?.response?.data?.message || 'Failed to get queue info');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [appointmentId]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    fetchQueueInfo();
    intervalRef.current = setInterval(fetchQueueInfo, pollInterval);
  }, [fetchQueueInfo, pollInterval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (autoStart && appointmentId) {
      setLoading(true);
      startPolling();
    }
    return () => stopPolling();
  }, [appointmentId, autoStart, startPolling, stopPolling]);

  return {
    queueInfo,
    loading,
    error,
    position:      queueInfo?.position || queueInfo?.queueNumber || null,
    estimatedWait: queueInfo?.estimatedWait || queueInfo?.estimatedTime || null,
    totalInQueue:  queueInfo?.totalInQueue || queueInfo?.currentQueueCount || null,
    refresh:       fetchQueueInfo,
    startPolling,
    stopPolling,
  };
};

/**
 * useQueueInfo — Get queue info for a doctor on a specific date (for booking)
 */
export const useQueueInfo = (doctorId, date, consultationType) => {
  const [queueInfo, setQueueInfo] = useState(null);
  const [loading, setLoading]     = useState(false);

  const fetch = useCallback(async () => {
    if (!doctorId || !date) return;
    setLoading(true);
    try {
      const params = consultationType ? `?consultationType=${consultationType}` : '';
      const res = await axios.get(`/api/appointments/queue-info/${doctorId}/${date}${params}`);
      setQueueInfo(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [doctorId, date, consultationType]);

  useEffect(() => { fetch(); }, [fetch]);

  return { queueInfo, loading, refresh: fetch };
};

export default useQueue;
