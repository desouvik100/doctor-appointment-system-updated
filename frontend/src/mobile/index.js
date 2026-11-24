/**
 * Mobile Utilities Index
 * Central export for all Capacitor mobile utilities
 */

export * from './authStorage';
export * from './payment';
export * from './pushNotifications';
export * from './camera';

// Platform detection utilities
import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();
export const isAndroid = () => Capacitor.getPlatform() === 'android';
export const isIOS = () => Capacitor.getPlatform() === 'ios';
export const isWeb = () => Capacitor.getPlatform() === 'web';
export const getPlatform = () => Capacitor.getPlatform();

/**
 * Initialize all mobile services
 * Call this in App.js after user authentication
 */
export const initMobileServices = async (userId) => {
  if (!isNative()) {
    console.log('Running on web - mobile services not initialized');
    return;
  }

  console.log(`Initializing mobile services for ${getPlatform()}`);

  // Initialize push notifications
  const { initPushNotifications } = await import('./pushNotifications');
  await initPushNotifications(userId);

  // Set up deep link handling
  const { App } = await import('@capacitor/app');
  App.addListener('appUrlOpen', async (event) => {
    console.log('Deep link received:', event.url);
    
    // Handle payment callbacks
    if (event.url.includes('/payment/')) {
      const { handlePaymentDeepLink } = await import('./payment');
      const result = await handlePaymentDeepLink(event.url);
      
      // Dispatch event for UI to handle
      window.dispatchEvent(new CustomEvent('paymentCallback', { detail: result }));
    }
  });

  // Handle app state changes
  App.addListener('appStateChange', ({ isActive }) => {
    console.log('App state changed. Is active:', isActive);
    
    if (isActive) {
      // App came to foreground - refresh data if needed
      window.dispatchEvent(new CustomEvent('appResumed'));
    }
  });

  console.log('Mobile services initialized');
};

/**
 * Cleanup mobile services
 * Call this on logout
 */
export const cleanupMobileServices = async (userId) => {
  if (!isNative()) return;

  const { unregisterDevice } = await import('./pushNotifications');
  await unregisterDevice(userId);

  const { App } = await import('@capacitor/app');
  await App.removeAllListeners();
};
