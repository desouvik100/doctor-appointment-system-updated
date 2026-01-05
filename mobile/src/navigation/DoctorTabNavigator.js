/**
 * Doctor Tab Navigator - Dashboard for Doctors
 * With Stack Navigation for all doctor screens - 100% Web Parity
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import { shadows } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { useTheme } from '../context/ThemeContext';

// Import all doctor screens directly
import DoctorDashboardScreen from '../screens/doctor/DoctorDashboardScreen';
import DoctorAppointmentsScreen from '../screens/doctor/DoctorAppointmentsScreen';
import DoctorPatientsScreen from '../screens/doctor/DoctorPatientsScreen';
import DoctorAppointmentDetailScreen from '../screens/doctor/DoctorAppointmentDetailScreen';
import DoctorPatientDetailScreen from '../screens/doctor/DoctorPatientDetailScreen';
import DoctorPrescriptionsScreen from '../screens/doctor/DoctorPrescriptionsScreen';
import DoctorCreatePrescriptionScreen from '../screens/doctor/DoctorCreatePrescriptionScreen';
import DoctorScheduleScreen from '../screens/doctor/DoctorScheduleScreen';
import DoctorWalletScreen from '../screens/doctor/DoctorWalletScreen';
import DoctorEMRScreen from '../screens/doctor/DoctorEMRScreen';
import DoctorSupportScreen from '../screens/doctor/DoctorSupportScreen';
import DoctorQueueScreen from '../screens/doctor/DoctorQueueScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import NotificationSettingsScreen from '../screens/profile/NotificationSettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Doctor Dashboard Stack - contains all doctor screens
const DoctorDashboardStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DoctorDashboardMain" component={DoctorDashboardScreen} />
      <Stack.Screen name="DoctorAppointmentDetail" component={DoctorAppointmentDetailScreen} />
      <Stack.Screen name="DoctorPatientDetail" component={DoctorPatientDetailScreen} />
      <Stack.Screen name="DoctorPrescriptions" component={DoctorPrescriptionsScreen} />
      <Stack.Screen name="DoctorCreatePrescription" component={DoctorCreatePrescriptionScreen} />
      <Stack.Screen name="DoctorSchedule" component={DoctorScheduleScreen} />
      <Stack.Screen name="DoctorWallet" component={DoctorWalletScreen} />
      <Stack.Screen name="DoctorEMR" component={DoctorEMRScreen} />
      <Stack.Screen name="DoctorSupport" component={DoctorSupportScreen} />
      <Stack.Screen name="DoctorQueue" component={DoctorQueueScreen} />
    </Stack.Navigator>
  );
};

// Appointments Stack
const AppointmentsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DoctorAppointmentsMain" component={DoctorAppointmentsScreen} />
      <Stack.Screen name="DoctorAppointmentDetail" component={DoctorAppointmentDetailScreen} />
      <Stack.Screen name="DoctorCreatePrescription" component={DoctorCreatePrescriptionScreen} />
    </Stack.Navigator>
  );
};

// Patients Stack
const PatientsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DoctorPatientsMain" component={DoctorPatientsScreen} />
      <Stack.Screen name="DoctorPatientDetail" component={DoctorPatientDetailScreen} />
      <Stack.Screen name="DoctorCreatePrescription" component={DoctorCreatePrescriptionScreen} />
    </Stack.Navigator>
  );
};

// Profile Stack - includes notifications
const ProfileStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    </Stack.Navigator>
  );
};

const TabIcon = ({ icon, label, focused, colors }) => (
  <View style={styles.tabItem}>
    {focused ? (
      <LinearGradient colors={['#6C5CE7', '#A29BFE']} style={styles.activeIconBg}>
        <Text style={styles.tabIcon}>{icon}</Text>
      </LinearGradient>
    ) : (
      <View style={styles.inactiveIconBg}>
        <Text style={[styles.tabIcon, styles.inactiveIcon]}>{icon}</Text>
      </View>
    )}
    <Text style={[styles.tabLabel, { color: colors.textMuted }, focused && { color: '#6C5CE7', fontWeight: '600' }]}>
      {label}
    </Text>
  </View>
);

const CustomTabBar = ({ state, navigation }) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.tabBarContainer}>
      <View style={[styles.tabBar, { backgroundColor: colors.backgroundCard, borderColor: colors.surfaceBorder }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const getIcon = () => {
            switch (route.name) {
              case 'Dashboard': return '🏥';
              case 'Appointments': return '📅';
              case 'Patients': return '👥';
              case 'Profile': return '👤';
              default: return '📱';
            }
          };

          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={styles.tabButton} activeOpacity={0.7}>
              <TabIcon icon={getIcon()} label={route.name} focused={isFocused} colors={colors} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const DoctorTabNavigator = () => {
  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={DoctorDashboardStack} />
      <Tab.Screen name="Appointments" component={AppointmentsStack} />
      <Tab.Screen name="Patients" component={PatientsStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: { position: 'absolute', bottom: spacing.xl, left: spacing.xl, right: spacing.xl },
  tabBar: { flexDirection: 'row', borderRadius: borderRadius.xxl, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderWidth: 1, ...shadows.large },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm },
  tabItem: { alignItems: 'center' },
  activeIconBg: { width: 44, height: 44, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs, ...shadows.glow },
  inactiveIconBg: { width: 44, height: 44, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  tabIcon: { fontSize: 22 },
  inactiveIcon: { opacity: 0.6 },
  tabLabel: { ...typography.labelSmall },
});

export default DoctorTabNavigator;
