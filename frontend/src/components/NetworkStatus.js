/**
 * Network Status Indicator
 * Shows offline/online status to users
 */

import { useState, useEffect } from 'react';
import './NetworkStatus.css';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowBanner(true);
        // Hide "back online" banner after 3 seconds
        setTimeout(() => setShowBanner(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (!showBanner) return null;

  return (
    <div className={`network-status-banner ${isOnline ? 'online' : 'offline'}`}>
      <div className="network-status-content">
        {isOnline ? (
          <>
            <i className="fas fa-wifi"></i>
            <span>Back online</span>
          </>
        ) : (
          <>
            <i className="fas fa-wifi-slash"></i>
            <span>No internet connection</span>
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;
