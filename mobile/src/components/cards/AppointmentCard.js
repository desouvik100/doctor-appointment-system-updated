/**
 * Enterprise Appointment Card
 * Premium appointment display with actions
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
import { lightTheme, colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import Badge from '../common/Badge';

const AppointmentCard = ({
  appointment,
  onPress,
  onJoinPress,
  onReschedulePress,
  onCancelPress,
  style,
}) => {
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
      style={[styles.container, style]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F9FAFB']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.doctorInfo}>
            {doctorPhoto ? (
              <Image source={{ uri: doctorPhoto }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {doctorName?.charAt(0) || 'D'}
                </Text>
              </View>
            )}

            <View style={styles.details}>
              <Text style={styles.doctorName} numberOfLines={1}>
                {doctorName}
              </Text>
              <Text style={styles.specialty} numberOfLines={1}>
                {specialty}
              </Text>
            </View>
          </View>

          {getStatusBadge()}
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoText}>{formatDateTime(dateTime)}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>{getTypeIcon()}</Text>
            <Text style={styles.infoText}>
              {type === 'video' ? 'Video Call' : type === 'clinic' ? 'Clinic Visit' : 'Home Visit'}
            </Text>
          </View>
        </View>

        {type === 'clinic' && clinicName && (
          <View style={styles.locationContainer}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={styles.locationDetails}>
              <Text style={styles.clinicName} numberOfLines={1}>
                {clinicName}
              </Text>
              {clinicAddress && (
                <Text style={styles.clinicAddress} numberOfLines={1}>
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
                style={[styles.actionButton, styles.primaryButton]}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Join Call</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onReschedulePress?.(appointment);
              }}
              style={[styles.actionButton, styles.secondaryButton]}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>Reschedule</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onCancelPress?.(appointment);
              }}
              style={[styles.actionButton, styles.ghostButton]}
              activeOpacity={0.85}
            >
              <Text style={styles.ghostButtonText}>Cancel</Text>
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
    ...shadows.md,
  },

  gradient: {
    padding: spacing.lg,
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

  details: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },

  doctorName: {
    ...typography.headlineSmall,
    color: lightTheme.text,
    fontWeight: '700',
    marginBottom: 2,
  },

  specialty: {
    ...typography.bodyMedium,
    color: lightTheme.textSecondary,
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
    color: lightTheme.textSecondary,
  },

  locationContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
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
    color: lightTheme.text,
    fontWeight: '600',
    marginBottom: 2,
  },

  clinicAddress: {
    ...typography.bodySmall,
    color: lightTheme.textSecondary,
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
    backgroundColor: lightTheme.primary,
    ...shadows.sm,
  },

  primaryButtonText: {
    ...typography.button,
    color: '#fff',
    fontSize: 14,
  },

  secondaryButton: {
    backgroundColor: colors.primary[50],
  },

  secondaryButtonText: {
    ...typography.button,
    color: lightTheme.primary,
    fontSize: 14,
  },

  ghostButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },

  ghostButtonText: {
    ...typography.button,
    color: lightTheme.textSecondary,
    fontSize: 14,
  },
});

export default AppointmentCard;
