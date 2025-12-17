/**
 * PWA Install Banner Component
 * Shows install prompt for PWA on supported browsers
 */

import { useState, useEffect } from 'react';
import usePWA from '../hooks/usePWA';
import './PWAInstallBanner.css';

const PWAInstallBanner = () => {
  const { canInstall, needsIOSInstall, promptInstall, isOnline } = usePWA();
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner before
    const wasDismissed = localStorage.getItem('pwa-banner-dismissed');
    if (wasDismissed) {
      const dismissedTime = parseInt(wasDismissed);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }

    // Show banner after 3 seconds if can install
    const timer = setTimeout(() => {
      if (canInstall || needsIOSInstall) {
        setShowBanner(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [canInstall, needsIOSInstall]);

  const handleInstall = async () => {
    if (needsIOSInstall) {
      setShowIOSInstructions(true);
      return;
    }

    const installed = await promptInstall();
    if (installed) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  if (dismissed || (!canInstall && !needsIOSInstall) || !showBanner) {
    return null;
  }

  return (
    <>
      <div className="pwa-install-banner">
        <div className="pwa-banner-content">
          <div className="pwa-banner-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C9.243 2 7 4.243 7 7c0 2.757 2.243 5 5 5s5-2.243 5-5c0-2.757-2.243-5-5-5zm0 8c-1.654 0-3-1.346-3-3s1.346-3 3-3 3 1.346 3 3-1.346 3-3 3zm9 11v-1c0-3.859-3.141-7-7-7h-4c-3.86 0-7 3.141-7 7v1h2v-1c0-2.757 2.243-5 5-5h4c2.757 0 5 2.243 5 5v1h2z"/>
              <circle cx="17" cy="4" r="1.5" fill="#10b981"/>
              <path d="M17 6.5v2M15.5 7.5h3" stroke="#10b981" strokeWidth="0.8" fill="none"/>
            </svg>
          </div>
          <div className="pwa-banner-text">
            <strong>Install HealthSync</strong>
            <span>Get quick access & offline support</span>
          </div>
        </div>
        <div className="pwa-banner-actions">
          <button className="pwa-install-btn" onClick={handleInstall}>
            Install
          </button>
          <button className="pwa-dismiss-btn" onClick={handleDismiss}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="pwa-ios-modal-overlay" onClick={() => setShowIOSInstructions(false)}>
          <div className="pwa-ios-modal" onClick={e => e.stopPropagation()}>
            <button className="pwa-ios-close" onClick={() => setShowIOSInstructions(false)}>
              <i className="fas fa-times"></i>
            </button>
            <h3>Install HealthSync on iOS</h3>
            <div className="pwa-ios-steps">
              <div className="pwa-ios-step">
                <span className="step-number">1</span>
                <span>Tap the <strong>Share</strong> button</span>
                <i className="fas fa-share-square"></i>
              </div>
              <div className="pwa-ios-step">
                <span className="step-number">2</span>
                <span>Scroll and tap <strong>"Add to Home Screen"</strong></span>
                <i className="fas fa-plus-square"></i>
              </div>
              <div className="pwa-ios-step">
                <span className="step-number">3</span>
                <span>Tap <strong>"Add"</strong> to install</span>
                <i className="fas fa-check"></i>
              </div>
            </div>
            <button className="pwa-ios-done" onClick={() => setShowIOSInstructions(false)}>
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Offline indicator */}
      {!isOnline && (
        <div className="pwa-offline-banner">
          <i className="fas fa-wifi-slash"></i>
          <span>You're offline. Some features may be limited.</span>
        </div>
      )}
    </>
  );
};

export default PWAInstallBanner;
