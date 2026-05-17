/**
 * Doctor Appointments Screen - View and manage appointments
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../services/api/apiClient';

const DoctorAppointmentsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all'); // all, today, upcoming, completed

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await apiClient.get('/doctors/appointments');
      setAppointments(response.data || []);
    } catch (error) {
      console.log('Error fetching appointments:', error.message);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  }, [fetchAppointments]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F39C12';
      case 'completed': return '#6C5CE7';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderAppointment = ({ item }) => (
    <Card style={[styles.appointmentCard, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHeader}>
        <View style={styles.patientInfo}>
          <View style={[styles.avatar, { backgroundColor: '#6C5CE720' }]}>
            <Text style={styles.avatarText}>
              {(item.patient?.name || 'P')[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={[styles.patientName, { color: colors.textPrimary }]}>
              {item.patient?.name || 'Patient'}
            </Text>
            <Text style={[styles.appointmentType, { color: colors.textSecondary }]}>
              {item.type || 'Consultation'}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status || 'Scheduled'}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📅</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {new Date(item.date).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🕐</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {item.timeSlot || new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#6C5CE720' }]}
          onPress={() => navigation.navigate('DoctorAppointmentDetail', { appointmentId: item._id })}
        >
          <Text style={[styles.actionBtnText, { color: '#6C5CE7' }]}>View Details</Text>
        </TouchableOpacity>
        {item.status === 'confirmed' && (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#10B98120' }]}
            onPress={() => navigation.navigate('DoctorAppointmentDetail', { appointmentId: item._id, startConsultation: true })}
          >
            <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Start Consultation</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const FilterButton = ({ label, value }) => (
    <TouchableOpacity
      style={[
        styles.filterBtn,
        { backgroundColor: filter === value ? '#6C5CE7' : colors.surface }
      ]}
      onPress={() => setFilter(value)}
    >
      <Text style={[
        styles.filterBtnText,
        { color: filter === value ? '#fff' : colors.textSecondary }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Appointments</Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <FilterButton label="All" value="all" />
        <FilterButton label="Today" value="today" />
        <FilterButton label="Upcoming" value="upcoming" />
        <FilterButton label="Completed" value="completed" />
      </View>

      {/* Appointments List */}
      <FlatList
        data={appointments}
        renderItem={renderAppointment}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No appointments found
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.headlineLarge,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  filterBtnText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  appointmentCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6C5CE7',
  },
  patientName: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  appointmentType: {
    ...typography.labelSmall,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  cardBody: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  infoText: {
    ...typography.labelSmall,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  actionBtnText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.bodyMedium,
  },
});
export default DoctorAppointmentsScreen;