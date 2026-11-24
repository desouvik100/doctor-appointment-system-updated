/**
 * usePresenceNotifications Hook
 * Tracks watched staff and triggers notifications on presence changes
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'staffPresenceNotifications';

/**
 * @typedef {Object} NotificationPreferences
 * @property {string[]} watchedStaffIds - IDs of staff being watched
 * @property {boolean} notifyOnCheckIn - Notify when watched staff checks in
 * @property {boolean} notifyOnCheckOut - Notify when watched staff checks out
 * @property {boolean} soundEnabled - Play sound with notifications
 */

const defaultPreferences = {
  watchedStaffIds: [],
  notifyOnCheckIn: true,
  notifyOnCheckOut: true,
  soundEnabled: false
};

/**
 * Hook for managing presence notifications
 * @param {Array} staffPresence - Current staff presence list
 * @returns {Object} Notification management functions and state
 */
const usePresenceNotifications = (staffPresence) => {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const prevPresenceRef = useRef(new Map());
  const isInitializedRef = useRef(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({
          ...defaultPreferences,
          ...parsed,
          watchedStaffIds: Array.isArray(parsed.watchedStaffIds) ? parsed.watchedStaffIds : []
        });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      } catch (error) {
        console.error('Error saving notification preferences:', error);
      }
    }
  }, [preferences, isLoading]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (preferences.soundEnabled) {
      try {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
      } catch (error) {
        console.error('Error playing notification sound:', error);
      }
    }
  }, [preferences.soundEnabled]);

  // Compare presence and trigger notifications (Requirements: 4.1, 4.2, 4.3)
  useEffect(() => {
    if (isLoading || !staffPresence || staffPresence.length === 0) {
      return;
    }

    // Skip first render to avoid notifications on initial load
    if (!isInitializedRef.current) {
      // Build initial presence map
      const initialMap = new Map();
      staffPresence.forEach(staff => {
        initialMap.set(staff._id, {
          isCheckedIn: staff.isCheckedIn,
          name: staff.name
        });
      });
      prevPresenceRef.current = initialMap;
      isInitializedRef.current = true;
      return;
    }

    const prevPresence = prevPresenceRef.current;
    const watchedIds = new Set(preferences.watchedStaffIds);

    // Check for presence changes in watched staff
    staffPresence.forEach(staff => {
      if (!watchedIds.has(staff._id)) {
        return; // Not watching this staff
      }

      const prev = prevPresence.get(staff._id);
      
      if (!prev) {
        // New staff member appeared - could be first time seeing them
        return;
      }

      // Check for check-in (Requirements: 4.2)
      if (!prev.isCheckedIn && staff.isCheckedIn && preferences.notifyOnCheckIn) {
        toast.success(`${staff.name} just checked in`, {
          icon: '🟢',
          duration: 4000
        });
        playNotificationSound();
      }

      // Check for check-out (Requirements: 4.3)
      if (prev.isCheckedIn && !staff.isCheckedIn && preferences.notifyOnCheckOut) {
        toast(`${staff.name} just checked out`, {
          icon: '🔴',
          duration: 4000
        });
        playNotificationSound();
      }
    });

    // Update previous presence map
    const newMap = new Map();
    staffPresence.forEach(staff => {
      newMap.set(staff._id, {
        isCheckedIn: staff.isCheckedIn,
        name: staff.name
      });
    });
    prevPresenceRef.current = newMap;

  }, [staffPresence, preferences, isLoading, playNotificationSound]);

  /**
   * Add a staff member to watch list (Requirements: 4.1)
   * @param {string} staffId - ID of staff to watch
   */
  const watchStaff = useCallback((staffId) => {
    setPreferences(prev => ({
      ...prev,
      watchedStaffIds: prev.watchedStaffIds.includes(staffId) 
        ? prev.watchedStaffIds 
        : [...prev.watchedStaffIds, staffId]
    }));
  }, []);

  /**
   * Remove a staff member from watch list
   * @param {string} staffId - ID of staff to unwatch
   */
  const unwatchStaff = useCallback((staffId) => {
    setPreferences(prev => ({
      ...prev,
      watchedStaffIds: prev.watchedStaffIds.filter(id => id !== staffId)
    }));
  }, []);

  /**
   * Toggle watch status for a staff member
   * @param {string} staffId - ID of staff to toggle
   * @returns {boolean} New watch status
   */
  const toggleWatch = useCallback((staffId) => {
    const isWatched = preferences.watchedStaffIds.includes(staffId);
    if (isWatched) {
      unwatchStaff(staffId);
    } else {
      watchStaff(staffId);
    }
    return !isWatched;
  }, [preferences.watchedStaffIds, watchStaff, unwatchStaff]);

  /**
   * Check if a staff member is being watched
   * @param {string} staffId - ID of staff to check
   * @returns {boolean} Whether staff is watched
   */
  const isWatched = useCallback((staffId) => {
    return preferences.watchedStaffIds.includes(staffId);
  }, [preferences.watchedStaffIds]);

  /**
   * Update notification preferences (Requirements: 4.4, 4.5)
   * @param {Partial<NotificationPreferences>} updates - Preference updates
   */
  const updatePreferences = useCallback((updates) => {
    setPreferences(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  /**
   * Clear all watched staff
   */
  const clearAllWatched = useCallback(() => {
    setPreferences(prev => ({
      ...prev,
      watchedStaffIds: []
    }));
  }, []);

  return {
    preferences,
    isLoading,
    watchStaff,
    unwatchStaff,
    toggleWatch,
    isWatched,
    updatePreferences,
    clearAllWatched,
    watchedCount: preferences.watchedStaffIds.length
  };
};

export default usePresenceNotifications;
