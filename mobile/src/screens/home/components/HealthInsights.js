/**
 * HealthInsights - Personalized daily wellness tips
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, { 
  FadeInDown,
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { shadows } from '../../../theme/shadows';

const { width } = Dimensions.get('window');

const INSIGHTS = [
  {
    id: 'morning',
    title: 'Start Hydrated',
    tip: 'Drinking water first thing in the morning boosts metabolism and cleanses your digestive tract.',
    action: 'Log Water 💧',
    color: '#00D4AA',
  },
  {
    id: 'afternoon',
    title: 'Rest Your Eyes',
    tip: 'Follow the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds.',
    action: 'Take Break 👁️',
    color: '#6C5CE7',
  },
  {
    id: 'evening',
    title: 'Unwind Mindfully',
    tip: 'A 5-minute deep breathing session before dinner lowers stress levels and improves digestion.',
    action: 'Breathe 🧘',
    color: '#FF7675',
  },
  {
    id: 'night',
    title: 'Optimize Sleep',
    tip: 'Avoid blue light screens at least 1 hour before sleeping to boost melatonin production naturally.',
    action: 'Sleep Mode 😴',
    color: '#0984E3',
  }
];

const HealthInsights = ({ userFirstName = 'there' }) => {
  const { colors, isDarkMode } = useTheme();
  const scale = useSharedValue(1);

  const activeInsight = useMemo(() => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) return INSIGHTS[0]; // Morning
    if (hours >= 12 && hours < 17) return INSIGHTS[1]; // Afternoon
    if (hours >= 17 && hours < 21) return INSIGHTS[2]; // Evening
    return INSIGHTS[3]; // Night
  }, []);

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(200)}
      style={[animatedStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            ...shadows.md,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: activeInsight.color + '15' }]}>
            <Text style={[styles.badgeText, { color: activeInsight.color }]}>Personalized Insight</Text>
          </View>
          <Text style={styles.avatarEmoji}>💡</Text>
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {activeInsight.title}, {userFirstName}
        </Text>
        <Text style={[styles.tipText, { color: colors.textSecondary }]}>
          {activeInsight.tip}
        </Text>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: activeInsight.color }]}
            activeOpacity={0.8}
          >
            <Text style={styles.actionText}>{activeInsight.action}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    ...typography.labelSmall,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  avatarEmoji: {
    fontSize: 18,
  },
  title: {
    ...typography.headlineSmall,
    fontSize: 15,
    fontWeight: '850',
    marginBottom: spacing.xs,
  },
  tipText: {
    ...typography.bodyMedium,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default React.memo(HealthInsights);
