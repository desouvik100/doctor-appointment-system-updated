/**
 * QuickBookActions - Visually dominant hero actions for booking
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { shadows } from '../../../theme/shadows';

const { width } = Dimensions.get('window');
const BUTTON_WIDTH = (width - spacing.lg * 2 - spacing.md) / 2;

const BookingButton = ({ label, subtext, icon, color, screen, params }) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.94, { damping: 10, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    navigation.navigate(screen, params);
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[
          styles.btn,
          {
            width: BUTTON_WIDTH,
            backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.05)',
            ...shadows.md,
          },
        ]}
      >
        <View style={[styles.iconWrapper, { backgroundColor: color + '15' }]}>
          <Text style={[styles.icon, { color }]}>{icon}</Text>
        </View>
        <View style={styles.textWrapper}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
          <Text style={[styles.subtext, { color: colors.textMuted }]}>{subtext}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const QuickBookActions = () => {
  return (
    <View style={styles.container}>
      <BookingButton 
        label="Book Doctor" 
        subtext="Find clinics & visit" 
        icon="🩺" 
        color="#00D4AA" 
        screen="DoctorSearch" 
        params={{}} 
      />
      <BookingButton 
        label="Video Consult" 
        subtext="Connect in 10 mins" 
        icon="🎥" 
        color="#6C5CE7" 
        screen="VideoConsult" 
        params={{}} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  btn: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    height: 125,
    justifyContent: 'space-between',
    elevation: 3,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  textWrapper: {
    marginTop: spacing.sm,
  },
  label: {
    ...typography.bodyMedium,
    fontWeight: '900',
    fontSize: 15,
  },
  subtext: {
    ...typography.labelSmall,
    fontSize: 10,
    marginTop: 2,
  },
});

export default React.memo(QuickBookActions);
