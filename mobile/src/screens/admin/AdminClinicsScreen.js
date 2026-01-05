/**
 * Admin Clinics Screen - Clinic Management
 * 100% Parity with Web Admin
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import adminApi from '../../services/api/adminApi';

const AdminClinicsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, approved, pending

  const fetchClinics = useCallback(async () => {
    try {
      const data = await adminApi.getClinics();
      setClinics(Array.isArray(data) ? data : data.clinics || []);
    } catch (error) {
      console.log('Error fetching clinics:', error.message);
      Alert.alert('Error', 'Failed to load clinics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClinics();
    setRefreshing(false);
  }, [fetchClinics]);

  const filteredClinics = clinics.filter(clinic => {
    // Check approval status - backend uses approvalStatus field
    const isApproved = clinic.approvalStatus === 'approved' || clinic.isApproved === true || clinic.approved === true;
    const matchesSearch = clinic.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         clinic.address?.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'all') return matchesSearch;
    if (filter === 'approved') return matchesSearch && isApproved;
    if (filter === 'pending') return matchesSearch && !isApproved;
    return matchesSearch;
  });

  const handleApprove = async (clinicId) => {
    Alert.alert('Approve Clinic', 'Are you sure you want to approve this clinic?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            await adminApi.approveClinic(clinicId);
            Alert.alert('Success', 'Clinic approved successfully');
            fetchClinics();
          } catch (error) {
            Alert.alert('Error', error.message || 'Failed to approve clinic');
          }
        },
      },
    ]);
  };

  const handleReject = async (clinicId) => {
    Alert.alert('Reject Clinic', 'Are you sure you want to reject this clinic?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminApi.rejectClinic(clinicId, 'Rejected by admin');
            Alert.alert('Success', 'Clinic rejected');
            fetchClinics();
          } catch (error) {
            Alert.alert('Error', error.message || 'Failed to reject clinic');
          }
        },
      },
    ]);
  };

  const FilterButton = ({ label, value }) => (
    <TouchableOpacity
      style={[styles.filterBtn, filter === value && styles.filterBtnActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterBtnText, { color: filter === value ? '#fff' : colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderClinic = ({ item }) => {
    // Check approval status - backend uses approvalStatus field
    const isApproved = item.approvalStatus === 'approved' || item.isApproved === true || item.approved === true;
    
    return (
    <TouchableOpacity
      style={[styles.clinicCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('AdminClinicDetail', { clinicId: item._id })}
    >
      <View style={styles.clinicHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>🏥</Text>
        </View>
        <View style={styles.clinicInfo}>
          <Text style={[styles.clinicName, { color: colors.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.clinicAddress, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.address}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isApproved ? '#10B98120' : '#F59E0B20' }]}>
          <Text style={[styles.statusText, { color: isApproved ? '#10B981' : '#F59E0B' }]}>
            {isApproved ? 'Active' : 'Pending'}
          </Text>
        </View>
      </View>

      <View style={styles.clinicStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{item.doctorCount || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Doctors</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{item.staffCount || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Staff</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{item.appointmentCount || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Appointments</Text>
        </View>
      </View>

      {!isApproved && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => handleApprove(item._id)}
          >
            <Text style={styles.approveBtnText}>✓ Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => handleReject(item._id)}
          >
            <Text style={styles.rejectBtnText}>✕ Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Clinics</Text>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => navigation.navigate('AdminAddClinic')}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.textPrimary }]}
          placeholder="Search clinics..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <FilterButton label="All" value="all" />
        <FilterButton label="Active" value="approved" />
        <FilterButton label="Pending" value="pending" />
      </View>

      {/* List */}
      <FlatList
        data={filteredClinics}
        renderItem={renderClinic}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F39C12" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏥</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No clinics found</Text>
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
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F39C12', alignItems: 'center', justifyContent: 'center' },
  addIcon: { fontSize: 24, color: '#fff', fontWeight: '600' },
  countBadge: { ...typography.labelMedium },
  searchContainer: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  searchInput: { height: 48, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, ...typography.bodyMedium },
  filterContainer: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm },
  filterBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: 'rgba(0,0,0,0.05)' },
  filterBtnActive: { backgroundColor: '#F39C12' },
  filterBtnText: { ...typography.labelMedium },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  clinicCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  clinicHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarContainer: { width: 48, height: 48, borderRadius: borderRadius.lg, backgroundColor: '#1ABC9C20', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24 },
  clinicInfo: { flex: 1, marginLeft: spacing.md },
  clinicName: { ...typography.bodyLarge, fontWeight: '600' },
  clinicAddress: { ...typography.bodySmall, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  statusText: { ...typography.labelSmall, fontWeight: '600' },
  clinicStats: { flexDirection: 'row', marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { ...typography.bodyLarge, fontWeight: '700' },
  statLabel: { ...typography.labelSmall, marginTop: 2 },
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

export default AdminClinicsScreen;
