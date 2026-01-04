/**
 * NotificationService - Firebase Cloud Messaging setup and handlers
 * Supports both real FCM and fallback mock mode
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import apiClient from '../api/apiClient';

// Try to import Firebase messaging - will be null if not configured
let messaging = null;
let PushNotification = null;

try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (e) {
  console.log('Firebase messaging not available, using mock mode');
}

try {
  PushNotification = require('react-native-push-notification').default;
} catch (e) {
  console.log('PushNotification not available');
}

class NotificationService {
  constructor() {
    this.initialized = false;
    this.fcmToken = null;
    this.useMockMode = !messaging;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Configure local notifications channel (Android)
      if (PushNotification) {
        PushNotification.createChannel(
          {
            channelId: 'healthsync-channel',
            channelName: 'HealthSync Notifications',
            channelDescription: 'Notifications for appointments, reminders, and updates',
            playSound: true,
            soundName: 'default',
            importance: 4,
            vibrate: true,
          },
          (created) => console.log(`Notification channel created: ${created}`)
        );
      }

      // Request permission
      const authStatus = await this.requestPermission();
      if (authStatus) {
        // Get FCM token
        const token = await this.getToken();
        if (token) {
          this.fcmToken = token;
          await this.registerTokenWithBackend(token);
        }

        // Set up message handlers
        this.setupMessageHandlers();
      }

      this.initialized = true;
      console.log('NotificationService initialized', { useMockMode: this.useMockMode });
    } catch (error) {
      console.error('Notification initialization error:', error);
      // Still mark as initialized to prevent repeated attempts
      this.initialized = true;
    }
  }

  async requestPermission() {
    try {
      if (messaging) {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        console.log('FCM permission status:', enabled ? 'granted' : 'denied');
        return enabled;
      }
      // Mock mode - assume permission granted
      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  async getToken() {
    try {
      if (messaging) {
        const token = await messaging().getToken();
        console.log('FCM token obtained:', token?.substring(0, 20) + '...');
        return token;
      }
      // Mock mode - generate a mock token
      const mockToken = `mock-fcm-${Platform.OS}-${Date.now()}`;
      console.log('Using mock FCM token:', mockToken);
      return mockToken;
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  async registerTokenWithBackend(token) {
    try {
      // Store token locally
      await AsyncStorage.setItem('fcmToken', token);
      
      // Register with backend
      const userToken = await AsyncStorage.getItem('token');
      if (userToken) {
        await apiClient.post('/notifications/register-device', {
          fcmToken: token,
          platform: Platform.OS,
          deviceInfo: {
            os: Platform.OS,
            version: Platform.Version,
          }
        }).catch(err => {
          // Backend endpoint might not exist yet - that's okay
          console.log('Device registration endpoint not available:', err.message);
        });
      }
      
      console.log('FCM token registered:', token?.substring(0, 20) + '...');
    } catch (error) {
      console.error('Token registration error:', error);
    }
  }

  setupMessageHandlers() {
    if (!messaging) {
      console.log('Skipping message handlers setup - mock mode');
      return;
    }

    // Handle foreground messages
    messaging().onMessage(async remoteMessage => {
      console.log('Foreground message received:', remoteMessage);
      this.handleForegroundMessage(remoteMessage);
    });

    // Handle background messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background message received:', remoteMessage);
      this.handleBackgroundMessage(remoteMessage);
    });

    // Handle notification tap when app is in background/quit state
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app:', remoteMessage);
      this.handleNotificationTap(remoteMessage);
    });

    // Check if app was opened from a notification
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('App opened from notification:', remoteMessage);
        this.handleNotificationTap(remoteMessage);
      }
    });

    // Listen for token refresh
    messaging().onTokenRefresh(async token => {
      console.log('FCM token refreshed');
      this.fcmToken = token;
      await this.registerTokenWithBackend(token);
    });
  }

  handleForegroundMessage(message) {
    const { notification, data } = message;
    
    // Show local notification when app is in foreground
    if (PushNotification && notification) {
      PushNotification.localNotification({
        channelId: 'healthsync-channel',
        title: notification.title || 'HealthSync',
        message: notification.body || '',
        data: data,
        playSound: true,
        soundName: 'default',
        vibrate: true,
        priority: 'high',
        importance: 'high',
      });
    }

    console.log('Foreground message handled:', message);
  }

  handleBackgroundMessage(message) {
    console.log('Background message handled:', message);
    // Process background message (e.g., update badge count, sync data)
    const { data } = message;
    
    if (data?.type === 'appointment_update') {
      // Could trigger a background sync here
      console.log('Appointment update received in background');
    }
  }

  handleNotificationTap(message) {
    const { data } = message;
    
    // Store navigation intent for when app is ready
    if (data) {
      AsyncStorage.setItem('pendingNotificationNavigation', JSON.stringify({
        type: data.type,
        id: data.id || data.appointmentId || data.prescriptionId,
        timestamp: Date.now()
      })).catch(console.error);
    }
    
    // Navigation will be handled by the app when it's ready
    console.log('Notification tap stored for navigation:', data);
  }

  // Get pending navigation from notification tap
  async getPendingNavigation() {
    try {
      const pending = await AsyncStorage.getItem('pendingNotificationNavigation');
      if (pending) {
        await AsyncStorage.removeItem('pendingNotificationNavigation');
        const data = JSON.parse(pending);
        // Only use if less than 5 minutes old
        if (Date.now() - data.timestamp < 5 * 60 * 1000) {
          return data;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async getNotificationSettings() {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      return settings ? JSON.parse(settings) : this.getDefaultSettings();
    } catch (error) {
      return this.getDefaultSettings();
    }
  }

  getDefaultSettings() {
    return {
      appointments: true,
      reminders: true,
      promotions: false,
      healthTips: true,
      labResults: true,
      prescriptions: true,
      sound: true,
      vibration: true,
    };
  }

  async updateNotificationSettings(settings) {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
      
      // Sync with backend
      const userToken = await AsyncStorage.getItem('token');
      if (userToken) {
        await apiClient.put('/notifications/settings', settings).catch(err => {
          console.log('Settings sync endpoint not available:', err.message);
        });
      }
    } catch (error) {
      console.error('Update settings error:', error);
    }
  }

  async scheduleLocalNotification(title, body, date, data = {}) {
    if (!PushNotification) {
      console.log('Scheduled notification (mock):', { title, body, date, data });
      return;
    }

    PushNotification.localNotificationSchedule({
      channelId: 'healthsync-channel',
      title,
      message: body,
      date,
      data,
      playSound: true,
      soundName: 'default',
      vibrate: true,
      allowWhileIdle: true,
    });
    
    console.log('Notification scheduled:', { title, date });
  }

  async cancelAllNotifications() {
    if (PushNotification) {
      PushNotification.cancelAllLocalNotifications();
    }
  }

  async cancelNotification(id) {
    if (PushNotification) {
      PushNotification.cancelLocalNotification(id);
    }
  }

  // Schedule appointment reminder
  async scheduleAppointmentReminder(appointment) {
    const settings = await this.getNotificationSettings();
    if (!settings.appointments || !settings.reminders) return;

    const appointmentDate = new Date(appointment.date);
    const reminderDate = new Date(appointmentDate.getTime() - 60 * 60 * 1000); // 1 hour before

    if (reminderDate > new Date()) {
      await this.scheduleLocalNotification(
        'Appointment Reminder',
        `Your appointment with ${appointment.doctorName} is in 1 hour`,
        reminderDate,
        { type: 'appointment_reminder', appointmentId: appointment._id }
      );
    }
  }

  // Get current FCM token
  getStoredToken() {
    return this.fcmToken;
  }
}

export default new NotificationService();
