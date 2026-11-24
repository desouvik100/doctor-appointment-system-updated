/**
 * Push Notifications - Firebase Cloud Messaging with Capacitor
 * Handles FCM registration and notification handling for mobile
 * 
 * NOTE: Requires google-services.json in android/app/ folder
 * Get it from Firebase Console: Project Settings > Your Apps > Download google-services.json
 */

import { Capacitor } from '@capacitor/core';
// import { PushNotifications } from '@capacitor/push-notifications';
import axiosInstance from '../api/config';
import { saveFCMToken, getFCMToken } from './authStorage';

// Flag to enable/disable push notifications
// google-services.json is now configured
const PUSH_NOTIFICATIONS_ENABLED = true;

/**
 * Initialize push notifications
 * Call this after user login
 */
export const initPushNotifications = async (userId) => {
  // Push notifications disabled until Firebase is configured
  if (!PUSH_NOTIFICATIONS_ENABLED) {
    console.log('Push notifications disabled - Firebase not configured');
    return null;
  }

  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications only available on native platforms');
    return null;
  }

  try {
    // Dynamically import to avoid crash if not configured
    const { PushNotifications } = await import('@capacitor/push-notifications');
    
    // Check if PushNotifications is available
    if (!PushNotifications || typeof PushNotifications.requestPermissions !== 'function') {
      console.log('Push notifications not available on this device');
      return null;
    }

    // Check current permission status first
    const currentStatus = await PushNotifications.checkPermissions();
    console.log('Current push permission status:', currentStatus);

    // Only request if not already granted or denied permanently
    if (currentStatus.receive === 'prompt' || currentStatus.receive === 'prompt-with-rationale') {
      const permStatus = await PushNotifications.requestPermissions();
      
      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission denied');
        return null;
      }
    } else if (currentStatus.receive === 'denied') {
      console.log('Push notifications previously denied');
      return null;
    }

    // Register with FCM
    await PushNotifications.register();

    // Set up listeners
    setupPushListeners(userId, PushNotifications);

    return true;
  } catch (error) {
    // Don't crash the app if push notifications fail
    console.warn('Push notification init error (non-fatal):', error.message || error);
    return null;
  }
};

/**
 * Set up push notification listeners
 */
const setupPushListeners = (userId, PushNotifications) => {
  // On registration success
  PushNotifications.addListener('registration', async (token) => {
    console.log('FCM Token:', token.value);
    
    // Save token locally
    await saveFCMToken(token.value);
    
    // Register token with backend
    await registerDeviceToken(userId, token.value);
  });

  // On registration error
  PushNotifications.addListener('registrationError', (error) => {
    console.error('Push registration error:', error);
  });

  // On notification received (foreground)
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push notification received:', notification);
    handleForegroundNotification(notification);
  });

  // On notification action (user tapped notification)
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Push notification action:', action);
    handleNotificationAction(action);
  });
};

/**
 * Register device token with backend
 */
const registerDeviceToken = async (userId, fcmToken) => {
  try {
    await axiosInstance.post('/api/notifications/register-device', {
      userId,
      fcmToken,
      platform: Capacitor.getPlatform(),
      deviceId: await getDeviceId()
    });
    console.log('Device token registered with backend');
  } catch (error) {
    console.error('Failed to register device token:', error);
  }
};

/**
 * Get unique device identifier
 */
const getDeviceId = async () => {
  // Use a combination of platform info as device ID
  // In production, consider using @capacitor/device plugin
  const platform = Capacitor.getPlatform();
  const timestamp = Date.now();
  return `${platform}-${timestamp}`;
};

/**
 * Handle foreground notification
 */
const handleForegroundNotification = (notification) => {
  // Show in-app notification or toast
  // You can dispatch to your notification state/context here
  const { title, body, data } = notification;
  
  // Example: Show toast notification
  if (window.showToast) {
    window.showToast({
      title,
      message: body,
      type: data?.type || 'info'
    });
  }
};

/**
 * Handle notification tap action
 */
const handleNotificationAction = (action) => {
  const { notification } = action;
  const data = notification.data;
  
  // Navigate based on notification type
  if (data?.type === 'appointment_reminder') {
    // Navigate to appointment details
    window.location.href = `/appointments/${data.appointmentId}`;
  } else if (data?.type === 'payment_success') {
    // Navigate to appointment history
    window.location.href = '/appointments';
  } else if (data?.type === 'consultation_ready') {
    // Navigate to consultation
    window.location.href = `/consultation/${data.appointmentId}`;
  }
};

/**
 * Unregister device (call on logout)
 */
export const unregisterDevice = async (userId) => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const fcmToken = await getFCMToken();
    if (fcmToken) {
      await axiosInstance.post('/api/notifications/unregister-device', {
        userId,
        fcmToken
      });
    }
    
    // Remove all listeners - dynamically import
    const { PushNotifications } = await import('@capacitor/push-notifications');
    await PushNotifications.removeAllListeners();
  } catch (error) {
    console.error('Failed to unregister device:', error);
  }
};

export default {
  initPushNotifications,
  unregisterDevice
};
