/**
 * HealthSync Pro - Clinical Staff Application
 * For Doctors, Staff, and Admins only
 */

import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform, PermissionsAndroid } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import NotificationService from './src/services/notifications/NotificationService';

const App = () => {
  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
      }
      await NotificationService.initialize();
    } catch (error) {
      console.log('Notification init error:', error.message);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default App;
