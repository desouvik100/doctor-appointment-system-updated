/**
 * Doctor Appointment Detail Screen - View & Manage Appointment
 * 100% Parity with Web Doctor Dashboard
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
import doctorApi from '../../services/api/doctorDashboardApi';

const DoctorAppointmentDetailScreen = ({ navigation, route }) => {
  const { appointmentId } = route.params;
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointment, setAppointment] = useState(null);

  const fetchAppointment = useCallback(async () => {
    try {
      const data = await doctorApi.getAppointmentDetails(appointmentId);
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

  const handleStartConsultation = async () => {
    try {
      await doctorApi.startConsultation(appointmentId);
      Alert.alert('Success', 'Consultation started');
      fetchAppointment();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleComplete = async () => {
    Alert.alert('Complete Consultation', 'Mark this consultation as completed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: async () => {
        try {
          await doctorApi.completeAppointment(appointmentId);
          Alert.alert('Success', 'Consultation completed');
          navigation.goBack();
        } catch (error) {
          Alert.alert('Error', error.message);
        }
      }},
    ]);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#10B981';
      case 'in-progress': case 'in_progress': return '#3B82F6';
      case 'confirmed': return '#6C5CE7';
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
        <ActivityIndicator size="large" color="#6C5CE7" />
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
  const canStart = ['pending', 'confirmed'].includes(appointment.status?.toLowerCase());
  const canComplete = appointment.status?.toLowerCase() === 'in-progress' || appointment.status?.toLowerCase() === 'in_progress';

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />}
      >
        <View style={[styles.statusCard, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {appointment.status?.toUpperCase().replace('_', ' ') || 'UNKNOWN'}
          </Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📅 Schedule</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Date</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{formatDate(appointment.date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Time</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{appointment.time || appointment.timeSlot || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Type</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{appointment.consultationType || 'In-Person'}</Text>
          </View>
          {appointment.queueNumber && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Token #</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{appointment.queueNumber}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.infoCard, { backgroundColor: colors.surface }]}
          onPress={() => appointment.patient?._id && navigation.navigate('DoctorPatientDetail', { patientId: appointment.patient._id || appointment.userId })}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>👤 Patient</Text>
          <View style={styles.patientRow}>
            <View style={styles.patientAvatar}>
              <Text style={styles.patientAvatarText}>{appointment.patient?.name?.charAt(0) || 'P'}</Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={[styles.patientName, { color: colors.textPrimary }]}>{appointment.patient?.name || 'Patient'}</Text>
              <Text style={[styles.patientPhone, { color: colors.textSecondary }]}>{appointment.patient?.phone || 'N/A'}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>

        {appointment.reason && (
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📝 Reason for Visit</Text>
            <Text style={[styles.reasonText, { color: colors.textSecondary }]}>{appointment.reason}</Text>
          </View>
        )}

        {appointment.consultationType === 'online' && appointment.meetingLink && (
          <TouchableOpacity style={[styles.meetingCard, { backgroundColor: '#6C5CE720' }]}>
            <Text style={styles.meetingIcon}>📹</Text>
            <View style={styles.meetingInfo}>
              <Text style={[styles.meetingTitle, { color: '#6C5CE7' }]}>Video Consultation</Text>
              <Text style={[styles.meetingLink, { color: colors.textSecondary }]}>Tap to join meeting</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.actionButtons}>
          {canStart && (
            <TouchableOpacity style={[styles.actionBtn, styles.startBtn]} onPress={handleStartConsultation}>
              <Text style={styles.startBtnText}>▶ Start Consultation</Text>
            </TouchableOpacity>
          )}
          {canComplete && (
            <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]} onPress={handleComplete}>
              <Text style={styles.completeBtnText}>✓ Complete Consultation</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.actionBtn, styles.prescriptionBtn]}
            onPress={() => navigation.navigate('DoctorCreatePrescription', { appointmentId, patient: appointment.patient })}
          >
            <Text style={styles.prescriptionBtnText}>💊 Write Prescription</Text>
          </TouchableOpacity>
        </View>
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
  patientRow: { flexDirection: 'row', alignItems: 'center' },
  patientAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#6C5CE720', alignItems: 'center', justifyContent: 'center' },
  patientAvatarText: { fontSize: 18, fontWeight: '700', color: '#6C5CE7' },
  patientInfo: { flex: 1, marginLeft: spacing.md },
  patientName: { ...typography.bodyLarge, fontWeight: '600' },
  patientPhone: { ...typography.bodySmall },
  chevron: { fontSize: 24, color: '#6C5CE7' },
  reasonText: { ...typography.bodyMedium },
  meetingCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  meetingIcon: { fontSize: 32, marginRight: spacing.md },
  meetingInfo: { flex: 1 },
  meetingTitle: { ...typography.bodyLarge, fontWeight: '600' },
  meetingLink: { ...typography.bodySmall },
  actionButtons: { gap: spacing.md, marginTop: spacing.md },
  actionBtn: { paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  startBtn: { backgroundColor: '#6C5CE7' },
  startBtnText: { color: '#fff', fontWeight: '600', ...typography.bodyMedium },
  completeBtn: { backgroundColor: '#10B981' },
  completeBtnText: { color: '#fff', fontWeight: '600', ...typography.bodyMedium },
  prescriptionBtn: { backgroundColor: '#F39C1220' },
  prescriptionBtnText: { color: '#F39C12', fontWeight: '600', ...typography.bodyMedium },
});

export default DoctorAppointmentDetailScreen;
