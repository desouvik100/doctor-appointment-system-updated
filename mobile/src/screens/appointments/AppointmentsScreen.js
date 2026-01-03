/**
 * Appointments Screen - Book & Manage
 * Connected to real API
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import { getAppointments, cancelAppointment } from '../../services/api/appointmentService';
import { devLog, devError } from '../../utils/errorHandler';
import dayjs from 'dayjs';

const AppointmentsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const tabs = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const fetchAppointments = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    
    try {
      devLog('📅 [AppointmentsScreen] Fetching appointments...');
      const response = await getAppointments({ status: activeTab });
      
      const appointmentsList = Array.isArray(response) 
        ? response 
        : (response?.data || response?.appointments || []);
      
      // Format appointments for display
      const formattedAppointments = appointmentsList.map(apt => ({
        id: apt._id || apt.id,
        doctor: apt.doctorName || apt.doctor?.name || 'Doctor',
        doctorId: apt.doctorId || apt.doctor?._id,
        specialty: apt.specialty || apt.doctor?.specialty || 'Specialist',
        date: dayjs(apt.date || apt.appointmentDate).format('MMM D, YYYY'),
        time: apt.time || apt.timeSlot || dayjs(apt.appointmentDate).format('h:mm A'),
        type: apt.consultationType || apt.type || 'clinic',
        status: apt.status || 'pending',
        avatar: apt.doctorPhoto || apt.doctor?.profilePhoto || null,
        clinicName: apt.clinicName || apt.clinic?.name,
        clinicAddress: apt.clinicAddress || apt.clinic?.address,
        rawData: apt,
      }));
      
      setAppointments(formattedAppointments);
      devLog(`✅ [AppointmentsScreen] Loaded ${formattedAppointments.length} appointments`);
    } catch (error) {
      devError('❌ [AppointmentsScreen] Failed to fetch appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAppointments(false);
    });
    return unsubscribe;
  }, [navigation, fetchAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments(false);
  };

  const handleCancelAppointment = (appointmentId) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAppointment(appointmentId, 'Cancelled by patient');
              Alert.alert('Success', 'Appointment cancelled successfully');
              fetchAppointments();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to cancel appointment');
            }
          },
        },
      ]
    );
  };

  const handleReschedule = (appointment) => {
    navigation.navigate('SlotSelection', {
      doctor: {
        _id: appointment.doctorId,
        name: appointment.doctor,
        specialty: appointment.specialty,
      },
      rescheduleAppointmentId: appointment.id,
    });
  };

  const handleJoinCall = (appointment) => {
    navigation.navigate('VideoCall', {
      appointmentId: appointment.id,
      doctorName: appointment.doctor,
    });
  };

  const handleViewDetails = (appointment) => {
    navigation.navigate('AppointmentDetails', {
      appointment: appointment.rawData,
    });
  };

  const renderAppointmentCard = ({ item }) => (
    <Card 
      variant="gradient" 
      style={styles.appointmentCard} 
      onPress={() => handleViewDetails(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.doctorRow}>
          <Avatar name={item.doctor} size="large" source={item.avatar} />
          <View style={styles.doctorDetails}>
            <Text style={styles.doctorName}>{item.doctor}</Text>
            <Text style={styles.specialty}>{item.specialty}</Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          item.status === 'confirmed' && styles.statusConfirmed,
          item.status === 'completed' && styles.statusCompleted,
          item.status === 'pending' && styles.statusPending,
          item.status === 'cancelled' && styles.statusCancelled,
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'confirmed' && styles.statusTextConfirmed,
            item.status === 'completed' && styles.statusTextCompleted,
            item.status === 'pending' && styles.statusTextPending,
            item.status === 'cancelled' && styles.statusTextCancelled,
          ]}>
            {item.status === 'confirmed' ? '✓ Confirmed' : 
             item.status === 'completed' ? '✓ Completed' :
             item.status === 'cancelled' ? '✗ Cancelled' : '⏳ Pending'}
          </Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>{item.date}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>⏰</Text>
            <Text style={styles.detailText}>{item.time}</Text>
          </View>
        </View>
        <View style={styles.typeTag}>
          <Text style={styles.typeIcon}>{item.type === 'video' ? '📹' : '🏥'}</Text>
          <Text style={styles.typeText}>
            {item.type === 'video' ? 'Video Call' : 'Clinic Visit'}
          </Text>
        </View>
      </View>

      {activeTab === 'upcoming' && item.status !== 'cancelled' && (
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.secondaryBtn}
            onPress={() => handleReschedule(item)}
          >
            <Text style={styles.secondaryBtnText}>Reschedule</Text>
          </TouchableOpacity>
          {item.type === 'video' && item.status === 'confirmed' && (
            <TouchableOpacity 
              style={styles.primaryBtn}
              onPress={() => handleJoinCall(item)}
            >
              <LinearGradient
                colors={colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtnGradient}
              >
                <Text style={styles.primaryBtnText}>Join Call</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {item.type === 'clinic' && (
            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={() => handleCancelAppointment(item.id)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('Booking')}>
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.addBtnGradient}
          >
            <Text style={styles.addBtnIcon}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.tabTextActive,
            ]}>
              {tab.label}
            </Text>
            {activeTab === tab.id && (
              <LinearGradient
                colors={colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tabIndicator}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : (
        /* Appointments List */
        <FlatList
          data={appointments}
          renderItem={renderAppointmentCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No appointments</Text>
              <Text style={styles.emptyDesc}>
                You don't have any {activeTab} appointments
              </Text>
              {activeTab === 'upcoming' && (
                <TouchableOpacity 
                  style={styles.bookNowBtn}
                  onPress={() => navigation.navigate('Booking')}
                >
                  <Text style={styles.bookNowText}>Book Now</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Floating Book Button */}
      <TouchableOpacity 
        style={styles.floatingBtn}
        onPress={() => navigation.navigate('Booking')}
      >
        <LinearGradient
          colors={colors.gradientPrimary}
          style={styles.floatingBtnGradient}
        >
          <Text style={styles.floatingBtnIcon}>📅</Text>
          <Text style={styles.floatingBtnText}>Book Appointment</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.displaySmall,
    color: colors.textPrimary,
  },
  addBtn: {
    ...shadows.small,
  },
  addBtnGradient: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnIcon: {
    fontSize: 24,
    color: colors.textInverse,
    fontWeight: '300',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  tab: {
    marginRight: spacing.xxl,
    paddingBottom: spacing.md,
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    ...typography.bodyLarge,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
  appointmentCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  doctorDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  doctorName: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
  },
  specialty: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
  },
  statusConfirmed: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
  },
  statusTextConfirmed: {
    color: colors.success,
  },
  statusTextCompleted: {
    color: colors.info,
  },
  statusTextPending: {
    color: colors.warning,
  },
  statusTextCancelled: {
    color: colors.error,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.lg,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  detailText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  typeIcon: {
    fontSize: 12,
    marginRight: spacing.xs,
  },
  typeText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  secondaryBtnText: {
    ...typography.buttonSmall,
    color: colors.textSecondary,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  cancelBtnText: {
    ...typography.buttonSmall,
    color: colors.error,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  primaryBtnGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    ...typography.buttonSmall,
    color: colors.textInverse,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.huge * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bookNowBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  bookNowText: {
    ...typography.button,
    color: colors.textInverse,
  },
  floatingBtn: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: spacing.xl,
    right: spacing.xl,
    ...shadows.large,
  },
  floatingBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  floatingBtnIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  floatingBtnText: {
    ...typography.button,
    color: colors.textInverse,
  },
});

export default AppointmentsScreen;
