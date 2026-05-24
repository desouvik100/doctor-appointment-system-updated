/**
 * Enterprise Doctor Card
 * Premium doctor listing with smooth interactions
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { lightTheme, colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import Badge from '../common/Badge';

const DoctorCard = ({
  doctor,
  onPress,
  onBookPress,
  style,
}) => {
  const {
    name,
    photo,
    specialization,
    experience,
    rating,
    reviewCount,
    consultationFee,
    nextAvailable,
    isOnline,
  } = doctor;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.container, style]}
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {name?.charAt(0) || 'D'}
              </Text>
            </View>
          )}
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.specialization} numberOfLines={1}>
            {specialization}
          </Text>
          <View style={styles.meta}>
            <Text style={styles.experience}>
              {experience}+ yrs exp
            </Text>
            {rating && (
              <>
                <Text style={styles.metaDivider}>•</Text>
                <Text style={styles.rating}>
                  ⭐ {rating.toFixed(1)}
                </Text>
                {reviewCount && (
                  <Text style={styles.reviewCount}>
                    ({reviewCount})
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.availability}>
          {nextAvailable ? (
            <>
              <Badge variant="success" size="small">
                Available
              </Badge>
              <Text style={styles.nextSlot}>{nextAvailable}</Text>
            </>
          ) : (
            <Badge variant="neutral" size="small">
              Busy
            </Badge>
          )}
        </View>

        <View style={styles.actions}>
          <View style={styles.feeContainer}>
            <Text style={styles.feeLabel}>Fee</Text>
            <Text style={styles.fee}>₹{consultationFee}</Text>
          </View>
          
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onBookPress?.(doctor);
            }}
            style={styles.bookButton}
            activeOpacity={0.85}
          >
            <Text style={styles.bookButtonText}>Book</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightTheme.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },

  header: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },

  avatarContainer: {
    position: 'relative',
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: lightTheme.surface,
  },

  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },

  avatarText: {
    ...typography.headlineMedium,
    color: colors.primary[700],
    fontWeight: '700',
  },

  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success[500],
    borderWidth: 2,
    borderColor: lightTheme.card,
  },

  info: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },

  name: {
    ...typography.headlineSmall,
    color: lightTheme.text,
    fontWeight: '700',
    marginBottom: 2,
  },

  specialization: {
    ...typography.bodyMedium,
    color: lightTheme.textSecondary,
    marginBottom: spacing.xs,
  },

  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  experience: {
    ...typography.bodySmall,
    color: lightTheme.textTertiary,
  },

  metaDivider: {
    ...typography.bodySmall,
    color: lightTheme.textTertiary,
    marginHorizontal: spacing.xs,
  },

  rating: {
    ...typography.bodySmall,
    color: colors.warning[600],
    fontWeight: '600',
  },

  reviewCount: {
    ...typography.bodySmall,
    color: lightTheme.textTertiary,
    marginLeft: 2,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: lightTheme.borderLight,
  },

  availability: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  nextSlot: {
    ...typography.bodySmall,
    color: lightTheme.textSecondary,
    marginLeft: spacing.sm,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  feeContainer: {
    alignItems: 'flex-end',
    marginRight: spacing.md,
  },

  feeLabel: {
    ...typography.labelSmall,
    color: lightTheme.textTertiary,
    marginBottom: 2,
  },

  fee: {
    ...typography.bodyLarge,
    color: lightTheme.text,
    fontWeight: '700',
  },

  bookButton: {
    backgroundColor: lightTheme.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },

  bookButtonText: {
    ...typography.button,
    color: '#fff',
    fontSize: 14,
  },
});

export default DoctorCard;
