/**
 * Admin Doctors Screen - Doctor Management
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

const AdminDoctorsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, approved, pending

  const fetchDoctors = useCallback(async () => {
    try {
      const data = await adminApi.getDoctors();
      setDoctors(Array.isArray(data) ? data : data.doctors || []);
    } catch (error) {
      console.log('Error fetching doctors:', error.message);
      Alert.alert('Error', 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDoctors();
    setRefreshing(false);
  }, [fetchDoctors]);

  const filteredDoctors = doctors.filter(doc => {
    // Check approval status - backend uses approvalStatus field with 'pending'/'approved'/'rejected' values
    const isApproved = doc.approvalStatus === 'approved' || doc.isApproved === true || doc.approved === true;
    const matchesSearch = doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'all') return matchesSearch;
    if (filter === 'approved') return matchesSearch && isApproved;
    if (filter === 'pending') return matchesSearch && !isApproved;
    return matchesSearch;
  });

  const handleApprove = async (doctorId) => {
    Alert.alert('Approve Doctor', 'Are you sure you want to approve this doctor?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            await adminApi.approveDoctor(doctorId);
            Alert.alert('Success', 'Doctor approved successfully');
            fetchDoctors();
          } catch (error) {
            Alert.alert('Error', error.message || 'Failed to approve doctor');
          }
        },
      },
    ]);
  };

  const handleReject = async (doctorId) => {
    Alert.prompt('Reject Doctor', 'Enter rejection reason:', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async (reason) => {
          try {
            await adminApi.rejectDoctor(doctorId, reason || 'Not specified');
            Alert.alert('Success', 'Doctor rejected');
            fetchDoctors();
          } catch (error) {
            Alert.alert('Error', error.message || 'Failed to reject doctor');
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

  const renderDoctor = ({ item }) => {
    // Check approval status - backend uses approvalStatus field with 'pending'/'approved'/'rejected' values
    const isApproved = item.approvalStatus === 'approved' || item.isApproved === true || item.approved === true;
    
    return (
    <TouchableOpacity
      style={[styles.doctorCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('AdminDoctorDetail', { doctorId: item._id })}
    >
      <View style={styles.doctorHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{item.name?.charAt(0) || 'D'}</Text>
        </View>
        <View style={styles.doctorInfo}>
          <Text style={[styles.doctorName, { color: colors.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.doctorSpec, { color: colors.textSecondary }]}>{item.specialization}</Text>
          <Text style={[styles.doctorEmail, { color: colors.textMuted }]}>{item.email}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isApproved ? '#10B98120' : '#F59E0B20' }]}>
          <Text style={[styles.statusText, { color: isApproved ? '#10B981' : '#F59E0B' }]}>
            {isApproved ? 'Approved' : 'Pending'}
          </Text>
        </View>
      </View>
      
      <View style={styles.doctorStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{item.appointmentCount || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Appointments</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>₹{item.consultationFee || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Fee</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{item.rating?.toFixed(1) || 'N/A'}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Rating</Text>
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Doctors</Text>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => navigation.navigate('AdminAddDoctor')}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.textPrimary }]}
          placeholder="Search doctors..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <FilterButton label="All" value="all" />
        <FilterButton label="Approved" value="approved" />
        <FilterButton label="Pending" value="pending" />
      </View>

      {/* List */}
      <FlatList
        data={filteredDoctors}
        renderItem={renderDoctor}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F39C12" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👨‍⚕️</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No doctors found</Text>
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
  doctorCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  doctorHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#9B59B620', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#9B59B6' },
  doctorInfo: { flex: 1, marginLeft: spacing.md },
  doctorName: { ...typography.bodyLarge, fontWeight: '600' },
  doctorSpec: { ...typography.bodySmall, marginTop: 2 },
  doctorEmail: { ...typography.labelSmall, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  statusText: { ...typography.labelSmall, fontWeight: '600' },
  doctorStats: { flexDirection: 'row', marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
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

export default AdminDoctorsScreen;
