// frontend/src/hooks/useQueuePolling.js
// Custom hook for real-time queue position updates

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../api/config';

/**
 * Hook for polling queue position updates
 * @param {string} appointmentId - The appointment ID to track
 * @param {object} options - Configuration options
 * @returns {object} Queue status and controls
 */
export function useQueuePolling(appointmentId, options = {}) {
  const {
    enabled = true,
    interval = 30000, // 30 seconds default
    onPositionChange = null,
    onAlmostTurn = null, // Called when position <= 2
  } = options;

  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const previousPosition = useRef(null);
  const intervalRef = useRef(null);

  const fetchQueueStatus = useCallback(async () => {
    if (!appointmentId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/appointments/my-queue/${appointmentId}`);
      
      if (response.data.success) {
        const data = response.data;
        setQueueData(data);
        setLastUpdated(new Date());
        
        // Check for position change
        if (previousPosition.current !== null && 
            previousPosition.current !== data.position) {
          onPositionChange?.(data.position, previousPosition.current);
        }
        
        // Check if almost turn (position <= 2)
        if (data.position <= 2 && previousPosition.current > 2) {
          onAlmostTurn?.(data.position);
        }
        
        previousPosition.current = data.position;
      }
    } catch (err) {
      console.error('Error fetching queue status:', err);
      setError(err.response?.data?.message || 'Failed to fetch queue status');
    } finally {
      setLoading(false);
    }
  }, [appointmentId, onPositionChange, onAlmostTurn]);

  // Start/stop polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    
    fetchQueueStatus(); // Fetch immediately
    intervalRef.current = setInterval(fetchQueueStatus, interval);
  }, [fetchQueueStatus, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchQueueStatus();
  }, [fetchQueueStatus]);

  // Setup polling on mount
  useEffect(() => {
    if (enabled && appointmentId) {
      startPolling();
    }
    
    return () => stopPolling();
  }, [enabled, appointmentId, startPolling, stopPolling]);

  // Pause polling when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (enabled && appointmentId) {
        startPolling();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, appointmentId, startPolling, stopPolling]);

  return {
    queueData,
    loading,
    error,
    lastUpdated,
    refresh,
    startPolling,
    stopPolling,
    isPolling: !!intervalRef.current
  };
}

/**
 * Hook for doctor's queue management
 * @param {string} doctorId - The doctor's ID
 * @param {object} options - Configuration options
 */
export function useDoctorQueue(doctorId, options = {}) {
  const {
    enabled = true,
    interval = 15000, // 15 seconds for doctors
    date = new Date().toISOString().split('T')[0]
  } = options;

  const [queue, setQueue] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const intervalRef = useRef(null);

  const fetchQueue = useCallback(async () => {
    if (!doctorId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/appointments/doctor/${doctorId}/queue?date=${date}`);
      
      const queueData = response.data || [];
      
      // Separate current patient from waiting queue
      const inProgress = queueData.find(a => a.status === 'in_progress');
      const waiting = queueData.filter(a => 
        a.status === 'confirmed' || a.status === 'pending'
      ).sort((a, b) => {
        if (a.tokenNumber && b.tokenNumber) return a.tokenNumber - b.tokenNumber;
        return a.time.localeCompare(b.time);
      });
      
      setCurrentPatient(inProgress || null);
      setQueue(waiting);
    } catch (err) {
      console.error('Error fetching doctor queue:', err);
      setError(err.response?.data?.message || 'Failed to fetch queue');
    } finally {
      setLoading(false);
    }
  }, [doctorId, date]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    
    fetchQueue();
    intervalRef.current = setInterval(fetchQueue, interval);
  }, [fetchQueue, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled && doctorId) {
      startPolling();
    }
    
    return () => stopPolling();
  }, [enabled, doctorId, startPolling, stopPolling]);

  return {
    queue,
    currentPatient,
    loading,
    error,
    refresh: fetchQueue,
    totalWaiting: queue.length,
    startPolling,
    stopPolling
  };
}

export default { useQueuePolling, useDoctorQueue };
