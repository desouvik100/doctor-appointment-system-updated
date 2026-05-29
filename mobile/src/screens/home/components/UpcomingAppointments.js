/**
 * UpcomingAppointments - Overhauled Premium Showcase Card
 * Implements a responsive 2-column layout, 16dp corners, and subtle shadows.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { useTheme } from '../../../context/ThemeContext';
import Avatar from '../../../components/common/Avatar';

dayjs.extend(relativeTime);

const UpcomingAppointments = ({ appointments = [], navigation, onJoinCall, onReschedule, maxDisplay = 3 }) => {
  const { colors, isDarkMode } = useTheme();
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
        <View style={[
          styles.emptyCard,
          {
            backgroundColor: isDarkMode ? 'rgba(26, 31, 46, 0.45)' : colors.backgroundCard,
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
            borderWidth: 1,
          }
        ]}>
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

      {/* Overhauled Showcase Card */}
      <View style={[
        styles.featuredCard,
        {
          backgroundColor: colors.surface,
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
          borderWidth: 1,
        }
      ]}>
        {/* Countdown & Type badges row */}
        <View style={styles.badgesRow}>
          <View style={[styles.countdownBadge, { backgroundColor: isDarkMode ? 'rgba(0, 212, 170, 0.12)' : 'rgba(0, 212, 170, 0.08)' }]}>
            <Text style={[styles.countdownText, { color: colors.primary }]}>{countdown}</Text>
          </View>
          <View style={[
            styles.typeBadge,
            { backgroundColor: nextAppointment.type === 'video' ? 'rgba(0, 212, 170, 0.1)' : 'rgba(108, 92, 231, 0.1)' }
          ]}>
            <Text style={[styles.typeText, { color: nextAppointment.type === 'video' ? colors.primary : colors.secondary }]}>
              {nextAppointment.type === 'video' ? '📹 Video' : '🏥 Clinic'}
            </Text>
          </View>
        </View>

        {/* 2-Column Responsive Layout */}
        <View style={styles.twoColumnGrid}>
          {/* Left Column: Date & Time prominent typography */}
          <View style={[
            styles.dateTimeCol,
            { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 212, 170, 0.05)' }
          ]}>
            <Text style={[styles.dateNumberText, { color: colors.primary }]}>
              {dayjs(nextAppointment.dateTime).format('DD')}
            </Text>
            <Text style={[styles.dateMonthText, { color: colors.primary }]}>
              {dayjs(nextAppointment.dateTime).format('MMM').toUpperCase()}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]} />
            <Text style={[styles.dateTimeText, { color: colors.textSecondary }]}>
              {dayjs(nextAppointment.dateTime).format('h:mm A')}
            </Text>
          </View>

          {/* Right Column: Doctor Info + Actions */}
          <View style={styles.doctorInfoCol}>
            <View style={styles.doctorHeaderRow}>
              <Avatar
                name={nextAppointment.doctorName}
                size="medium"
                source={nextAppointment.doctorPhoto ? { uri: nextAppointment.doctorPhoto } : null}
              />
              <View style={styles.doctorMetaWrap}>
                <Text style={[styles.doctorName, { color: colors.textPrimary }]} numberOfLines={1}>
                  Dr. {nextAppointment.doctorName}
                </Text>
                <Text style={[styles.specialty, { color: colors.textSecondary }]} numberOfLines={1}>
                  {nextAppointment.specialty}
                </Text>
              </View>
            </View>

            {/* Quick Actions Row */}
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.reschedBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    borderWidth: 1,
                  }
                ]}
                onPress={() => onReschedule?.(nextAppointment)}
                activeOpacity={0.8}
              >
                <Text style={[styles.reschedBtnText, { color: colors.textPrimary }]}>Reschedule</Text>
              </TouchableOpacity>
              
              {nextAppointment.type === 'video' ? (
                <TouchableOpacity
                  style={styles.joinBtnWrapper}
                  onPress={() => onJoinCall?.(nextAppointment)}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#00D4AA', '#00B894']} style={styles.joinBtn}>
                    <Text style={styles.joinBtnText}>Join Call</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.joinBtnWrapper}
                  onPress={() => navigation.navigate('Appointments')}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#6C5CE7', '#5B4ED1']} style={styles.joinBtn}>
                    <Text style={styles.joinBtnText}>Queue info</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Other appointments in queue */}
      {displayAppointments.slice(1).map((apt, i) => (
        <TouchableOpacity key={apt.id || i}
          style={[
            styles.listItem,
            {
              backgroundColor: colors.surface,
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
              borderWidth: 1,
            }
          ]}
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

  // Overhauled Card Layout
  featuredCard: {
    borderRadius: 16, // Enforce uniform corner radius of 16dp
    padding: spacing.md,
    marginBottom: spacing.md,
    // Subtle diffused elevation blur shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  countdownBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  countdownText: { ...typography.labelSmall, fontWeight: '700', fontSize: 10 },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  typeText: { ...typography.labelSmall, fontWeight: '700', fontSize: 10 },
  
  // 2-Column responsive grid
  twoColumnGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateTimeCol: {
    width: 80,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNumberText: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    lineHeight: 28,
  },
  dateMonthText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  dividerLine: {
    height: 1,
    width: '60%',
    marginVertical: 6,
  },
  dateTimeText: {
    fontSize: 9,
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
  },
  doctorInfoCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  doctorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorMetaWrap: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  doctorName: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 18,
  },
  specialty: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  actionButtonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  reschedBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reschedBtnText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  joinBtnWrapper: {
    flex: 1.2,
  },
  joinBtn: {
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },

  // List items
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  listContent: { flex: 1, marginLeft: spacing.md },
  listDoctorName: { ...typography.bodyMedium, fontWeight: '600' },
  listDateTime: { ...typography.bodySmall, marginTop: 2 },
  listType: { fontSize: 18 },
});

export default UpcomingAppointments;
