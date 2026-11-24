/**
 * usePWA Hook
 * Handles PWA installation prompt and status
 */

import { useState, useEffect, useCallback } from 'react';

const usePWA = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode (installed PWA)
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone ||
                        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
      setIsInstalled(standalone);
    };
    
    checkStandalone();

    // Listen for beforeinstallprompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log('📱 PWA install prompt ready');
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
      console.log('✅ PWA installed successfully');
    };

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Trigger install prompt
  const promptInstall = useCallback(async () => {
    if (!installPrompt) {
      console.log('❌ Install prompt not available');
      return false;
    }

    try {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted install');
        setInstallPrompt(null);
        return true;
      } else {
        console.log('❌ User dismissed install');
        return false;
      }
    } catch (error) {
      console.error('Install error:', error);
      return false;
    }
  }, [installPrompt]);

  // Check if PWA can be installed
  const canInstall = !isInstalled && !isStandalone && installPrompt !== null;

  // Check if running on iOS (needs manual install instructions)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const needsIOSInstall = isIOS && !isStandalone;

  return {
    canInstall,
    isInstalled,
    isOnline,
    isStandalone,
    isIOS,
    needsIOSInstall,
    promptInstall
  };
};

export default usePWA;
