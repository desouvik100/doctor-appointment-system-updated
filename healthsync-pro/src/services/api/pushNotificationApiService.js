/**
 * Push Notification API Service - Device Registration and Management
 * 
 * Provides functions for registering device tokens for push notifications
 * and managing notification preferences.
 * 
 * Production-ready with FCM integration, error handling, and persistence.
 * 
 * @module pushNotificationApiService
 */

import apiClient, { isNetworkError, getErrorMessage } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState } from 'react-native';

// Storage keys
const FCM_TOKEN_KEY = 'fcm_device_token';
const NOTIFICATION_PREFS_KEY = 'notification_preferences';
const SUBSCRIBED_TOPICS_KEY = 'subscribed_topics';
const TOKEN_REGISTERED_KEY = 'fcm_token_registered';

/**
 * @typedef {Object} NotificationPreferences
 * @property {boolean} emailReminders - Enable email reminders
 * @property {boolean} smsReminders - Enable SMS reminders
 * @property {boolean} pushNotifications - Enable push notifications
 * @property {number} reminderHoursBefore - Hours before appointment to send reminder
 * @property {boolean} appointmentReminders - Enable appointment reminders
 * @property {boolean} prescriptionAlerts - Enable prescription alerts
 * @property {boolean} labReportAlerts - Enable lab report alerts
 * @property {boolean} promotionalMessages - Enable promotional messages
 * @property {boolean} queueUpdates - Enable queue position updates
 * @property {boolean} chatMessages - Enable chat message notifications
 */

/**
 * Default notification preferences
 */
const DEFAULT_PREFERENCES = {
  emailReminders: true,
  smsReminders: false,
  pushNotifications: true,
  reminderHoursBefore: 24,
  appointmentReminders: true,
  prescriptionAlerts: true,
  labReportAlerts: true,
  promotionalMessages: false,
  queueUpdates: true,
  chatMessages: true,
};

/**
 * Store FCM token locally
 * @private
 */
const storeTokenLocally = async (token) => {
  await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
};

/**
 * Get locally stored FCM token
 * @private
 */
const getStoredToken = async () => {
  return await AsyncStorage.getItem(FCM_TOKEN_KEY);
};

/**
 * Mark token as registered with backend
 * @private
 */
const markTokenRegistered = async (registered = true) => {
  await AsyncStorage.setItem(TOKEN_REGISTERED_KEY, registered ? 'true' : 'false');
};

/**
 * Check if token is registered with backend
 * @private
 */
const isTokenRegistered = async () => {
  const registered = await AsyncStorage.getItem(TOKEN_REGISTERED_KEY);
  return registered === 'true';
};

/**
 * Register device token for push notifications
 * Automatically retries on failure and caches token locally
 * 
 * @param {string} deviceToken - FCM device token
 * @param {string} [platform] - Device platform (auto-detected if not provided)
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.force=false] - Force re-registration even if already registered
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const registerDeviceToken = async (deviceToken, platform, options = {}) => {
  const { force = false } = options;
  
  if (!deviceToken) {
    return { success: false, message: 'No device token provided' };
  }
  
  // Store token locally first
  await storeTokenLocally(deviceToken);
  
  // Check if already registered (unless forced)
  const storedToken = await getStoredToken();
  const alreadyRegistered = await isTokenRegistered();
  
  if (!force && alreadyRegistered && storedToken === deviceToken) {
    return { success: true, message: 'Token already registered' };
  }
  
  try {
    const response = await apiClient.post('/auth/device-token', {
      deviceToken,
      platform: platform || Platform.OS,
      deviceInfo: {
        os: Platform.OS,
        version: Platform.Version,
        model: Platform.constants?.Model || 'Unknown',
      },
    });
    
    await markTokenRegistered(true);
    
    return {
      success: true,
      message: response.data?.message || 'Device registered successfully',
    };
    
  } catch (error) {
    // Don't throw - token is stored locally and will be retried
    console.error('Failed to register device token:', getErrorMessage(error));
    await markTokenRegistered(false);
    
    return {
      success: false,
      message: isNetworkError(error) 
        ? 'Offline - will register when online' 
        : getErrorMessage(error),
      willRetry: true,
    };
  }
};

/**
 * Retry registering device token (call when app comes online)
 * 
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const retryTokenRegistration = async () => {
  const token = await getStoredToken();
  const registered = await isTokenRegistered();
  
  if (!token || registered) {
    return { success: true, message: 'No retry needed' };
  }
  
  return registerDeviceToken(token, undefined, { force: true });
};

/**
 * Unregister device token (on logout or app uninstall)
 * 
 * @param {string} [deviceToken] - FCM device token (uses stored token if not provided)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const unregisterDeviceToken = async (deviceToken) => {
  const token = deviceToken || await getStoredToken();
  
  if (!token) {
    return { success: true, message: 'No token to unregister' };
  }
  
  try {
    await apiClient.delete('/auth/device-token', {
      data: { deviceToken: token },
    });
    
    // Clear local storage
    await AsyncStorage.multiRemove([FCM_TOKEN_KEY, TOKEN_REGISTERED_KEY]);
    
    return { success: true, message: 'Device unregistered successfully' };
    
  } catch (error) {
    // Clear local storage anyway on logout
    await AsyncStorage.multiRemove([FCM_TOKEN_KEY, TOKEN_REGISTERED_KEY]);
    
    return {
      success: false,
      message: getErrorMessage(error),
    };
  }
};

/**
 * Get notification preferences for a user
 * Returns cached preferences if offline
 * 
 * @param {string} userId - The user ID
 * @returns {Promise<NotificationPreferences>}
 */
