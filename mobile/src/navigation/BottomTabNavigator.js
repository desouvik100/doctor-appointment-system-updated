/**
 * Bottom Tab Navigator - Modern Floating Tab Bar
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LinearGradient from 'react-native-linear-gradient';
import { shadows } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { useTheme } from '../context/ThemeContext';

import HomeScreen from '../screens/home/HomeScreen';
import AppointmentsScreen from '../screens/appointments/AppointmentsScreen';
import DoctorsScreen from '../screens/doctors/DoctorsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

const TabIcon = ({ icon, label, focused, colors }) => (
  <View style={styles.tabItem}>
    {focused ? (
      <LinearGradient
        colors={colors.gradientPrimary}
        style={styles.activeIconBg}
      >
        <Text style={styles.tabIcon}>{icon}</Text>
      </LinearGradient>
    ) : (
      <View style={styles.inactiveIconBg}>
        <Text style={[styles.tabIcon, styles.inactiveIcon]}>{icon}</Text>
      </View>
    )}
    <Text style={[styles.tabLabel, { color: colors.textMuted }, focused && { color: colors.primary, fontWeight: '600' }]}>
      {label}
    </Text>
  </View>
);

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.tabBarContainer}>
      <View style={[styles.tabBar, { backgroundColor: colors.backgroundCard, borderColor: colors.surfaceBorder }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

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

          const getIcon = () => {
            switch (route.name) {
              case 'Home': return '🏠';
              case 'Appointments': return '📅';
              case 'Doctors': return '👨‍⚕️';
              case 'Profile': return '👤';
              default: return '📱';
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <TabIcon
                icon={getIcon()}
                label={route.name}
                focused={isFocused}
                colors={colors}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} />
      <Tab.Screen name="Doctors" component={DoctorsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: borderRadius.xxl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    ...shadows.large,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  tabItem: {
    alignItems: 'center',
  },
  activeIconBg: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...shadows.glow,
  },
  inactiveIconBg: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  tabIcon: {
    fontSize: 22,
  },
  inactiveIcon: {
    opacity: 0.6,
  },
  tabLabel: {
    ...typography.labelSmall,
  },
});

export default BottomTabNavigator;
