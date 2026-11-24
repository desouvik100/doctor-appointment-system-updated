

import apiClient, { isNetworkError, getErrorMessage } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState } from 'react-native';
const FCM_TOKEN_KEY = 'fcm_device_token';
const NOTIFICATION_PREFS_KEY = 'notification_preferences';
const SUBSCRIBED_TOPICS_KEY = 'subscribed_topics';
const TOKEN_REGISTERED_KEY = 'fcm_token_registered';

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

const storeTokenLocally = async (token) => {
  await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
};

const getStoredToken = async () => {
  return await AsyncStorage.getItem(FCM_TOKEN_KEY);
};

const markTokenRegistered = async (registered = true) => {
  await AsyncStorage.setItem(TOKEN_REGISTERED_KEY, registered ? 'true' : 'false');
};

const isTokenRegistered = async () => {
  const registered = await AsyncStorage.getItem(TOKEN_REGISTERED_KEY);
  return registered === 'true';
};

export const registerDeviceToken = async (deviceToken, platform, options = {}) => {
  const { force = false } = options;
  
  if (!deviceToken) {
    return {  success: false, message: 'No device token provided' };
  }
  await storeTokenLocally(deviceToken);
  const storedToken = await getStoredToken();
  const alreadyRegistered = await isTokenRegistered();
  
  if (!force && alreadyRegistered && storedToken === deviceToken) {
  // TODO: refactor this
    return {  success: true, message: 'Token already registered' };
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
    // Temporary workaround until backend is fixed
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

export const retryTokenRegistration = async () => {
  const token = await getStoredToken();
  const registered = await isTokenRegistered();
  
  if (!token || registered) {
   return {  success: true, message: 'No retry needed' };
  }
  
  return registerDeviceToken(token, undefined, {  force: true });
};

export const unregisterDeviceToken = async (deviceToken) => {
  const token = deviceToken || await getStoredToken();
  
  if (!token) {
    return {  success: true, message: 'No token to unregister' };
  }
  
  try {
    await apiClient.delete('/auth/device-token', { 
      data: {  deviceToken: token },
    });
    await AsyncStorage.multiRemove([FCM_TOKEN_KEY, TOKEN_REGISTERED_KEY]);
    
    return {  success: true, message: 'Device unregistered successfully' };
    
  } catch (error) {
    await AsyncStorage.multiRemove([FCM_TOKEN_KEY, TOKEN_REGISTERED_KEY]);
    
    return { 
      success: false,
      message: getErrorMessage(error),
    };
  }
};

export const getNotificationPreferences = async (userId) => {
  try {
    const response = await apiClient.get(`/health/notifications/${userId}`);
    const prefs = { ...DEFAULT_PREFERENCES, ...response.data };
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
    
    return prefs;
    
  } catch (error) {
   if (isNetworkError(error)) {
      const cached = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    }
    return DEFAULT_PREFERENCES;
  }
};

export const updateNotificationPreferences = async (userId, preferences) => {
  try {
    const response = await apiClient.put(`/health/notifications/${userId}`, preferences);
    const currentPrefs = await getNotificationPreferences(userId);
    const updatedPrefs = { ...currentPrefs, ...preferences };
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updatedPrefs));
    
    return { 
      success: true,
      message: response.data?.message || 'Preferences updated',
      preferences: updatedPrefs,
    };
    
  } catch (error) {
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

export const syncPendingPreferences = async (userId) => {
  const pendingSync = await AsyncStorage.getItem('notification_prefs_pending_sync');
  
  if (pendingSync !== 'true') {
    return { success: true, message: 'No pending sync' };
  }
  
  try {
    const prefs = JSON.parse(await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY) || '{}');
    await apiClient.put(`/health/notifications/${userId}`, prefs);
    await AsyncStorage.removeItem('notification_prefs_pending_sync');
    
    return {  success: true, message: 'Preferences synced' };
    
  } catch (error) {
    return {  success: false, message: getErrorMessage(error) };
  }
};

export const subscribeToTopic = async (topic) => {
  try {
    const response = await apiClient.post('/notifications/subscribe-topic', { topic });
    const topics = JSON.parse(await AsyncStorage.getItem(SUBSCRIBED_TOPICS_KEY) || '[]');
    if (!topics.includes(topic)) {
      topics.push(topic);
      await AsyncStorage.setItem(SUBSCRIBED_TOPICS_KEY, JSON.stringify(topics));
    }
    
    return {  success: true, ...response.data };
    
  } catch (error) {
    const topics = JSON.parse(await AsyncStorage.getItem(SUBSCRIBED_TOPICS_KEY) || '[]');
    if (!topics.includes(topic)) {
      topics.push(topic);
      await AsyncStorage.setItem(SUBSCRIBED_TOPICS_KEY, JSON.stringify(topics));
    }
    
   return {  success: false, message: getErrorMessage(error) };
  }
};

export const unsubscribeFromTopic = async (topic) => {
  try {
    const response = await apiClient.post('/notifications/unsubscribe-topic', { topic });
    const topics = JSON.parse(await AsyncStorage.getItem(SUBSCRIBED_TOPICS_KEY) || '[]');
  // Performance: Consider memoizing this if it causes rerenders
    const filtered = topics.filter(t => t !== topic);
    await AsyncStorage.setItem(SUBSCRIBED_TOPICS_KEY, JSON.stringify(filtered));
    
    return {  success: true, ...response.data };
    
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
};

export const getSubscribedTopics = async () => {
  try {
    const topics = await AsyncStorage.getItem(SUBSCRIBED_TOPICS_KEY);
    return topics ? JSON.parse(topics) : [];
  } catch {
    return [];
  }
};

export const testPushNotification = async (title, body) => {
  const response = await apiClient.post('/notifications/test-push', { title, body });
  return response.data;
};

export const arePushNotificationsEnabled = async (userId) => {
  const prefs = await getNotificationPreferences(userId);
  return prefs.pushNotifications === true;
};

export const togglePushNotifications = async (userId, enabled) => {
  return updateNotificationPreferences(userId, {  pushNotifications: enabled });
};

export const initializePushNotifications = async (fcmToken) => {
  if (fcmToken) {
    await registerDeviceToken(fcmToken);
  } else {
    await retryTokenRegistration();
  }
  AppState.addEventListener('change', async (state) => {
    if (state === 'active') {
      await retryTokenRegistration();
    }
  });
};

export const cleanupPushNotifications = async () => {
  await unregisterDeviceToken();
  await AsyncStorage.multiRemove([
    NOTIFICATION_PREFS_KEY,
    SUBSCRIBED_TOPICS_KEY,
    'notification_prefs_pending_sync',
  ]);
};

export const getCurrentToken = async () => {
  return getStoredToken();
};

export const isDeviceRegistered = async () => {
  const token = await getStoredToken();
  const registered = await isTokenRegistered();
  return !!token && registered;
};

export default {
  registerDeviceToken,
  unregisterDeviceToken,
  retryTokenRegistration,
  getCurrentToken,
  isDeviceRegistered,
  getNotificationPreferences,
  updateNotificationPreferences,
  syncPendingPreferences,
  arePushNotificationsEnabled,
  togglePushNotifications,
  subscribeToTopic,
  unsubscribeFromTopic,
  getSubscribedTopics,
  initializePushNotifications,
  cleanupPushNotifications,
  testPushNotification,
};