export const getNotificationPreferences = async (userId) => {
  try {
    const response = await apiClient.get(`/health/notifications/${userId}`);
    const prefs = { ...DEFAULT_PREFERENCES, ...response.data };
    
    // Cache preferences locally
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
    
    return prefs;
    
  } catch (error) {
    // Return cached preferences if offline
    if (isNetworkError(error)) {
      const cached = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    }
    
    // Return defaults if no cache
    return DEFAULT_PREFERENCES;
  }
};

/**
 * Update notification preferences for a user
 * 
 * @param {string} userId - The user ID
 * @param {Partial<NotificationPreferences>} preferences - Preferences to update
 * @returns {Promise<{success: boolean, message: string, preferences: NotificationPreferences}>}
 */
export const updateNotificationPreferences = async (userId, preferences) => {
  try {
    const response = await apiClient.put(`/health/notifications/${userId}`, preferences);
    
    // Update local cache
    const currentPrefs = await getNotificationPreferences(userId);
    const updatedPrefs = { ...currentPrefs, ...preferences };
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updatedPrefs));
    
    return {
      success: true,
      message: response.data?.message || 'Preferences updated',
      preferences: updatedPrefs,
    };
    
  } catch (error) {
    // Cache update locally for later sync
    if (isNetworkError(error)) {
      const currentPrefs = JSON.parse(await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY) || '{}');
      const updatedPrefs = { ...DEFAULT_PREFERENCES, ...currentPrefs, ...preferences };
      await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updatedPrefs));
      await AsyncStorage.setItem('notification_prefs_pending_sync', 'true');
      
      return {
        success: true,
        message: 'Preferences saved locally - will sync when online',
        preferences: updatedPrefs,
        pendingSync: true,
      };
    }
    
    throw error;
  }
};

/**
 * Sync pending preference changes (call when app comes online)
 * 
 * @param {string} userId - The user ID
 * @returns {Promise<{success: boolean}>}
 */
export const syncPendingPreferences = async (userId) => {
  const pendingSync = await AsyncStorage.getItem('notification_prefs_pending_sync');
  
  if (pendingSync !== 'true') {
    return { success: true, message: 'No pending sync' };
  }
  
  try {
    const prefs = JSON.parse(await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY) || '{}');
    await apiClient.put(`/health/notifications/${userId}`, prefs);
    await AsyncStorage.removeItem('notification_prefs_pending_sync');
    
    return { success: true, message: 'Preferences synced' };
    
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
};

/**
 * Subscribe to a notification topic (for broadcast notifications)
 * 
 * @param {string} topic - Topic name to subscribe to
 * @returns {Promise<{success: boolean}>}
 */
