/**
 * App Navigator - Main Navigation Structure
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import DoctorLoginScreen from '../screens/auth/DoctorLoginScreen';
import StaffLoginScreen from '../screens/auth/StaffLoginScreen';
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';
import BottomTabNavigator from './BottomTabNavigator';
import BookingScreen from '../screens/booking/BookingScreen';
import SlotSelectionScreen from '../screens/booking/SlotSelectionScreen';
import PaymentScreen from '../screens/booking/PaymentScreen';
import ConfirmationScreen from '../screens/booking/ConfirmationScreen';
import DoctorProfileScreen from '../screens/doctors/DoctorProfileScreen';
import DoctorSearchScreen from '../screens/doctors/DoctorSearchScreen';
import AppointmentDetailsScreen from '../screens/appointments/AppointmentDetailsScreen';
import RescheduleScreen from '../screens/appointments/RescheduleScreen';
import VideoConsultScreen from '../screens/services/VideoConsultScreen';
import LabTestsScreen from '../screens/services/LabTestsScreen';
import MedicineScreen from '../screens/services/MedicineScreen';
import RecordsScreen from '../screens/services/RecordsScreen';
import EmergencyScreen from '../screens/services/EmergencyScreen';
import MedicalImagingScreen from '../screens/services/MedicalImagingScreen';
import { UserProvider, useUser } from '../context/UserContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

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
        initialRouteName={isLoggedIn ? 'Main' : 'RoleSelection'}
      >
        {/* Auth Screens - Always available for account switching */}
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="DoctorLogin" component={DoctorLoginScreen} />
        <Stack.Screen name="StaffLogin" component={StaffLoginScreen} />
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
        
        {/* Main App */}
        <Stack.Screen name="Main" component={BottomTabNavigator} />
        <Stack.Screen name="DoctorSearch" component={DoctorSearchScreen} />
        <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} />
        <Stack.Screen name="Booking" component={BookingScreen} />
        <Stack.Screen name="SlotSelection" component={SlotSelectionScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="BookingConfirmation" component={ConfirmationScreen} />
        <Stack.Screen name="AppointmentDetails" component={AppointmentDetailsScreen} />
        <Stack.Screen name="Reschedule" component={RescheduleScreen} />
        <Stack.Screen name="VideoConsult" component={VideoConsultScreen} />
        <Stack.Screen name="LabTests" component={LabTestsScreen} />
        <Stack.Screen name="Medicine" component={MedicineScreen} />
        <Stack.Screen name="Records" component={RecordsScreen} />
        <Stack.Screen name="Emergency" component={EmergencyScreen} />
        <Stack.Screen name="MedicalImaging" component={MedicalImagingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const AppNavigator = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  );
};

export default AppNavigator;
