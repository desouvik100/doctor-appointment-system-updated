/**
 * Home Screen - Modern Dashboard with Pull-to-Refresh
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  QuickActions, 
  UpcomingAppointments, 
  WalletSummary, 
  HealthTips 
} from './components';
import { getUpcomingAppointments } from '../../services/api/appointmentService';
import { getBalance, getLoyaltyPoints } from '../../services/api/walletService';
import { getVitalsHistory, getTimeline } from '../../services/api/healthRecordService';
import { useSocket, SOCKET_EVENTS } from '../../context/SocketContext';
import { devLog, devError, isValid } from '../../utils/errorHandler';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const { subscribe, isConnected } = useSocket();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    appointments: [],
    walletBalance: 0,
    loyaltyPoints: 0,
    healthMetrics: [
      { label: 'Heart Rate', value: '--', unit: 'bpm', icon: '❤️', trend: 'stable' },
      { label: 'Blood Pressure', value: '--/--', unit: 'mmHg', icon: '🩺', trend: 'good' },
      { label: 'Sleep', value: '--', unit: 'hrs', icon: '😴', trend: 'up' },
      { label: 'Steps', value: '--', unit: 'steps', icon: '👟', trend: 'up' },
    ],
    recentActivity: []
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchDashboardData = useCallback(async () => {
    // GUARD: Don't fetch if user is not ready
    if (!isValid(user?.id)) {
      devLog('🏠 [HomeScreen] No user.id - skipping fetch');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    devLog('🏠 [HomeScreen] Starting API calls for user:', user.id);

    try {
      const [appointmentsData, balanceData, loyaltyData, vitalsData, timelineData] = await Promise.all([
        getUpcomingAppointments().catch(err => {
          devError('Appointments API failed:', err?.message);
          return [];
        }),
        getBalance().catch(err => {
          devError('Balance API failed:', err?.message);
          return { balance: 0 };
        }),
        getLoyaltyPoints().catch(err => {
          devError('Loyalty API failed:', err?.message);
          return { points: 0 };
        }),
        getVitalsHistory(user.id).catch(err => {
          devError('Vitals API failed:', err?.message);
          return { data: [] };
        }),
        getTimeline(user.id).catch(err => {
          devError('Timeline API failed:', err?.message);
          return { timeline: [] };
        })
      ]);
      
      devLog('✅ [HomeScreen] API responses received');

      const rawAppointments = Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData.data || []);
      
      const formattedAppointments = rawAppointments.map(app => ({
        id: app._id || app.id,
        doctorName: app.doctor?.name || 'Unknown Doctor',
        specialty: app.doctor?.specialization || 'General',
        dateTime: app.date || app.appointmentDate,
        type: app.type || 'video',
      }));

      // Process Vitals
      // Note: This logic depends on the actual structure of vitalsData from backend
      // Assuming vitalsData.data is an array of vital records
      const rawVitals = vitalsData?.data || []; 
      
      // Default metrics
      let metrics = [
        { label: 'Heart Rate', value: '--', unit: 'bpm', icon: '❤️', trend: 'stable' },
        { label: 'Blood Pressure', value: '--/--', unit: 'mmHg', icon: '🩺', trend: 'good' },
        { label: 'Weight', value: '--', unit: 'kg', icon: '⚖️', trend: 'stable' },
        { label: 'Temperature', value: '--', unit: '°C', icon: '🌡️', trend: 'stable' },
      ];

      // If we have data, try to extract latest values
      // This is a simplified extraction
      if (rawVitals.length > 0) {
        // Example: logic to parse vitals would go here
      }

      // Process Timeline
      const rawTimeline = timelineData?.timeline || [];
      const activities = rawTimeline.slice(0, 5).map(item => ({
        icon: item.icon || '📌',
        title: item.title || 'Activity',
        desc: item.description || item.subtitle || '',
        time: item.date ? new Date(item.date).toLocaleDateString() : 'Recent'
      }));

      setDashboardData(prev => ({
        ...prev,
        appointments: formattedAppointments,
        walletBalance: balanceData.balance || 0,
        loyaltyPoints: loyaltyData.points || 0,
        healthMetrics: metrics,
        recentActivity: activities
      }));

    } catch (error) {
      devError('Error fetching dashboard data:', error?.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!isConnected) return;

    // Listen for appointment events
    const unsubAppointmentCreated = subscribe(SOCKET_EVENTS.APPOINTMENT_CREATED, (data) => {
      devLog('🔔 [HomeScreen] New appointment created:', data);
      // Add new appointment to the list
      if (data.appointment) {
        setDashboardData(prev => ({
          ...prev,
          appointments: [
            {
              id: data.appointment._id || data.appointment.id,
              doctorName: data.appointment.doctor?.name || 'Unknown Doctor',
              specialty: data.appointment.doctor?.specialization || 'General',
              dateTime: data.appointment.date || data.appointment.appointmentDate,
              type: data.appointment.type || 'video',
            },
            ...prev.appointments,
          ],
        }));
      }
    });

    const unsubAppointmentUpdated = subscribe(SOCKET_EVENTS.APPOINTMENT_UPDATED, (data) => {
      devLog('🔔 [HomeScreen] Appointment updated:', data);
      // Update existing appointment
      if (data.appointment) {
        setDashboardData(prev => ({
          ...prev,
          appointments: prev.appointments.map(apt => 
            apt.id === (data.appointment._id || data.appointment.id)
              ? {
                  ...apt,
                  doctorName: data.appointment.doctor?.name || apt.doctorName,
                  specialty: data.appointment.doctor?.specialization || apt.specialty,
                  dateTime: data.appointment.date || data.appointment.appointmentDate || apt.dateTime,
                  type: data.appointment.type || apt.type,
                }
              : apt
          ),
        }));
      }
    });

    const unsubAppointmentCancelled = subscribe(SOCKET_EVENTS.APPOINTMENT_CANCELLED, (data) => {
      devLog('🔔 [HomeScreen] Appointment cancelled:', data);
      // Remove cancelled appointment
      const cancelledId = data.appointmentId || data.appointment?._id || data.appointment?.id;
      if (cancelledId) {
        setDashboardData(prev => ({
          ...prev,
          appointments: prev.appointments.filter(apt => apt.id !== cancelledId),
        }));
      }
    });

    // Listen for wallet events
    const unsubWalletTransaction = subscribe(SOCKET_EVENTS.WALLET_TRANSACTION, (data) => {
      devLog('🔔 [HomeScreen] Wallet transaction:', data);
      // Update wallet balance
      if (data.balance !== undefined) {
        setDashboardData(prev => ({
          ...prev,
          walletBalance: data.balance,
        }));
      }
    });

    // Cleanup subscriptions
    return () => {
      unsubAppointmentCreated();
      unsubAppointmentUpdated();
      unsubAppointmentCancelled();
      unsubWalletTransaction();
    };
  }, [isConnected, subscribe]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  const handleJoinCall = (appointment) => {
    navigation.navigate('VideoConsult', { appointmentId: appointment.id });
  };

  const handleReschedule = (appointment) => {
    navigation.navigate('Reschedule', { appointment });
  };

  const handleAddMoney = () => {
    navigation.navigate('Wallet', { action: 'addMoney' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()} 👋</Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar name={user?.name || 'User'} size="large" showBorder />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity 
          style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          onPress={() => navigation.navigate('DoctorSearch')}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={[styles.searchPlaceholder, { color: colors.textMuted }]}>Search doctors, symptoms...</Text>
        </TouchableOpacity>

        {/* Upcoming Appointments */}
        <UpcomingAppointments
          appointments={dashboardData.appointments}
          navigation={navigation}
          onJoinCall={handleJoinCall}
          onReschedule={handleReschedule}
        />

        {/* Quick Actions */}
        <QuickActions navigation={navigation} />

        {/* Wallet Summary */}
        <WalletSummary
          balance={dashboardData.walletBalance}
          loyaltyPoints={dashboardData.loyaltyPoints}
          navigation={navigation}
          onAddMoney={handleAddMoney}
        />

        {/* Health Tips - Full width, no padding */}
        <View style={styles.healthTipsWrapper}>
          <HealthTips />
        </View>

        {/* Health Metrics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Health Overview</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Records')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metricsGrid}>
            {dashboardData.healthMetrics.map((metric, index) => (
              <Card key={index} variant="gradient" style={[styles.metricCard, { backgroundColor: colors.surface }]}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricIcon}>{metric.icon}</Text>
                  <View style={[
                    styles.trendBadge,
                    { backgroundColor: colors.surfaceLight },
                    metric.trend === 'up' && styles.trendUp,
                    metric.trend === 'down' && styles.trendDown,
                  ]}>
                    <Text style={[styles.trendText, { color: colors.textSecondary }]}>
                      {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{metric.value}</Text>
                <Text style={[styles.metricUnit, { color: colors.textMuted }]}>{metric.unit}</Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{metric.label}</Text>
              </Card>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: colors.primary }]}>View all</Text>
            </TouchableOpacity>
          </View>

          <Card variant="default" style={{ backgroundColor: colors.surface }}>
            {dashboardData.recentActivity?.map((item, index) => (
              <TouchableOpacity key={index} style={[
                styles.activityItem,
                index < (dashboardData.recentActivity?.length || 0) - 1 && [styles.activityItemBorder, { borderBottomColor: colors.divider }],
              ]}>
                <View style={[styles.activityIcon, { backgroundColor: colors.surfaceLight }]}>
                  <Text style={styles.activityEmoji}>{item.icon}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.activityDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                </View>
                <Text style={[styles.activityTime, { color: colors.textMuted }]}>{item.time}</Text>
              </TouchableOpacity>
            ))}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  headerLeft: {},
  greeting: {
    ...typography.bodyLarge,
  },
  userName: {
    ...typography.headlineLarge,
    marginTop: spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    marginBottom: spacing.xxl,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  searchPlaceholder: {
    ...typography.bodyLarge,
  },
  healthTipsWrapper: {
    marginHorizontal: -spacing.xl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.headlineSmall,
  },
  seeAll: {
    ...typography.labelMedium,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    width: (width - spacing.xl * 2 - spacing.md) / 2,
    padding: spacing.lg,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metricIcon: {
    fontSize: 20,
  },
  trendBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  trendUp: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  trendDown: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  trendText: {
    fontSize: 12,
  },
  metricValue: {
    ...typography.displaySmall,
  },
  metricUnit: {
    ...typography.labelSmall,
    marginTop: -4,
  },
  metricLabel: {
    ...typography.labelMedium,
    marginTop: spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  activityEmoji: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...typography.bodyMedium,
    fontWeight: '500',
  },
  activityDesc: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  activityTime: {
    ...typography.labelSmall,
  },
});

export default HomeScreen;
