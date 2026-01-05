/**
 * Admin Approvals Screen - Pending Approvals Management
 * 100% Parity with Web Admin
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import adminApi from '../../services/api/adminApi';

const AdminApprovalsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('doctors');
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [pendingStaff, setPendingStaff] = useState([]);
  const [pendingClinics, setPendingClinics] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [doctors, staff, clinics] = await Promise.all([
        adminApi.getPendingDoctors().catch(() => []),
        adminApi.getPendingStaff().catch(() => []),
        adminApi.getPendingClinics().catch(() => []),
      ]);
      setPendingDoctors(Array.isArray(doctors) ? doctors : doctors.doctors || []);
      setPendingStaff(Array.isArray(staff) ? staff : staff.receptionists || []);
      setPendingClinics(Array.isArray(clinics) ? clinics : clinics.clinics || []);
    } catch (error) {
      console.log('Error fetching approvals:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);


  const handleApproveDoctor = async (doctorId) => {
    try {
      await adminApi.approveDoctor(doctorId);
      Alert.alert('Success', 'Doctor approved');
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRejectDoctor = async (doctorId) => {
    try {
      await adminApi.rejectDoctor(doctorId, 'Rejected by admin');
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleApproveStaff = async (staffId) => {
    try {
      await adminApi.approveStaff(staffId);
      Alert.alert('Success', 'Staff approved');
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRejectStaff = async (staffId) => {
    try {
      await adminApi.rejectStaff(staffId, 'Rejected by admin');
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleApproveClinic = async (clinicId) => {
    try {
      await adminApi.approveClinic(clinicId);
      Alert.alert('Success', 'Clinic approved');
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRejectClinic = async (clinicId) => {
    try {
      await adminApi.rejectClinic(clinicId, 'Rejected by admin');
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const TabButton = ({ label, value, count }) => (
    <TouchableOpacity
      style={[styles.tabBtn, activeTab === value && styles.tabBtnActive]}
      onPress={() => setActiveTab(value)}
    >
      <Text style={[styles.tabBtnText, { color: activeTab === value ? '#fff' : colors.textSecondary }]}>
        {label} {count > 0 && <Text style={styles.tabCount}>({count})</Text>}
      </Text>
    </TouchableOpacity>
  );

  const renderDoctor = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{item.name?.charAt(0)}</Text></View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: colors.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{item.specialization}</Text>
          <Text style={[styles.cardEmail, { color: colors.textMuted }]}>{item.email}</Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleApproveDoctor(item._id)}>
          <Text style={styles.approveBtnText}>✓ Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleRejectDoctor(item._id)}>
          <Text style={styles.rejectBtnText}>✕ Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStaff = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: '#E74C3C20' }]}><Text style={[styles.avatarText, { color: '#E74C3C' }]}>{item.name?.charAt(0)}</Text></View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: colors.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.cardEmail, { color: colors.textMuted }]}>{item.email}</Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleApproveStaff(item._id)}>
          <Text style={styles.approveBtnText}>✓ Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleRejectStaff(item._id)}>
          <Text style={styles.rejectBtnText}>✕ Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderClinic = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: '#1ABC9C20' }]}><Text style={styles.clinicIcon}>🏥</Text></View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: colors.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={2}>{item.address}</Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleApproveClinic(item._id)}>
          <Text style={styles.approveBtnText}>✓ Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleRejectClinic(item._id)}>
          <Text style={styles.rejectBtnText}>✕ Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getData = () => {
    switch (activeTab) {
      case 'doctors': return pendingDoctors;
      case 'staff': return pendingStaff;
      case 'clinics': return pendingClinics;
      default: return [];
    }
  };

  const getRenderItem = () => {
    switch (activeTab) {
      case 'doctors': return renderDoctor;
      case 'staff': return renderStaff;
      case 'clinics': return renderClinic;
      default: return renderDoctor;
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#F39C12" />
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Pending Approvals</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TabButton label="Doctors" value="doctors" count={pendingDoctors.length} />
        <TabButton label="Staff" value="staff" count={pendingStaff.length} />
        <TabButton label="Clinics" value="clinics" count={pendingClinics.length} />
      </View>

      <FlatList
        data={getData()}
        renderItem={getRenderItem()}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F39C12" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No pending approvals</Text>
          </View>
        }
      />
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
  tabContainer: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm },
  tabBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#F39C12' },
  tabBtnText: { ...typography.labelMedium },
  tabCount: { fontWeight: '700' },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  card: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#9B59B620', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#9B59B6' },
  clinicIcon: { fontSize: 24 },
  cardInfo: { flex: 1, marginLeft: spacing.md },
  cardName: { ...typography.bodyLarge, fontWeight: '600' },
  cardSub: { ...typography.bodySmall, marginTop: 2 },
  cardEmail: { ...typography.labelSmall, marginTop: 2 },
  actionButtons: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  actionBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
  approveBtn: { backgroundColor: '#10B98120' },
  approveBtnText: { color: '#10B981', fontWeight: '600' },
  rejectBtn: { backgroundColor: '#EF444420' },
  rejectBtnText: { color: '#EF4444', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },
});

export default AdminApprovalsScreen;
