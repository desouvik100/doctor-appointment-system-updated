/**
 * useMobileInit Hook
 * Initialize mobile services when app loads
 * 
 * Usage in App.js:
 * 
 * import { useMobileInit } from './mobile/useMobileInit';
 * 
 * function App() {
 *   const user = JSON.parse(localStorage.getItem('user') || '{}');
 *   useMobileInit(user?.id);
 *   
 *   return <YourApp />;
 * }
 */

import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

export const useMobileInit = (userId) => {
  const initialized = useRef(false);

  useEffect(() => {
    const initMobile = async () => {
      // Only run on native platforms
      if (!Capacitor.isNativePlatform()) {
        return;
      }

      // Prevent double initialization
      if (initialized.current) {
        return;
      }

      console.log('Initializing mobile services...');

      try {
        // Initialize status bar
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#4F46E5' });
      } catch (e) {
        console.log('StatusBar not available:', e.message);
      }

      try {
        // Hide splash screen after app is ready - with delay to prevent flash
        const { SplashScreen } = await import('@capacitor/splash-screen');
        // Wait a bit for the app to render before hiding splash
        setTimeout(async () => {
          try {
            await SplashScreen.hide({ fadeOutDuration: 500 });
          } catch (e) {
            console.log('SplashScreen hide error:', e.message);
          }
        }, 1000);
      } catch (e) {
        console.log('SplashScreen not available:', e.message);
      }

      try {
        // Set up keyboard behavior
        const { Keyboard } = await import('@capacitor/keyboard');
        Keyboard.addListener('keyboardWillShow', () => {
          document.body.classList.add('keyboard-open');
        });
        Keyboard.addListener('keyboardWillHide', () => {
          document.body.classList.remove('keyboard-open');
        });
      } catch (e) {
        console.log('Keyboard plugin not available:', e.message);
      }

      try {
        // Set up app lifecycle listeners
        const { App } = await import('@capacitor/app');
        
        // Handle back button on Android
        App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            // Optionally show exit confirmation
            App.exitApp();
          }
        });

        // Handle deep links
        App.addListener('appUrlOpen', (event) => {
          console.log('Deep link:', event.url);
          handleDeepLink(event.url);
        });

        // Handle app state changes
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            // App came to foreground
            window.dispatchEvent(new CustomEvent('appResumed'));
          }
        });
      } catch (e) {
        console.log('App plugin not available:', e.message);
      }

      initialized.current = true;
      console.log('Mobile services initialized');
    };

    initMobile();

    // Cleanup on unmount
    return () => {
      const cleanup = async () => {
        if (!Capacitor.isNativePlatform()) return;
        
        try {
          const { App } = await import('@capacitor/app');
          await App.removeAllListeners();
        } catch (e) {
          // Ignore
        }
        
        try {
          const { Keyboard } = await import('@capacitor/keyboard');
          await Keyboard.removeAllListeners();
        } catch (e) {
          // Ignore
        }
      };
      cleanup();
    };
  }, []);

  // Initialize push notifications when user is logged in
  useEffect(() => {
    const initPush = async () => {
      if (!Capacitor.isNativePlatform() || !userId) {
        return;
      }

      try {
        const { initPushNotifications } = await import('./pushNotifications');
        await initPushNotifications(userId);
        console.log('Push notifications initialized for user:', userId);
      } catch (e) {
        console.log('Push notifications not available:', e.message);
      }
    };

    initPush();
  }, [userId]);
};

/**
 * Handle deep links
 */
const handleDeepLink = async (url) => {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    // Payment callback
    if (path.includes('/payment/success') || path.includes('/payment/cancel')) {
      const { handlePaymentDeepLink } = await import('./payment');
      const result = await handlePaymentDeepLink(url);
      window.dispatchEvent(new CustomEvent('paymentCallback', { detail: result }));
      return;
    }

    // Appointment deep link
    if (path.includes('/appointments/')) {
      const appointmentId = path.split('/appointments/')[1];
      window.location.href = `/appointments/${appointmentId}`;
      return;
    }

    // Consultation deep link
    if (path.includes('/consultation/')) {
      const appointmentId = path.split('/consultation/')[1];
      window.location.href = `/consultation/${appointmentId}`;
      return;
    }

    // Default: navigate to path
    if (path && path !== '/') {
      window.location.href = path;
    }
  } catch (e) {
    console.error('Deep link handling error:', e);
  }
};

export default useMobileInit;
