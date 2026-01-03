/**
 * HealthSync Mobile App
 */

import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { configureGoogleSignIn } from './src/services/socialAuthService';

const App = () => {
  useEffect(() => {
    // Initialize Google Sign-In on app start
    configureGoogleSignIn();
  }, []);

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
