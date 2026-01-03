/**
 * ConfirmationScreen - Booking confirmation with QR code
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Share,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';

const ConfirmationScreen = ({ navigation, route }) => {
  const { booking } = route.params || {};
  const [addingToCalendar, setAddingToCalendar] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleAddToCalendar = async () => {
    setAddingToCalendar(true);
    try {
      // In real app, use react-native-add-calendar-event
      // const eventConfig = {
      //   title: `Appointment with ${booking.doctor.name}`,
      //   startDate: new Date(booking.date + 'T' + convertTo24Hour(booking.time)),
      //   endDate: new Date(booking.date + 'T' + convertTo24Hour(booking.time, 30)),
      //   notes: `Booking ID: ${booking.id}`,
      // };
      // await AddCalendarEvent.presentEventCreatingDialog(eventConfig);
      
      Alert.alert('Success', 'Event added to your calendar');
    } catch (error) {
      Alert.alert('Error', 'Could not add to calendar');
    } finally {
      setAddingToCalendar(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Appointment Confirmed!\n\nDoctor: ${booking.doctor?.name}\nDate: ${formatDate(booking.date)}\nTime: ${booking.time}\nBooking ID: ${booking.id}\n\nHealthSync App`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleGoHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const handleViewAppointments = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main', params: { screen: 'Appointments' } }],
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Success Animation */}
        <View style={styles.successContainer}>
          <LinearGradient colors={colors.gradientPrimary} style={styles.successCircle}>
            <Text style={styles.successIcon}>✓</Text>
          </LinearGradient>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your appointment has been successfully booked
          </Text>
        </View>

        {/* Booking Details Card */}
        <Card variant="gradient" style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <Avatar name={booking?.doctor?.name || 'Doctor'} size="large" />
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{booking?.doctor?.name}</Text>
              <Text style={styles.specialty}>{booking?.doctor?.specialty}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(booking?.date)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>⏰</Text>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{booking?.time}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>
                {booking?.consultationType === 'video' ? '📹' : '🏥'}
              </Text>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>
                {booking?.consultationType === 'video' ? 'Video Call' : 'Clinic Visit'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>👤</Text>
              <Text style={styles.detailLabel}>Patient</Text>
              <Text style={styles.detailValue}>{booking?.patient?.name}</Text>
            </View>
            {booking?.queueNumber && (
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>🎫</Text>
                <Text style={styles.detailLabel}>Token</Text>
                <Text style={styles.detailValue}>#{booking.queueNumber}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* QR Code Section */}
        <Card variant="default" style={styles.qrCard}>
          <Text style={styles.qrTitle}>Check-in QR Code</Text>
          <Text style={styles.qrSubtitle}>Show this at the clinic for quick check-in</Text>
          
          <View style={styles.qrContainer}>
            {booking?.id ? (
              <QRCode
                value={`HEALTHSYNC:${booking.id}`}
                size={180}
                backgroundColor="white"
                color={colors.background}
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>QR Code</Text>
              </View>
            )}
          </View>
          
          <View style={styles.bookingIdRow}>
            <Text style={styles.bookingIdLabel}>Booking ID</Text>
            <Text style={styles.bookingIdValue}>{booking?.id || 'N/A'}</Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleAddToCalendar}>
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionText}>Add to Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Summary */}
        <Card variant="default" style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Amount Paid</Text>
            <Text style={styles.paymentValue}>₹{booking?.amount}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Method</Text>
            <Text style={styles.paymentMethod}>
              {booking?.paymentMethod === 'wallet' ? '💳 Health Wallet' : 
               booking?.paymentMethod === 'upi' ? '📱 UPI' : '💳 Card'}
            </Text>
          </View>
        </Card>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtons}>
          <Button
            title="View My Appointments"
            onPress={handleViewAppointments}
            fullWidth
            size="large"
          />
          <TouchableOpacity style={styles.homeBtn} onPress={handleGoHome}>
            <Text style={styles.homeBtnText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.huge },
  successContainer: { alignItems: 'center', marginBottom: spacing.xxl },
  successCircle: {
    width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  successIcon: { fontSize: 40, color: colors.textInverse },
  successTitle: { ...typography.headlineLarge, color: colors.textPrimary, marginBottom: spacing.sm },
  successSubtitle: { ...typography.bodyMedium, color: colors.textSecondary, textAlign: 'center' },
  bookingCard: { padding: spacing.xl, marginBottom: spacing.xl },
  bookingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  doctorInfo: { flex: 1, marginLeft: spacing.md },
  doctorName: { ...typography.headlineSmall, color: colors.textPrimary },
  specialty: { ...typography.bodyMedium, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.divider, marginBottom: spacing.lg },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  detailItem: { width: '50%', marginBottom: spacing.md },
  detailIcon: { fontSize: 20, marginBottom: spacing.xs },
  detailLabel: { ...typography.labelSmall, color: colors.textMuted },
  detailValue: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '500' },
  qrCard: { padding: spacing.xl, alignItems: 'center', marginBottom: spacing.xl },
  qrTitle: { ...typography.headlineSmall, color: colors.textPrimary, marginBottom: spacing.xs },
  qrSubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.lg },
  qrContainer: {
    padding: spacing.lg, backgroundColor: 'white', borderRadius: borderRadius.lg, marginBottom: spacing.lg,
  },
  qrPlaceholder: {
    width: 180, height: 180, backgroundColor: colors.surface, borderRadius: borderRadius.md,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  qrPlaceholderText: { ...typography.bodyMedium, color: colors.textMuted },
  bookingIdRow: { flexDirection: 'row', alignItems: 'center' },
  bookingIdLabel: { ...typography.labelMedium, color: colors.textMuted, marginRight: spacing.sm },
  bookingIdValue: { ...typography.bodyMedium, color: colors.primary, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  actionIcon: { fontSize: 18, marginRight: spacing.sm },
  actionText: { ...typography.labelMedium, color: colors.textPrimary },
  paymentCard: { padding: spacing.lg, marginBottom: spacing.xl },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  paymentLabel: { ...typography.bodyMedium, color: colors.textSecondary },
  paymentValue: { ...typography.headlineSmall, color: colors.success },
  paymentMethod: { ...typography.bodyMedium, color: colors.textPrimary },
  bottomButtons: { marginTop: spacing.md },
  homeBtn: { alignItems: 'center', paddingVertical: spacing.lg },
  homeBtnText: { ...typography.labelMedium, color: colors.textSecondary },
});

export default ConfirmationScreen;
