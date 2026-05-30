/**
 * Staff Tab Navigator - Dashboard for Clinic Staff/Receptionists
 * With Stack Navigation for all staff screens - 100% Web Parity
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import { shadows } from '../theme/shadows';
import { typography, spacing, borderRadius } from '../theme/typography';
import { useTheme } from '../context/ThemeContext';

// Import all staff screens directly
import StaffDashboardScreen from '../screens/staff/StaffDashboardScreen';
import StaffAppointmentsScreen from '../screens/staff/StaffAppointmentsScreen';
import StaffQueueScreen from '../screens/staff/StaffQueueScreen';
import StaffPatientsScreen from '../screens/staff/StaffPatientsScreen';
import StaffPatientDetailScreen from '../screens/staff/StaffPatientDetailScreen';
import StaffDoctorsScreen from '../screens/staff/StaffDoctorsScreen';
import StaffDoctorFormScreen from '../screens/staff/StaffDoctorFormScreen';
import StaffBookAppointmentScreen from '../screens/staff/StaffBookAppointmentScreen';
import StaffAppointmentDetailScreen from '../screens/staff/StaffAppointmentDetailScreen';
import StaffEMRScreen from '../screens/staff/StaffEMRScreen';
import StaffRegisterPatientScreen from '../screens/staff/StaffRegisterPatientScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import NotificationSettingsScreen from '../screens/profile/NotificationSettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Staff Dashboard Stack - contains all staff screens
const StaffDashboardStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StaffDashboardMain" component={StaffDashboardScreen} />
      <Stack.Screen name="StaffQueue" component={StaffQueueScreen} />
      <Stack.Screen name="StaffPatients" component={StaffPatientsScreen} />
      <Stack.Screen name="StaffPatientDetail" component={StaffPatientDetailScreen} />
      <Stack.Screen name="StaffDoctors" component={StaffDoctorsScreen} />
      <Stack.Screen name="StaffDoctorForm" component={StaffDoctorFormScreen} />
      <Stack.Screen name="StaffBookAppointment" component={StaffBookAppointmentScreen} />
      <Stack.Screen name="StaffAppointmentDetail" component={StaffAppointmentDetailScreen} />
      <Stack.Screen name="StaffEMR" component={StaffEMRScreen} />
      <Stack.Screen name="StaffRegisterPatient" component={StaffRegisterPatientScreen} />
    </Stack.Navigator>
  );
};

// Appointments Stack
const AppointmentsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StaffAppointmentsMain" component={StaffAppointmentsScreen} />
      <Stack.Screen name="StaffAppointmentDetail" component={StaffAppointmentDetailScreen} />
      <Stack.Screen name="StaffBookAppointment" component={StaffBookAppointmentScreen} />
      <Stack.Screen name="StaffPatientDetail" component={StaffPatientDetailScreen} />
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

const TabIcon = ({ icon, label, focused, colors, isDarkMode }) => (
  <View style={styles.tabItem}>
    {focused ? (
      <LinearGradient 
        colors={colors.gradientPrimary || ['#00D4AA', '#00B894']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.activeIconBg}
      >
        <Text style={styles.tabIcon}>{icon}</Text>
      </LinearGradient>
    ) : (
      <View style={[styles.inactiveIconBg, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
        <Text style={[styles.tabIcon, styles.inactiveIcon]}>{icon}</Text>
      </View>
    )}
    <Text style={[styles.tabLabel, { color: colors.textMuted }, focused && { color: colors.primary, fontWeight: '700' }]}>
      {label}
    </Text>
  </View>
);

const CustomTabBar = ({ state, navigation }) => {
  const { colors, isDarkMode } = useTheme();
  
  return (
    <View style={styles.tabBarContainer}>
      <View style={[
        styles.tabBar, 
        { 
          backgroundColor: isDarkMode ? 'rgba(26, 31, 46, 0.85)' : 'rgba(255, 255, 255, 0.9)', 
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 184, 148, 0.12)',
          ...shadows.lg,
        }
      ]}>
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
              case 'Profile': return '👤';
              default: return '📱';
            }
          };

          return (
            <TouchableOpacity key={route.key} onPress={onPress} style={styles.tabButton} activeOpacity={0.7}>
              <TabIcon icon={getIcon()} label={route.name} focused={isFocused} colors={colors} isDarkMode={isDarkMode} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const StaffTabNavigator = () => {
  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={StaffDashboardStack} />
      <Tab.Screen name="Appointments" component={AppointmentsStack} />
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

export default StaffTabNavigator;
