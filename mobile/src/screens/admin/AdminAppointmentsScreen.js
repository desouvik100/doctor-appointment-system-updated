/**
 * Admin Appointments Screen - All Appointments Management
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

const AdminAppointmentsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchAppointments = useCallback(async () => {
    try {
      const data = await adminApi.getAppointments();
      setAppointments(Array.isArray(data) ? data : data.appointments || []);
    } catch (error) {
      console.log('Error fetching appointments:', error.message);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  }, [fetchAppointments]);

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         apt.doctor?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'all') return matchesSearch;
    return matchesSearch && apt.status === filter;
  });


  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'confirmed': return '#3498DB';
      case 'pending': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
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

  const renderAppointment = ({ item }) => (
    <TouchableOpacity
      style={[styles.appointmentCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('AdminAppointmentDetail', { appointmentId: item._id })}
    >
      <View style={styles.appointmentHeader}>
        <View style={styles.dateContainer}>
          <Text style={[styles.dateDay, { color: colors.textPrimary }]}>
            {new Date(item.date).getDate()}
          </Text>
          <Text style={[styles.dateMonth, { color: colors.textSecondary }]}>
            {new Date(item.date).toLocaleString('default', { month: 'short' })}
          </Text>
        </View>
        <View style={styles.appointmentInfo}>
          <Text style={[styles.patientName, { color: colors.textPrimary }]}>
            {item.patient?.name || 'Unknown Patient'}
          </Text>
          <Text style={[styles.doctorName, { color: colors.textSecondary }]}>
            Dr. {item.doctor?.name || 'Unknown'}
          </Text>
          <Text style={[styles.timeSlot, { color: colors.textMuted }]}>
            {item.timeSlot || item.time}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Appointments</Text>
        <View style={styles.headerRight}>
          <Text style={[styles.countBadge, { color: colors.textSecondary }]}>{filteredAppointments.length}</Text>
        </View>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.textPrimary }]}
          placeholder="Search appointments..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <View style={styles.filterContainer}>
        <FilterButton label="All" value="all" />
        <FilterButton label="Pending" value="pending" />
        <FilterButton label="Confirmed" value="confirmed" />
        <FilterButton label="Completed" value="completed" />
      </View>
      <FlatList
        data={filteredAppointments}
        renderItem={renderAppointment}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F39C12" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No appointments found</Text>
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
  countBadge: { ...typography.labelMedium },
  searchContainer: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  searchInput: { height: 48, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, ...typography.bodyMedium },
  filterContainer: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm },
  filterBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: 'rgba(0,0,0,0.05)' },
  filterBtnActive: { backgroundColor: '#F39C12' },
  filterBtnText: { ...typography.labelSmall },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  appointmentCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  appointmentHeader: { flexDirection: 'row', alignItems: 'center' },
  dateContainer: { width: 50, alignItems: 'center', marginRight: spacing.md },
  dateDay: { ...typography.headlineMedium },
  dateMonth: { ...typography.labelSmall },
  appointmentInfo: { flex: 1 },
  patientName: { ...typography.bodyMedium, fontWeight: '600' },
  doctorName: { ...typography.bodySmall, marginTop: 2 },
  timeSlot: { ...typography.labelSmall, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  statusText: { ...typography.labelSmall, fontWeight: '600', textTransform: 'capitalize' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },
});

export default AdminAppointmentsScreen;
