/**
 * Booking Screen - Select Date & Time
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';

const BookingScreen = ({ navigation, route }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [consultationType, setConsultationType] = useState('video');

  const doctor = {
    name: 'Dr. Sarah Wilson',
    specialty: 'Cardiologist',
    fee: '$150',
  };

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      full: date.toISOString(),
    };
  });

  const timeSlots = [
    { id: '1', time: '09:00 AM', available: true },
    { id: '2', time: '09:30 AM', available: false },
    { id: '3', time: '10:00 AM', available: true },
    { id: '4', time: '10:30 AM', available: true },
    { id: '5', time: '11:00 AM', available: false },
    { id: '6', time: '11:30 AM', available: true },
    { id: '7', time: '02:00 PM', available: true },
    { id: '8', time: '02:30 PM', available: true },
    { id: '9', time: '03:00 PM', available: false },
    { id: '10', time: '03:30 PM', available: true },
    { id: '11', time: '04:00 PM', available: true },
    { id: '12', time: '04:30 PM', available: true },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Doctor Info */}
        <Card variant="gradient" style={styles.doctorCard}>
          <View style={styles.doctorRow}>
            <Avatar name={doctor.name} size="large" />
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.specialty}>{doctor.specialty}</Text>
            </View>
            <View style={styles.feeBox}>
              <Text style={styles.feeLabel}>Fee</Text>
              <Text style={styles.feeValue}>{doctor.fee}</Text>
            </View>
          </View>
        </Card>

        {/* Consultation Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consultation Type</Text>
          <View style={styles.typeOptions}>
            <TouchableOpacity
              style={[
                styles.typeOption,
                consultationType === 'video' && styles.typeOptionActive,
              ]}
              onPress={() => setConsultationType('video')}
            >
              {consultationType === 'video' ? (
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.typeOptionGradient}
                >
                  <Text style={styles.typeIcon}>📹</Text>
                  <Text style={styles.typeTextActive}>Video Call</Text>
                </LinearGradient>
              ) : (
                <>
                  <Text style={styles.typeIcon}>📹</Text>
                  <Text style={styles.typeText}>Video Call</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeOption,
                consultationType === 'clinic' && styles.typeOptionActive,
              ]}
              onPress={() => setConsultationType('clinic')}
            >
              {consultationType === 'clinic' ? (
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.typeOptionGradient}
                >
                  <Text style={styles.typeIcon}>🏥</Text>
                  <Text style={styles.typeTextActive}>Clinic Visit</Text>
                </LinearGradient>
              ) : (
                <>
                  <Text style={styles.typeIcon}>🏥</Text>
                  <Text style={styles.typeText}>Clinic Visit</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesContainer}
          >
            {dates.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateCard,
                  selectedDate === date.full && styles.dateCardActive,
                ]}
                onPress={() => setSelectedDate(date.full)}
              >
                {selectedDate === date.full ? (
                  <LinearGradient
                    colors={colors.gradientPrimary}
                    style={styles.dateCardGradient}
                  >
                    <Text style={styles.dateDayActive}>{date.day}</Text>
                    <Text style={styles.dateNumActive}>{date.date}</Text>
                    <Text style={styles.dateMonthActive}>{date.month}</Text>
                  </LinearGradient>
                ) : (
                  <>
                    <Text style={styles.dateDay}>{date.day}</Text>
                    <Text style={styles.dateNum}>{date.date}</Text>
                    <Text style={styles.dateMonth}>{date.month}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeSlotsGrid}>
            {timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.timeSlot,
                  !slot.available && styles.timeSlotDisabled,
                  selectedTime === slot.id && styles.timeSlotActive,
                ]}
                onPress={() => slot.available && setSelectedTime(slot.id)}
                disabled={!slot.available}
              >
                {selectedTime === slot.id ? (
                  <LinearGradient
                    colors={colors.gradientPrimary}
                    style={styles.timeSlotGradient}
                  >
                    <Text style={styles.timeTextActive}>{slot.time}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={[
                    styles.timeText,
                    !slot.available && styles.timeTextDisabled,
                  ]}>
                    {slot.time}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>{doctor.fee}</Text>
        </View>
        <Button
          title="Confirm Booking"
          onPress={() => {}}
          fullWidth
          size="large"
          disabled={!selectedDate || !selectedTime}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  backIcon: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  headerTitle: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 180,
  },
  doctorCard: {
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  doctorName: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
  },
  specialty: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  feeBox: {
    alignItems: 'flex-end',
  },
  feeLabel: {
    ...typography.labelSmall,
    color: colors.textMuted,
  },
  feeValue: {
    ...typography.headlineMedium,
    color: colors.primary,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  typeOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  typeOptionActive: {
    borderWidth: 0,
    overflow: 'hidden',
  },
  typeOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    width: '100%',
  },
  typeIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  typeText: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  typeTextActive: {
    ...typography.bodyLarge,
    color: colors.textInverse,
    fontWeight: '600',
  },
  datesContainer: {
    gap: spacing.md,
  },
  dateCard: {
    width: 72,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginRight: spacing.md,
  },
  dateCardActive: {
    borderWidth: 0,
    overflow: 'hidden',
  },
  dateCardGradient: {
    width: '100%',
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  dateDay: {
    ...typography.labelSmall,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  dateDayActive: {
    ...typography.labelSmall,
    color: 'rgba(0,0,0,0.6)',
    marginBottom: spacing.xs,
  },
  dateNum: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
  },
  dateNumActive: {
    ...typography.headlineMedium,
    color: colors.textInverse,
  },
  dateMonth: {
    ...typography.labelSmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  dateMonthActive: {
    ...typography.labelSmall,
    color: 'rgba(0,0,0,0.6)',
    marginTop: spacing.xs,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  timeSlot: {
    width: '31%',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  timeSlotDisabled: {
    opacity: 0.4,
  },
  timeSlotActive: {
    borderWidth: 0,
    overflow: 'hidden',
  },
  timeSlotGradient: {
    width: '100%',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  timeText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  timeTextDisabled: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  timeTextActive: {
    ...typography.bodyMedium,
    color: colors.textInverse,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    ...shadows.large,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  summaryLabel: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
  },
});

export default BookingScreen;
