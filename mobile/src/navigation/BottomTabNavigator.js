/**
 * Bottom Tab Navigator - Redesigned Floating Dock & Quick Actions Sheet
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  StatusBar,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { shadows } from '../theme/shadows';
import { typography, spacing, borderRadius } from '../theme/typography';
import { useTheme } from '../context/ThemeContext';

import HomeScreen from '../screens/home/HomeScreen';
import AppointmentsScreen from '../screens/appointments/AppointmentsScreen';

const Tab = createBottomTabNavigator();
const { width, height } = Dimensions.get('window');

// 3-tab configuration
const TAB_CONFIG = [
  { name: 'Home', icon: '🏠', label: 'Home' },
  { name: 'Book', icon: '➕', label: 'Book' }, // Floating center action button
  { name: 'Appointments', icon: '📅', label: 'Appointments' },
];

const QUICK_ACTIONS = [
  { id: 'Booking', label: 'Book Doctor', icon: '🩺', color: '#00D4AA', desc: 'Clinic appointments' },
  { id: 'VideoConsult', label: 'Video Consult', icon: '🎥', color: '#6C5CE7', desc: 'Virtual doctor online' },
  { id: 'LabTests', label: 'Lab Tests', icon: '🧪', color: '#FF7675', desc: 'Home sample pickup' },
  { id: 'Medicine', label: 'Medicines', icon: '💊', color: '#0984E3', desc: 'Express home delivery' },
  { id: 'Records', label: 'Reports', icon: '📄', color: '#FDCB6E', desc: 'E-prescriptions & files' },
  { id: 'Emergency', label: 'Emergency SOS', icon: '🚑', color: '#D63031', desc: '24/7 ambulance alert' },
  { id: 'Wallet', label: 'Health Wallet', icon: '💰', color: '#27AE60', desc: 'Loyalty & balances' },
];

const TabItem = ({ icon, label, focused, isCenter, colors, isDarkMode, rotation, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.1 : 1.0,
      useNativeDriver: true,
      friction: 8,
      tension: 45,
    }).start();
  }, [focused]);

  if (isCenter) {
    const pressScale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(pressScale, {
        toValue: 0.88,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(pressScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    return (
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <View style={styles.centerButtonContainer}>
          <Animated.View style={{ transform: [{ scale: pressScale }] }}>
            <LinearGradient
              colors={colors.gradientPrimary || ['#00D4AA', '#00B894']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.centerButton, shadows.xl]}
            >
              <Animated.Text style={[styles.centerButtonIcon, { transform: [{ rotate: rotation }] }]}>
                {icon}
              </Animated.Text>
            </LinearGradient>
          </Animated.View>
          <Text style={[styles.tabLabel, { color: colors.textMuted, marginTop: 4 }]}>{label}</Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <Animated.View style={[styles.tabItem, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.iconContainer}>
        {focused && (
          <View style={[styles.activePill, { backgroundColor: colors.primary + '15' }]} />
        )}
        <Text style={[styles.tabIcon, { color: focused ? colors.primary : colors.textMuted, opacity: focused ? 1.0 : 0.75 }]}>
          {icon}
        </Text>
      </View>
      <Text
        style={[
          styles.tabLabel,
          {
            color: focused ? colors.primary : colors.textMuted,
            fontFamily: focused ? 'Inter-Bold' : 'Inter-Regular',
            fontWeight: focused ? '700' : '400',
          },
        ]}
      >
        {label}
      </Text>
    </Animated.View>
  );
};

const CustomTabBar = ({ state, descriptors, navigation, onOpenBookSheet, rotation }) => {
  const { colors, isDarkMode } = useTheme();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const barPadding = spacing.md;
  const horizontalMargin = spacing.xl;
  const tabWidth = (width - horizontalMargin * 2 - barPadding * 2) / 3;

  useEffect(() => {
    let targetIdx = 0;
    if (state.index === 0) {
      targetIdx = 0;
    } else if (state.index === 2) {
      targetIdx = 2;
    }
    Animated.spring(slideAnim, {
      toValue: targetIdx * tabWidth,
      useNativeDriver: true,
      tension: 60,
      friction: 9,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <View style={styles.tabBarContainer}>
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: isDarkMode ? 'rgba(26, 31, 46, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            paddingHorizontal: barPadding,
            ...shadows.xl,
          },
        ]}
      >
        {/* Active Tab sliding pill background - skips center button */}
        {state.index !== 1 && (
          <Animated.View
            style={[
              styles.slidingPillBg,
              {
                width: tabWidth,
                transform: [{ translateX: slideAnim }],
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 212, 170, 0.04)',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 212, 170, 0.08)',
              },
            ]}
          />
        )}

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG.find((t) => t.name === route.name) || TAB_CONFIG[0];
          const isCenter = route.name === 'Book';

          const onPress = () => {
            if (isCenter) {
              onOpenBookSheet();
              return;
            }
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
              activeOpacity={isCenter ? 1.0 : 0.8}
            >
              <TabItem
                icon={config.icon}
                label={config.label}
                focused={isFocused}
                isCenter={isCenter}
                colors={colors}
                isDarkMode={isDarkMode}
                rotation={rotation}
                onPress={onPress}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const BottomTabNavigator = ({ navigation: navProp }) => {
  const { colors, isDarkMode } = useTheme();
  // useNavigation() is the reliable source — navProp may be undefined
  // when this component is rendered as a nested tab screen
  const hookNav = useNavigation();
  const navigation = navProp || hookNav;
  const [sheetVisible, setSheetVisible] = useState(false);
  
  const slideUpAnim = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const openSheet = () => {
    setSheetVisible(true);
    Animated.parallel([
      Animated.spring(slideUpAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(rotateAnim, {
        toValue: 1, // 45 degree rotation
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(slideUpAnim, {
        toValue: height,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(rotateAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }),
    ]).start(() => {
      setSheetVisible(false);
    });
  };

  const handleAction = (screenName) => {
    closeSheet();
    setTimeout(() => {
      // Ensure target navigation works based on screen IDs
      if (screenName === 'Booking') {
        navigation.navigate('DoctorSearch');
      } else {
        navigation.navigate(screenName);
      }
    }, 300);
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '135deg'], // Rotates plus to close icon
  });

  return (
    <View style={styles.navigatorWrapper}>
      <Tab.Navigator
        tabBar={(props) => (
          <CustomTabBar
            {...props}
            onOpenBookSheet={openSheet}
            rotation={rotation}
          />
        )}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        {/* Placeholder tab: Center Action is intercepted to open sheet */}
        <Tab.Screen name="Book" component={HomeScreen} />
        <Tab.Screen name="Appointments" component={AppointmentsScreen} />
      </Tab.Navigator>

      {sheetVisible && (
        <View style={StyleSheet.absoluteFill}>
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={closeSheet}>
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
          </TouchableWithoutFeedback>

          {/* Bottom Sheet Container */}
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: isDarkMode ? '#1E2333' : '#FFFFFF',
                transform: [{ translateY: slideUpAnim }],
                borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                ...shadows.xl,
              },
            ]}
          >
            {/* Grab Handle */}
            <View style={[styles.grabHandle, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)' }]} />

            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Quick Booking & Care</Text>
              <Text style={[styles.sheetSubtitle, { color: colors.textMuted }]}>Select a premium health service below</Text>
            </View>

            {/* Actions Grid */}
            <View style={styles.gridContainer}>
              {QUICK_ACTIONS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.gridItem,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
                    },
                  ]}
                  onPress={() => handleAction(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.gridIconCircle, { backgroundColor: item.color + '15' }]}>
                    <Text style={[styles.gridIcon, { color: item.color }]}>{item.icon}</Text>
                  </View>
                  <View style={styles.gridTextContainer}>
                    <Text style={[styles.gridLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                    <Text style={[styles.gridDesc, { color: colors.textMuted }]}>{item.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                },
              ]}
              onPress={closeSheet}
              activeOpacity={0.8}
            >
              <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>Dismiss</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  navigatorWrapper: {
    flex: 1,
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    left: spacing.xl,
    right: spacing.xl,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: borderRadius.xxl,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    height: 68,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 64,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  activePill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.full,
  },
  tabIcon: {
    fontSize: 24,
  },
  tabLabel: {
    ...typography.labelSmall,
    fontSize: 11,
    marginTop: 2,
  },
  slidingPillBg: {
    position: 'absolute',
    top: spacing.xs,
    bottom: spacing.xs,
    borderRadius: borderRadius.xxl - 2,
    borderWidth: 1,
  },
  centerButtonContainer: {
    position: 'absolute',
    bottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  centerButtonIcon: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '300',
  },
  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  // Bottom Sheet
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl + 10 : spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  grabHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetHeader: {
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    ...typography.displaySmall,
    fontSize: 20,
    fontWeight: '800',
  },
  sheetSubtitle: {
    ...typography.bodyMedium,
    fontSize: 13,
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  gridItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
  },
  gridIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIcon: {
    fontSize: 20,
  },
  gridTextContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  gridLabel: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
  },
  gridDesc: {
    ...typography.labelSmall,
    fontSize: 9,
    marginTop: 1,
    lineHeight: 12,
  },
  closeButton: {
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    ...typography.button,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default BottomTabNavigator;
