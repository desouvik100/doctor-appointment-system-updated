/**
 * ConfirmationScreen - Booking confirmation with QR code
 * Uses useTheme() for proper light/dark mode support
 */

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Share, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { shadows } from '../../theme/colors';

const ConfirmationScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { booking } = route.params || {};

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Appointment Confirmed!\n\nDoctor: ${booking?.doctor?.name}\nDate: ${formatDate(booking?.date)}\nToken: #${booking?.queueNumber || '-'}\nBooking ID: ${booking?.id}\n\nHealthSync`,
      });
    } catch (e) { /* ignore */ }
  };

  const handleGoHome = () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] });

  const handleViewAppointments = () =>
    navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Appointments' } }] });

  const details = [
    { icon: '📅', label: 'Date',    value: formatDate(booking?.date) },
    { icon: booking?.consultationType === 'online' ? '📹' : '🏥', label: 'Type',
      value: booking?.consultationType === 'online' ? 'Online Consultation' : 'In-Clinic Visit' },
    ...(booking?.queueNumber ? [{ icon: '🎫', label: 'Token', value: `#${booking.queueNumber}` }] : []),
    { icon: '👤', label: 'Patient', value: booking?.patient?.name || 'Patient' },
    { icon: '💊', label: 'Doctor',  value: booking?.doctor?.name || 'Doctor' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Success Header */}
        <View style={styles.successContainer}>
          <LinearGradient colors={colors.gradientPrimary} style={styles.successCircle}>
            <Text style={styles.successIcon}>✓</Text>
          </LinearGradient>
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Booking Confirmed!</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            Your appointment has been successfully booked
          </Text>
        </View>

        {/* Booking Details */}
        <LinearGradient colors={colors.gradientPrimary} style={styles.bookingCard}>
          <Text style={styles.bookingCardTitle}>Appointment Details</Text>
          <View style={styles.detailsGrid}>
            {details.map(({ icon, label, value }) => (
              <View key={label} style={styles.detailItem}>
                <Text style={styles.detailIcon}>{icon}</Text>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* QR Code */}
        <View style={[styles.qrCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.qrTitle, { color: colors.textPrimary }]}>Check-in QR Code</Text>
          <Text style={[styles.qrSubtitle, { color: colors.textSecondary }]}>
            Show this at the clinic for quick check-in
          </Text>
          <View style={styles.qrContainer}>
            {booking?.id ? (
              <QRCode value={`HEALTHSYNC:${booking.id}`} size={180} backgroundColor="white" color="#1a1a2e" />
            ) : (
              <View style={[styles.qrPlaceholder, { backgroundColor: colors.backgroundCard }]}>
                <Text style={[styles.qrPlaceholderText, { color: colors.textMuted }]}>QR Code</Text>
              </View>
            )}
          </View>
          <View style={styles.bookingIdRow}>
            <Text style={[styles.bookingIdLabel, { color: colors.textMuted }]}>Booking ID  </Text>
            <Text style={[styles.bookingIdValue, { color: colors.primary }]}>
              {booking?.id ? String(booking.id).slice(-8).toUpperCase() : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={handleShare}
          >
            <Text style={styles.actionIcon}>�</Text>
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            onPress={() => Alert.alert('Calendar', 'Event added to your calendar')}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>Add to Calendar</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Summary */}
        <View style={[styles.paymentCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.paymentRow}>
            <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Amount Paid</Text>
            <Text style={[styles.paymentValue, { color: colors.success }]}>₹{booking?.amount || 0}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Payment Method</Text>
            <Text style={[styles.paymentMethod, { color: colors.textPrimary }]}>
              {booking?.paymentMethod === 'wallet' ? '💰 Health Wallet'
                : booking?.paymentMethod === 'upi' ? '📱 UPI'
                : booking?.paymentMethod === 'razorpay' ? '💳 Online Payment'
                : '💳 Card'}
            </Text>
          </View>
        </View>

        {/* Bottom Buttons */}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleViewAppointments} activeOpacity={0.85}>
          <LinearGradient colors={colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnGradient}>
            <Text style={styles.primaryBtnText}>View My Appointments</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeBtn} onPress={handleGoHome}>
          <Text style={[styles.homeBtnText, { color: colors.textSecondary }]}>Go to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: 60 },

  successContainer: { alignItems: 'center', marginBottom: spacing.xxl },
  successCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  successIcon: { fontSize: 40, color: '#fff' },
  successTitle: { ...typography.headlineLarge, marginBottom: spacing.sm },
  successSubtitle: { ...typography.bodyMedium, textAlign: 'center' },

  bookingCard: { borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing.xl },
  bookingCardTitle: { ...typography.headlineSmall, color: '#fff', marginBottom: spacing.lg, fontWeight: '700' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  detailItem: { width: '50%', marginBottom: spacing.lg },
  detailIcon: { fontSize: 22, marginBottom: spacing.xs },
  detailLabel: { ...typography.labelSmall, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  detailValue: { ...typography.bodyMedium, color: '#fff', fontWeight: '600' },

  qrCard: { borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.xl, borderWidth: 1 },
  qrTitle: { ...typography.headlineSmall, marginBottom: spacing.xs },
  qrSubtitle: { ...typography.bodySmall, marginBottom: spacing.lg, textAlign: 'center' },
  qrContainer: { padding: spacing.lg, backgroundColor: 'white', borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  qrPlaceholder: { width: 180, height: 180, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  qrPlaceholderText: { ...typography.bodyMedium },
  bookingIdRow: { flexDirection: 'row', alignItems: 'center' },
  bookingIdLabel: { ...typography.labelMedium },
  bookingIdValue: { ...typography.bodyMedium, fontWeight: '700' },

  actionsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1 },
  actionIcon: { fontSize: 18, marginRight: spacing.sm },
  actionText: { ...typography.labelMedium },

  paymentCard: { borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.xl, borderWidth: 1 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  paymentLabel: { ...typography.bodyMedium },
  paymentValue: { ...typography.headlineSmall },
  paymentMethod: { ...typography.bodyMedium },

  primaryBtn: { borderRadius: borderRadius.xl, overflow: 'hidden', marginBottom: spacing.md },
  primaryBtnGradient: { paddingVertical: spacing.lg, alignItems: 'center' },
  primaryBtnText: { ...typography.bodyLarge, color: '#fff', fontWeight: '700' },
  homeBtn: { alignItems: 'center', paddingVertical: spacing.lg },
  homeBtnText: { ...typography.labelMedium },
});

export default ConfirmationScreen;
