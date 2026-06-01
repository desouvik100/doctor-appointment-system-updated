/**
 * QuickActions Component - Premium Healthcare Service Cards
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { shadows } from '../../../theme/shadows';

const ACTIONS = [
  {
    id: 'book',
    icon: '🩺',
    label: 'Book Clinic',
    description: 'In-person checkups',
    screen: 'DoctorSearch',
    color: '#00D4AA',
  },
  {
    id: 'video',
    icon: '🎥',
    label: 'Video Consult',
    description: 'Connect in 10 mins',
    screen: 'VideoConsult',
    color: '#6C5CE7',
  },
  {
    id: 'lab',
    icon: '🧪',
    label: 'Lab Tests',
    description: 'Home sample pickup',
    screen: 'LabTests',
    color: '#FF7675',
  },
  {
    id: 'records',
    icon: '📄',
    label: 'Medical Reports',
    description: 'View file & history',
    screen: 'Records',
    color: '#FDCB6E',
  },
  {
    id: 'meds',
    icon: '💊',
    label: 'Medicines',
    description: 'Express delivery',
    screen: 'Medicine',
    color: '#0984E3',
  },
  {
    id: 'emergency',
    icon: '🚑',
    label: 'Emergency SOS',
    description: 'Ambulance dispatch',
    screen: 'Emergency',
    color: '#D63031',
  },
];

const QuickActions = () => {
  const { colors, isDarkMode } = useTheme();
  // Obtain navigation reference directly via hook for reusability
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Our Services</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>6 core features</Text>
      </View>
      <View style={styles.grid}>
        {ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.card,
              {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                ...shadows.sm,
              },
            ]}
            onPress={() => navigation.navigate(action.screen)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: action.color + '15' }]}>
              <Text style={styles.icon}>{action.icon}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>{action.label}</Text>
              <Text style={[styles.description, { color: colors.textMuted }]}>{action.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headlineMedium,
    fontWeight: '800',
  },
  subtitle: {
    ...typography.labelSmall,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  card: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
  textContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  label: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '700',
  },
  description: {
    ...typography.labelSmall,
    fontSize: 9,
    marginTop: 1,
    lineHeight: 12,
  },
});

export default QuickActions;
