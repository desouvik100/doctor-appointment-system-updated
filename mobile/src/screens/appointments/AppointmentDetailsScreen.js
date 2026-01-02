/**
 * AppointmentDetailsScreen - Full appointment details with actions
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
import QRCode from 'react-native-qrcode-svg';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import CancelModal from './components/CancelModal';
import QueueTracker from './components/QueueTracker';

const AppointmentDetailsScreen = ({ navigation, route }) => {
  const { appointment } = route.params || {};
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Mock appointment data
  const appointmentData = appointment || {
    id: 'APT123456',
    doctor: { name: 'Dr. Sarah Wilson', specialty: 'Cardiologist', fee: 500 },
    date: '2026-01-05',
    time: '2:30 PM',
    type: 'clinic',
    status: 'confirmed',
    patient: { name: 'John Doe', relation: 'Self' },
    queuePosition: 3,
    estimatedWait: 15,
    clinicAddress: '123 Medical Center Drive, Suite 400',
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleReschedule = () => {
    navigation.navigate('Reschedule', { appointment: appointmentData });
  };

  const handleCancel = (reason) => {
    setShowCancelModal(false);
    Alert.alert('Appointment Cancelled', 'Your appointment has been cancelled. Refund will be processed within 3-5 business days.');
    navigation.goBack();
  };

  const handleJoinCall = () => {
    navigation.navigate('VideoConsult', { appointmentId: appointmentData.id });
  };

  const handleCheckIn = () => {
    Alert.alert('Check-in Successful', 'You have been checked in. Please wait for your turn.');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Status Banner */}
        <LinearGradient
          colors={appointmentData.status === 'confirmed' ? ['#10B981', '#059669'] : colors.gradientPrimary}
          style={styles.statusBanner}
        >
          <Text style={styles.statusIcon}>
            {appointmentData.status === 'confirmed' ? '✓' : '⏳'}
          </Text>
          <Text style={styles.statusText}>
            {appointmentData.status === 'confirmed' ? 'Appointment Confirmed' : 'Pending Confirmation'}
          </Text>
        </LinearGradient>

        {/* Doctor Card */}
        <Card variant="gradient" style={styles.doctorCard}>
          <View style={styles.doctorRow}>
            <Avatar name={appointmentData.doctor?.name || 'Doctor'} size="large" />
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{appointmentData.doctor?.name || 'Doctor'}</Text>
              <Text style={styles.specialty}>{appointmentData.doctor?.specialty || 'Specialist'}</Text>
            </View>
          </View>
        </Card>

        {/* Appointment Details */}
        <Card variant="default" style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>📅</Text>
              <View>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatDate(appointmentData.date)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>⏰</Text>
              <View>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{appointmentData.time}</Text>
              </View>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>{appointmentData.type === 'video' ? '📹' : '🏥'}</Text>
              <View>
                <Text style={styles.detailLabel}>Consultation Type</Text>
                <Text style={styles.detailValue}>
                  {appointmentData.type === 'video' ? 'Video Call' : 'Clinic Visit'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>👤</Text>
              <View>
                <Text style={styles.detailLabel}>Patient</Text>
                <Text style={styles.detailValue}>{appointmentData.patient?.name || 'Patient'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>🆔</Text>
              <View>
                <Text style={styles.detailLabel}>Booking ID</Text>
                <Text style={styles.detailValue}>{appointmentData.id}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Queue Tracker (for clinic visits) */}
        {appointmentData.type === 'clinic' && appointmentData.status === 'confirmed' && (
          <QueueTracker
            position={appointmentData.queuePosition}
            estimatedWait={appointmentData.estimatedWait}
          />
        )}

        {/* QR Code Section */}
        {appointmentData.type === 'clinic' && (
          <Card variant="default" style={styles.qrSection}>
            <TouchableOpacity style={styles.qrHeader} onPress={() => setShowQR(!showQR)}>
              <Text style={styles.qrTitle}>Check-in QR Code</Text>
              <Text style={styles.qrToggle}>{showQR ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showQR && (
              <View style={styles.qrContainer}>
                <QRCode
                  value={JSON.stringify({ bookingId: appointmentData.id, patientId: appointmentData.patient?.id })}
                  size={150}
                  backgroundColor="white"
                  color={colors.background}
                />
                <Text style={styles.qrHint}>Show this at the clinic for quick check-in</Text>
              </View>
            )}
          </Card>
        )}

        {/* Clinic Address (for clinic visits) */}
        {appointmentData.type === 'clinic' && (
          <Card variant="default" style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <Text style={styles.addressIcon}>📍</Text>
              <Text style={styles.addressTitle}>Clinic Location</Text>
            </View>
            <Text style={styles.addressText}>{appointmentData.clinicAddress}</Text>
            <TouchableOpacity style={styles.directionsBtn}>
              <Text style={styles.directionsBtnText}>Get Directions</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Payment Info */}
        <Card variant="default" style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Consultation Fee</Text>
            <Text style={styles.paymentValue}>₹{appointmentData.doctor?.fee || 0}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Status</Text>
            <Text style={styles.paymentPaid}>✓ Paid</Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {appointmentData.type === 'video' && appointmentData.status === 'confirmed' && (
            <Button title="Join Video Call" onPress={handleJoinCall} fullWidth size="large" />
          )}
          {appointmentData.type === 'clinic' && appointmentData.status === 'confirmed' && (
            <Button title="Check In" onPress={handleCheckIn} fullWidth size="large" />
          )}
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleReschedule}>
              <Text style={styles.secondaryBtnText}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, styles.cancelBtn]} onPress={() => setShowCancelModal(true)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <CancelModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        refundAmount={appointmentData.doctor?.fee || 0}
      />
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
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.huge },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.xl,
  },
  statusIcon: { fontSize: 18, color: 'white', marginRight: spacing.sm },
  statusText: { ...typography.labelMedium, color: 'white' },
  doctorCard: { padding: spacing.lg, marginBottom: spacing.lg },
  doctorRow: { flexDirection: 'row', alignItems: 'center' },
  doctorInfo: { flex: 1, marginLeft: spacing.md },
  doctorName: { ...typography.headlineSmall, color: colors.textPrimary },
  specialty: { ...typography.bodyMedium, color: colors.textSecondary },
  detailsCard: { padding: spacing.lg, marginBottom: spacing.lg },
  detailRow: { marginBottom: spacing.md },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailIcon: { fontSize: 20, marginRight: spacing.md, width: 30 },
  detailLabel: { ...typography.labelSmall, color: colors.textMuted },
  detailValue: { ...typography.bodyMedium, color: colors.textPrimary },
  qrSection: { padding: spacing.lg, marginBottom: spacing.lg },
  qrHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qrTitle: { ...typography.headlineSmall, color: colors.textPrimary },
  qrToggle: { fontSize: 12, color: colors.textMuted },
  qrContainer: { alignItems: 'center', marginTop: spacing.lg },
  qrHint: { ...typography.labelSmall, color: colors.textMuted, marginTop: spacing.md },
  addressCard: { padding: spacing.lg, marginBottom: spacing.lg },
  addressHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  addressIcon: { fontSize: 18, marginRight: spacing.sm },
  addressTitle: { ...typography.headlineSmall, color: colors.textPrimary },
  addressText: { ...typography.bodyMedium, color: colors.textSecondary, marginBottom: spacing.md },
  directionsBtn: { alignSelf: 'flex-start' },
  directionsBtnText: { ...typography.labelMedium, color: colors.primary },
  paymentCard: { padding: spacing.lg, marginBottom: spacing.xl },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  paymentLabel: { ...typography.bodyMedium, color: colors.textSecondary },
  paymentValue: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: '600' },
  paymentPaid: { ...typography.labelMedium, color: colors.success },
  actionButtons: { marginBottom: spacing.xl },
  secondaryActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  secondaryBtn: {
    flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center',
    borderWidth: 1, borderColor: colors.surfaceBorder, backgroundColor: colors.surface,
  },
  secondaryBtnText: { ...typography.labelMedium, color: colors.textSecondary },
  cancelBtn: { borderColor: colors.error, backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  cancelBtnText: { ...typography.labelMedium, color: colors.error },
});

export default AppointmentDetailsScreen;
