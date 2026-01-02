/**
 * QuickActions Component - Grid of service icons for quick navigation
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');

const QuickActions = ({ navigation }) => {
  const { colors } = useTheme();
  
  const QUICK_ACTIONS = [
    { id: 'book', icon: '📅', label: 'Book\nAppointment', color: colors.primary, screen: 'Booking' },
    { id: 'video', icon: '📹', label: 'Video\nConsult', color: colors.secondary, screen: 'VideoConsult' },
    { id: 'lab', icon: '🧪', label: 'Lab Tests', color: colors.warning, screen: 'LabTests' },
    { id: 'meds', icon: '💊', label: 'Medicine', color: colors.info, screen: 'Medicine' },
    { id: 'records', icon: '📋', label: 'Records', color: colors.accent, screen: 'Records' },
    { id: 'imaging', icon: '🩻', label: 'Imaging', color: '#6366f1', screen: 'MedicalImaging' },
    { id: 'emergency', icon: '🚑', label: 'Emergency', color: colors.error, screen: 'Emergency' },
    { id: 'wallet', icon: '💳', label: 'Wallet', color: '#10b981', screen: 'Wallet' },
  ];

  const handlePress = (screen) => {
    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
      <View style={styles.grid}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionItem}
            onPress={() => handlePress(action.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${action.color}20` }]}>
              <Text style={styles.icon}>{action.icon}</Text>
            </View>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.headlineSmall,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    alignItems: 'center',
    width: (width - spacing.xl * 2 - spacing.md * 3) / 4,
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 24,
  },
  label: {
    ...typography.labelMedium,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default QuickActions;
