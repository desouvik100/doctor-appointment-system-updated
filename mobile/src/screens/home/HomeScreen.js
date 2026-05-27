/**
 * Home Screen - Premium Patient Dashboard
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Avatar from '../../components/common/Avatar';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import {
  QuickActions,
  UpcomingAppointments,
  WalletSummary,
  HealthTips,
  LocationDisplay,
} from './components';
import { getUpcomingAppointments } from '../../services/api/appointmentService';
import { getBalance, getLoyaltyPoints } from '../../services/api/walletService';
import { useSocket, SOCKET_EVENTS } from '../../context/SocketContext';
import { devError, isValid } from '../../utils/errorHandler';

const HomeScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors } = useTheme();
  const { subscribe, isConnected } = useSocket();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
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
    recentActivity: [],
  });

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 5)  return 'Good night';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Good night';
  };

  const fetchDashboardData = useCallback(async () => {
    if (!isValid(user?.id)) { setLoading(false); setRefreshing(false); return; }
    try {
      const [appointmentsData, balanceData, loyaltyData] = await Promise.all([
        getUpcomingAppointments().catch(() => []),
        getBalance().catch(() => ({ balance: 0 })),
        getLoyaltyPoints().catch(() => ({ points: 0 })),
      ]);
      const raw = Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData.data || []);
      setDashboardData(prev => ({
        ...prev,
        appointments: raw.map(app => ({
          id: app._id || app.id,
          doctorName: app.doctor?.name || 'Unknown Doctor',
          doctorPhoto: app.doctor?.photo || app.doctor?.profilePhoto || null,
          specialty: app.doctor?.specialization || 'General',
          dateTime: app.date || app.appointmentDate,
          type: app.type || 'video',
        })),
        walletBalance: balanceData.balance || 0,
        loyaltyPoints: loyaltyData.points || 0,
      }));
    } catch (e) { devError('Dashboard fetch error:', e?.message); }
    finally { setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // Re-fetch wallet balance whenever the home screen comes into focus
  // (e.g. user adds money in WalletScreen and navigates back)
  useFocusEffect(
    useCallback(() => {
      if (!isValid(user?.id)) return;
      getBalance()
        .then(res => {
          setDashboardData(prev => ({ ...prev, walletBalance: res?.balance || 0 }));
        })
        .catch(() => {});
    }, [user?.id])
  );

  useEffect(() => {
    if (!isConnected) return;
    const u1 = subscribe(SOCKET_EVENTS.APPOINTMENT_CREATED, (data) => {
      if (data.appointment) {
        setDashboardData(prev => ({
          ...prev,
          appointments: [{ id: data.appointment._id, doctorName: data.appointment.doctor?.name || 'Unknown', specialty: data.appointment.doctor?.specialization || 'General', dateTime: data.appointment.date, type: data.appointment.type || 'video' }, ...prev.appointments],
        }));
      }
    });
    const u2 = subscribe(SOCKET_EVENTS.APPOINTMENT_CANCELLED, (data) => {
      const id = data.appointmentId || data.appointment?._id;
      if (id) setDashboardData(prev => ({ ...prev, appointments: prev.appointments.filter(a => a.id !== id) }));
    });
    const u3 = subscribe(SOCKET_EVENTS.WALLET_TRANSACTION, (data) => {
      if (data.balance !== undefined) setDashboardData(prev => ({ ...prev, walletBalance: data.balance }));
    });
    return () => { u1(); u2(); u3(); };
  }, [isConnected, subscribe]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
  }, [fetchDashboardData]);

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Ambient background mesh */}
      <View style={styles.backgroundContainer}>
        <LinearGradient colors={['#0A0E17', '#121826', '#1A1F2E']} style={StyleSheet.absoluteFill} />
        <View style={styles.orb1}>
          <LinearGradient colors={['rgba(0, 212, 170, 0.15)', 'transparent']} style={{ flex: 1, borderRadius: 150 }} />
        </View>
        <View style={styles.orb2}>
          <LinearGradient colors={['rgba(108, 92, 231, 0.12)', 'transparent']} style={{ flex: 1, borderRadius: 150 }} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor="#fff" colors={[colors.primary]} progressBackgroundColor={colors.backgroundCard} />
        }
      >
        {/* ── Hero Header ── */}
        <LinearGradient
          colors={['rgba(26, 31, 46, 0.55)', 'rgba(10, 14, 23, 0.15)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.heroGradient, { paddingTop: insets.top + spacing.lg }]}
        >
          <View style={styles.heroRow}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroGreeting}>{getGreeting()} 👋</Text>
              <Text style={styles.heroName}>{firstName}</Text>
              <Text style={styles.heroSubtitle}>Stay healthy, {firstName} 💙</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.85}>
              <View style={styles.avatarRing}>
                <Avatar
                  name={user?.name || 'User'}
                  size="large"
                  showBorder
                  source={user?.profilePhoto ? { uri: user.profilePhoto } : null}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Search Bar — inside hero (Glassmorphic) */}
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => navigation.navigate('Booking')}
            activeOpacity={0.9}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>Search doctors, symptoms...</Text>
            <View style={styles.filterBtn}>
              <Text style={styles.filterIcon}>⚙️</Text>
            </View>
          </TouchableOpacity>

          {/* Location — compact inline */}
          <LocationDisplay compact />
        </LinearGradient>

        <View style={styles.body}>
          {/* Upcoming Appointments */}
          <UpcomingAppointments
            appointments={dashboardData.appointments}
            navigation={navigation}
            onJoinCall={(apt) => navigation.navigate('VideoConsult', { appointmentId: apt.id })}
            onReschedule={(apt) => navigation.navigate('Reschedule', { appointment: apt })}
          />

          {/* Quick Actions */}
          <QuickActions navigation={navigation} />

          {/* Health Wallet */}
          <WalletSummary
            balance={dashboardData.walletBalance}
            loyaltyPoints={dashboardData.loyaltyPoints}
            navigation={navigation}
            onAddMoney={() => navigation.navigate('Wallet', { action: 'addMoney' })}
          />

          {/* Find Doctor CTA */}
          <TouchableOpacity
                onPress={() => navigation.navigate('Booking')}
                activeOpacity={0.85}>
                <LinearGradient
                  colors={colors?.gradients?.secondary || ['#6C5CE7', '#A29BFE']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ctaBanner}
                >
              <View style={styles.ctaLeft}>
                <Text style={styles.ctaTitle}>👨‍⚕️ Recommended for you</Text>
                <Text style={styles.ctaSubtitle}>500+ verified specialists available</Text>
              </View>
              <View style={styles.ctaArrow}>
                <Text style={styles.ctaArrowText}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Health Tips */}
          <View style={styles.healthTipsWrapper}>
            <HealthTips />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // Ambient mesh
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

  // Hero
  heroGradient: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
  heroLeft: { flex: 1 },
  heroGreeting: { color: 'rgba(255,255,255,0.65)', ...typography.bodyLarge, fontWeight: '500' },
  heroName: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 2, letterSpacing: -0.5 },
  heroSubtitle: { color: 'rgba(255,255,255,0.5)', ...typography.bodyMedium, marginTop: spacing.xs },
  avatarRing: { borderWidth: 3, borderColor: 'rgba(0, 212, 170, 0.4)', borderRadius: 999, padding: 2 },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  searchIcon: { fontSize: 18, marginRight: spacing.md, color: 'rgba(255, 255, 255, 0.6)' },
  searchPlaceholder: { flex: 1, ...typography.bodyLarge, color: 'rgba(255, 255, 255, 0.45)', fontWeight: '500' },
  filterBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0, 212, 170, 0.25)', alignItems: 'center', justifyContent: 'center' },
  filterIcon: { fontSize: 16, color: '#00D4AA' },

  // Body
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },

  // CTA
  ctaBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.xxl },
  ctaLeft: { flex: 1 },
  ctaTitle: { color: '#fff', ...typography.bodyLarge, fontWeight: '700', marginBottom: 3 },
  ctaSubtitle: { color: 'rgba(255,255,255,0.75)', ...typography.bodySmall },
  ctaArrow: { width: 40, height: 40, borderRadius: borderRadius.lg, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginLeft: spacing.md },
  ctaArrowText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  healthTipsWrapper: { marginHorizontal: -spacing.xl, marginBottom: spacing.xxl },
});

export default HomeScreen;
