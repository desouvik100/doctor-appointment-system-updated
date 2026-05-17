/**
 * Admin Tab Navigator - Dashboard for System Administrators
 * With Stack Navigation for all admin screens - 100% Web Parity
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import { shadows } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { useTheme } from '../context/ThemeContext';

// Import all admin screens
import {
  AdminDashboardScreen,
  AdminDoctorsScreen,
  AdminStaffScreen,
  AdminClinicsScreen,
  AdminUsersScreen,
  AdminAppointmentsScreen,
  AdminWalletScreen,
  AdminCouponsScreen,
  AdminReportsScreen,
  AdminApprovalsScreen,
  AdminDoctorDetailScreen,
  AdminUserDetailScreen,
  AdminClinicDetailScreen,
  AdminAppointmentDetailScreen,
  AdminAddDoctorScreen,
  AdminEditDoctorScreen,
  AdminAddClinicScreen,
  AdminEditClinicScreen,
  AdminSupportTicketsScreen,
  AdminAuditLogsScreen,
} from '../screens/admin';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Admin Dashboard Stack - contains all admin screens
const AdminDashboardStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Main Screens */}
      <Stack.Screen name="AdminDashboardMain" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminDoctors" component={AdminDoctorsScreen} />
      <Stack.Screen name="AdminStaff" component={AdminStaffScreen} />
      <Stack.Screen name="AdminClinics" component={AdminClinicsScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Stack.Screen name="AdminAppointments" component={AdminAppointmentsScreen} />
      <Stack.Screen name="AdminWallet" component={AdminWalletScreen} />
      <Stack.Screen name="AdminCoupons" component={AdminCouponsScreen} />
      <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
      <Stack.Screen name="AdminApprovals" component={AdminApprovalsScreen} />
      <Stack.Screen name="AdminSupportTickets" component={AdminSupportTicketsScreen} />
      <Stack.Screen name="AdminAuditLogs" component={AdminAuditLogsScreen} />
      
      {/* Detail Screens */}
      <Stack.Screen name="AdminDoctorDetail" component={AdminDoctorDetailScreen} />
      <Stack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} />
      <Stack.Screen name="AdminClinicDetail" component={AdminClinicDetailScreen} />
      <Stack.Screen name="AdminAppointmentDetail" component={AdminAppointmentDetailScreen} />
      
      {/* CRUD Screens */}
      <Stack.Screen name="AdminAddDoctor" component={AdminAddDoctorScreen} />
      <Stack.Screen name="AdminEditDoctor" component={AdminEditDoctorScreen} />
      <Stack.Screen name="AdminAddClinic" component={AdminAddClinicScreen} />
      <Stack.Screen name="AdminEditClinic" component={AdminEditClinicScreen} />
    </Stack.Navigator>
  );
};

const TabIcon = ({ icon, label, focused, colors }) => (
  <View style={styles.tabItem}>
    {focused ? (
      <LinearGradient colors={['#F39C12', '#F1C40F']} style={styles.activeIconBg}>
        <Text style={styles.tabIcon}>{icon}</Text>
      </LinearGradient>
    ) : (
      <View style={styles.inactiveIconBg}>
        <Text style={[styles.tabIcon, styles.inactiveIcon]}>{icon}</Text>
      </View>
    )}
    <Text style={[styles.tabLabel, { color: colors.textMuted }, focused && { color: '#F39C12', fontWeight: '600' }]}>
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
              case 'Dashboard': return '🛡️';
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

const AdminTabNavigator = () => {
  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={AdminDashboardStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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

export default AdminTabNavigator;
