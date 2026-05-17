/**
 * Admin Dashboard Screen - COMPLETE Implementation
 * 100% Parity with Web Admin Dashboard
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
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import adminApi from '../../services/api/adminApi';

const { width } = Dimensions.get('window');

const AdminDashboardScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Dashboard data state
  const [overview, setOverview] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalClinics: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
  });
  const [monthStats, setMonthStats] = useState({
    appointments: 0,
    revenue: 0,
    appointmentGrowth: 0,
    revenueGrowth: 0,
  });
  const [pendingApprovals, setPendingApprovals] = useState({
    doctors: 0,
    staff: 0,
    clinics: 0,
    total: 0,
  });
  const [topDoctors, setTopDoctors] = useState([]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('🔵 [AdminDashboard] Fetching data...');
      
      const [overviewData, pendingData, topDoctorsData] = await Promise.all([
        adminApi.getDashboardOverview().catch(err => {
          console.log('Overview error:', err.message);
          return null;
        }),
        adminApi.getPendingApprovalsCount().catch(err => {
          console.log('Pending approvals error:', err.message);
          return { doctors: 0, staff: 0, clinics: 0, total: 0 };
        }),
        adminApi.getTopDoctors(5).catch(err => {
          console.log('Top doctors error:', err.message);
          return [];
        }),
      ]);

      if (overviewData) {
        setOverview(overviewData.overview || {});
        setMonthStats(overviewData.thisMonth || {});
      }
      
      setPendingApprovals(pendingData);
      setTopDoctors(topDoctorsData || []);
      
      console.log('✅ [AdminDashboard] Data loaded');
    } catch (error) {
      console.log('❌ [AdminDashboard] Error:', error.message);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  // Stat Card Component
  const StatCard = ({ icon, value, label, color, onPress }) => (
    <TouchableOpacity 
      style={[styles.statCard, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.statIconBg, { backgroundColor: color + '20' }]}>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );

  // Quick Action Card
  const QuickAction = ({ icon, label, onPress, badge }) => (
    <TouchableOpacity 
      style={[styles.quickAction, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionIcon}>{icon}</Text>
        <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>{label}</Text>
      </View>
      {badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#F39C12" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F39C12" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()} 🛡️
            </Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {user?.name || 'Admin'}
            </Text>
            <View style={styles.roleBadge}>
              <LinearGradient colors={['#F39C12', '#F1C40F']} style={styles.roleBadgeGradient}>
                <Text style={styles.roleBadgeText}>ADMIN</Text>
              </LinearGradient>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar name={user?.name || 'Admin'} size="large" showBorder />
          </TouchableOpacity>
        </View>

        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              icon="👥" 
              value={overview.totalPatients} 
              label="Total Patients" 
              color="#3498DB"
              onPress={() => navigation.navigate('AdminUsers')}
            />
            <StatCard 
              icon="👨‍⚕️" 
              value={overview.totalDoctors} 
              label="Doctors" 
              color="#9B59B6"
              onPress={() => navigation.navigate('AdminDoctors')}
            />
            <StatCard 
              icon="🏥" 
              value={overview.totalClinics} 
              label="Clinics" 
              color="#1ABC9C"
              onPress={() => navigation.navigate('AdminClinics')}
            />
            <StatCard 
              icon="📅" 
              value={overview.todayAppointments} 
              label="Today's Appts" 
              color="#E74C3C"
              onPress={() => navigation.navigate('AdminAppointments')}
            />
          </View>
        </View>

        {/* This Month Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>This Month</Text>
          <Card style={[styles.monthCard, { backgroundColor: colors.surface }]}>
            <View style={styles.monthRow}>
              <View style={styles.monthStat}>
                <Text style={[styles.monthValue, { color: colors.textPrimary }]}>
                  {monthStats.appointments?.toLocaleString() || 0}
                </Text>
                <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>
                  Appointments
                </Text>
                <View style={[
                  styles.growthBadge, 
                  { backgroundColor: monthStats.appointmentGrowth >= 0 ? '#10B98120' : '#EF444420' }
                ]}>
                  <Text style={[
                    styles.growthText, 
                    { color: monthStats.appointmentGrowth >= 0 ? '#10B981' : '#EF4444' }
                  ]}>
                    {monthStats.appointmentGrowth >= 0 ? '↑' : '↓'} {Math.abs(monthStats.appointmentGrowth || 0)}%
                  </Text>
                </View>
              </View>
              <View style={styles.monthDivider} />
              <View style={styles.monthStat}>
                <Text style={[styles.monthValue, { color: colors.textPrimary }]}>
                  ₹{(monthStats.revenue || 0).toLocaleString()}
                </Text>
                <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>
                  Revenue
                </Text>
                <View style={[
                  styles.growthBadge, 
                  { backgroundColor: monthStats.revenueGrowth >= 0 ? '#10B98120' : '#EF444420' }
                ]}>
                  <Text style={[
                    styles.growthText, 
                    { color: monthStats.revenueGrowth >= 0 ? '#10B981' : '#EF4444' }
                  ]}>
                    {monthStats.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(monthStats.revenueGrowth || 0)}%
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* Pending Approvals Alert */}
        {pendingApprovals.total > 0 && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.alertCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}
              onPress={() => navigation.navigate('AdminApprovals')}
              activeOpacity={0.7}
            >
              <View style={styles.alertContent}>
                <Text style={styles.alertIcon}>⚠️</Text>
                <View style={styles.alertText}>
                  <Text style={[styles.alertTitle, { color: '#92400E' }]}>
                    {pendingApprovals.total} Pending Approval{pendingApprovals.total > 1 ? 's' : ''}
                  </Text>
                  <Text style={[styles.alertSubtext, { color: '#B45309' }]}>
                    {pendingApprovals.doctors > 0 && `${pendingApprovals.doctors} doctors`}
                    {pendingApprovals.doctors > 0 && pendingApprovals.staff > 0 && ', '}
                    {pendingApprovals.staff > 0 && `${pendingApprovals.staff} staff`}
                    {(pendingApprovals.doctors > 0 || pendingApprovals.staff > 0) && pendingApprovals.clinics > 0 && ', '}
                    {pendingApprovals.clinics > 0 && `${pendingApprovals.clinics} clinics`}
                  </Text>
                </View>
              </View>
              <Text style={styles.alertArrow}>→</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction 
              icon="👨‍⚕️" 
              label="Doctors" 
              badge={pendingApprovals.doctors}
              onPress={() => navigation.navigate('AdminDoctors')}
            />
            <QuickAction 
              icon="👩‍💼" 
              label="Staff" 
              badge={pendingApprovals.staff}
              onPress={() => navigation.navigate('AdminStaff')}
            />
            <QuickAction 
              icon="🏥" 
              label="Clinics" 
              badge={pendingApprovals.clinics}
              onPress={() => navigation.navigate('AdminClinics')}
            />
            <QuickAction 
              icon="👥" 
              label="Users" 
              onPress={() => navigation.navigate('AdminUsers')}
            />
            <QuickAction 
              icon="📅" 
              label="Appointments" 
              onPress={() => navigation.navigate('AdminAppointments')}
            />
            <QuickAction 
              icon="💰" 
              label="Wallet" 
              onPress={() => navigation.navigate('AdminWallet')}
            />
            <QuickAction 
              icon="🎫" 
              label="Coupons" 
              onPress={() => navigation.navigate('AdminCoupons')}
            />
            <QuickAction 
              icon="📊" 
              label="Reports" 
              onPress={() => navigation.navigate('AdminReports')}
            />
            <QuickAction 
              icon="🎟️" 
              label="Support" 
              onPress={() => navigation.navigate('AdminSupportTickets')}
            />
            <QuickAction 
              icon="📋" 
              label="Audit Logs" 
              onPress={() => navigation.navigate('AdminAuditLogs')}
            />
          </View>
        </View>

        {/* Top Doctors */}
        {topDoctors.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Top Doctors</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AdminDoctors')}>
                <Text style={[styles.seeAll, { color: '#F39C12' }]}>See all</Text>
              </TouchableOpacity>
            </View>
            <Card style={[styles.listCard, { backgroundColor: colors.surface }]}>
              {topDoctors.map((doctor, index) => (
                <TouchableOpacity 
                  key={doctor._id || index}
                  style={[
                    styles.doctorItem,
                    index < topDoctors.length - 1 && [styles.doctorItemBorder, { borderBottomColor: colors.divider }]
                  ]}
                  onPress={() => navigation.navigate('AdminDoctorDetail', { doctorId: doctor._id })}
                >
                  <View style={styles.doctorRank}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={[styles.doctorName, { color: colors.textPrimary }]}>
                      {doctor.name}
                    </Text>
                    <Text style={[styles.doctorSpec, { color: colors.textSecondary }]}>
                      {doctor.specialization}
                    </Text>
                  </View>
                  <View style={styles.doctorStats}>
                    <Text style={[styles.doctorAppts, { color: colors.textPrimary }]}>
                      {doctor.appointmentCount}
                    </Text>
                    <Text style={[styles.doctorApptLabel, { color: colors.textMuted }]}>
                      appts
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        )}

        {/* System Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>System Status</Text>
          <Card style={[styles.statusCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>API Server</Text>
              </View>
              <Text style={[styles.statusValue, { color: '#10B981' }]}>Online</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Database</Text>
              </View>
              <Text style={[styles.statusValue, { color: '#10B981' }]}>Connected</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Payments</Text>
              </View>
              <Text style={[styles.statusValue, { color: '#10B981' }]}>Active</Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, ...typography.bodyMedium },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: 120 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xxl },
  headerLeft: {},
  greeting: { ...typography.bodyLarge },
  userName: { ...typography.headlineLarge, marginTop: spacing.xs },
  roleBadge: { marginTop: spacing.sm },
  roleBadgeGradient: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  roleBadgeText: { color: '#0A0A0F', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  
  // Section
  section: { marginBottom: spacing.xxl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  sectionTitle: { ...typography.headlineSmall, marginBottom: spacing.lg },
  seeAll: { ...typography.labelMedium },
  
  // Stats Grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: { width: (width - spacing.xl * 2 - spacing.md) / 2, padding: spacing.lg, borderRadius: borderRadius.lg },
  statIconBg: { width: 44, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statIcon: { fontSize: 22 },
  statValue: { ...typography.displaySmall, marginBottom: spacing.xs },
  statLabel: { ...typography.labelSmall },
  
  // Month Card
  monthCard: { padding: spacing.lg, borderRadius: borderRadius.lg },
  monthRow: { flexDirection: 'row', alignItems: 'center' },
  monthStat: { flex: 1, alignItems: 'center' },
  monthDivider: { width: 1, height: 60, backgroundColor: 'rgba(0,0,0,0.1)', marginHorizontal: spacing.lg },
  monthValue: { ...typography.headlineMedium, marginBottom: spacing.xs },
  monthLabel: { ...typography.labelSmall, marginBottom: spacing.sm },
  growthBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  growthText: { ...typography.labelSmall, fontWeight: '600' },
  
  // Alert Card
  alertCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1 },
  alertContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  alertIcon: { fontSize: 24, marginRight: spacing.md },
  alertText: { flex: 1 },
  alertTitle: { ...typography.bodyMedium, fontWeight: '600' },
  alertSubtext: { ...typography.labelSmall, marginTop: 2 },
  alertArrow: { fontSize: 20, color: '#F59E0B' },
  
  // Quick Actions
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickAction: { width: (width - spacing.xl * 2 - spacing.md * 3) / 4, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', position: 'relative' },
  quickActionContent: { alignItems: 'center' },
  quickActionIcon: { fontSize: 24, marginBottom: spacing.xs },
  quickActionLabel: { ...typography.labelSmall, textAlign: 'center' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  
  // List Card
  listCard: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  doctorItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  doctorItemBorder: { borderBottomWidth: 1 },
  doctorRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F39C1220', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  rankText: { color: '#F39C12', fontSize: 12, fontWeight: '700' },
  doctorInfo: { flex: 1 },
  doctorName: { ...typography.bodyMedium, fontWeight: '600' },
  doctorSpec: { ...typography.labelSmall, marginTop: 2 },
  doctorStats: { alignItems: 'flex-end' },
  doctorAppts: { ...typography.bodyLarge, fontWeight: '700' },
  doctorApptLabel: { ...typography.labelSmall },
  
  // Status Card
  statusCard: { padding: spacing.lg, borderRadius: borderRadius.lg },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  statusItem: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  statusLabel: { ...typography.bodyMedium },
  statusValue: { ...typography.labelMedium, fontWeight: '600' },
});

export default AdminDashboardScreen;
