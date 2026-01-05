/**
 * HealthSync Mobile App
 */

import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform, PermissionsAndroid } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { configureGoogleSignIn } from './src/services/socialAuthService';
import NotificationService from './src/services/notifications/NotificationService';

const App = () => {
  useEffect(() => {
    // Initialize Google Sign-In on app start
    configureGoogleSignIn();
    
    // Initialize Push Notifications
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      // Request notification permission on Android 13+
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        console.log('🔔 Notification permission:', granted);
      }
      
      // Initialize the notification service
      await NotificationService.initialize();
      console.log('🔔 Push notifications initialized');
    } catch (error) {
      console.log('🔔 Notification init error:', error.message);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
