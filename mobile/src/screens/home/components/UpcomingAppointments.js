/**
 * UpcomingAppointments - Premium card with emotional empty state
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { useTheme } from '../../../context/ThemeContext';
import Avatar from '../../../components/common/Avatar';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const UpcomingAppointments = ({ appointments = [], navigation, onJoinCall, onReschedule, maxDisplay = 3 }) => {
  const { colors } = useTheme();
  const [countdown, setCountdown] = useState('');
  const displayAppointments = appointments.slice(0, maxDisplay);
  const nextAppointment = displayAppointments[0];

  useEffect(() => {
    if (!nextAppointment) return;
    const update = () => {
      const diff = dayjs(nextAppointment.dateTime).diff(dayjs(), 'minute');
      if (diff <= 0) setCountdown('Starting now');
      else if (diff < 60) setCountdown(`In ${diff} min`);
      else if (diff < 1440) setCountdown(`In ${Math.floor(diff / 60)}h ${diff % 60}m`);
      else setCountdown(dayjs(nextAppointment.dateTime).fromNow());
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [nextAppointment]);

  if (!displayAppointments.length) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upcoming Appointments</Text>
        </View>
        <View style={[styles.emptyCard, { backgroundColor: 'rgba(26, 31, 46, 0.45)', borderColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1 }]}>
          <Text style={styles.emptyIllustration}>👨‍⚕️</Text>
          <Text style={[styles.emptyTitle, { color: colors.primary }]}>You're all set!</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Let's book your first checkup and stay ahead of your health.
          </Text>
          <View style={styles.emptyActions}>
            <TouchableOpacity onPress={() => navigation.navigate('Booking')} activeOpacity={0.85}>
              <LinearGradient colors={['#00D4AA', '#00B894']} style={styles.bookBtn}>
                <Text style={styles.bookBtnText}>Book a Consultation →</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Booking')} style={styles.exploreBtn} activeOpacity={0.8}>
              <Text style={[styles.exploreBtnText, { color: colors.primary }]}>Explore doctors</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upcoming Appointments</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>

      {/* Featured card */}
      <LinearGradient colors={['rgba(26, 31, 46, 0.8)', 'rgba(10, 14, 23, 0.5)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featuredCard}>
        <View style={styles.countdownBadge}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
        <View style={styles.apptHeader}>
          <Avatar name={nextAppointment.doctorName} size="medium" source={nextAppointment.doctorPhoto ? { uri: nextAppointment.doctorPhoto } : null} />
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{nextAppointment.doctorName}</Text>
            <Text style={styles.specialty}>{nextAppointment.specialty}</Text>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{nextAppointment.type === 'video' ? '📹 Video' : '🏥 Clinic'}</Text>
          </View>
        </View>
        <View style={styles.apptDetails}>
          <Text style={styles.detailText}>📅 {dayjs(nextAppointment.dateTime).format('MMM D, YYYY')}</Text>
          <Text style={styles.detailText}>⏰ {dayjs(nextAppointment.dateTime).format('h:mm A')}</Text>
        </View>
        <View style={styles.apptActions}>
          <TouchableOpacity style={styles.actionBtnGhost} onPress={() => onReschedule?.(nextAppointment)}>
            <Text style={styles.actionBtnGhostText}>Reschedule</Text>
          </TouchableOpacity>
          {nextAppointment.type === 'video' && (
            <TouchableOpacity style={styles.actionBtnSolidWrapper} onPress={() => onJoinCall?.(nextAppointment)} activeOpacity={0.85}>
              <LinearGradient colors={['#00D4AA', '#00B894']} style={styles.actionBtnSolid}>
                <Text style={styles.actionBtnSolidText}>Join Call</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Other appointments */}
      {displayAppointments.slice(1).map((apt, i) => (
        <TouchableOpacity key={apt.id || i}
          style={[styles.listItem, { backgroundColor: 'rgba(26, 31, 46, 0.45)', borderColor: 'rgba(255, 255, 255, 0.06)', borderWidth: 1 }]}
          onPress={() => navigation.navigate('AppointmentDetails', { appointment: apt })}>
          <Avatar name={apt.doctorName} size="medium" source={apt.doctorPhoto ? { uri: apt.doctorPhoto } : null} />
          <View style={styles.listContent}>
            <Text style={[styles.listDoctorName, { color: colors.textPrimary }]}>{apt.doctorName}</Text>
            <Text style={[styles.listDateTime, { color: colors.textSecondary }]}>{dayjs(apt.dateTime).format('MMM D, h:mm A')}</Text>
          </View>
          <Text style={styles.listType}>{apt.type === 'video' ? '📹' : '🏥'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xxl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  sectionTitle: { ...typography.headlineSmall, fontWeight: '700' },
  seeAll: { ...typography.labelMedium },

  // Empty state
  emptyCard: { borderRadius: borderRadius.xl, padding: spacing.xxl, alignItems: 'center' },
  emptyIllustration: { fontSize: 64, marginBottom: spacing.md },
  emptyTitle: { ...typography.headlineMedium, fontWeight: '800', marginBottom: spacing.sm },
  emptyText: { ...typography.bodyMedium, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 22 },
  emptyActions: { width: '100%', gap: spacing.sm },
  bookBtn: { borderRadius: borderRadius.lg, paddingVertical: spacing.md, alignItems: 'center' },
  bookBtnText: { color: '#fff', ...typography.button, fontWeight: '700' },
  exploreBtn: { paddingVertical: spacing.sm, alignItems: 'center' },
  exploreBtnText: { ...typography.labelMedium, fontWeight: '600' },

  // Featured card
  featuredCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 212, 170, 0.25)',
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  countdownBadge: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 212, 170, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.35)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  countdownText: { color: '#00D4AA', ...typography.labelSmall, fontWeight: '700' },
  apptHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  doctorInfo: { flex: 1, marginLeft: spacing.md },
  doctorName: { color: '#fff', ...typography.bodyLarge, fontWeight: '700' },
  specialty: { color: 'rgba(255,255,255,0.7)', ...typography.bodySmall, marginTop: 2 },
  typeBadge: {
    backgroundColor: 'rgba(108, 92, 231, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.35)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  typeText: { color: '#A29BFE', ...typography.labelSmall },
  apptDetails: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  detailText: { color: 'rgba(255,255,255,0.9)', ...typography.bodySmall, fontWeight: '500' },
  apptActions: { flexDirection: 'row', gap: spacing.sm },
  actionBtnGhost: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionBtnGhostText: { color: '#fff', ...typography.labelSmall, fontWeight: '600' },
  actionBtnSolidWrapper: { flex: 1 },
  actionBtnSolid: {
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  actionBtnSolidText: { color: '#fff', ...typography.labelSmall, fontWeight: '700' },

  // List items
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  listContent: { flex: 1, marginLeft: spacing.md },
  listDoctorName: { ...typography.bodyMedium, fontWeight: '600' },
  listDateTime: { ...typography.bodySmall, marginTop: 2 },
  listType: { fontSize: 18 },
});

export default UpcomingAppointments;
