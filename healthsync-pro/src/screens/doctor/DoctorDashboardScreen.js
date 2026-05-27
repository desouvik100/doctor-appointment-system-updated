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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { shadows } from '../../theme/colors';
import { 
  getTodayAppointments, 
  getDoctorAppointments,
  getDoctorPatients 
} from '../../services/api/doctorDashboardApi';

const { width } = Dimensions.get('window');

const DoctorDashboardScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
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

  const [activeStat, setActiveStat] = useState(null);

  const StatCard = ({ icon, value, label, color, onPress }) => (
    <TouchableOpacity 
      style={[
        styles.statCard, 
        { backgroundColor: colors.surface }, 
        activeStat === label ? shadows.glowPrimary : shadows.medium,
        activeStat === label && { transform: [{ scale: 0.98 }] }
      ]}
      onPressIn={() => setActiveStat(label)}
      onPressOut={() => setActiveStat(null)}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={[color + '30', color + '05']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statIconBg}
      >
        <Text style={styles.statIcon}>{icon}</Text>
      </LinearGradient>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );

  const QuickActionBtn = ({ icon, label, onPress, gradient }) => (
    <TouchableOpacity 
      style={[styles.quickActionWrapper, shadows.small]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quickActionGradient}
      >
        <Text style={styles.quickActionIcon}>{icon}</Text>
        <Text style={[styles.quickActionText, { color: '#ffffff' }]}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.lg }]}
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
          <StatCard 
            icon="📅" 
            value={stats.todayAppointments} 
            label="Today's Appointments" 
            color="#6C5CE7" 
            onPress={() => navigation.navigate('Appointments')}
          />
          <StatCard 
            icon="⏳" 
            value={stats.pendingAppointments} 
            label="Pending" 
            color="#F39C12" 
            onPress={() => navigation.navigate('Appointments')}
          />
          <StatCard 
            icon="👥" 
            value={stats.totalPatients} 
            label="Total Patients" 
            color="#00D4AA" 
            onPress={() => navigation.navigate('Patients')}
          />
          <StatCard 
            icon="✅" 
            value={stats.completedToday} 
            label="Completed Today" 
            color="#10B981" 
            onPress={() => navigation.navigate('Appointments')}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <QuickActionBtn 
              icon="📋" 
              label="Queue" 
              onPress={() => navigation.navigate('DoctorQueue')}
              gradient={['#6C5CE7', '#5B4ED1']}
            />
            <QuickActionBtn 
              icon="💊" 
              label="Prescriptions" 
              onPress={() => navigation.navigate('DoctorPrescriptions')}
              gradient={['#00D4AA', '#00B894']}
            />
            <QuickActionBtn 
              icon="💰" 
              label="Wallet" 
              onPress={() => navigation.navigate('DoctorWallet')}
              gradient={['#FF9F43', '#FF6B6B']}
            />
          </View>
          <View style={[styles.quickActions, { marginTop: spacing.md }]}>
            <QuickActionBtn 
              icon="🗓️" 
              label="Availability" 
              onPress={() => navigation.navigate('DoctorSchedule')}
              gradient={['#10B981', '#059669']}
            />
            <QuickActionBtn 
              icon="📝" 
              label="EMR" 
              onPress={() => navigation.navigate('DoctorEMR')}
              gradient={['#3B82F6', '#1D4ED8']}
            />
            <QuickActionBtn 
              icon="🎧" 
              label="Support" 
              onPress={() => navigation.navigate('DoctorSupport')}
              gradient={['#6B7280', '#4B5563']}
            />
          </View>
          <View style={[styles.quickActions, { marginTop: spacing.md }]}>
            <QuickActionBtn 
              icon="👥" 
              label="Patients" 
              onPress={() => navigation.navigate('Patients')}
              gradient={['#8B5CF6', '#6D28D9']}
            />
            <QuickActionBtn 
              icon="✏️" 
              label="New Rx" 
              onPress={() => navigation.navigate('DoctorCreatePrescription')}
              gradient={['#EC4899', '#BE185D']}
            />
            <QuickActionBtn 
              icon="📅" 
              label="Bookings" 
              onPress={() => navigation.navigate('Appointments')}
              gradient={['#F59E0B', '#D97706']}
            />
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
              <TouchableOpacity 
                key={appointment._id || index} 
                style={[styles.appointmentCard, { backgroundColor: colors.surface }]}
                onPress={() => navigation.navigate('DoctorAppointmentDetail', { appointmentId: appointment._id || appointment.id })}
                activeOpacity={0.7}
              >
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
              </TouchableOpacity>
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
  quickActionWrapper: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
