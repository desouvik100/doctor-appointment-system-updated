/**
 * Admin Staff Screen - Staff/Receptionist Management
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

const AdminStaffScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [staff, setStaff] = useState([]);
  const [pendingStaff, setPendingStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('pending'); // pending, all

  const fetchStaff = useCallback(async () => {
    try {
      const pending = await adminApi.getPendingStaff();
      setPendingStaff(Array.isArray(pending) ? pending : pending.receptionists || []);
    } catch (error) {
      console.log('Error fetching staff:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStaff();
    setRefreshing(false);
  }, [fetchStaff]);

  const displayStaff = filter === 'pending' ? pendingStaff : staff;
  const filteredStaff = displayStaff.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = async (staffId) => {
    Alert.alert('Approve Staff', 'Are you sure you want to approve this staff member?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            await adminApi.approveStaff(staffId);
            Alert.alert('Success', 'Staff approved successfully');
            fetchStaff();
          } catch (error) {
            Alert.alert('Error', error.message || 'Failed to approve staff');
          }
        },
      },
    ]);
  };

  const handleReject = async (staffId) => {
    Alert.alert('Reject Staff', 'Are you sure you want to reject this staff member?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminApi.rejectStaff(staffId, 'Rejected by admin');
            Alert.alert('Success', 'Staff rejected');
            fetchStaff();
          } catch (error) {
            Alert.alert('Error', error.message || 'Failed to reject staff');
          }
        },
      },
    ]);
  };

  const FilterButton = ({ label, value, count }) => (
    <TouchableOpacity
      style={[styles.filterBtn, filter === value && styles.filterBtnActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterBtnText, { color: filter === value ? '#fff' : colors.textSecondary }]}>
        {label} {count > 0 && `(${count})`}
      </Text>
    </TouchableOpacity>
  );

  const renderStaff = ({ item }) => {
    // Check approval status - backend uses approvalStatus field
    const isApproved = item.approvalStatus === 'approved' || item.isApproved === true || item.approved === true;
    
    return (
    <View style={[styles.staffCard, { backgroundColor: colors.surface }]}>
      <View style={styles.staffHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{item.name?.charAt(0) || 'S'}</Text>
        </View>
        <View style={styles.staffInfo}>
          <Text style={[styles.staffName, { color: colors.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.staffEmail, { color: colors.textSecondary }]}>{item.email}</Text>
          <Text style={[styles.staffPhone, { color: colors.textMuted }]}>{item.phone}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isApproved ? '#10B98120' : '#F59E0B20' }]}>
          <Text style={[styles.statusText, { color: isApproved ? '#10B981' : '#F59E0B' }]}>
            {isApproved ? 'Approved' : 'Pending'}
          </Text>
        </View>
      </View>

      {item.clinic && (
        <View style={styles.clinicInfo}>
          <Text style={[styles.clinicLabel, { color: colors.textMuted }]}>Clinic:</Text>
          <Text style={[styles.clinicName, { color: colors.textSecondary }]}>{item.clinic.name}</Text>
        </View>
      )}

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
    </View>
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Staff Management</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.textPrimary }]}
          placeholder="Search staff..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <FilterButton label="Pending" value="pending" count={pendingStaff.length} />
        <FilterButton label="All Staff" value="all" count={staff.length} />
      </View>

      {/* List */}
      <FlatList
        data={filteredStaff}
        renderItem={renderStaff}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F39C12" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👩‍💼</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {filter === 'pending' ? 'No pending approvals' : 'No staff found'}
            </Text>
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
  searchContainer: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  searchInput: { height: 48, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, ...typography.bodyMedium },
  filterContainer: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm },
  filterBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: 'rgba(0,0,0,0.05)' },
  filterBtnActive: { backgroundColor: '#F39C12' },
  filterBtnText: { ...typography.labelMedium },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  staffCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  staffHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E74C3C20', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#E74C3C' },
  staffInfo: { flex: 1, marginLeft: spacing.md },
  staffName: { ...typography.bodyLarge, fontWeight: '600' },
  staffEmail: { ...typography.bodySmall, marginTop: 2 },
  staffPhone: { ...typography.labelSmall, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  statusText: { ...typography.labelSmall, fontWeight: '600' },
  clinicInfo: { flexDirection: 'row', marginTop: spacing.sm, alignItems: 'center' },
  clinicLabel: { ...typography.labelSmall },
  clinicName: { ...typography.bodySmall, marginLeft: spacing.xs },
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

export default AdminStaffScreen;
