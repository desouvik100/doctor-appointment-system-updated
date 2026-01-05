/**
 * Admin Clinic Detail Screen - Clinic Profile & Management
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
  FlatList,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import adminApi from '../../services/api/adminApi';

const AdminClinicDetailScreen = ({ navigation, route }) => {
  const { clinicId } = route.params;
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clinic, setClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);

  const fetchClinic = useCallback(async () => {
    try {
      const [clinicData, clinicWithDoctors] = await Promise.all([
        adminApi.getClinicById(clinicId),
        adminApi.getClinicWithDoctors(clinicId).catch(() => ({ doctors: [] })),
      ]);
      setClinic(clinicData.clinic || clinicData);
      setDoctors(clinicWithDoctors.doctors || []);
    } catch (error) {
      console.log('Error fetching clinic:', error.message);
      Alert.alert('Error', 'Failed to load clinic details');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => { fetchClinic(); }, [fetchClinic]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClinic();
    setRefreshing(false);
  }, [fetchClinic]);

  const handleApprove = async () => {
    Alert.alert('Approve Clinic', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: async () => {
        try {
          await adminApi.approveClinic(clinicId);
          Alert.alert('Success', 'Clinic approved');
          fetchClinic();
        } catch (error) {
          Alert.alert('Error', error.message);
        }
      }},
    ]);
  };


  const handleDeactivate = async () => {
    Alert.alert('Deactivate Clinic', 'This will deactivate the clinic.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Deactivate', style: 'destructive', onPress: async () => {
        try {
          await adminApi.deactivateClinic(clinicId);
          Alert.alert('Success', 'Clinic deactivated');
          navigation.goBack();
        } catch (error) {
          Alert.alert('Error', error.message);
        }
      }},
    ]);
  };

  const renderDoctor = ({ item }) => (
    <TouchableOpacity
      style={[styles.doctorItem, { backgroundColor: colors.backgroundCard }]}
      onPress={() => navigation.navigate('AdminDoctorDetail', { doctorId: item._id })}
    >
      <View style={styles.doctorAvatar}>
        <Text style={styles.doctorAvatarText}>{item.name?.charAt(0) || 'D'}</Text>
      </View>
      <View style={styles.doctorInfo}>
        <Text style={[styles.doctorName, { color: colors.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.doctorSpec, { color: colors.textSecondary }]}>{item.specialization}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#F39C12" />
      </View>
    );
  }

  if (!clinic) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Clinic Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Clinic not found</Text>
        </View>
      </View>
    );
  }

  const isApproved = clinic.approvalStatus === 'approved' || clinic.isApproved === true;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Clinic Details</Text>
        <TouchableOpacity 
          style={styles.editBtn}
          onPress={() => navigation.navigate('AdminEditClinic', { clinicId, clinic })}
        >
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F39C12" />}
      >
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>🏥</Text>
          </View>
          <Text style={[styles.clinicName, { color: colors.textPrimary }]}>{clinic.name}</Text>
          <Text style={[styles.clinicAddress, { color: colors.textSecondary }]}>{clinic.address}</Text>
          <View style={[styles.statusBadge, { backgroundColor: isApproved ? '#10B98120' : '#F59E0B20' }]}>
            <Text style={[styles.statusText, { color: isApproved ? '#10B981' : '#F59E0B' }]}>
              {isApproved ? 'Active' : 'Pending Approval'}
            </Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Phone</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{clinic.phone || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Email</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{clinic.email || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>City</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{clinic.city || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Timings</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{clinic.timings || 'N/A'}</Text>
          </View>
        </View>

        {doctors.length > 0 && (
          <View style={styles.doctorsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Doctors ({doctors.length})</Text>
            <FlatList
              data={doctors}
              renderItem={renderDoctor}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
            />
          </View>
        )}

        <View style={styles.actionButtons}>
          {!isApproved && (
            <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={handleApprove}>
              <Text style={styles.approveBtnText}>✓ Approve Clinic</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionBtn, styles.deactivateBtn]} onPress={handleDeactivate}>
            <Text style={styles.deactivateBtnText}>Deactivate Clinic</Text>
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
  editBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  editIcon: { fontSize: 18 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...typography.bodyMedium },
  profileCard: { padding: spacing.xl, borderRadius: borderRadius.xl, alignItems: 'center', marginBottom: spacing.lg },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1ABC9C20', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarText: { fontSize: 36 },
  clinicName: { ...typography.headlineMedium, marginBottom: spacing.xs, textAlign: 'center' },
  clinicAddress: { ...typography.bodyMedium, marginBottom: spacing.md, textAlign: 'center' },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  statusText: { ...typography.labelMedium, fontWeight: '600' },
  infoCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  infoLabel: { ...typography.bodySmall },
  infoValue: { ...typography.bodyMedium, fontWeight: '500' },
  doctorsSection: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.bodyLarge, fontWeight: '600', marginBottom: spacing.md },
  doctorItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  doctorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#9B59B620', alignItems: 'center', justifyContent: 'center' },
  doctorAvatarText: { fontSize: 16, fontWeight: '700', color: '#9B59B6' },
  doctorInfo: { flex: 1, marginLeft: spacing.md },
  doctorName: { ...typography.bodyMedium, fontWeight: '600' },
  doctorSpec: { ...typography.labelSmall },
  actionButtons: { gap: spacing.md },
  actionBtn: { paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  approveBtn: { backgroundColor: '#10B981' },
  approveBtnText: { color: '#fff', fontWeight: '600', ...typography.bodyMedium },
  deactivateBtn: { backgroundColor: '#EF444420' },
  deactivateBtnText: { color: '#EF4444', fontWeight: '600', ...typography.bodyMedium },
});

export default AdminClinicDetailScreen;
