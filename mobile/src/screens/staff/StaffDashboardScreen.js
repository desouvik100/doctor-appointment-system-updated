/**
 * Staff Dashboard Screen - Main dashboard for clinic staff/receptionists
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
import staffApi from '../../services/api/staffDashboardApi';

const { width } = Dimensions.get('window');

const StaffDashboardScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    checkedIn: 0,
    waiting: 0,
    completed: 0,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchDashboardData = useCallback(async () => {
    if (!user?.clinicId) {
      console.log('No clinicId found for staff user');
      return;
    }
    try {
      // Fetch today's appointments
      const appointmentsData = await staffApi.getTodayClinicAppointments(user.clinicId).catch(() => []);
      
      const appointments = Array.isArray(appointmentsData) ? appointmentsData : appointmentsData?.appointments || [];
      const checkedIn = appointments.filter(a => a.checkedIn || a.status === 'checked-in').length;
      const completed = appointments.filter(a => a.status === 'completed').length;
      const waiting = appointments.filter(a => (a.status === 'confirmed' || a.status === 'scheduled') && !a.checkedIn).length;
      
      setStats({
        todayAppointments: appointments.length,
        checkedIn: checkedIn,
        waiting: waiting,
        completed: completed,
      });
    } catch (error) {
      console.log('Error fetching staff dashboard:', error.message);
    }
  }, [user?.clinicId]);

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()} 👩‍💼</Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.name || 'Staff'}</Text>
            <View style={styles.roleBadge}>
              <LinearGradient colors={['#FF6B6B', '#FF8E8E']} style={styles.roleBadgeGradient}>
                <Text style={styles.roleBadgeText}>STAFF</Text>
              </LinearGradient>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar name={user?.name || 'Staff'} size="large" showBorder />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="📅" value={stats.todayAppointments} label="Today's Appointments" color="#FF6B6B" />
          <StatCard icon="✅" value={stats.checkedIn} label="Checked In" color="#10B981" />
          <StatCard icon="⏳" value={stats.waiting} label="Waiting" color="#F39C12" />
          <StatCard icon="🏁" value={stats.completed} label="Completed" color="#6C5CE7" />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('StaffQueue')}
            >
              <Text style={styles.quickActionIcon}>📋</Text>
              <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Queue</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('StaffBookAppointment')}
            >
              <Text style={styles.quickActionIcon}>📅</Text>
              <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Book Appt</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('StaffPatients')}
            >
              <Text style={styles.quickActionIcon}>🔍</Text>
              <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Patients</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.quickActions, { marginTop: spacing.md }]}>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Appointments')}
            >
              <Text style={styles.quickActionIcon}>📆</Text>
              <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Appointments</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('StaffDoctors')}
            >
              <Text style={styles.quickActionIcon}>👨‍⚕️</Text>
              <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Doctors</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Queue Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Current Queue</Text>
          <Card style={[styles.queueCard, { backgroundColor: colors.surface }]}>
            <View style={styles.queueHeader}>
              <Text style={[styles.queueTitle, { color: colors.textPrimary }]}>Waiting Room</Text>
              <View style={[styles.queueBadge, { backgroundColor: '#FF6B6B20' }]}>
                <Text style={[styles.queueBadgeText, { color: '#FF6B6B' }]}>{stats.waiting} waiting</Text>
              </View>
            </View>
            <Text style={[styles.queueSubtext, { color: colors.textSecondary }]}>
              Manage patient queue and check-ins
            </Text>
            <TouchableOpacity 
              style={[styles.queueBtn, { backgroundColor: '#FF6B6B' }]}
              onPress={() => navigation.navigate('StaffQueue')}
            >
              <Text style={styles.queueBtnText}>View Queue</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xxl },
  headerLeft: {},
  greeting: { ...typography.bodyLarge },
  userName: { ...typography.headlineLarge, marginTop: spacing.xs },
  roleBadge: { marginTop: spacing.sm },
  roleBadgeGradient: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  roleBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xxl },
  statCard: { width: (width - spacing.xl * 2 - spacing.md) / 2, padding: spacing.lg, borderRadius: borderRadius.lg },
  statIconBg: { width: 40, height: 40, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statIcon: { fontSize: 20 },
  statValue: { ...typography.displaySmall, marginBottom: spacing.xs },
  statLabel: { ...typography.labelSmall },
  section: { marginBottom: spacing.xxl },
  sectionTitle: { ...typography.headlineSmall, marginBottom: spacing.lg },
  quickActions: { flexDirection: 'row', gap: spacing.md },
  quickAction: { flex: 1, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  quickActionIcon: { fontSize: 24, marginBottom: spacing.sm },
  quickActionText: { ...typography.labelSmall, textAlign: 'center' },
  queueCard: { padding: spacing.lg, borderRadius: borderRadius.lg },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  queueTitle: { ...typography.bodyLarge, fontWeight: '600' },
  queueBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  queueBadgeText: { ...typography.labelSmall, fontWeight: '600' },
  queueSubtext: { ...typography.bodySmall, marginBottom: spacing.md },
  queueBtn: { paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  queueBtnText: { color: '#fff', ...typography.labelMedium, fontWeight: '600' },
});

export default StaffDashboardScreen;