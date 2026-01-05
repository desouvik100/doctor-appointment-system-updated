/**
 * Staff Appointment Detail Screen - View/Manage Appointment
 * 100% Parity with Web Staff Dashboard
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import staffApi from '../../services/api/staffDashboardApi';

const StaffAppointmentDetailScreen = ({ navigation, route }) => {
  const { appointmentId } = route.params;
  const { colors, isDarkMode } = useTheme();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAppointment = useCallback(async () => {
    try {
      // Use the billing endpoint to get appointment details
      const data = await staffApi.getAppointmentBilling(appointmentId).catch(() => null);
      setAppointment(data?.appointment || data);
    } catch (error) {
      console.log('Error fetching appointment:', error.message);
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => { fetchAppointment(); }, [fetchAppointment]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointment();
    setRefreshing(false);
  }, [fetchAppointment]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await staffApi.checkInPatient(appointmentId);
      Alert.alert('Success', 'Patient checked in');
      fetchAppointment();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        setActionLoading(true);
        try {
          await staffApi.cancelAppointment(appointmentId, 'Cancelled by staff');
          Alert.alert('Success', 'Appointment cancelled');
          navigation.goBack();
        } catch (error) {
          Alert.alert('Error', error.message);
        } finally {
          setActionLoading(false);
        }
      }},
    ]);
  };

  const handleReschedule = () => {
    navigation.navigate('StaffBookAppointment', {
      patientId: appointment?.patient?._id,
      patientName: appointment?.patient?.name,
      doctorId: appointment?.doctor?._id,
      doctorName: appointment?.doctor?.name,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'completed': return '#3B82F6';
      case 'cancelled': return '#EF4444';
      case 'checked-in': return '#6C5CE7';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Appointment</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>❌</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Appointment not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Appointment Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B6B" />}
      >
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(appointment.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
            {appointment.status?.toUpperCase() || 'PENDING'}
          </Text>
        </View>

        {/* Date & Time */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📅</Text>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Schedule</Text>
          </View>
          <Text style={[styles.dateText, { color: colors.textPrimary }]}>
            {appointment.date ? new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
          </Text>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {appointment.time || appointment.slot || 'Time not set'}
          </Text>
        </View>

        {/* Patient Info */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>👤</Text>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Patient</Text>
          </View>
          <Text style={[styles.personName, { color: colors.textPrimary }]}>
            {appointment.patient?.name || 'Unknown Patient'}
          </Text>
          <Text style={[styles.personMeta, { color: colors.textMuted }]}>
            {appointment.patient?.phone || 'No phone'} • {appointment.patient?.email || 'No email'}
          </Text>
        </View>

        {/* Doctor Info */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>👨‍⚕️</Text>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Doctor</Text>
          </View>
          <Text style={[styles.personName, { color: colors.textPrimary }]}>
            Dr. {appointment.doctor?.name || 'Unknown Doctor'}
          </Text>
          <Text style={[styles.personMeta, { color: colors.textMuted }]}>
            {appointment.doctor?.specialization || 'General'} • ₹{appointment.doctor?.consultationFee || 'N/A'}
          </Text>
        </View>

        {/* Notes */}
        {appointment.notes && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📝</Text>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Notes</Text>
            </View>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>{appointment.notes}</Text>
          </View>
        )}

        {/* Actions */}
        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
          <View style={styles.actionsContainer}>
            {appointment.status === 'confirmed' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                onPress={handleCheckIn}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                  <>
                    <Text style={styles.actionIcon}>✓</Text>
                    <Text style={styles.actionText}>Check In</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
              onPress={handleReschedule}
            >
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionText}>Reschedule</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
              onPress={handleCancel}
            >
              <Text style={styles.actionIcon}>✕</Text>
              <Text style={styles.actionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24 },
  headerTitle: { flex: 1, ...typography.headlineMedium, textAlign: 'center' },
  headerRight: { width: 40 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, marginBottom: spacing.lg },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  statusText: { ...typography.labelMedium, fontWeight: '600' },
  card: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  cardIcon: { fontSize: 20, marginRight: spacing.sm },
  cardTitle: { ...typography.bodyMedium, fontWeight: '600' },
  dateText: { ...typography.bodyLarge, fontWeight: '600' },
  timeText: { ...typography.bodyMedium, marginTop: spacing.xs },
  personName: { ...typography.bodyLarge, fontWeight: '600' },
  personMeta: { ...typography.bodySmall, marginTop: spacing.xs },
  notesText: { ...typography.bodyMedium },
  actionsContainer: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.lg, gap: spacing.xs },
  actionIcon: { fontSize: 16, color: '#fff' },
  actionText: { color: '#fff', fontWeight: '600', ...typography.labelMedium },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },
});

export default StaffAppointmentDetailScreen;
