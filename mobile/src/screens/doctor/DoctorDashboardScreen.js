/**
 * Doctor Dashboard Screen - Main dashboard for doctors
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
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  getTodayAppointments, 
  getDoctorAppointments,
  getDoctorPatients 
} from '../../services/api/doctorDashboardApi';

const { width } = Dimensions.get('window');

const DoctorDashboardScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingAppointments: 0,
    totalPatients: 0,
    completedToday: 0,
  });
  const [todaySchedule, setTodaySchedule] = useState([]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔵 [DoctorDashboard] Fetching data for doctor:', user.id);
      
      // Fetch real data from APIs
      const [todayAppts, allAppts, patients] = await Promise.all([
        getTodayAppointments(user.id).catch(err => {
          console.log('Today appointments error:', err.message);
          return [];
        }),
        getDoctorAppointments(user.id).catch(err => {
          console.log('All appointments error:', err.message);
          return [];
        }),
        getDoctorPatients(user.id).catch(err => {
          console.log('Patients error:', err.message);
          return [];
        }),
      ]);

      // Calculate stats from real data
      const todayList = Array.isArray(todayAppts) ? todayAppts : (todayAppts.appointments || []);
      const allList = Array.isArray(allAppts) ? allAppts : (allAppts.appointments || []);
      const patientList = Array.isArray(patients) ? patients : (patients.patients || []);
      
      const completedToday = todayList.filter(a => a.status === 'completed').length;
      const pendingAppts = allList.filter(a => 
        a.status === 'pending' || a.status === 'confirmed'
      ).length;

      setStats({
        todayAppointments: todayList.length,
        pendingAppointments: pendingAppts,
        totalPatients: patientList.length,
        completedToday: completedToday,
      });

      setTodaySchedule(todayList.slice(0, 5));
      
      console.log('✅ [DoctorDashboard] Data loaded:', {
        today: todayList.length,
        pending: pendingAppts,
        patients: patientList.length
      });
    } catch (error) {
      console.log('❌ [DoctorDashboard] Error:', error.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  const StatCard = ({ icon, value, label, color }) => (
    <Card style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.statIconBg, { backgroundColor: color + '20' }]}>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </Card>
  );

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
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()} 👨‍⚕️</Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>Dr. {user?.name || 'Doctor'}</Text>
            <View style={styles.roleBadge}>
              <LinearGradient colors={['#6C5CE7', '#A29BFE']} style={styles.roleBadgeGradient}>
                <Text style={styles.roleBadgeText}>DOCTOR</Text>
              </LinearGradient>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar name={user?.name || 'Doctor'} size="large" showBorder />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="📅" value={stats.todayAppointments} label="Today's Appointments" color="#6C5CE7" />
          <StatCard icon="⏳" value={stats.pendingAppointments} label="Pending" color="#F39C12" />
          <StatCard icon="👥" value={stats.totalPatients} label="Total Patients" color="#00D4AA" />
          <StatCard icon="✅" value={stats.completedToday} label="Completed Today" color="#10B981" />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('DoctorQueue')}
            >
              <Text style={styles.quickActionIcon}>📋</Text>
              <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Queue</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('DoctorPrescriptions')}
            >
              <Text style={styles.quickActionIcon}>💊</Text>
              <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Prescriptions</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('DoctorWallet')}
            >
              <Text style={styles.quickActionIcon}>💰</Text>
              <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Wallet</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.quickActions, { marginTop: spacing.md }]}>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('DoctorSchedule')}
            >
              <Text style={styles.quickActionIcon}>🗓️</Text>
              <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Availability</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('DoctorEMR')}
            >
              <Text style={styles.quickActionIcon}>📝</Text>
              <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>EMR</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('DoctorSupport')}
            >
              <Text style={styles.quickActionIcon}>🎧</Text>
              <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Support</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.quickActions, { marginTop: spacing.md }]}>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Patients')}
            >
              <Text style={styles.quickActionIcon}>👥</Text>
              <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Patients</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('DoctorCreatePrescription')}
            >
              <Text style={styles.quickActionIcon}>✏️</Text>
              <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>New Rx</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Appointments')}
            >
              <Text style={styles.quickActionIcon}>📅</Text>
              <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Bookings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
              <Text style={[styles.seeAll, { color: '#6C5CE7' }]}>See all</Text>
            </TouchableOpacity>
          </View>

          {todaySchedule.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No appointments scheduled for today</Text>
            </Card>
          ) : (
            todaySchedule.slice(0, 5).map((appointment, index) => (
              <Card key={index} style={[styles.appointmentCard, { backgroundColor: colors.surface }]}>
                <View style={styles.appointmentTime}>
                  <Text style={[styles.timeText, { color: '#6C5CE7' }]}>
                    {new Date(appointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={[styles.patientName, { color: colors.textPrimary }]}>
                    {appointment.patient?.name || 'Patient'}
                  </Text>
                  <Text style={[styles.appointmentType, { color: colors.textSecondary }]}>
                    {appointment.type || 'Consultation'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#6C5CE720' }]}>
                  <Text style={[styles.statusText, { color: '#6C5CE7' }]}>
                    {appointment.status || 'Scheduled'}
                  </Text>
                </View>
              </Card>
            ))
          )}
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
    alignItems: 'flex-start',
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
  roleBadge: {
    marginTop: spacing.sm,
  },
  roleBadgeGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  statCard: {
    width: (width - spacing.xl * 2 - spacing.md) / 2,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    ...typography.displaySmall,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.labelSmall,
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
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickAction: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  quickActionText: {
    ...typography.labelSmall,
    textAlign: 'center',
  },
  emptyCard: {
    padding: spacing.xxl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.bodyMedium,
    textAlign: 'center',
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  appointmentTime: {
    marginRight: spacing.lg,
  },
  timeText: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
  appointmentInfo: {
    flex: 1,
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
});

export default DoctorDashboardScreen;
