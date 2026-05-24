/**
 * Appointments Screen - Enterprise Edition
 * Premium appointment management with enhanced UI
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
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { lightTheme } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import AppointmentCard from '../../components/cards/AppointmentCard';
import Button from '../../components/common/Button';
import { SkeletonCard } from '../../components/common/Skeleton';
import { getAppointments, cancelAppointment } from '../../services/api/appointmentService';
import { devLog, devError } from '../../utils/errorHandler';
import { useTheme } from '../../context/ThemeContext';
import dayjs from 'dayjs';

const AppointmentsScreen = ({ navigation }) => {
  const { colors } = useTheme();
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
      
      // Format appointments for the new AppointmentCard component
      const formattedAppointments = appointmentsList.map(apt => ({
        id: apt._id || apt.id,
        doctorName: apt.doctorName || apt.doctor?.name || 'Doctor',
        doctorPhoto: apt.doctorPhoto || apt.doctor?.profilePhoto || null,
        specialty: apt.specialty || apt.doctor?.specialty || apt.doctor?.specialization || 'Specialist',
        dateTime: apt.date || apt.appointmentDate,
        type: apt.consultationType || apt.type || 'clinic',
        status: activeTab === 'upcoming' ? 'upcoming' : activeTab === 'past' ? 'completed' : 'cancelled',
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
        _id: appointment.rawData?.doctorId || appointment.rawData?.doctor?._id,
        name: appointment.doctorName,
        specialty: appointment.specialty,
      },
      rescheduleAppointmentId: appointment.id,
    });
  };

  const handleJoinCall = (appointment) => {
    navigation.navigate('VideoCall', {
      appointmentId: appointment.id,
      doctorName: appointment.doctorName,
    });
  };

  const handleViewDetails = (appointment) => {
    navigation.navigate('AppointmentDetails', {
      appointment: appointment.rawData,
    });
  };

  const renderAppointmentCard = ({ item }) => (
    <AppointmentCard
      appointment={item}
      onPress={() => handleViewDetails(item)}
      onJoinPress={handleJoinCall}
      onReschedulePress={handleReschedule}
      onCancelPress={(apt) => handleCancelAppointment(apt.id)}
      style={styles.appointmentCard}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: lightTheme.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={lightTheme.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: lightTheme.text }]}>Appointments</Text>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => navigation.navigate('Booking')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#0066FF', '#1976D2']}
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
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              { color: lightTheme.textSecondary },
              activeTab === tab.id && { color: lightTheme.primary, fontWeight: '700' },
            ]}>
              {tab.label}
            </Text>
            {activeTab === tab.id && (
              <LinearGradient
                colors={['#0066FF', '#1976D2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tabIndicator}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading State with Skeletons */}
      {loading ? (
        <View style={styles.listContent}>
          <SkeletonCard style={{ marginBottom: spacing.lg }} />
          <SkeletonCard style={{ marginBottom: spacing.lg }} />
          <SkeletonCard style={{ marginBottom: spacing.lg }} />
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
              colors={[lightTheme.primary]}
              tintColor={lightTheme.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={[styles.emptyTitle, { color: lightTheme.text }]}>No appointments</Text>
              <Text style={[styles.emptyDesc, { color: lightTheme.textSecondary }]}>
                You don't have any {activeTab} appointments
              </Text>
              {activeTab === 'upcoming' && (
                <Button
                  variant="primary"
                  size="large"
                  gradient
                  onPress={() => navigation.navigate('Booking')}
                  style={styles.bookNowBtn}
                >
                  Book Appointment
                </Button>
              )}
            </View>
          }
        />
      )}

      {/* Floating Book Button */}
      {!loading && appointments.length > 0 && (
        <TouchableOpacity 
          style={styles.floatingBtn}
          onPress={() => navigation.navigate('Booking')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#0066FF', '#1976D2']}
            style={styles.floatingBtnGradient}
          >
            <Text style={styles.floatingBtnIcon}>📅</Text>
            <Text style={styles.floatingBtnText}>Book Appointment</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontWeight: '800',
  },
  addBtn: {
    ...shadows.md,
    borderRadius: borderRadius.lg,
  },
  addBtnGradient: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnIcon: {
    fontSize: 28,
    fontWeight: '300',
    color: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.xxl,
  },
  tab: {
    paddingBottom: spacing.md,
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    ...typography.bodyLarge,
    fontSize: 16,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
  appointmentCard: {
    marginBottom: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.huge * 2,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: spacing.xl,
    opacity: 0.5,
  },
  emptyTitle: {
    ...typography.headlineLarge,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    ...typography.bodyLarge,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  bookNowBtn: {
    marginTop: spacing.lg,
    minWidth: 200,
  },
  floatingBtn: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: spacing.xl,
    right: spacing.xl,
    ...shadows.xl,
    borderRadius: borderRadius.xl,
  },
  floatingBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  floatingBtnIcon: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  floatingBtnText: {
    ...typography.button,
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
});
export default AppointmentsScreen;