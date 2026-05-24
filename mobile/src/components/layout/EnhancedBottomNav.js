/**
 * Enterprise Bottom Navigation
 * Smooth animations, haptic feedback, and accessibility
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { lightTheme } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

const TabButton = ({ icon, label, isActive, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isActive ? 1.1 : 1,
        useNativeDriver: true,
        friction: 5,
      }),
      Animated.spring(translateY, {
        toValue: isActive ? -2 : 0,
        useNativeDriver: true,
        friction: 5,
      }),
    ]).start();
  }, [isActive, scaleAnim, translateY]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.tabButton}
    >
      <Animated.View
        style={[
          styles.tabIconContainer,
          isActive && styles.tabIconContainerActive,
          {
            transform: [{ scale: scaleAnim }, { translateY }],
          },
        ]}
      >
        <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
          {icon}
        </Text>
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          isActive && styles.tabLabelActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const EnhancedBottomNav = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, spacing.md),
        },
      ]}
    >
      <View style={styles.tabBar}>
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

          // Icon mapping
          const iconMap = {
            Home: '🏠',
            Doctors: '👨‍⚕️',
            Appointments: '📅',
            Health: '❤️',
            Profile: '👤',
          };

          const icon = iconMap[route.name] || '•';
          const label = options.tabBarLabel || route.name;

          return (
            <TabButton
              key={route.key}
              icon={icon}
              label={label}
              isActive={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.lg,
  },
  
  tabBar: {
    flexDirection: 'row',
    backgroundColor: lightTheme.card,
    borderRadius: borderRadius.xxl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    ...shadows.xl,
  },
  
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  
  tabIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  
  tabIconContainerActive: {
    backgroundColor: lightTheme.primaryLight,
  },
  
  tabIcon: {
    fontSize: 24,
  },
  
  tabIconActive: {
    fontSize: 26,
  },
  
  tabLabel: {
    ...typography.labelSmall,
    color: lightTheme.textSecondary,
    fontWeight: '500',
  },
  
  tabLabelActive: {
    color: lightTheme.primary,
    fontWeight: '700',
  },
});

export default EnhancedBottomNav;
