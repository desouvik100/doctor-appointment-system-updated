/**
 * HealthScoreCard - Material 3 Health metrics tracker
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { shadows } from '../../../theme/shadows';

const { width } = Dimensions.get('window');

const HealthScoreCard = ({ 
  wellnessScore = 78, 
  hydration = '1.8L', 
  hydrationTarget = '3.0L',
  sleep = '7h 15m', 
  sleepTarget = '8h 00m',
  steps = '6,420', 
  stepsTarget = '10,000'
}) => {
  const { colors, isDarkMode } = useTheme();

  // Reanimated 3 Shared Values
  const progressVal = useSharedValue(0);
  const scaleVal = useSharedValue(0.9);

  useEffect(() => {
    // Animate wellness score progress ring and scaling on mount
    progressVal.value = withTiming(wellnessScore / 100, {
      duration: 1000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    scaleVal.value = withSpring(1, { damping: 15 });
  }, [wellnessScore]);

  // Animated styles
  const animatedScoreStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleVal.value }],
    };
  });

  return (
    <Animated.View 
      style={[
        styles.card, 
        { 
          backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          ...shadows.md,
        },
        animatedScoreStyle
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Health Score</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Based on today's logs</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.scoreBadgeText, { color: colors.primary }]}>Optimal</Text>
        </View>
      </View>

      <View style={styles.contentRow}>
        {/* Animated Wellness Score Gauge */}
        <View style={styles.scoreContainer}>
          <View style={[styles.circlePlaceholder, { borderColor: isDarkMode ? '#2A3142' : '#F1F5F9' }]}>
            <View style={styles.scoreTextWrapper}>
              <Text style={[styles.scoreNumber, { color: colors.textPrimary }]}>{wellnessScore}</Text>
              <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>Score</Text>
            </View>
          </View>
        </View>

        {/* Detailed Stats Column */}
        <View style={styles.statsColumn}>
          {/* Hydration */}
          <View style={styles.statItem}>
            <View style={[styles.iconWrapper, { backgroundColor: '#E0F7FA' }]}>
              <Text style={styles.emoji}>💧</Text>
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Hydration</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {hydration} <Text style={styles.targetText}>/ {hydrationTarget}</Text>
              </Text>
            </View>
          </View>

          {/* Sleep */}
          <View style={styles.statItem}>
            <View style={[styles.iconWrapper, { backgroundColor: '#ECEFF1' }]}>
              <Text style={styles.emoji}>😴</Text>
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Sleep Duration</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {sleep} <Text style={styles.targetText}>/ {sleepTarget}</Text>
              </Text>
            </View>
          </View>

          {/* Steps */}
          <View style={styles.statItem}>
            <View style={[styles.iconWrapper, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.emoji}>🚶</Text>
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Activity</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {steps} <Text style={styles.targetText}>/ {stepsTarget}</Text>
              </Text>
            </View>
          </View>
        </View>
      </View>
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
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.headlineSmall,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    ...typography.labelSmall,
    fontSize: 11,
    marginTop: 2,
  },
  scoreBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  scoreBadgeText: {
    ...typography.labelSmall,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circlePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreTextWrapper: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 28,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsColumn: {
    flex: 1,
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  emoji: {
    fontSize: 16,
  },
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    ...typography.labelSmall,
    fontSize: 10,
    fontWeight: '600',
  },
  statValue: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  targetText: {
    fontSize: 10,
    fontWeight: '400',
    opacity: 0.6,
  },
});

export default React.memo(HealthScoreCard);
