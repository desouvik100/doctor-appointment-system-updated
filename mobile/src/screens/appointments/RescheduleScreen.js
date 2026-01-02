/**
 * RescheduleScreen - Reschedule an existing appointment
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';

const RescheduleScreen = ({ navigation, route }) => {
  const { appointment } = route.params || {};
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      full: date.toISOString().split('T')[0],
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
  ];

  const handleReschedule = () => {
    Alert.alert(
      'Confirm Reschedule',
      'Are you sure you want to reschedule this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            Alert.alert('Success', 'Your appointment has been rescheduled.');
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reschedule</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Current Appointment Info */}
        <Card variant="gradient" style={styles.currentCard}>
          <Text style={styles.currentLabel}>Current Appointment</Text>
          <View style={styles.currentRow}>
            <Avatar name={appointment?.doctor?.name || 'Doctor'} size="medium" />
            <View style={styles.currentInfo}>
              <Text style={styles.doctorName}>{appointment?.doctor?.name}</Text>
              <Text style={styles.currentDateTime}>
                {appointment?.date} at {appointment?.time}
              </Text>
            </View>
          </View>
        </Card>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select New Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesContainer}>
            {dates.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.dateCard, selectedDate === date.full && styles.dateCardActive]}
                onPress={() => setSelectedDate(date.full)}
              >
                {selectedDate === date.full ? (
                  <LinearGradient colors={colors.gradientPrimary} style={styles.dateCardGradient}>
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
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select New Time</Text>
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
                    <LinearGradient colors={colors.gradientPrimary} style={styles.timeSlotGradient}>
                      <Text style={styles.timeTextActive}>{slot.time}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={[styles.timeText, !slot.available && styles.timeTextDisabled]}>
                      {slot.time}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          title="Confirm Reschedule"
          onPress={handleReschedule}
          fullWidth
          size="large"
          disabled={!selectedDate || !selectedTime}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: { ...typography.headlineMedium, color: colors.textPrimary },
  placeholder: { width: 44 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  currentCard: { padding: spacing.lg, marginBottom: spacing.xl },
  currentLabel: { ...typography.labelSmall, color: colors.textMuted, marginBottom: spacing.md },
  currentRow: { flexDirection: 'row', alignItems: 'center' },
  currentInfo: { marginLeft: spacing.md },
  doctorName: { ...typography.bodyLarge, color: colors.textPrimary, fontWeight: '500' },
  currentDateTime: { ...typography.bodyMedium, color: colors.textSecondary },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.headlineSmall, color: colors.textPrimary, marginBottom: spacing.lg },
  datesContainer: { gap: spacing.md },
  dateCard: {
    width: 72, paddingVertical: spacing.lg, borderRadius: borderRadius.lg, backgroundColor: colors.surface,
    alignItems: 'center', borderWidth: 1, borderColor: colors.surfaceBorder, marginRight: spacing.md,
  },
  dateCardActive: { borderWidth: 0, overflow: 'hidden' },
  dateCardGradient: { width: '100%', paddingVertical: spacing.lg, alignItems: 'center' },
  dateDay: { ...typography.labelSmall, color: colors.textMuted, marginBottom: spacing.xs },
  dateDayActive: { ...typography.labelSmall, color: 'rgba(0,0,0,0.6)', marginBottom: spacing.xs },
  dateNum: { ...typography.headlineMedium, color: colors.textPrimary },
  dateNumActive: { ...typography.headlineMedium, color: colors.textInverse },
  dateMonth: { ...typography.labelSmall, color: colors.textMuted, marginTop: spacing.xs },
  dateMonthActive: { ...typography.labelSmall, color: 'rgba(0,0,0,0.6)', marginTop: spacing.xs },
  timeSlotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  timeSlot: {
    width: '31%', paddingVertical: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.surface,
    alignItems: 'center', borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  timeSlotDisabled: { opacity: 0.4 },
  timeSlotActive: { borderWidth: 0, overflow: 'hidden' },
  timeSlotGradient: { width: '100%', paddingVertical: spacing.md, alignItems: 'center' },
  timeText: { ...typography.bodyMedium, color: colors.textSecondary },
  timeTextDisabled: { color: colors.textMuted, textDecorationLine: 'line-through' },
  timeTextActive: { ...typography.bodyMedium, color: colors.textInverse, fontWeight: '600' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.backgroundCard,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxl,
    borderTopWidth: 1, borderTopColor: colors.surfaceBorder, ...shadows.large,
  },
});

export default RescheduleScreen;
