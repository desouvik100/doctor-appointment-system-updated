/**
 * Staff Invoice Screen - Generate billing receipt per appointment
 * Shows itemized bill and allows sharing as text
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import staffApi from '../../services/api/staffDashboardApi';

const StaffInvoiceScreen = ({ navigation, route }) => {
  const { appointmentId, appointment: passedAppointment } = route.params || {};
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [appointment, setAppointment] = useState(passedAppointment || null);
  const [loading, setLoading] = useState(!passedAppointment);

  const fetchAppointment = useCallback(async () => {
    if (!appointmentId) return;
    try {
      const data = await staffApi.getAppointmentById(appointmentId);
      setAppointment(data?.appointment || data);
    } catch (err) {
      console.log('Invoice fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    if (!passedAppointment) fetchAppointment();
  }, [fetchAppointment, passedAppointment]);

  const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
  const consultationFee = appointment?.payment?.consultationFee || appointment?.doctor?.consultationFee || 0;
  const gst = appointment?.payment?.gst || Math.round(consultationFee * 0.18);
  const platformFee = appointment?.payment?.platformFee || 0;
  const total = appointment?.payment?.totalAmount || (consultationFee + gst + platformFee);
  const patientName = appointment?.userId?.name || appointment?.patient?.name || 'Patient';
  const doctorName = appointment?.doctorId?.name || appointment?.doctor?.name || 'Doctor';
  const aptDate = appointment?.date ? new Date(appointment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
  const aptTime = appointment?.time || 'N/A';

  const handleShare = async () => {
    const text = [
      '━━━━━━━━━━━━━━━━━━━━━━',
      '       HEALTHSYNC PRO',
      '       Medical Invoice',
      '━━━━━━━━━━━━━━━━━━━━━━',
      `Invoice No : ${invoiceNumber}`,
      `Date       : ${aptDate}`,
      `Time       : ${aptTime}`,
      '──────────────────────',
      `Patient    : ${patientName}`,
      `Doctor     : Dr. ${doctorName}`,
      '──────────────────────',
      `Consultation Fee : ₹${consultationFee}`,
      `GST (18%)        : ₹${gst}`,
      platformFee ? `Platform Fee     : ₹${platformFee}` : null,
      '──────────────────────',
      `TOTAL            : ₹${total}`,
      '━━━━━━━━━━━━━━━━━━━━━━',
      'Thank you for visiting!',
    ].filter(Boolean).join('\n');

    try {
      await Share.share({ message: text, title: 'Medical Invoice' });
    } catch (err) {
      Alert.alert('Share failed', err.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Invoice</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Invoice Header */}
        <LinearGradient colors={['#4FACFE', '#00F2FE']} style={styles.invoiceHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.clinicName}>HealthSync Pro</Text>
          <Text style={styles.invoiceTitle}>Medical Invoice</Text>
          <Text style={styles.invoiceNum}>{invoiceNumber}</Text>
        </LinearGradient>

        {/* Appointment Info */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Row label="Date" value={aptDate} colors={colors} />
          <Row label="Time" value={aptTime} colors={colors} />
          <Row label="Patient" value={patientName} colors={colors} />
          <Row label="Doctor" value={`Dr. ${doctorName}`} colors={colors} isLast />
        </View>

        {/* Billing Breakdown */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Billing Details</Text>
          <BillRow label="Consultation Fee" amount={consultationFee} colors={colors} />
          <BillRow label="GST (18%)" amount={gst} colors={colors} />
          {platformFee > 0 && <BillRow label="Platform Fee" amount={platformFee} colors={colors} />}
          <View style={[styles.totalRow, { borderTopColor: colors.surfaceBorder }]}>
            <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{total}</Text>
          </View>
        </View>

        {/* Payment Status */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Row label="Payment Status" value={appointment?.paymentStatus || 'Pending'} colors={colors} highlight isLast />
        </View>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareFullBtn} onPress={handleShare} activeOpacity={0.85}>
          <LinearGradient colors={['#4FACFE', '#00F2FE']} style={styles.shareFullGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.shareFullText}>📤  Share Invoice</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const Row = ({ label, value, colors, isLast, highlight }) => (
  <View style={[styles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: '#2E364920' }]}>
    <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
    <Text style={[styles.rowValue, { color: highlight ? '#10B981' : colors.textPrimary }]}>{value}</Text>
  </View>
);

const BillRow = ({ label, amount, colors }) => (
  <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: '#2E364920' }]}>
    <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
    <Text style={[styles.rowValue, { color: colors.textPrimary }]}>₹{amount}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22 },
  headerTitle: { flex: 1, ...typography.headlineMedium, textAlign: 'center' },
  shareBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  shareIcon: { fontSize: 22 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  invoiceHeader: { borderRadius: borderRadius.xxl, padding: spacing.xxl, alignItems: 'center', marginBottom: spacing.xl },
  clinicName: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: spacing.xs },
  invoiceTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: spacing.xs },
  invoiceNum: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  card: { borderRadius: borderRadius.xl, marginBottom: spacing.lg, overflow: 'hidden' },
  cardTitle: { ...typography.bodyMedium, fontWeight: '700', padding: spacing.lg, paddingBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  rowLabel: { ...typography.bodyMedium },
  rowValue: { ...typography.bodyMedium, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, borderTopWidth: 2 },
  totalLabel: { ...typography.bodyLarge, fontWeight: '700' },
  totalAmount: { fontSize: 22, fontWeight: '800', color: '#4FACFE' },
  shareFullBtn: { borderRadius: borderRadius.xl, overflow: 'hidden', marginTop: spacing.md },
  shareFullGradient: { paddingVertical: spacing.xl, alignItems: 'center' },
  shareFullText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default StaffInvoiceScreen;