export const subscribeToTopic = async (topic) => {
  try {
    const response = await apiClient.post('/notifications/subscribe-topic', { topic });
    
    // Track subscribed topics locally
    const topics = JSON.parse(await AsyncStorage.getItem(SUBSCRIBED_TOPICS_KEY) || '[]');
    if (!topics.includes(topic)) {
      topics.push(topic);
      await AsyncStorage.setItem(SUBSCRIBED_TOPICS_KEY, JSON.stringify(topics));
    }
    
    return { success: true, ...response.data };
    
  } catch (error) {
    // Track locally even if API fails
    const topics = JSON.parse(await AsyncStorage.getItem(SUBSCRIBED_TOPICS_KEY) || '[]');
    if (!topics.includes(topic)) {
      topics.push(topic);
      await AsyncStorage.setItem(SUBSCRIBED_TOPICS_KEY, JSON.stringify(topics));
    }
    
    return { success: false, message: getErrorMessage(error) };
  }
};

/**
 * Unsubscribe from a notification topic
 * 
 * @param {string} topic - Topic name to unsubscribe from
 * @returns {Promise<{success: boolean}>}
 */
export const unsubscribeFromTopic = async (topic) => {
  try {
    const response = await apiClient.post('/notifications/unsubscribe-topic', { topic });
    
    // Update local tracking
    const topics = JSON.parse(await AsyncStorage.getItem(SUBSCRIBED_TOPICS_KEY) || '[]');
    const filtered = topics.filter(t => t !== topic);
    await AsyncStorage.setItem(SUBSCRIBED_TOPICS_KEY, JSON.stringify(filtered));
    
    return { success: true, ...response.data };
    
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
};

/**
 * Get list of subscribed topics
 * 
 * @returns {Promise<string[]>}
 */
export const getSubscribedTopics = async () => {
  try {
    const topics = await AsyncStorage.getItem(SUBSCRIBED_TOPICS_KEY);
    return topics ? JSON.parse(topics) : [];
  } catch {
    return [];
  }
};

/**
 * Test push notification (for debugging)
 * 
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const testPushNotification = async (title, body) => {
  const response = await apiClient.post('/notifications/test-push', { title, body });
  return response.data;
};

/**
 * Check if push notifications are enabled
 * 
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>}
 */
export const arePushNotificationsEnabled = async (userId) => {
  const prefs = await getNotificationPreferences(userId);
  return prefs.pushNotifications === true;
};

/**
 * Quick toggle for push notifications
 * 
 * @param {string} userId - The user ID
 * @param {boolean} enabled - Enable or disable
 * @returns {Promise<{success: boolean}>}
 */
export const togglePushNotifications = async (userId, enabled) => {
  return updateNotificationPreferences(userId, { pushNotifications: enabled });
};

/**
 * Initialize push notification service
 * Call this on app startup
 * 
 * @param {string} [fcmToken] - FCM token if already available
 * @returns {Promise<void>}
 */
export const initializePushNotifications = async (fcmToken) => {
  // Register token if provided
  if (fcmToken) {
    await registerDeviceToken(fcmToken);
  } else {
    // Retry any pending registration
    await retryTokenRegistration();
  }
  
  // Listen for app state changes to retry registration
  AppState.addEventListener('change', async (state) => {
    if (state === 'active') {
      await retryTokenRegistration();
    }
  });
};

/**
 * Clean up push notification service
 * Call this on logout
 * 
 * @returns {Promise<void>}
 */
export const cleanupPushNotifications = async () => {
  await unregisterDeviceToken();
  await AsyncStorage.multiRemove([
    NOTIFICATION_PREFS_KEY,
    SUBSCRIBED_TOPICS_KEY,
    'notification_prefs_pending_sync',
  ]);
};

/**
 * Get current FCM token
 * 
 * @returns {Promise<string|null>}
 */
export const getCurrentToken = async () => {
  return getStoredToken();
};

/**
 * Check if device is registered for push notifications
 * 
 * @returns {Promise<boolean>}
 */
export const isDeviceRegistered = async () => {
  const token = await getStoredToken();
  const registered = await isTokenRegistered();
  return !!token && registered;
};

export default {
  // Token management
  registerDeviceToken,
  unregisterDeviceToken,
  retryTokenRegistration,
  getCurrentToken,
  isDeviceRegistered,
  
  // Preferences
  getNotificationPreferences,
  updateNotificationPreferences,
  syncPendingPreferences,
  arePushNotificationsEnabled,
  togglePushNotifications,
  
  // Topics
  subscribeToTopic,
  unsubscribeFromTopic,
  getSubscribedTopics,
  
  // Lifecycle
  initializePushNotifications,
  cleanupPushNotifications,
  
  // Testing
  testPushNotification,
};
