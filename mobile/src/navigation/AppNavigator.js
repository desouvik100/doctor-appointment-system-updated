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
import VerifyOTPScreen from '../screens/auth/VerifyOTPScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import DoctorLoginScreen from '../screens/auth/DoctorLoginScreen';
import StaffLoginScreen from '../screens/auth/StaffLoginScreen';
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';
import RoleBasedNavigator from './RoleBasedNavigator';
import BookingScreen from '../screens/booking/BookingScreen';
import SlotSelectionScreen from '../screens/booking/SlotSelectionScreen';
import ConfirmDetailsScreen from '../screens/booking/ConfirmDetailsScreen';
import PaymentScreen from '../screens/booking/PaymentScreen';
import RazorpayPaymentScreen from '../screens/booking/RazorpayPaymentScreen';
import ConfirmationScreen from '../screens/booking/ConfirmationScreen';
import DoctorProfileScreen from '../screens/doctors/DoctorProfileScreen';
import DoctorSearchScreen from '../screens/doctors/DoctorSearchScreen';
import AppointmentDetailsScreen from '../screens/appointments/AppointmentDetailsScreen';
import RescheduleScreen from '../screens/appointments/RescheduleScreen';
import VideoConsultScreen from '../screens/services/VideoConsultScreen';
import LabTestsScreen from '../screens/services/LabTestsScreen';
import LabTestPaymentScreen from '../screens/services/LabTestPaymentScreen';
import LabTestConfirmationScreen from '../screens/services/LabTestConfirmationScreen';
import MedicineScreen from '../screens/services/MedicineScreen';
import RecordsScreen from '../screens/services/RecordsScreen';
import EmergencyScreen from '../screens/services/EmergencyScreen';
import MedicalImagingScreen from '../screens/services/MedicalImagingScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import RewardsScreen from '../screens/profile/RewardsScreen';
import PaymentMethodsScreen from '../screens/profile/PaymentMethodsScreen';
import HealthReportsScreen from '../screens/profile/HealthReportsScreen';
import FamilyMembersScreen from '../screens/profile/FamilyMembersScreen';
import { 
  MedicalTimelineScreen, 
  PrescriptionViewScreen, 
  UploadReportScreen, 
  VitalsHistoryScreen, 
  ReportDetailsScreen 
} from '../screens/records';
import InsuranceScreen from '../screens/profile/InsuranceScreen';
import NotificationSettingsScreen from '../screens/profile/NotificationSettingsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import WalletScreen from '../screens/profile/WalletScreen';
import AuthGate from '../components/AuthGate';
import { UserProvider, useUser } from '../context/UserContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { SocketProvider } from '../context/SocketContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

const Stack = createStackNavigator();

const AppContent = () => {
  const { isLoggedIn } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [completedOnboarding, setCompletedOnboarding] = React.useState(false);
  const [onboardingLoading, setOnboardingLoading] = React.useState(true);

  React.useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const val = await AsyncStorage.getItem('has_completed_onboarding');
        setCompletedOnboarding(val === 'true');
      } catch (error) {
        console.log('Error loading onboarding state:', error);
      } finally {
        setOnboardingLoading(false);
      }
    };
    checkOnboarding();
  }, []);

  if (onboardingLoading) {
    return null; // Let AuthGate handle the loading/splash transition
  }

  const getInitialRoute = () => {
    if (isLoggedIn) return 'Main';
    if (!completedOnboarding) return 'Onboarding';
    return 'Welcome';
  };

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
        initialRouteName={getInitialRoute()}
      >
        {/* Onboarding & Patient auth flow */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Welcome" component={RoleSelectionScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        {/* Pro app screens — kept for deep-link compatibility */}
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="DoctorLogin" component={DoctorLoginScreen} />
        <Stack.Screen name="StaffLogin" component={StaffLoginScreen} />
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
        
        {/* Main App - Role-based navigation */}
        <Stack.Screen name="Main" component={RoleBasedNavigator} />
        <Stack.Screen name="DoctorSearch" component={BookingScreen} />
        <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} />
        <Stack.Screen name="Booking" component={BookingScreen} />
        <Stack.Screen name="SlotSelection" component={SlotSelectionScreen} />
        <Stack.Screen name="ConfirmDetails" component={ConfirmDetailsScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="RazorpayPayment" component={RazorpayPaymentScreen} />
        <Stack.Screen name="BookingConfirmation" component={ConfirmationScreen} />
        <Stack.Screen name="AppointmentDetails" component={AppointmentDetailsScreen} />
        <Stack.Screen name="Reschedule" component={RescheduleScreen} />
        <Stack.Screen name="VideoConsult" component={VideoConsultScreen} />
        <Stack.Screen name="LabTests" component={LabTestsScreen} />
        <Stack.Screen name="LabTestPayment" component={LabTestPaymentScreen} />
        <Stack.Screen name="LabTestConfirmation" component={LabTestConfirmationScreen} />
        <Stack.Screen name="Medicine" component={MedicineScreen} />
        <Stack.Screen name="Records" component={RecordsScreen} />
        <Stack.Screen name="Emergency" component={EmergencyScreen} />
        <Stack.Screen name="MedicalImaging" component={MedicalImagingScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Rewards" component={RewardsScreen} />
        <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
        <Stack.Screen name="HealthReports" component={HealthReportsScreen} />
        <Stack.Screen name="FamilyMembers" component={FamilyMembersScreen} />
        <Stack.Screen name="MedicalTimeline" component={MedicalTimelineScreen} />
        <Stack.Screen name="PrescriptionView" component={PrescriptionViewScreen} />
        <Stack.Screen name="UploadReport" component={UploadReportScreen} />
        <Stack.Screen name="VitalsHistory" component={VitalsHistoryScreen} />
        <Stack.Screen name="ReportDetails" component={ReportDetailsScreen} />
        <Stack.Screen name="Insurance" component={InsuranceScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
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
