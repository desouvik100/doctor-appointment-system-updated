/**
 * ContinueJourney - Premium unified booking progress indicator card (V4 Refined)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  FadeInDown,
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { shadows } from '../../../theme/shadows';
import Avatar from '../../../components/common/Avatar';

const ContinueJourney = ({ items = [] }) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();

  if (!items || items.length === 0) {
    return null;
  }

  // Focus on the highest-priority pending task (the first item)
  const activeTask = items[0];
  const scale = useSharedValue(1);

  // Fallback values for layout details
  const doctorName = activeTask.description?.split(' - ')[0] || 'Dr. Sarah Wilson';
  const specialty = activeTask.description?.split(' - ')[1] || 'Cardiologist';
  const selectedDate = 'Friday, June 5';
  const selectedSlot = '10:30 AM';
  const pendingStepAction = activeTask.id === 'payment' 
    ? '💳 Click to authorize ₹150.00 payment' 
    : '🩺 Complete booking slot selection';

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 12 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(15)}
      style={[styles.container, animatedStyle]}
    >
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Resume Booking</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Complete your active slot request</Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.95}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => navigation.navigate(activeTask.screen, activeTask.params)}
        style={[
          styles.card,
          {
            backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            ...shadows.md,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.doctorWrapper}>
            <Avatar name={doctorName} size="medium" />
            <View style={styles.doctorTextWrapper}>
              <Text style={[styles.docName, { color: colors.textPrimary }]}>{doctorName}</Text>
              <Text style={[styles.docSpec, { color: colors.textMuted }]}>{specialty}</Text>
            </View>
          </View>
          <View style={[styles.pendingStepBadge, { backgroundColor: activeTask.color + '15' }]}>
            <Text style={[styles.pendingStepBadgeText, { color: activeTask.color }]}>Pending Action</Text>
          </View>
        </View>

        {/* Selected Slot Information */}
        <View style={[styles.slotDetailsCard, { backgroundColor: isDarkMode ? '#171E2D' : '#F8FAFC' }]}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Selected Date</Text>
            <Text style={[styles.detailVal, { color: colors.textPrimary }]}>📅 {selectedDate}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Time Slot</Text>
            <Text style={[styles.detailVal, { color: colors.textPrimary }]}>🕒 {selectedSlot}</Text>
          </View>
        </View>

        {/* Action Prompt */}
        <View style={styles.footerRow}>
          <Text style={[styles.pendingStepText, { color: colors.textPrimary }]}>
            {pendingStepAction}
          </Text>
          <Text style={[styles.resumeText, { color: activeTask.color }]}>Resume ➔</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.headlineSmall,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    ...typography.labelSmall,
    fontSize: 11,
    marginTop: 2,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    height: 185,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doctorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  doctorTextWrapper: {
    flex: 1,
  },
  docName: {
    ...typography.bodyMedium,
    fontSize: 14,
    fontWeight: '800',
  },
  docSpec: {
    ...typography.labelSmall,
    fontSize: 10.5,
    marginTop: 1,
  },
  pendingStepBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  pendingStepBadgeText: {
    fontSize: 8.5,
    fontWeight: '850',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slotDetailsCard: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 8.5,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailVal: {
    fontSize: 11.5,
    fontWeight: '750',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  pendingStepText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  resumeText: {
    fontSize: 11.5,
    fontWeight: '950',
    marginLeft: spacing.sm,
  },
});

export default React.memo(ContinueJourney);
