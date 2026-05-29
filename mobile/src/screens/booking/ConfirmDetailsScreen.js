/**
 * ConfirmDetailsScreen - Premium booking parameters confirmation screen
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import shadows from '../../theme/shadows';
import Avatar from '../../components/common/Avatar';

const ConfirmDetailsScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    doctor,
    date,
    time,
    queueNumber,
    consultationType,
    patient,
    pendingBooking,
  } = route.params || {};

  const consultationFee = doctor?.consultationFee || doctor?.fee || 500;
  const platformFee = Math.round(consultationFee * 0.05); // 5% platform fee
  const totalPayable = consultationFee + platformFee;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const handleProceed = () => {
    navigation.navigate('Payment', {
      doctor,
      date,
      time,
      queueNumber,
      consultationType,
      patient,
      pendingBooking,
    });
  };

  const appointmentDetails = [
    { icon: '📅', label: 'Date & Time', value: `${formatDate(date)} · ~${time}` },
    { icon: consultationType === 'online' ? '💻' : '🏥', label: 'Consultation', value: consultationType === 'online' ? 'Online Video Consultation' : 'In-Person Clinic Visit' },
    { icon: '🎫', label: 'Queue Token', value: `#${queueNumber} (Est. wait: ${time})` },
    { icon: '👤', label: 'Patient Name', value: patient?.name || 'Self' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header Banner */}
      <LinearGradient colors={colors.gradientPrimary || ['#00D4AA', '#00B894']}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Confirm Details</Text>
          <Text style={styles.headerSub}>Verify details before payment</Text>
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Step Indicator */}
        <View style={styles.stepProgressRow}>
          <View style={[styles.stepDot, { backgroundColor: colors.primary }]}>
            <Text style={styles.stepCheck}>✓</Text>
          </View>
          <View style={[styles.stepLine, { backgroundColor: colors.primary }]} />
          <View style={[styles.stepDot, { backgroundColor: colors.primary }]}>
            <Text style={styles.stepCheck}>✓</Text>
          </View>
          <View style={[styles.stepLine, { backgroundColor: colors.primary }]} />
          <View style={[styles.stepDot, { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.surface }]} />
          <View style={[styles.stepLine, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : colors.divider }]} />
          <View style={[styles.stepDot, { borderColor: colors.textMuted, borderWidth: 1, backgroundColor: colors.surface }]} />
        </View>
        <View style={styles.stepLabelRow}>
          <Text style={[styles.stepLabelText, { color: colors.primary }]}>Type</Text>
          <Text style={[styles.stepLabelText, { color: colors.primary }]}>Date</Text>
          <Text style={[styles.stepLabelText, { color: colors.primary, fontWeight: '700' }]}>Verify</Text>
          <Text style={[styles.stepLabelText, { color: colors.textMuted }]}>Pay</Text>
        </View>

        {/* Doctor Info Card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>YOUR DOCTOR</Text>
          <View style={styles.doctorRow}>
            <Avatar imageUrl={doctor?.profilePhoto} name={doctor?.name} size="large" showBorder={false} />
            <View style={styles.doctorInfo}>
              <View style={styles.doctorNameRow}>
                <Text style={[styles.doctorName, { color: colors.textPrimary }]}>
                  {doctor?.name?.startsWith('Dr.') ? doctor?.name : `Dr. ${doctor?.name || 'Doctor'}`}
                </Text>
                <View style={[styles.verifiedBadge, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.verifiedText, { color: colors.primary }]}>✔ Verified</Text>
                </View>
              </View>
              <Text style={[styles.doctorSpecialty, { color: colors.primary }]}>
                {doctor?.specialization || doctor?.specialty || 'Specialist'}
              </Text>
              <Text style={[styles.doctorExp, { color: colors.textMuted }]}>
                🎓 {doctor?.experience || 8} yrs experience · ⭐ {doctor?.rating || '4.8'}
              </Text>
            </View>
          </View>
        </View>

        {/* Slot details card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>APPOINTMENT SUMMARY</Text>
          {appointmentDetails.map(({ icon, label, value }) => (
            <View key={label} style={[styles.detailItemRow, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F1F5F9' }]}>
              <View style={styles.detailLabelColumn}>
                <Text style={styles.detailIcon}>{icon}</Text>
                <Text style={[styles.detailLabelText, { color: colors.textMuted }]}>{label}</Text>
              </View>
              <Text style={[styles.detailValueText, { color: colors.textPrimary }]}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Clinic address coordinates */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>CLINIC & VENUE DETAILS</Text>
          {consultationType === 'online' ? (
            <View style={styles.clinicRow}>
              <View style={[styles.clinicIconBox, { backgroundColor: colors.primary + '15' }]}>
                <Text style={styles.clinicEmoji}>📹</Text>
              </View>
              <View style={styles.clinicInfo}>
                <Text style={[styles.clinicNameText, { color: colors.textPrimary }]}>Video Consultation Room</Text>
                <Text style={[styles.clinicAddressText, { color: colors.textSecondary }]}>
                  A secure Google Meet/Zoom consultation link will be sent to your phone and email 15 mins before the session.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.clinicRow}>
              <View style={[styles.clinicIconBox, { backgroundColor: colors.primary + '15' }]}>
                <Text style={styles.clinicEmoji}>🏥</Text>
              </View>
              <View style={styles.clinicInfo}>
                <Text style={[styles.clinicNameText, { color: colors.textPrimary }]}>
                  {doctor?.clinicName || doctor?.hospitalName || 'HealthSync Medical Plaza'}
                </Text>
                <Text style={[styles.clinicAddressText, { color: colors.textSecondary }]}>
                  Ground Floor, Suite 402, Sector V, Salt Lake, Kolkata, West Bengal - 700091
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Transparent Bill details card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>TRANSPARENT PRICING</Text>

          <View style={styles.pricingItemRow}>
            <Text style={[styles.pricingLabelText, { color: colors.textSecondary }]}>Doctor Consultation Fee</Text>
            <Text style={[styles.pricingValueText, { color: colors.textPrimary }]}>₹{consultationFee}</Text>
          </View>

          <View style={styles.pricingItemRow}>
            <Text style={[styles.pricingLabelText, { color: colors.textSecondary }]}>Booking & Platform Fee</Text>
            <Text style={[styles.pricingValueText, { color: colors.textPrimary }]}>₹{platformFee}</Text>
          </View>

          <View style={[styles.pricingDivider, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : colors.divider || '#E5E7EB' }]} />

          <View style={styles.pricingTotalRow}>
            <Text style={[styles.totalLabelText, { color: colors.textPrimary }]}>Total Payable Amount</Text>
            <Text style={[styles.totalValueText, { color: colors.primary }]}>₹{totalPayable}</Text>
          </View>
        </View>

        {/* Trust verification pill */}
        <View style={[styles.trustPillBox, { backgroundColor: colors.success + '08', borderColor: colors.success + '30' }]}>
          <Text style={styles.trustLockIcon}>🔒</Text>
          <View style={styles.trustMessageInfo}>
            <Text style={[styles.trustTitleText, { color: colors.success }]}>RBI Compliant Secure Verification</Text>
            <Text style={[styles.trustSubtext, { color: colors.textMuted }]}>
              Payments are processed using 256-bit bank grade encryption. Full refund is guaranteed if cancelled 2+ hours prior.
            </Text>
          </View>
        </View>

        {/* Cancellation policy banner */}
        <View style={[styles.cancellationBox, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cancellationTitleText, { color: colors.textPrimary }]}>Cancellation & Refund Policy</Text>
          <Text style={[styles.cancellationDescText, { color: colors.textSecondary }]}>
            • Free cancellation and instant refund up to 2 hours before appointment time.
          </Text>
          <Text style={[styles.cancellationDescText, { color: colors.textSecondary }]}>
            • Reschedules are permitted up to 1 hour prior at no additional charges.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Sticky CTA bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: isDarkMode ? 'rgba(255,255,255,0.06)' : colors.divider || '#F1F5F9' }]}>
        <View style={styles.bottomPriceRow}>
          <View>
            <Text style={[styles.bottomPriceLabel, { color: colors.textMuted }]}>Total Payable</Text>
            <Text style={[styles.bottomPriceVal, { color: colors.textPrimary }]}>₹{totalPayable}</Text>
          </View>
          <TouchableOpacity
            style={styles.proceedBtnContainer}
            onPress={handleProceed}
            activeOpacity={0.85}
          >
            <LinearGradient colors={colors.gradientPrimary || ['#00D4AA', '#00B894']} style={styles.proceedBtnGradient}>
              <Text style={[styles.proceedBtnText, { color: colors.textInverse }]}>
                Proceed to Payment →
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.changeDetailsBtn} onPress={() => navigation.goBack()}>
          <Text style={[styles.changeDetailsText, { color: colors.textSecondary }]}>Modify Appointment Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header Banner
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 18, color: '#fff', fontWeight: '700' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', ...typography.headlineMedium, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.75)', ...typography.labelSmall, marginTop: 2 },

  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },

  // Step Progress Row
  stepProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepCheck: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  stepLine: { flex: 1, height: 2 },
  stepLabelRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xl + 4, marginBottom: spacing.lg },
  stepLabelText: { fontSize: 11, fontWeight: '500' },

  // Section card base
  sectionCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionHeading: {
    ...typography.labelSmall,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },

  // Doctor section info
  doctorRow: { flexDirection: 'row', alignItems: 'center' },
  doctorInfo: { flex: 1, marginLeft: spacing.md },
  doctorNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  doctorName: { ...typography.bodyLarge, fontWeight: '800' },
  verifiedBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  verifiedText: { fontSize: 9, fontWeight: '700' },
  doctorSpecialty: { ...typography.bodySmall, fontWeight: '600', marginTop: 2 },
  doctorExp: { ...typography.labelSmall, marginTop: 3 },

  // Detail Item row
  detailItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  detailLabelColumn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailIcon: { fontSize: 16 },
  detailLabelText: { ...typography.bodyMedium },
  detailValueText: { ...typography.bodyMedium, fontWeight: '600' },

  // Venue Section details
  clinicRow: { flexDirection: 'row', alignItems: 'center' },
  clinicIconBox: { width: 44, height: 44, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  clinicEmoji: { fontSize: 20 },
  clinicInfo: { flex: 1 },
  clinicNameText: { ...typography.bodyLarge, fontWeight: '700', marginBottom: 2 },
  clinicAddressText: { ...typography.bodySmall, lineHeight: 18 },

  // Pricing details card
  pricingItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  pricingLabelText: { ...typography.bodyMedium },
  pricingValueText: { ...typography.bodyMedium, fontWeight: '600' },
  pricingDivider: { height: 1, marginVertical: spacing.md },
  pricingTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 },
  totalLabelText: { ...typography.bodyLarge, fontWeight: '800' },
  totalValueText: { fontSize: 22, fontWeight: '700' },

  // Trust pill
  trustPillBox: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md },
  trustLockIcon: { fontSize: 20, marginRight: spacing.sm, marginTop: 1 },
  trustMessageInfo: { flex: 1 },
  trustTitleText: { ...typography.labelSmall, fontWeight: '800' },
  trustSubtext: { ...typography.bodySmall, fontSize: 11, lineHeight: 16, marginTop: 2 },

  // Cancellation policy card
  cancellationBox: { borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.xl },
  cancellationTitleText: { ...typography.bodyMedium, fontWeight: '700', marginBottom: spacing.sm },
  cancellationDescText: { ...typography.bodySmall, lineHeight: 18, marginBottom: 2 },

  // Bottom action bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg,
    borderTopWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 6,
  },
  bottomPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  bottomPriceLabel: { ...typography.labelSmall, textTransform: 'uppercase', letterSpacing: 0.3 },
  bottomPriceVal: { ...typography.headlineMedium, fontWeight: '700', lineHeight: 28 },
  proceedBtnContainer: { flex: 1.3, borderRadius: borderRadius.lg, overflow: 'hidden', marginLeft: spacing.xl },
  proceedBtnGradient: { paddingVertical: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  proceedBtnText: { ...typography.bodyLarge, fontWeight: '800' },
  changeDetailsBtn: { alignItems: 'center', paddingVertical: spacing.xs, marginTop: spacing.sm },
  changeDetailsText: { ...typography.labelMedium, fontWeight: '600' },
});

export default ConfirmDetailsScreen;
