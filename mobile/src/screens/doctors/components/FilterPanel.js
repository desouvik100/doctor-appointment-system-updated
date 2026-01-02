/**
 * FilterPanel Component - Doctor search filters
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { colors } from '../../../theme/colors';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import Button from '../../../components/common/Button';

const { height } = Dimensions.get('window');

const SPECIALIZATIONS = [
  'Cardiologist',
  'Dermatologist',
  'General Physician',
  'Neurologist',
  'Orthopedic',
  'Pediatrician',
  'Psychiatrist',
  'Gynecologist',
  'ENT Specialist',
  'Ophthalmologist',
];

const EXPERIENCE_OPTIONS = [
  { label: 'Any', value: null },
  { label: '5+ years', value: '5' },
  { label: '10+ years', value: '10' },
  { label: '15+ years', value: '15' },
];

const FEE_OPTIONS = [
  { label: 'Any', value: null },
  { label: 'Under ₹500', value: 500 },
  { label: 'Under ₹1000', value: 1000 },
  { label: 'Under ₹2000', value: 2000 },
];

const RATING_OPTIONS = [
  { label: 'Any', value: null },
  { label: '4+ ⭐', value: 4 },
  { label: '4.5+ ⭐', value: 4.5 },
];

const AVAILABILITY_OPTIONS = [
  { label: 'Any time', value: null },
  { label: 'Available today', value: 'today' },
  { label: 'Available this week', value: 'week' },
];

const FilterPanel = ({ 
  visible, 
  filters, 
  onApply, 
  onClose, 
  onClear 
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, visible]);

  const updateFilter = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleClear = () => {
    const clearedFilters = {
      specialization: null,
      gender: null,
      experience: null,
      maxFee: null,
      availability: null,
      rating: null,
    };
    setLocalFilters(clearedFilters);
    onClear?.();
  };

  const renderChip = (label, isSelected, onPress) => (
    <TouchableOpacity
      style={[styles.chip, isSelected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearText}>Clear all</Text>
            </TouchableOpacity>
          </View>

          {/* Handle */}
          <View style={styles.handle} />

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Specialization */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specialization</Text>
              <View style={styles.chipContainer}>
                {SPECIALIZATIONS.map((spec) => (
                  renderChip(
                    spec,
                    localFilters.specialization === spec,
                    () => updateFilter('specialization', spec),
                  )
                ))}
              </View>
            </View>

            {/* Gender */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gender</Text>
              <View style={styles.chipContainer}>
                {renderChip(
                  'Male',
                  localFilters.gender === 'male',
                  () => updateFilter('gender', 'male'),
                )}
                {renderChip(
                  'Female',
                  localFilters.gender === 'female',
                  () => updateFilter('gender', 'female'),
                )}
              </View>
            </View>

            {/* Experience */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Experience</Text>
              <View style={styles.chipContainer}>
                {EXPERIENCE_OPTIONS.map((opt) => (
                  renderChip(
                    opt.label,
                    localFilters.experience === opt.value,
                    () => updateFilter('experience', opt.value),
                  )
                ))}
              </View>
            </View>

            {/* Consultation Fee */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Consultation Fee</Text>
              <View style={styles.chipContainer}>
                {FEE_OPTIONS.map((opt) => (
                  renderChip(
                    opt.label,
                    localFilters.maxFee === opt.value,
                    () => updateFilter('maxFee', opt.value),
                  )
                ))}
              </View>
            </View>

            {/* Rating */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rating</Text>
              <View style={styles.chipContainer}>
                {RATING_OPTIONS.map((opt) => (
                  renderChip(
                    opt.label,
                    localFilters.rating === opt.value,
                    () => updateFilter('rating', opt.value),
                  )
                ))}
              </View>
            </View>

            {/* Availability */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Availability</Text>
              <View style={styles.chipContainer}>
                {AVAILABILITY_OPTIONS.map((opt) => (
                  renderChip(
                    opt.label,
                    localFilters.availability === opt.value,
                    () => updateFilter('availability', opt.value),
                  )
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Apply Filters"
              onPress={handleApply}
              fullWidth
              size="large"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: height * 0.85,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.divider,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  title: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
  },
  clearText: {
    ...typography.labelMedium,
    color: colors.primary,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.labelLarge,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.labelMedium,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});

export default FilterPanel;
