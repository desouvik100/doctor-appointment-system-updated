/**
 * Admin Doctor Detail Screen - Doctor Profile & Management
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

const AdminDoctorDetailScreen = ({ navigation, route }) => {
  const { doctorId } = route.params;
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctor, setDoctor] = useState(null);

  const fetchDoctor = useCallback(async () => {
    try {
      const data = await adminApi.getDoctorById(doctorId);
      setDoctor(data.doctor || data);
    } catch (error) {
      console.log('Error fetching doctor:', error.message);
      Alert.alert('Error', 'Failed to load doctor details');
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => { fetchDoctor(); }, [fetchDoctor]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDoctor();
    setRefreshing(false);
  }, [fetchDoctor]);

  const handleApprove = async () => {
    Alert.alert('Approve Doctor', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: async () => {
        try {
          await adminApi.approveDoctor(doctorId);
          Alert.alert('Success', 'Doctor approved');
          fetchDoctor();
        } catch (error) {
          Alert.alert('Error', error.message);
        }
      }},
    ]);
  };

  const handleDeactivate = async () => {
    Alert.alert('Deactivate Doctor', 'This will remove the doctor from the platform.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Deactivate', style: 'destructive', onPress: async () => {
        try {
          await adminApi.deactivateDoctor(doctorId);
          Alert.alert('Success', 'Doctor deactivated');
          navigation.goBack();
        } catch (error) {
          Alert.alert('Error', error.message);
        }
      }},
    ]);
  };


  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#F39C12" />
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Doctor Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Doctor not found</Text>
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Doctor Details</Text>
        <TouchableOpacity 
          style={styles.editBtn}
          onPress={() => navigation.navigate('AdminEditDoctor', { doctorId, doctor })}
        >
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F39C12" />}
      >
        {/* Profile Card */}
        {(() => {
          // Check approval status - backend uses approvalStatus field
          const isApproved = doctor.approvalStatus === 'approved' || doctor.isApproved === true;
          return (
        <>
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{doctor.name?.charAt(0) || 'D'}</Text>
          </View>
          <Text style={[styles.doctorName, { color: colors.textPrimary }]}>{doctor.name}</Text>
          <Text style={[styles.doctorSpec, { color: colors.textSecondary }]}>{doctor.specialization}</Text>
          <View style={[styles.statusBadge, { backgroundColor: isApproved ? '#10B98120' : '#F59E0B20' }]}>
            <Text style={[styles.statusText, { color: isApproved ? '#10B981' : '#F59E0B' }]}>
              {isApproved ? 'Approved' : 'Pending Approval'}
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Email</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{doctor.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Phone</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{doctor.phone || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Experience</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{doctor.experience || 0} years</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Consultation Fee</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>₹{doctor.consultationFee || 0}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Rating</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>⭐ {doctor.rating?.toFixed(1) || 'N/A'}</Text>
          </View>
        </View>

        {/* Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{doctor.appointmentCount || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Appointments</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{doctor.patientCount || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Patients</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{doctor.reviewCount || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Reviews</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!isApproved && (
            <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={handleApprove}>
              <Text style={styles.approveBtnText}>✓ Approve Doctor</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionBtn, styles.deactivateBtn]} onPress={handleDeactivate}>
            <Text style={styles.deactivateBtnText}>Deactivate Doctor</Text>
          </TouchableOpacity>
        </View>
        </>
          );
        })()}
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
  editBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  editIcon: { fontSize: 18 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...typography.bodyMedium },
  profileCard: { padding: spacing.xl, borderRadius: borderRadius.xl, alignItems: 'center', marginBottom: spacing.lg },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#9B59B620', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#9B59B6' },
  doctorName: { ...typography.headlineMedium, marginBottom: spacing.xs },
  doctorSpec: { ...typography.bodyMedium, marginBottom: spacing.md },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  statusText: { ...typography.labelMedium, fontWeight: '600' },
  infoCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  infoLabel: { ...typography.bodySmall },
  infoValue: { ...typography.bodyMedium, fontWeight: '500' },
  statsCard: { flexDirection: 'row', padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.xl },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  statValue: { ...typography.headlineSmall },
  statLabel: { ...typography.labelSmall, marginTop: 2 },
  actionButtons: { gap: spacing.md },
  actionBtn: { paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  approveBtn: { backgroundColor: '#10B981' },
  approveBtnText: { color: '#fff', fontWeight: '600', ...typography.bodyMedium },
  deactivateBtn: { backgroundColor: '#EF444420' },
  deactivateBtnText: { color: '#EF4444', fontWeight: '600', ...typography.bodyMedium },
});

export default AdminDoctorDetailScreen;
