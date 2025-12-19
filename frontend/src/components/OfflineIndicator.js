/**
 * Offline Indicator Component
 * Shows network status and gracefully handles offline state
 */

import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import '../styles/offline-indicator.css';

const OfflineIndicator = ({ onRetry }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Show "back online" message briefly
        setShowBanner(true);
        setTimeout(() => setShowBanner(false), 3000);
        setWasOffline(false);
        // Trigger data refresh
        if (onRetry) onRetry();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      setShowBanner(true);
      setWasOffline(true);
    }

    // For Capacitor, also listen to network status
    const initNetworkListener = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const { Network } = await import('@capacitor/network');
          Network.addListener('networkStatusChange', (status) => {
            if (status.connected) {
              handleOnline();
            } else {
              handleOffline();
            }
          });
        } catch (e) {
          console.log('Network plugin not available');
        }
      }
    };

    initNetworkListener();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline, onRetry]);

  if (!showBanner) return null;

  return (
    <div className={`offline-banner ${isOnline ? 'online' : 'offline'}`}>
      <div className="offline-content">
        <i className={`fas ${isOnline ? 'fa-wifi' : 'fa-wifi-slash'}`}></i>
        <span>
          {isOnline 
            ? "You're back online!" 
            : "You're offline. Some features may be limited."}
        </span>
      </div>
      {!isOnline && (
        <button 
          className="offline-dismiss"
          onClick={() => setShowBanner(false)}
          aria-label="Dismiss"
        >
          <i className="fas fa-times"></i>
        </button>
      )}
    </div>
  );
};

// Hook for checking online status
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

export default OfflineIndicator;
