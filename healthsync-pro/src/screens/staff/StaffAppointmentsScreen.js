/**
 * Staff Appointments Screen - Clinic Appointment Management
 * 100% Parity with Web Staff Dashboard
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
import { useUser } from '../../context/UserContext';
import staffApi from '../../services/api/staffDashboardApi';

const StaffAppointmentsScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('today');

  const fetchAppointments = useCallback(async () => {
    if (!user?.clinicId) return;
    try {
      let data;
      if (filter === 'today') {
        data = await staffApi.getTodayClinicAppointments(user.clinicId);
      } else {
        data = await staffApi.getClinicAppointments(user.clinicId, { status: filter !== 'all' ? filter : undefined });
      }
      setAppointments(Array.isArray(data) ? data : data.appointments || []);
    } catch (error) {
      console.log('Error fetching appointments:', error.message);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [user?.clinicId, filter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  }, [fetchAppointments]);

  const filteredAppointments = appointments.filter(apt =>
    apt.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.doctor?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCheckIn = async (appointmentId) => {
    try {
      await staffApi.checkInPatient(appointmentId);
      Alert.alert('Success', 'Patient checked in');
      fetchAppointments();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#10B981';
      case 'in-progress': case 'in_progress': return '#3B82F6';
      case 'confirmed': case 'checked-in': return '#6C5CE7';
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
      onPress={() => navigation.navigate('StaffAppointmentDetail', { appointmentId: item._id })}
    >
      <View style={styles.appointmentHeader}>
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: '#FF6B6B' }]}>{item.time || item.timeSlot}</Text>
          {item.queueNumber && (
            <View style={styles.tokenBadge}>
              <Text style={styles.tokenText}>#{item.queueNumber}</Text>
            </View>
          )}
        </View>
        <View style={styles.appointmentInfo}>
          <Text style={[styles.patientName, { color: colors.textPrimary }]}>
            {item.patient?.name || item.userId?.name || 'Patient'}
          </Text>
          <Text style={[styles.doctorName, { color: colors.textSecondary }]}>
            Dr. {item.doctor?.name || item.doctorId?.name || 'Doctor'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status?.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {item.status === 'confirmed' && !item.checkedIn && (
        <TouchableOpacity
          style={styles.checkInBtn}
          onPress={() => handleCheckIn(item._id)}
        >
          <Text style={styles.checkInBtnText}>✓ Check In</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
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
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => navigation.navigate('StaffBookAppointment')}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.textPrimary }]}
          placeholder="Search patient or doctor..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <FilterButton label="Today" value="today" />
        <FilterButton label="All" value="all" />
        <FilterButton label="Pending" value="pending" />
        <FilterButton label="Completed" value="completed" />
      </View>

      <FlatList
        data={filteredAppointments}
        renderItem={renderAppointment}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B6B" />}
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
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF6B6B', alignItems: 'center', justifyContent: 'center' },
  addIcon: { fontSize: 24, color: '#fff', fontWeight: '600' },
  searchContainer: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  searchInput: { height: 48, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, ...typography.bodyMedium },
  filterContainer: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm },
  filterBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: 'rgba(0,0,0,0.05)' },
  filterBtnActive: { backgroundColor: '#FF6B6B' },
  filterBtnText: { ...typography.labelSmall },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  appointmentCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  appointmentHeader: { flexDirection: 'row', alignItems: 'center' },
  timeContainer: { marginRight: spacing.md, alignItems: 'center' },
  timeText: { ...typography.labelLarge, fontWeight: '600' },
  tokenBadge: { backgroundColor: '#FF6B6B20', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full, marginTop: 4 },
  tokenText: { color: '#FF6B6B', ...typography.labelSmall, fontWeight: '700' },
  appointmentInfo: { flex: 1 },
  patientName: { ...typography.bodyMedium, fontWeight: '600' },
  doctorName: { ...typography.bodySmall, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  statusText: { ...typography.labelSmall, fontWeight: '600', textTransform: 'capitalize' },
  checkInBtn: { backgroundColor: '#10B98120', paddingVertical: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center', marginTop: spacing.md },
  checkInBtnText: { color: '#10B981', fontWeight: '600', ...typography.labelMedium },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },
});

export default StaffAppointmentsScreen;
