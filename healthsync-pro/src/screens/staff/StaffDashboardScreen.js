/**
 * Staff Dashboard Screen - Enterprise-grade main dashboard for clinic staff/receptionists
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
import Avatar from '../../components/common/Avatar';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import staffApi from '../../services/api/staffDashboardApi';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { key: 'queue', label: 'Patient Queue', icon: '📋', gradient: ['#FF6B6B', '#FF8E53'], screen: 'StaffQueue' },
  { key: 'book', label: 'Book Appointment', icon: '📅', gradient: ['#4FACFE', '#00F2FE'], screen: 'StaffBookAppointment' },
  { key: 'register', label: 'Register Patient', icon: '➕', gradient: ['#43E97B', '#38F9D7'], screen: 'StaffRegisterPatient' },
  { key: 'emr', label: 'EMR / Records', icon: '📝', gradient: ['#A18CD1', '#FBC2EB'], screen: 'StaffEMR' },
  { key: 'doctors', label: 'Doctors', icon: '👨‍⚕️', gradient: ['#F093FB', '#F5576C'], screen: 'StaffDoctors' },
  { key: 'patients', label: 'All Patients', icon: '👥', gradient: ['#4481EB', '#04BEFE'], screen: 'StaffPatients' },
  { key: 'shift', label: 'My Shift', icon: '🕐', gradient: ['#11998E', '#38EF7D'], screen: 'StaffShift' },
  { key: 'summary', label: 'Daily Report', icon: '📊', gradient: ['#FC5C7D', '#6A3093'], screen: 'StaffDailySummary' },
];

const STATUS_COLORS = {
  confirmed: '#10B981',
  pending: '#F59E0B',
  completed: '#3B82F6',
  cancelled: '#EF4444',
  'checked-in': '#6C5CE7',
  scheduled: '#F59E0B',
};

const CARD_SIZE = (width - spacing.xl * 2 - spacing.md * 2) / 3;

const StatCard = ({ icon, value, label, color, colors, onPress }) => (
  <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.statIconBg, { backgroundColor: color + '20' }]}>
      <Text style={styles.statIcon}>{icon}</Text>
    </View>
    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
  </TouchableOpacity>
);

const StaffDashboardScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ todayAppointments: 0, checkedIn: 0, waiting: 0, completed: 0 });
  const [recentAppointments, setRecentAppointments] = useState([]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchDashboardData = useCallback(async () => {
    if (!user?.clinicId) return;
    try {
      const appointmentsData = await staffApi.getTodayClinicAppointments(user.clinicId).catch(() => []);
      const appointments = Array.isArray(appointmentsData) ? appointmentsData : appointmentsData?.appointments || [];
      const checkedIn = appointments.filter(a => a.checkedIn || a.status === 'checked-in').length;
      const completed = appointments.filter(a => a.status === 'completed').length;
      const waiting = appointments.filter(a => (a.status === 'confirmed' || a.status === 'scheduled') && !a.checkedIn).length;
      setStats({ todayAppointments: appointments.length, checkedIn, waiting, completed });
      setRecentAppointments(appointments.slice(0, 5));
    } catch (error) {
      console.log('Error fetching staff dashboard:', error.message);
    }
  }, [user?.clinicId]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  const formatTime = dateStr => {
    if (!dateStr) return '--:--';
    try { return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return '--:--'; }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()} 👩‍💼</Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.name || 'Staff'}</Text>
            <LinearGradient colors={['#FF6B6B', '#FF8E8E']} style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>RECEPTIONIST</Text>
            </LinearGradient>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar name={user?.name || 'Staff'} size="large" showBorder source={user?.profilePhoto ? { uri: user.profilePhoto } : null} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard icon="📅" value={stats.todayAppointments} label="Today" color="#FF6B6B" colors={colors} onPress={() => navigation.navigate('Appointments')} />
          <StatCard icon="✅" value={stats.checkedIn} label="Checked In" color="#10B981" colors={colors} onPress={() => navigation.navigate('StaffQueue')} />
          <StatCard icon="⏳" value={stats.waiting} label="Waiting" color="#F39C12" colors={colors} onPress={() => navigation.navigate('StaffQueue')} />
          <StatCard icon="🏁" value={stats.completed} label="Done" color="#6C5CE7" colors={colors} onPress={() => navigation.navigate('Appointments')} />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map(action => (
              <TouchableOpacity key={action.key} style={styles.actionCard} onPress={() => navigation.navigate(action.screen)} activeOpacity={0.85}>
                <LinearGradient colors={action.gradient} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                </LinearGradient>
                <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Queue Banner */}
        <TouchableOpacity style={styles.queueBanner} onPress={() => navigation.navigate('StaffQueue')} activeOpacity={0.85}>
          <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.queueBannerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <View style={styles.queueBannerLeft}>
              <Text style={styles.queueBannerTitle}>Waiting Room</Text>
              <Text style={styles.queueBannerSub}>{stats.waiting} patient{stats.waiting !== 1 ? 's' : ''} waiting · {stats.checkedIn} checked in</Text>
            </View>
            <View style={styles.queueBannerRight}>
              <Text style={styles.queueBannerCount}>{stats.waiting}</Text>
              <Text style={styles.queueBannerArrow}>→</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Recent Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today's Appointments</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
              <Text style={[styles.seeAll, { color: '#FF6B6B' }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {recentAppointments.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No appointments today</Text>
            </View>
          ) : (
            recentAppointments.map((apt, index) => {
              const statusColor = STATUS_COLORS[apt.status] || '#6B7280';
              const patientName = apt.userId?.name || apt.user?.name || apt.patient?.name || 'Patient';
              const doctorName = apt.doctorId?.name || apt.doctor?.name || 'Doctor';
              return (
                <TouchableOpacity
                  key={apt._id || index}
                  style={[styles.appointmentCard, { backgroundColor: colors.surface }]}
                  onPress={() => navigation.navigate('StaffAppointmentDetail', { appointmentId: apt._id })}
                  activeOpacity={0.75}
                >
                  <View style={[styles.timeColumn, { backgroundColor: '#FF6B6B10' }]}>
                    <Text style={styles.timeText}>{formatTime(apt.date || apt.appointmentDate)}</Text>
                    {apt.queueNumber ? <Text style={styles.tokenText}>#{apt.queueNumber}</Text> : null}
                  </View>
                  <View style={styles.aptInfo}>
                    <Text style={[styles.patientName, { color: colors.textPrimary }]}>{patientName}</Text>
                    <Text style={[styles.doctorName, { color: colors.textSecondary }]}>Dr. {doctorName}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>{apt.status || 'Scheduled'}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 110 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xxl },
  headerLeft: { flex: 1 },
  greeting: { ...typography.bodyLarge },
  userName: { ...typography.headlineLarge, marginTop: spacing.xs },
  roleBadge: { marginTop: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, alignSelf: 'flex-start' },
  roleBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxl },
  statCard: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  statIconBg: { width: 36, height: 36, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  statIcon: { fontSize: 18 },
  statValue: { ...typography.headlineSmall, fontWeight: '700' },
  statLabel: { ...typography.labelSmall, textAlign: 'center', marginTop: 2 },
  section: { marginBottom: spacing.xxl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  sectionTitle: { ...typography.headlineSmall, marginBottom: spacing.lg },
  seeAll: { ...typography.labelMedium },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  actionCard: { width: CARD_SIZE, alignItems: 'center' },
  actionGradient: {
    width: CARD_SIZE, height: CARD_SIZE * 0.75, borderRadius: borderRadius.xl,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { ...typography.labelSmall, textAlign: 'center', fontWeight: '600' },
  queueBanner: {
    borderRadius: borderRadius.xl, overflow: 'hidden', marginBottom: spacing.xxl,
    shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  queueBannerGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.xl },
  queueBannerLeft: { flex: 1 },
  queueBannerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: spacing.xs },
  queueBannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  queueBannerRight: { alignItems: 'center' },
  queueBannerCount: { color: '#fff', fontSize: 36, fontWeight: '800', lineHeight: 40 },
  queueBannerArrow: { color: 'rgba(255,255,255,0.8)', fontSize: 18 },
  appointmentCard: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.lg, marginBottom: spacing.md, overflow: 'hidden' },
  timeColumn: { paddingHorizontal: spacing.md, paddingVertical: spacing.lg, alignItems: 'center', minWidth: 64 },
  timeText: { color: '#FF6B6B', fontSize: 13, fontWeight: '700' },
  tokenText: { color: '#FF6B6B', fontSize: 11, marginTop: 2, opacity: 0.7 },
  aptInfo: { flex: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.lg },
  patientName: { ...typography.bodyMedium, fontWeight: '600' },
  doctorName: { ...typography.labelSmall, marginTop: 2 },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, marginRight: spacing.md, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  emptyCard: { padding: spacing.xxl, borderRadius: borderRadius.lg, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },
});

export default StaffDashboardScreen;
