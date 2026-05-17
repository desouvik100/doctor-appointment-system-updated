/**
 * HealthSync Pro - App Navigator
 * Handles Doctor, Staff, and Admin navigation only
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import DoctorLoginScreen from '../screens/auth/DoctorLoginScreen';
import StaffLoginScreen from '../screens/auth/StaffLoginScreen';
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import VerifyOTPScreen from '../screens/auth/VerifyOTPScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import ProRoleSelectionScreen from '../screens/auth/ProRoleSelectionScreen';
import ProRoleBasedNavigator from './ProRoleBasedNavigator';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

import AuthGate from '../components/AuthGate';
import { UserProvider, useUser } from '../context/UserContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { SocketProvider } from '../context/SocketContext';

const Stack = createStackNavigator();

const AppContent = () => {
  const { isLoggedIn } = useUser();
  const { colors, isDarkMode } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: isDarkMode,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.backgroundCard,
          text: colors.textPrimary,
          border: colors.surfaceBorder,
          notification: colors.accent,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background },
        }}
        initialRouteName={isLoggedIn ? 'Main' : 'ProRoleSelection'}
      >
        {/* Auth Screens */}
        <Stack.Screen name="ProRoleSelection" component={ProRoleSelectionScreen} />
        <Stack.Screen name="DoctorLogin" component={DoctorLoginScreen} />
        <Stack.Screen name="StaffLogin" component={StaffLoginScreen} />
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        {/* Main App */}
        <Stack.Screen name="Main" component={ProRoleBasedNavigator} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const AppNavigator = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <SocketProvider>
          <AuthGate>
            <AppContent />
          </AuthGate>
        </SocketProvider>
      </UserProvider>
    </ThemeProvider>
  );
};

export default AppNavigator;
