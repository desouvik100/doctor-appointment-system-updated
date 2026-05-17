/**
 * Admin Appointment Detail Screen - View & Manage Appointment
 * 100% Parity with Web Admin
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
import adminApi from '../../services/api/adminApi';

const AdminAppointmentDetailScreen = ({ navigation, route }) => {
  const { appointmentId } = route.params;
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointment, setAppointment] = useState(null);

  const fetchAppointment = useCallback(async () => {
    try {
      const data = await adminApi.getAppointmentById(appointmentId);
      setAppointment(data.appointment || data);
    } catch (error) {
      console.log('Error fetching appointment:', error.message);
      Alert.alert('Error', 'Failed to load appointment details');
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

  const handleCancel = async () => {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        try {
          await adminApi.cancelAppointment(appointmentId, 'Cancelled by admin');
          Alert.alert('Success', 'Appointment cancelled');
          fetchAppointment();
        } catch (error) {
          Alert.alert('Error', error.message);
        }
      }},
    ]);
  };

  const handleUpdateStatus = async (status) => {
    try {
      await adminApi.updateAppointmentStatus(appointmentId, status);
      Alert.alert('Success', `Appointment marked as ${status}`);
      fetchAppointment();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#10B981';
      case 'confirmed': return '#3B82F6';
      case 'pending': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#F39C12" />
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
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Appointment not found</Text>
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor(appointment.status);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Appointment</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F39C12" />}
      >
        <View style={[styles.statusCard, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {appointment.status?.toUpperCase() || 'UNKNOWN'}
          </Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📅 Appointment Info</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Date</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{formatDate(appointment.date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Time</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{appointment.timeSlot || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Type</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{appointment.type || 'In-Person'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Fee</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>₹{appointment.fee || 0}</Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>👨‍⚕️ Doctor</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Name</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{appointment.doctor?.name || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Specialization</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{appointment.doctor?.specialization || 'N/A'}</Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>👤 Patient</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Name</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{appointment.patient?.name || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Phone</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{appointment.patient?.phone || 'N/A'}</Text>
          </View>
        </View>

        {appointment.reason && (
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📝 Reason</Text>
            <Text style={[styles.reasonText, { color: colors.textSecondary }]}>{appointment.reason}</Text>
          </View>
        )}

        {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
          <View style={styles.actionButtons}>
            {appointment.status === 'pending' && (
              <TouchableOpacity 
                style={[styles.actionBtn, styles.confirmBtn]} 
                onPress={() => handleUpdateStatus('confirmed')}
              >
                <Text style={styles.confirmBtnText}>✓ Confirm</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.actionBtn, styles.completeBtn]} 
              onPress={() => handleUpdateStatus('completed')}
            >
              <Text style={styles.completeBtnText}>✓ Mark Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>✕ Cancel Appointment</Text>
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
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...typography.bodyMedium },
  statusCard: { padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.lg },
  statusText: { ...typography.headlineSmall, fontWeight: '700' },
  infoCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  sectionTitle: { ...typography.bodyLarge, fontWeight: '600', marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  infoLabel: { ...typography.bodySmall },
  infoValue: { ...typography.bodyMedium, fontWeight: '500' },
  reasonText: { ...typography.bodyMedium },
  actionButtons: { gap: spacing.md, marginTop: spacing.md },
  actionBtn: { paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  confirmBtn: { backgroundColor: '#3B82F6' },
  confirmBtnText: { color: '#fff', fontWeight: '600', ...typography.bodyMedium },
  completeBtn: { backgroundColor: '#10B981' },
  completeBtnText: { color: '#fff', fontWeight: '600', ...typography.bodyMedium },
  cancelBtn: { backgroundColor: '#EF444420' },
  cancelBtnText: { color: '#EF4444', fontWeight: '600', ...typography.bodyMedium },
});

export default AdminAppointmentDetailScreen;
