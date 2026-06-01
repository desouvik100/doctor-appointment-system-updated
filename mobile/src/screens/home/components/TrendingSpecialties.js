/**
 * TrendingSpecialties - Compact specialty selection pills
 */

import React from 'react';
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

const SPECIALTIES = [
  { id: 'cardiology', label: 'Cardiology', searchKey: 'Cardiologist', icon: '❤️', color: '#EF4444' },
  { id: 'dental', label: 'Dental', searchKey: 'Dentist', icon: '🦷', color: '#3B82F6' },
  { id: 'pediatrics', label: 'Pediatrics', searchKey: 'Pediatrician', icon: '👶', color: '#10B981' },
  { id: 'orthopedics', label: 'Orthopedics', searchKey: 'Orthopedist', icon: '🦴', color: '#F59E0B' },
  { id: 'dermatology', label: 'Dermatology', searchKey: 'Dermatologist', icon: '🧴', color: '#EC4899' },
];

const SpecialtyChip = ({ item, index }) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.92);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 60)}
      style={[animatedStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => navigation.navigate('DoctorSearch', { specialty: item.searchKey })}
        style={[
          styles.chip,
          {
            backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            ...shadows.sm,
          },
        ]}
      >
        <Text style={styles.icon}>{item.icon}</Text>
        <Text style={[styles.label, { color: colors.textPrimary }]}>{item.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const TrendingSpecialties = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Trending Specialties</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Find doctors by categorical filter</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {SPECIALTIES.map((item, index) => (
          <SpecialtyChip key={item.id} item={item} index={index} />
        ))}
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
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 36,
    gap: 6,
  },
  icon: {
    fontSize: 12,
  },
  label: {
    ...typography.bodyMedium,
    fontWeight: '700',
    fontSize: 11.5,
  },
});

export default React.memo(TrendingSpecialties);
