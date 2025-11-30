/**
 * Push Notifications - Firebase Cloud Messaging with Capacitor
 * Handles FCM registration and notification handling for mobile
 */

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import axiosInstance from '../api/config';
import { saveFCMToken, getFCMToken } from './authStorage';

/**
 * Initialize push notifications
 * Call this after user login
 */
export const initPushNotifications = async (userId) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications only available on native platforms');
    return null;
  }

  try {
    // Request permission
    const permStatus = await PushNotifications.requestPermissions();
    
    if (permStatus.receive !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Register with FCM
    await PushNotifications.register();

    // Set up listeners
    setupPushListeners(userId);

    return true;
  } catch (error) {
    console.error('Push notification init error:', error);
    return null;
  }
};

/**
 * Set up push notification listeners
 */
const setupPushListeners = (userId) => {
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
    
    // Remove all listeners
    await PushNotifications.removeAllListeners();
  } catch (error) {
    console.error('Failed to unregister device:', error);
  }
};

export default {
  initPushNotifications,
  unregisterDevice
};
