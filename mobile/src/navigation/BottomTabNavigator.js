/**
 * Bottom Tab Navigator - Premium Floating Tab Bar
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LinearGradient from 'react-native-linear-gradient';
import { shadows } from '../theme/shadows';
import { typography, spacing, borderRadius } from '../theme/typography';
import { useTheme } from '../context/ThemeContext';

import HomeScreen from '../screens/home/HomeScreen';
import AppointmentsScreen from '../screens/appointments/AppointmentsScreen';
import DoctorsScreen from '../screens/doctors/DoctorsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

const TAB_CONFIG = [
  { name: 'Home',         icon: '🏠', activeIcon: '🏠', label: 'Home' },
  { name: 'Appointments', icon: '📅', activeIcon: '📅', label: 'Bookings' },
  { name: 'Doctors',      icon: '👨‍⚕️', activeIcon: '👨‍⚕️', label: 'Doctors' },
  { name: 'Profile',      icon: '👤', activeIcon: '👤', label: 'Profile' },
];

const TabItem = ({ icon, label, focused, colors, isDarkMode }) => (
  <View style={styles.tabItem}>
    {focused ? (
      <LinearGradient
        colors={colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.activeIconBg}
      >
        <Text style={styles.tabIconActive}>{icon}</Text>
      </LinearGradient>
    ) : (
      <View style={[styles.inactiveIconBg, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
        <Text style={styles.tabIconInactive}>{icon}</Text>
      </View>
    )}
    <Text style={[
      styles.tabLabel,
      { color: focused ? colors.primary : colors.textMuted },
      focused && styles.tabLabelActive,
    ]}>
      {label}
    </Text>
  </View>
);

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={styles.tabBarContainer}>
      <View style={[
        styles.tabBar,
        {
          backgroundColor: isDarkMode ? 'rgba(26, 31, 46, 0.85)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 184, 148, 0.12)',
          ...shadows.lg,
        },
      ]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG.find(t => t.name === route.name) || TAB_CONFIG[0];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.75}
            >
              <TabItem
                icon={config.icon}
                label={config.label}
                focused={isFocused}
                colors={colors}
                isDarkMode={isDarkMode}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const BottomTabNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Appointments" component={AppointmentsScreen} />
    <Tab.Screen name="Doctors" component={DoctorsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    left: spacing.xl,
    right: spacing.xl,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: borderRadius.xxl,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  tabItem: {
    alignItems: 'center',
    gap: 4,
  },
  activeIconBg: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveIconBg: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    fontSize: 26,
  },
  tabIconInactive: {
    fontSize: 24,
    opacity: 0.7,
  },
  tabLabel: {
    ...typography.labelSmall,
    fontSize: 11,
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});

export default BottomTabNavigator;
