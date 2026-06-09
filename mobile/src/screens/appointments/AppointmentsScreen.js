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
import { typography, spacing, borderRadius } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import LinearGradient from 'react-native-linear-gradient';
import AppointmentCard from '../../components/cards/AppointmentCard';
import Button from '../../components/common/Button';
import { SkeletonCard } from '../../components/common/Skeleton';
import { getAppointments, cancelAppointment } from '../../services/api/appointmentService';
import { devLog, devError } from '../../utils/errorHandler';
import { useTheme } from '../../context/ThemeContext';
import dayjs from 'dayjs';

const AppointmentsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
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

  const handleReviewPress = (appointment) => {
    const rawApt = appointment.rawData;
    const docId = rawApt.doctorId?._id || rawApt.doctorId;
    navigation.navigate('DoctorProfile', {
      doctorId: docId,
      autoOpenReview: true,
    });
  };

  const renderAppointmentCard = ({ item }) => (
    <AppointmentCard
      appointment={item}
      onPress={() => handleViewDetails(item)}
      onJoinPress={handleJoinCall}
      onReschedulePress={handleReschedule}
      onCancelPress={(apt) => handleCancelAppointment(apt.id)}
      onReviewPress={handleReviewPress}
      style={styles.appointmentCard}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Ambient background mesh */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={isDarkMode ? ['#0A0E17', '#121826', '#1A1F2E'] : ['#F8FAFC', '#F1F5F9', '#E2E8F0']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.orb1}>
          <LinearGradient
            colors={isDarkMode ? ['rgba(0, 212, 170, 0.12)', 'transparent'] : ['rgba(0, 212, 170, 0.06)', 'transparent']}
            style={{ flex: 1, borderRadius: 150 }}
          />
        </View>
        <View style={styles.orb2}>
          <LinearGradient
            colors={isDarkMode ? ['rgba(108, 92, 231, 0.1)', 'transparent'] : ['rgba(108, 92, 231, 0.04)', 'transparent']}
            style={{ flex: 1, borderRadius: 150 }}
          />
        </View>
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: spacing.xxl + 10 }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Appointments</Text>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => navigation.navigate('Booking')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={colors.gradientPrimary || ['#00D4AA', '#00B894']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addBtnGradient}
          >
            <Text style={styles.addBtnIcon}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Segmented Tabs (Glassmorphic Pill Container) */}
      <View style={[
        styles.tabsContainer,
        {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        }
      ]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.75}
            >
              {isActive ? (
                <LinearGradient
                  colors={colors.gradientPrimary || ['#00D4AA', '#00B894']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activeTabGradient}
                >
                  <Text style={[styles.tabText, { color: colors.textInverse, fontWeight: '700' }]}>
                    {tab.label}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.inactiveTabContent}>
                  <Text style={[styles.tabText, { color: colors.textSecondary }]}>
                    {tab.label}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
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
          keyExtractor={(item, index) => item.id || item._id || String(index)}
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
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No appointments</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
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

    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  orb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -50,
    left: -100,
  },
  orb2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: 250,
    right: -100,
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
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  activeTabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveTabContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    ...typography.bodyMedium,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 140,
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