/**
 * ConfirmationScreen - Booking confirmation with QR code
 * Uses useTheme() for proper light/dark mode support
 */

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Share, Alert, Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { shadows } from '../../theme/shadows';

const ConfirmationScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
  const { booking } = route.params || {};

  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const handleShare = async () => {
    try {
      const docName = booking?.doctor?.name || 'Doctor';
      const cleanDocName = docName.startsWith('Dr.') ? docName : `Dr. ${docName}`;
      await Share.share({
        message: `Appointment Confirmed!\n\nDoctor: ${cleanDocName}\nDate: ${formatDate(booking?.date)}\nTime: ${booking?.time || ''}\nToken: #${booking?.queueNumber || '-'}\nBooking ID: ${booking?.id}\n\nHealthSync`,
      });
    } catch (e) { /* ignore */ }
  };

  const handleGoHome = () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] });

  const handleViewAppointments = () =>
    navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Appointments' } }] });

  const docName = booking?.doctor?.name || 'Doctor';
  const cleanDocName = docName.startsWith('Dr.') ? docName : `Dr. ${docName}`;

  const details = [
    { icon: '📅', label: 'Date & Time', value: `${formatDate(booking?.date)} · ${booking?.time || ''}` },
    { icon: booking?.consultationType === 'online' ? '📹' : '🏥', label: 'Consultation Mode',
      value: booking?.consultationType === 'online' ? 'Online Video Call' : 'In-Clinic Physical Visit' },
    ...(booking?.queueNumber ? [{ icon: '🎫', label: 'Queue Token', value: `#${booking.queueNumber}` }] : []),
    { icon: '👤', label: 'Patient Name', value: booking?.patient?.name || 'Patient' },
    { icon: '👨‍⚕️', label: 'Doctor Assigned', value: cleanDocName },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Success Header with Circular Animation */}
        <View style={styles.successContainer}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <LinearGradient colors={colors.gradientPrimary || ['#00D4AA', '#00B894']} style={styles.successCircle}>
              <Text style={styles.successIcon}>✓</Text>
            </LinearGradient>
          </Animated.View>
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Appointment Booked!</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            Your check-in details have been confirmed by {cleanDocName}
          </Text>
        </View>

        {/* Booking Details Card */}
        <View style={[styles.bookingCard, { backgroundColor: colors.surface }, shadows.md]}>
          <Text style={[styles.bookingCardTitle, { color: colors.textPrimary }]}>Appointment Summary</Text>
          <View style={styles.detailsGrid}>
            {details.map(({ icon, label, value }) => (
              <View key={label} style={[styles.detailItem, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F1F5F9' }]}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>{icon}</Text>
                  <View style={styles.detailTexts}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{value}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* QR Code Card */}
        <View style={[styles.qrCard, { backgroundColor: colors.surface }, shadows.md]}>
          <Text style={[styles.qrTitle, { color: colors.textPrimary }]}>Clinic Check-in QR</Text>
          <Text style={[styles.qrSubtitle, { color: colors.textSecondary }]}>
            Present this code at the clinic reception desk to bypass queue check-in
          </Text>
          <View style={[styles.qrContainer, shadows.sm]}>
            {booking?.id ? (
              <QRCode value={`HEALTHSYNC:${booking.id}`} size={160} backgroundColor="white" color="#1E293B" />
            ) : (
              <View style={[styles.qrPlaceholder, { backgroundColor: colors.backgroundCard }]}>
                <Text style={[styles.qrPlaceholderText, { color: colors.textMuted }]}>QR Code</Text>
              </View>
            )}
          </View>
          <View style={[styles.bookingIdRow, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }]}>
            <Text style={[styles.bookingIdLabel, { color: colors.textMuted }]}>Booking ID  </Text>
            <Text style={[styles.bookingIdValue, { color: colors.primary }]}>
              {booking?.id ? String(booking.id).slice(-8).toUpperCase() : 'HEALTHSYNC'}
            </Text>
          </View>
        </View>

        {/* Actions Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>Share Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]}
            onPress={() => Alert.alert('Calendar', 'Appointment added to your device calendar.')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>Add to Calendar</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Summary */}
        <View style={[styles.paymentCard, { backgroundColor: colors.surface }, shadows.md]}>
          <View style={styles.paymentRow}>
            <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Amount Paid</Text>
            <Text style={[styles.paymentValue, { color: colors.success }]}>₹{booking?.amount || 0}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Payment Gateway</Text>
            <Text style={[styles.paymentMethod, { color: colors.textPrimary }]}>
              {booking?.paymentMethod === 'wallet' ? '💰 HealthSync Balance'
                : booking?.paymentMethod === 'upi' ? '📱 UPI (Razorpay)'
                : booking?.paymentMethod === 'razorpay' ? '💳 Net Banking'
                : '💳 Card Payment'}
            </Text>
          </View>
        </View>

        {/* Bottom Navigation Buttons */}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleViewAppointments} activeOpacity={0.85}>
          <LinearGradient colors={colors.gradientPrimary || ['#00D4AA', '#00B894']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnGradient}>
            <Text style={styles.primaryBtnText}>Go to Appointments</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeBtn} onPress={handleGoHome} activeOpacity={0.8}>
          <Text style={[styles.homeBtnText, { color: colors.textSecondary }]}>Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 60 },

  successContainer: { alignItems: 'center', marginBottom: spacing.xl, marginTop: spacing.md },
  successCircle: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  successIcon: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
  successTitle: { ...typography.headlineMedium, fontWeight: '900', marginBottom: spacing.xs },
  successSubtitle: { ...typography.bodyMedium, textAlign: 'center', fontSize: 13, lineHeight: 18, paddingHorizontal: spacing.xl },

  bookingCard: { borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md },
  bookingCardTitle: { ...typography.bodyLarge, fontWeight: '900', marginBottom: spacing.md },
  detailsGrid: { flexDirection: 'column' },
  detailItem: { paddingVertical: spacing.md, borderBottomWidth: 1 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailIcon: { fontSize: 20, marginRight: spacing.md },
  detailTexts: { flex: 1 },
  detailLabel: { ...typography.labelSmall, fontSize: 10, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 2 },
  detailValue: { ...typography.bodyMedium, fontWeight: '700' },

  qrCard: { borderRadius: borderRadius.xl, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md },
  qrTitle: { ...typography.bodyLarge, fontWeight: '900', marginBottom: spacing.xs },
  qrSubtitle: { ...typography.bodySmall, marginBottom: spacing.lg, textAlign: 'center', fontSize: 11, lineHeight: 16, paddingHorizontal: spacing.md },
  qrContainer: { padding: spacing.md, backgroundColor: 'white', borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  qrPlaceholder: { width: 160, height: 160, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  qrPlaceholderText: { ...typography.bodyMedium },
  bookingIdRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: 20 },
  bookingIdLabel: { ...typography.labelSmall, fontSize: 11 },
  bookingIdValue: { ...typography.bodyMedium, fontWeight: '900' },

  actionsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.xl, paddingVertical: spacing.md, borderWidth: 1 },
  actionIcon: { fontSize: 16, marginRight: spacing.sm },
  actionText: { ...typography.labelMedium, fontWeight: '700' },

  paymentCard: { borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.xl },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacing.xs },
  paymentLabel: { ...typography.bodyMedium, fontSize: 13 },
  paymentValue: { ...typography.headlineSmall, fontWeight: '900' },
  paymentMethod: { ...typography.bodyMedium, fontWeight: '700', fontSize: 13 },

  primaryBtn: { borderRadius: borderRadius.xl, overflow: 'hidden', marginBottom: spacing.sm },
  primaryBtnGradient: { paddingVertical: spacing.lg, alignItems: 'center' },
  primaryBtnText: { ...typography.bodyLarge, color: '#fff', fontWeight: '700' },
  homeBtn: { alignItems: 'center', paddingVertical: spacing.md },
  homeBtnText: { ...typography.labelMedium, fontWeight: '600' },
});

export default ConfirmationScreen;
