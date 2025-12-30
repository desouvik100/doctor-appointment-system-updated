/**
 * App Navigator - Main Navigation Structure
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '../screens/auth/LoginScreen';
import BottomTabNavigator from './BottomTabNavigator';
import BookingScreen from '../screens/booking/BookingScreen';
import VideoConsultScreen from '../screens/services/VideoConsultScreen';
import LabTestsScreen from '../screens/services/LabTestsScreen';
import MedicineScreen from '../screens/services/MedicineScreen';
import RecordsScreen from '../screens/services/RecordsScreen';
import EmergencyScreen from '../screens/services/EmergencyScreen';
import MedicalImagingScreen from '../screens/services/MedicalImagingScreen';
import { colors } from '../theme/colors';
import { UserProvider, useUser } from '../context/UserContext';

const Stack = createStackNavigator();

const AppContent = () => {
  const { isLoggedIn } = useUser();

  return (
    <NavigationContainer
      theme={{
        dark: true,
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
      >
        {!isLoggedIn ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : null}
        <Stack.Screen name="Main" component={BottomTabNavigator} />
        <Stack.Screen name="Booking" component={BookingScreen} />
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
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
};

export default AppNavigator;
