/**
 * UpcomingAppointments Component - Display next appointments with countdown
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { useTheme } from '../../../context/ThemeContext';
import Avatar from '../../../components/common/Avatar';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const UpcomingAppointments = ({ 
  appointments = [], 
  navigation, 
  onJoinCall,
  onReschedule,
  maxDisplay = 3 
}) => {
  const { colors } = useTheme();
  const [countdown, setCountdown] = useState('');
  
  const displayAppointments = appointments.slice(0, maxDisplay);
  const nextAppointment = displayAppointments[0];

  useEffect(() => {
    if (!nextAppointment) return;

    const updateCountdown = () => {
      const appointmentTime = dayjs(nextAppointment.dateTime);
      const now = dayjs();
      const diff = appointmentTime.diff(now, 'minute');

      if (diff <= 0) {
        setCountdown('Starting now');
      } else if (diff < 60) {
        setCountdown(`In ${diff} min`);
      } else if (diff < 1440) {
        const hours = Math.floor(diff / 60);
        setCountdown(`In ${hours}h ${diff % 60}m`);
      } else {
        setCountdown(appointmentTime.fromNow());
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [nextAppointment]);

  if (!displayAppointments.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upcoming Appointments</Text>
        </View>
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No upcoming appointments</Text>
          <TouchableOpacity 
            style={[styles.bookButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Booking')}
          >
            <Text style={[styles.bookButtonText, { color: colors.textInverse }]}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upcoming Appointments</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>

      {/* Featured Next Appointment */}
      {nextAppointment && (
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featuredCard}
        >
          <View style={styles.countdownBadge}>
            <Text style={[styles.countdownText, { color: colors.textInverse }]}>{countdown}</Text>
          </View>

          <View style={styles.appointmentHeader}>
            <View style={styles.appointmentInfo}>
              <Avatar name={nextAppointment.doctorName} size="large" />
              <View style={styles.doctorInfo}>
                <Text style={[styles.doctorName, { color: colors.textInverse }]}>{nextAppointment.doctorName}</Text>
                <Text style={styles.specialty}>{nextAppointment.specialty}</Text>
              </View>
            </View>
            <View style={styles.typeBadge}>
              <Text style={[styles.typeText, { color: colors.textInverse }]}>
                {nextAppointment.type === 'video' ? '📹 Video' : '🏥 In-person'}
              </Text>
            </View>
          </View>

          <View style={styles.appointmentDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={[styles.detailText, { color: colors.textInverse }]}>
                {dayjs(nextAppointment.dateTime).format('MMM D, YYYY')}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>⏰</Text>
              <Text style={[styles.detailText, { color: colors.textInverse }]}>
                {dayjs(nextAppointment.dateTime).format('h:mm A')}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => onReschedule?.(nextAppointment)}
            >
              <Text style={[styles.actionBtnText, { color: colors.textInverse }]}>Reschedule</Text>
            </TouchableOpacity>
            {nextAppointment.type === 'video' && (
              <TouchableOpacity 
                style={[styles.actionBtn, styles.actionBtnPrimary, { backgroundColor: colors.textInverse }]}
                onPress={() => onJoinCall?.(nextAppointment)}
              >
                <Text style={[styles.actionBtnTextPrimary, { color: colors.primary }]}>Join Call</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      )}

      {/* Other Appointments List */}
      {displayAppointments.slice(1).map((appointment, index) => (
        <TouchableOpacity 
          key={appointment.id || index}
          style={[styles.listItem, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('AppointmentDetails', { appointment })}
        >
          <Avatar name={appointment.doctorName} size="medium" />
          <View style={styles.listItemContent}>
            <Text style={[styles.listDoctorName, { color: colors.textPrimary }]}>{appointment.doctorName}</Text>
            <Text style={[styles.listDateTime, { color: colors.textSecondary }]}>
              {dayjs(appointment.dateTime).format('MMM D, h:mm A')}
            </Text>
          </View>
          <Text style={styles.listType}>
            {appointment.type === 'video' ? '📹' : '🏥'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.headlineSmall,
  },
  seeAll: {
    ...typography.labelMedium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    borderRadius: borderRadius.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.bodyMedium,
    marginBottom: spacing.lg,
  },
  bookButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  bookButtonText: {
    ...typography.buttonSmall,
  },
  featuredCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  countdownBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  countdownText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  appointmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorInfo: {
    marginLeft: spacing.md,
  },
  doctorName: {
    ...typography.headlineSmall,
  },
  specialty: {
    ...typography.bodyMedium,
    color: 'rgba(0,0,0,0.6)',
    marginTop: 2,
  },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.xl,
  },
  typeText: {
    ...typography.labelSmall,
  },
  appointmentDetails: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  detailText: {
    ...typography.bodyMedium,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionBtnPrimary: {},
  actionBtnText: {
    ...typography.buttonSmall,
  },
  actionBtnTextPrimary: {
    ...typography.buttonSmall,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  listItemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  listDoctorName: {
    ...typography.bodyMedium,
    fontWeight: '500',
  },
  listDateTime: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  listType: {
    fontSize: 18,
  },
});

export default UpcomingAppointments;
