/**
 * NotificationService - Firebase Cloud Messaging setup and handlers
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
// import messaging from '@react-native-firebase/messaging';
// import PushNotification from 'react-native-push-notification';

class NotificationService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Request permission
      const authStatus = await this.requestPermission();
      if (authStatus) {
        // Get FCM token
        const token = await this.getToken();
        if (token) {
          await this.registerTokenWithBackend(token);
        }

        // Set up message handlers
        this.setupMessageHandlers();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Notification initialization error:', error);
    }
  }

  async requestPermission() {
    try {
      // In real app:
      // const authStatus = await messaging().requestPermission();
      // return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      //        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  async getToken() {
    try {
      // In real app:
      // const token = await messaging().getToken();
      // return token;
      return 'mock-fcm-token-' + Date.now();
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  async registerTokenWithBackend(token) {
    try {
      // In real app, send token to backend
      // await api.post('/notifications/register', { token });
      await AsyncStorage.setItem('fcmToken', token);
      console.log('FCM token registered:', token);
    } catch (error) {
      console.error('Token registration error:', error);
    }
  }

  setupMessageHandlers() {
    // Handle foreground messages
    // messaging().onMessage(async remoteMessage => {
    //   this.handleForegroundMessage(remoteMessage);
    // });

    // Handle background messages
    // messaging().setBackgroundMessageHandler(async remoteMessage => {
    //   this.handleBackgroundMessage(remoteMessage);
    // });

    // Handle notification tap when app is in background/quit state
    // messaging().onNotificationOpenedApp(remoteMessage => {
    //   this.handleNotificationTap(remoteMessage);
    // });

    // Check if app was opened from a notification
    // messaging().getInitialNotification().then(remoteMessage => {
    //   if (remoteMessage) {
    //     this.handleNotificationTap(remoteMessage);
    //   }
    // });
  }

  handleForegroundMessage(message) {
    const { notification, data } = message;
    
    // Show local notification
    // PushNotification.localNotification({
    //   title: notification?.title,
    //   message: notification?.body,
    //   data: data,
    //   channelId: 'healthsync-channel',
    // });

    console.log('Foreground message:', message);
  }

  handleBackgroundMessage(message) {
    console.log('Background message:', message);
    // Process background message (e.g., update badge count)
  }

  handleNotificationTap(message) {
    const { data } = message;
    
    // Navigate based on notification type
    switch (data?.type) {
      case 'appointment_reminder':
        // Navigate to appointment details
        break;
      case 'video_call':
        // Navigate to video consultation
        break;
      case 'prescription_ready':
        // Navigate to prescriptions
        break;
      case 'lab_results':
        // Navigate to lab results
        break;
      default:
        // Navigate to notifications screen
        break;
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
      // In real app, sync with backend
      // await api.put('/notifications/settings', settings);
    } catch (error) {
      console.error('Update settings error:', error);
    }
  }

  async scheduleLocalNotification(title, body, date, data = {}) {
    // In real app:
    // PushNotification.localNotificationSchedule({
    //   title,
    //   message: body,
    //   date,
    //   data,
    //   channelId: 'healthsync-channel',
    // });
    console.log('Scheduled notification:', { title, body, date, data });
  }

  async cancelAllNotifications() {
    // PushNotification.cancelAllLocalNotifications();
  }
}

export default new NotificationService();
