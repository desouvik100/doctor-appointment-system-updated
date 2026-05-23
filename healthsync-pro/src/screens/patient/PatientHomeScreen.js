/**
 * PatientHomeScreen — Home screen for patients in the HealthSync Pro mobile app
 * Shows upcoming appointments, quick actions, and health summary
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import apiClient from '../../services/api/apiClient';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { key: 'book',        label: 'Book\nAppointment', icon: '📅', screen: 'BookAppointment',   gradient: ['#4FACFE', '#00F2FE'] },
  { key: 'queue',       label: 'My\nQueue',          icon: '🔢', screen: 'MyQueue',           gradient: ['#43E97B', '#38F9D7'] },
  { key: 'records',     label: 'Health\nRecords',    icon: '📋', screen: 'HealthRecords',     gradient: ['#A18CD1', '#FBC2EB'] },
  { key: 'prescriptions', label: 'Prescriptions',   icon: '💊', screen: 'Prescriptions',     gradient: ['#FF6B6B', '#FF8E53'] },
  { key: 'labs',        label: 'Lab\nReports',       icon: '🧪', screen: 'LabReports',        gradient: ['#F093FB', '#F5576C'] },
  { key: 'family',      label: 'Family\nMembers',    icon: '👨‍👩‍👧', screen: 'FamilyMembers',   gradient: ['#11998E', '#38EF7D'] },
];

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: '#F59E0B', bg: '#FEF3C7' },
  confirmed:  { label: 'Confirmed',  color: '#10B981', bg: '#D1FAE5' },
  completed:  { label: 'Completed',  color: '#3B82F6', bg: '#DBEAFE' },
  cancelled:  { label: 'Cancelled',  color: '#EF4444', bg: '#FEE2E2' },
  'checked-in': { label: 'Checked In', color: '#8B5CF6', bg: '#EDE9FE' },
};

const AppointmentCard = ({ appointment, colors, onPress }) => {
  const status = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.pending;
  const date = new Date(appointment.date);
  const dateStr = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <TouchableOpacity
      style={[styles.appointmentCard, { backgroundColor: colors.backgroundCard }]}
      onPress={() => onPress(appointment)}
      activeOpacity={0.8}
    >
      <View style={styles.appointmentLeft}>
        <View style={[styles.dateBox, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.dateDay, { color: colors.primary }]}>
            {date.getDate()}
          </Text>
          <Text style={[styles.dateMonth, { color: colors.primary }]}>
            {date.toLocaleDateString('en-IN', { month: 'short' })}
          </Text>
        </View>
      </View>

      <View style={styles.appointmentInfo}>
        <Text style={[styles.doctorName, { color: colors.textPrimary }]} numberOfLines={1}>
          Dr. {appointment.doctorId?.name || appointment.doctorName || 'Unknown'}
        </Text>
        <Text style={[styles.specialization, { color: colors.textSecondary }]} numberOfLines={1}>
          {appointment.doctorId?.specialization || appointment.specialization || 'General'}
        </Text>
        <View style={styles.appointmentMeta}>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            🕐 {appointment.time || 'TBD'}
          </Text>
          {appointment.queueNumber && (
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              · Queue #{appointment.queueNumber}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
      </View>
    </TouchableOpacity>
  );
};

const QuickActionCard = ({ action, colors, onPress }) => (
  <TouchableOpacity
    style={styles.quickActionCard}
    onPress={() => onPress(action.screen)}
    activeOpacity={0.8}
  >
    <LinearGradient
      colors={action.gradient}
      style={styles.quickActionGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.quickActionIcon}>{action.icon}</Text>
      <Text style={styles.quickActionLabel}>{action.label}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const PatientHomeScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
    loyaltyPoints: 0,
  });

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchData = useCallback(async () => {
    if (!user?.id && !user?._id) { setLoading(false); return; }
    const userId = user.id || user._id;

    try {
      const [apptRes, loyaltyRes] = await Promise.allSettled([
        apiClient.get(`/appointments/my?status=upcoming`),
        apiClient.get(`/loyalty-points`),
      ]);

      if (apptRes.status === 'fulfilled') {
        const data = apptRes.value.data;
        const list = data?.data || data?.appointments || (Array.isArray(data) ? data : []);
        setUpcomingAppointments(list.slice(0, 5));
        setStats(prev => ({ ...prev, upcoming: list.length }));
      }

      if (loyaltyRes.status === 'fulfilled') {
        const pts = loyaltyRes.value.data?.points || loyaltyRes.value.data?.totalPoints || 0;
        setStats(prev => ({ ...prev, loyaltyPoints: pts }));
      }
    } catch (err) {
      console.log('[PatientHome] fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleQuickAction = (screen) => {
    navigation.navigate(screen);
  };

  const handleAppointmentPress = (appointment) => {
    navigation.navigate('AppointmentDetail', { appointmentId: appointment._id });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Header */}
        <LinearGradient
          colors={['#00D4AA', '#00B894', '#009B77']}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Patient'} 👋</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Text style={styles.notificationIcon}>🔔</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.upcoming}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.loyaltyPoints}</Text>
              <Text style={styles.statLabel}>Points 🏆</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map(action => (
              <QuickActionCard
                key={action.key}
                action={action}
                colors={colors}
                onPress={handleQuickAction}
              />
            ))}
          </View>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Upcoming Appointments
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyAppointments')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>

          {upcomingAppointments.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.backgroundCard }]}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No upcoming appointments
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Book an appointment with a doctor
              </Text>
              <TouchableOpacity
                style={[styles.bookBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('BookAppointment')}
              >
                <Text style={styles.bookBtnText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            upcomingAppointments.map(appt => (
              <AppointmentCard
                key={appt._id}
                appointment={appt}
                colors={colors}
                onPress={handleAppointmentPress}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const CARD_SIZE = (width - spacing.xl * 2 - spacing.md) / 3;

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontFamily: typography.regular },
  userName: { fontSize: 24, color: '#fff', fontFamily: typography.bold, marginTop: 2 },
  notificationBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  notificationIcon: { fontSize: 18 },

  // Stats
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: borderRadius.lg, padding: spacing.md },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, color: '#fff', fontFamily: typography.bold },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: typography.regular, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },

  // Sections
  section: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 18, fontFamily: typography.semiBold },
  seeAll: { fontSize: 14, fontFamily: typography.medium },

  // Quick Actions
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickActionCard: { width: CARD_SIZE, marginBottom: spacing.sm },
  quickActionGradient: { borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', minHeight: 80, justifyContent: 'center' },
  quickActionIcon: { fontSize: 24, marginBottom: 4 },
  quickActionLabel: { fontSize: 11, color: '#fff', fontFamily: typography.semiBold, textAlign: 'center' },

  // Appointment Cards
  appointmentCard: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  appointmentLeft: { marginRight: spacing.md },
  dateBox: { width: 48, height: 52, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontSize: 20, fontFamily: typography.bold, lineHeight: 22 },
  dateMonth: { fontSize: 11, fontFamily: typography.medium },
  appointmentInfo: { flex: 1 },
  doctorName: { fontSize: 15, fontFamily: typography.semiBold },
  specialization: { fontSize: 12, fontFamily: typography.regular, marginTop: 2 },
  appointmentMeta: { flexDirection: 'row', marginTop: 4 },
  metaText: { fontSize: 12, fontFamily: typography.regular },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.full },
  statusText: { fontSize: 11, fontFamily: typography.semiBold },

  // Empty state
  emptyCard: { borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: 16, fontFamily: typography.semiBold, marginBottom: spacing.xs },
  emptySubtitle: { fontSize: 13, fontFamily: typography.regular, textAlign: 'center', marginBottom: spacing.lg },
  bookBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  bookBtnText: { color: '#fff', fontSize: 14, fontFamily: typography.semiBold },
});

export default PatientHomeScreen;
