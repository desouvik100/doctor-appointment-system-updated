/**
 * Enterprise Appointment Card - Dynamic Theme & Premium Edition
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import { shadows } from '../../theme/shadows';
import Badge from '../common/Badge';

const AppointmentCard = ({
  appointment,
  onPress,
  onJoinPress,
  onReschedulePress,
  onCancelPress,
  onReviewPress,
  style,
}) => {
  const { colors, isDarkMode } = useTheme();
  const {
    doctorName,
    doctorPhoto,
    specialty,
    dateTime,
    type,
    status = 'upcoming',
    clinicName,
    clinicAddress,
  } = appointment;

  const getStatusBadge = () => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="info" size="small">Upcoming</Badge>;
      case 'completed':
        return <Badge variant="success" size="small">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="error" size="small">Cancelled</Badge>;
      case 'ongoing':
        return <Badge variant="warning" size="small">Ongoing</Badge>;
      default:
        return null;
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'video':
        return '📹';
      case 'clinic':
        return '🏥';
      case 'home':
        return '🏠';
      default:
        return '📅';
    }
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateStr;
    if (date.toDateString() === today.toDateString()) {
      dateStr = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateStr = 'Tomorrow';
    } else {
      dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${dateStr}, ${timeStr}`;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.container,
        {
          ...shadows.md,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={isDarkMode ? ['rgba(26, 31, 46, 0.55)', 'rgba(10, 14, 23, 0.15)'] : [colors.backgroundCard || '#FFFFFF', colors.surfaceLight || '#F9FAFB']}
        style={[
          styles.gradient,
          {
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            borderWidth: isDarkMode ? 1 : 0,
          }
        ]}
      >
        <View style={styles.header}>
          <View style={styles.doctorInfo}>
            {doctorPhoto ? (
              <Image source={{ uri: doctorPhoto }} style={[styles.avatar, { backgroundColor: colors.surface }]} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primaryLight || 'rgba(0, 212, 170, 0.15)' }]}>
                <Text style={[styles.avatarText, { color: colors.primary, lineHeight: 28 }]}>
                  {doctorName?.charAt(0) || 'D'}
                </Text>
              </View>
            )}

            <View style={styles.details}>
              <Text style={[styles.doctorName, { color: colors.textPrimary }]} numberOfLines={1}>
                {doctorName}
              </Text>
              <Text style={[styles.specialty, { color: colors.textSecondary }]} numberOfLines={1}>
                {specialty}
              </Text>
            </View>
          </View>

          {getStatusBadge()}
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{formatDateTime(dateTime)}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>{getTypeIcon()}</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {type === 'video' ? 'Video Call' : type === 'clinic' ? 'Clinic Visit' : 'Home Visit'}
            </Text>
          </View>
        </View>

        {type === 'clinic' && clinicName && (
          <View style={[styles.locationContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : colors.neutralLight || '#F3F4F6' }]}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={styles.locationDetails}>
              <Text style={[styles.clinicName, { color: colors.textPrimary }]} numberOfLines={1}>
                {clinicName}
              </Text>
              {clinicAddress && (
                <Text style={[styles.clinicAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                  {clinicAddress}
                </Text>
              )}
            </View>
          </View>
        )}

        {status === 'upcoming' && (
          <View style={styles.actions}>
            {type === 'video' && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onJoinPress?.(appointment);
                }}
                style={[styles.actionButton, styles.primaryButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.primaryButtonText, { color: colors.textInverse || '#fff' }]}>Join Call</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onReschedulePress?.(appointment);
              }}
              style={[
                styles.actionButton, 
                styles.secondaryButton, 
                { backgroundColor: colors.primaryLight || 'rgba(0, 212, 170, 0.15)' }
              ]}
              activeOpacity={0.85}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Reschedule</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onCancelPress?.(appointment);
              }}
              style={[
                styles.actionButton, 
                styles.ghostButton, 
                { borderColor: colors.divider || '#E5E7EB' }
              ]}
              activeOpacity={0.85}
            >
              <Text style={[styles.ghostButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'completed' && (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onReviewPress?.(appointment);
              }}
              style={[styles.actionButton, styles.primaryButton, { backgroundColor: colors.primary, flex: 0 }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryButtonText, { color: colors.textInverse || '#fff', paddingHorizontal: spacing.xl }]}>Write Review</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },

  gradient: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },

  doctorInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: spacing.md,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
  },

  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontFamily: typography.headlineMedium?.fontFamily,
    fontSize: typography.headlineMedium?.fontSize,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },

  details: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },

  doctorName: {
    ...typography.headlineSmall,
    fontWeight: '700',
    marginBottom: 2,
  },

  specialty: {
    ...typography.bodyMedium,
  },

  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },

  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },

  infoIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },

  infoText: {
    ...typography.bodyMedium,
  },

  locationContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  locationIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },

  locationDetails: {
    flex: 1,
  },

  clinicName: {
    ...typography.bodyMedium,
    fontWeight: '600',
    marginBottom: 2,
  },

  clinicAddress: {
    ...typography.bodySmall,
  },

  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButton: {
    ...shadows.sm,
  },

  primaryButtonText: {
    ...typography.button,
    fontSize: 14,
  },

  secondaryButton: {
  },

  secondaryButtonText: {
    ...typography.button,
    fontSize: 14,
  },

  ghostButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },

  ghostButtonText: {
    ...typography.button,
    fontSize: 14,
  },
});

export default React.memo(AppointmentCard);
