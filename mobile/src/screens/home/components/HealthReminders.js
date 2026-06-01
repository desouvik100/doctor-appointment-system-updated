/**
 * HealthReminders - Personalised clinical reminders and medication tasks
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  FadeInRight,
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { shadows } from '../../../theme/shadows';

const HealthReminders = () => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  
  // Dynamic state for marking medication as taken
  const [medsTaken, setMedsTaken] = useState(false);

  const handleMedsToggle = () => {
    setMedsTaken(!medsTaken);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Daily Health Tasks</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Actionable clinical reminders</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {/* Medication Reminder */}
        <Animated.View
          entering={FadeInRight.delay(100)}
          style={[
            styles.card,
            {
              backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              ...shadows.sm,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.badge, { backgroundColor: '#E0F2FE' }]}>
              <Text style={[styles.badgeText, { color: '#0369A1' }]}>Medication</Text>
            </View>
            <Text style={styles.emoji}>💊</Text>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            Dolo 650mg
          </Text>
          <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={1}>
            Next dose at 2:00 PM • After food
          </Text>

          <TouchableOpacity
            style={[
              styles.actionButton,
              medsTaken ? styles.actionButtonSuccess : { backgroundColor: colors.primary }
            ]}
            onPress={handleMedsToggle}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>
              {medsTaken ? '✓ Taken' : 'Mark as Taken'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Follow-up Reminder */}
        <Animated.View
          entering={FadeInRight.delay(200)}
          style={[
            styles.card,
            {
              backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              ...shadows.sm,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.badge, { backgroundColor: '#F3E8FF' }]}>
              <Text style={[styles.badgeText, { color: '#6B21A8' }]}>Follow-up</Text>
            </View>
            <Text style={styles.emoji}>🩺</Text>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            Review with Cardiologist
          </Text>
          <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={1}>
            Dr. Sarah Wilson • Due in 2 days
          </Text>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.secondary || '#6C5CE7' }]}
            onPress={() => navigation.navigate('DoctorSearch', { specialty: 'Cardiologist' })}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>Book Slot</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Lab Test Reminder */}
        <Animated.View
          entering={FadeInRight.delay(300)}
          style={[
            styles.card,
            {
              backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              ...shadows.sm,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.badgeText, { color: '#B45309' }]}>Lab Test</Text>
            </View>
            <Text style={styles.emoji}>🧪</Text>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            Fasting Blood Sugar
          </Text>
          <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={1}>
            Due tomorrow • Fast for 10 hours
          </Text>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF7675' }]}
            onPress={() => navigation.navigate('LabTests')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>Schedule Pickup</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
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
  horizontalScroll: {
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  card: {
    width: 200,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    height: 145,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  badgeText: {
    ...typography.labelSmall,
    fontSize: 8.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emoji: {
    fontSize: 16,
  },
  title: {
    ...typography.bodyMedium,
    fontWeight: '700',
    fontSize: 13.5,
    marginTop: spacing.xs,
  },
  desc: {
    fontSize: 9.5,
  },
  actionButton: {
    borderRadius: borderRadius.sm,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  actionButtonSuccess: {
    backgroundColor: '#10B981',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default React.memo(HealthReminders);
