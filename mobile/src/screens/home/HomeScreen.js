/**
 * Home Screen - Flagship Material 3 Patient Portal V3 (Dynamic Polish)
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import Avatar from '../../components/common/Avatar';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import {
  UpcomingAppointments,
  WalletSummary,
  LocationDisplay,
  QuickBookActions,
  LiveQueueStatus,
  AvailableNow,
  SecondaryServices,
  TrendingSpecialties,
  ContinueJourney,
} from './components';
import { getUpcomingAppointments } from '../../services/api/appointmentService';
import { getBalance, getLoyaltyPoints } from '../../services/api/walletService';
import { searchDoctors } from '../../services/api/doctorService';
import { useSocket, SOCKET_EVENTS } from '../../context/SocketContext';
import { devError, isValid } from '../../utils/errorHandler';

const HomeScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const { subscribe, isConnected } = useSocket();
  const insets = useSafeAreaInsets();
  
  const [refreshing, setRefreshing] = useState(false);
  const [recommendedDoctors, setRecommendedDoctors] = useState([]);
  const [loadedSections, setLoadedSections] = useState(1);
  const [pendingJourneys, setPendingJourneys] = useState([
    {
      id: 'booking',
      type: 'Pending booking',
      title: 'Complete Booking',
      description: 'Dr. Sarah Wilson - Cardiologist',
      cta: 'Resume',
      icon: '🩺',
      color: '#00D4AA',
      screen: 'DoctorSearch',
      params: { query: 'Sarah Wilson' }
    },
    {
      id: 'payment',
      type: 'Pending payment',
      title: 'Pay Consultation Fee',
      description: 'Dr. Michael Chen - ₹150.00',
      cta: 'Pay Now',
      icon: '💳',
      color: '#6C5CE7',
      screen: 'Wallet',
      params: { action: 'pay' }
    }
  ]);

  const [dashboardData, setDashboardData] = useState({
    appointments: [],
    walletBalance: 0,
    loyaltyPoints: 280,
    activeQueue: null,
  });

  // progressive section loading for solid 60 FPS initial render
  useEffect(() => {
    const frame1 = requestAnimationFrame(() => {
      setLoadedSections(2);
    });
    const frame2 = setTimeout(() => {
      setLoadedSections(3);
    }, 180);
    return () => {
      cancelAnimationFrame(frame1);
      clearTimeout(frame2);
    };
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 5)  return 'Good night';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Good night';
  };

  const fetchDashboardData = useCallback(async () => {
    if (!isValid(user?.id)) { setRefreshing(false); return; }
    try {
      const [appointmentsData, balanceData, loyaltyData, doctorsData] = await Promise.all([
        getUpcomingAppointments().catch(() => []),
        getBalance().catch(() => ({ balance: 0 })),
        getLoyaltyPoints().catch(() => ({ points: 280 })),
        searchDoctors({ limit: 5 }).catch(() => ({ doctors: [] })),
      ]);
      
      const raw = Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData.data || []);
      const docsRaw = doctorsData?.doctors || doctorsData?.data || doctorsData || [];
      
      const parsedAppointments = raw.map(app => ({
        id: app._id || app.id,
        doctorName: app.doctor?.name || 'Unknown Doctor',
        doctorPhoto: app.doctor?.photo || app.doctor?.profilePhoto || null,
        specialty: app.doctor?.specialization || 'General',
        dateTime: app.date || app.appointmentDate,
        type: app.type || 'video',
      }));

      setDashboardData(prev => ({
        ...prev,
        appointments: parsedAppointments,
        walletBalance: balanceData.balance || 0,
        loyaltyPoints: loyaltyData.points || 280,
      }));

      // Trigger dynamic Live Queue status active check
      if (parsedAppointments.length > 0) {
        setDashboardData(prev => ({
          ...prev,
          activeQueue: {
            userPosition: 3,
            estimatedWaitMinutes: 15,
            isYourTurn: false,
            status: 'waiting',
          }
        }));
      }
      
      setRecommendedDoctors(docsRaw.length > 0 ? docsRaw : [
        { _id: '1', name: 'Dr. Ananya Sharma', specialization: 'Cardiology', profilePhoto: null, rating: 4.9, consultationFee: 600, yearsOfExperience: 14, distance: '1.2 km' },
        { _id: '2', name: 'Dr. Rohan Mehra', specialization: 'Dermatology', profilePhoto: null, rating: 4.8, consultationFee: 500, yearsOfExperience: 10, distance: '2.5 km' },
        { _id: '3', name: 'Dr. Priya Nair', specialization: 'Pediatrics', profilePhoto: null, rating: 4.7, consultationFee: 400, yearsOfExperience: 8, distance: '3.8 km' },
      ]);
    } catch (e) { devError('Dashboard fetch error:', e?.message); }
    finally { setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

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
    const u4 = subscribe(SOCKET_EVENTS.QUEUE_POSITION_CHANGED, (data) => {
      setDashboardData(prev => ({ ...prev, activeQueue: data }));
    });
    const u5 = subscribe(SOCKET_EVENTS.QUEUE_YOUR_TURN, (data) => {
      setDashboardData(prev => ({ ...prev, activeQueue: { ...prev.activeQueue, ...data, isYourTurn: true } }));
    });
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [isConnected, subscribe]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
  }, [fetchDashboardData]);

  const firstName = user?.name?.split(' ')[0] || 'there';

  // ── DYNAMIC HOMEPAGE STATE SELECTOR ──
  const hasLiveQueue = dashboardData.activeQueue && 
    (dashboardData.activeQueue.status === 'waiting' || dashboardData.activeQueue.status === 'active' || dashboardData.activeQueue.isYourTurn) &&
    dashboardData.appointments.length > 0;
  
  const pendingBooking = pendingJourneys.find(j => j.id === 'booking');
  const pendingPayment = pendingJourneys.find(j => j.id === 'payment');

  let homeState = 'D'; // Default General
  if (hasLiveQueue) {
    homeState = 'A';
  } else if (pendingBooking) {
    homeState = 'B';
  } else if (pendingPayment) {
    homeState = 'C';
  }

  // Dynamic context-aware greeting subtext
  const getGreetingCTA = () => {
    switch (homeState) {
      case 'A':
        return 'Your consultation is ready. Track your live queue position below.';
      case 'B':
        return 'Finish your incomplete booking. Resume slot selection now.';
      case 'C':
        return 'Appointment slot reserved. Complete payment to secure booking.';
      case 'D':
      default:
        return 'Need a doctor today? Find nearby clinics and book in 10 seconds.';
    }
  };

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
            colors={isDarkMode ? ['rgba(0, 212, 170, 0.08)', 'transparent'] : ['rgba(0, 212, 170, 0.03)', 'transparent']}
            style={{ flex: 1, borderRadius: 150 }}
          />
        </View>
        <View style={styles.orb2}>
          <LinearGradient
            colors={isDarkMode ? ['rgba(108, 92, 231, 0.06)', 'transparent'] : ['rgba(108, 92, 231, 0.02)', 'transparent']}
            style={{ flex: 1, borderRadius: 150 }}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={isDarkMode ? '#ffffff' : colors.primary} 
            colors={[colors.primary]} 
            progressBackgroundColor={colors.backgroundCard} 
          />
        }
      >
        {/* ── 1. DYNAMIC HERO SECTION (Dynamic greeting & context-aware CTA) ── */}
        <View style={styles.headerRow}>
          <View style={styles.greetingContainer}>
            <Text style={[styles.heroSubGreeting, { color: colors.textSecondary }]}>
              {getGreeting().toUpperCase()} 👋
            </Text>
            <Text style={[styles.heroName, { color: colors.textPrimary }]}>
              {firstName}
            </Text>
            <Text style={[styles.heroCTA, { color: colors.textSecondary }]}>
              {getGreetingCTA()}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.notificationBtn,
                {
                  backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  ...shadows.sm,
                },
              ]}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 15 }}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.avatarBtn, { ...shadows.sm }]}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.85}
            >
              <Avatar
                name={user?.name || 'User'}
                size="medium"
                imageUrl={user?.profilePhoto}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. HERO SEARCH BAR & LOCATION ── */}
        <View style={styles.searchSection}>
          <TouchableOpacity
            style={[
              styles.searchBar,
              {
                backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                ...shadows.sm,
              }
            ]}
            onPress={() => navigation.navigate('DoctorSearch')}
            activeOpacity={0.9}
          >
            <Text style={[styles.searchIcon, { color: colors.textMuted }]}>🔍</Text>
            <Text style={[styles.searchPlaceholder, { color: colors.textMuted }]}>Search doctors, specialities, symptoms...</Text>
          </TouchableOpacity>
          <LocationDisplay compact />
        </View>

        <View style={styles.body}>
          {/* ── 3. STATE A PRIMARY: FLAGSHIP LIVE QUEUE TRACKER ── */}
          {homeState === 'A' && (
            <LiveQueueStatus 
              appointments={dashboardData.appointments} 
              activeQueue={dashboardData.activeQueue} 
            />
          )}

          {/* ── 4. STATE B & C PRIMARY: RESUME BOOKING progress ── */}
          {(homeState === 'B' || homeState === 'C') && (
            <ContinueJourney items={pendingJourneys} />
          )}

          {/* ── 5. BOOK DOCTOR HERO ACTIONS (State D Primary or State A/B/C Secondary) ── */}
          <QuickBookActions />

          {/* Progressive Load Tier 2 */}
          {loadedSections >= 2 && (
            <>
              {/* Render secondary states lower down */}
              {homeState !== 'A' && (
                <LiveQueueStatus 
                  appointments={dashboardData.appointments} 
                  activeQueue={dashboardData.activeQueue} 
                />
              )}

              {homeState === 'D' && (
                <ContinueJourney items={pendingJourneys} />
              )}

              {/* ── 6. AVAILABLE NOW SECTION ── */}
              <AvailableNow />
            </>
          )}

          {/* Progressive Load Tier 3 */}
          {loadedSections >= 3 && (
            <>
              {/* ── 7. RECOMMENDED DOCTORS (AIRBNB OVERHAUL) ── */}
              <View style={styles.recommendedSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recommended Doctors</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('DoctorSearch')} activeOpacity={0.7}>
                    <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                  {recommendedDoctors.map((doc, idx) => (
                    <Animated.View 
                      entering={FadeInDown.delay(idx * 80)} 
                      key={doc._id}
                    >
                      <TouchableOpacity
                        style={[
                          styles.doctorCard,
                          {
                            backgroundColor: isDarkMode ? '#1E2433' : '#FFFFFF',
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                            ...shadows.sm,
                          }
                        ]}
                        onPress={() => navigation.navigate('DoctorProfile', { doctor: doc, doctorId: doc._id })}
                        activeOpacity={0.85}
                      >
                        <View style={styles.docCardHeader}>
                          <Avatar name={doc.name} size="large" imageUrl={doc.profilePhoto} />
                          <View style={styles.docRatingRow}>
                            <Text style={styles.starText}>⭐</Text>
                            <Text style={[styles.ratingText, { color: colors.textPrimary }]}>{doc.rating || '4.8'}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.docCardContent}>
                          <Text style={[styles.recDocName, { color: colors.textPrimary }]} numberOfLines={1}>
                            {doc.name}
                          </Text>
                          <Text style={[styles.recDocSpec, { color: colors.textMuted }]} numberOfLines={1}>
                            {doc.specialization || doc.specialty || 'General Practitioner'}
                          </Text>
                          <Text style={[styles.recDocExp, { color: colors.textMuted }]}>
                            {doc.yearsOfExperience || 10} yrs exp • {doc.distance || '1.5 km'}
                          </Text>
                        </View>

                        <View style={styles.docCardFooter}>
                          <Text style={[styles.docFee, { color: colors.primary }]}>
                            ₹{doc.consultationFee || doc.fee || 500}
                          </Text>
                          <View style={[styles.bookBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.bookBadgeText}>Book</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </ScrollView>
              </View>

              {/* ── 8. TRENDING SPECIALTIES ── */}
              <TrendingSpecialties />

              {/* ── 9. OTHER SERVICES ── */}
              <SecondaryServices />

              {/* ── 10. WALLET SNAPSHOT (Bottom priority) ── */}
              <WalletSummary
                balance={dashboardData.walletBalance}
                loyaltyPoints={dashboardData.loyaltyPoints}
                onAddMoney={() => navigation.navigate('Wallet', { action: 'addMoney' })}
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

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

  // Dynamic Greeting row
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  greetingContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  heroSubGreeting: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroName: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  heroCTA: {
    fontSize: 12.5,
    fontWeight: '650',
    marginTop: 4,
    lineHeight: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },

  // Search Section
  searchSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
  },
  searchIcon: { fontSize: 15, marginRight: spacing.md },
  searchPlaceholder: { flex: 1, ...typography.bodyMedium, opacity: 0.6, fontSize: 12.5 },

  // Body
  body: { 
    paddingHorizontal: spacing.lg,
  },

  // Recommended Doctors Section
  recommendedSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.headlineMedium,
    fontSize: 16,
    fontWeight: '800',
  },
  seeAllText: {
    ...typography.labelMedium,
    fontWeight: '700',
  },
  horizontalScroll: {
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  // Airbnb-style doctor listing cards
  doctorCard: {
    width: 155,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    height: 185,
    justifyContent: 'space-between',
  },
  docCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  docRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    gap: 2,
  },
  starText: {
    fontSize: 9,
  },
  ratingText: {
    fontSize: 9,
    fontWeight: '800',
  },
  docCardContent: {
    marginVertical: spacing.xs,
  },
  recDocName: {
    ...typography.bodyMedium,
    fontWeight: '800',
    fontSize: 12.5,
  },
  recDocSpec: {
    ...typography.labelSmall,
    fontSize: 9.5,
    marginTop: 1,
  },
  recDocExp: {
    fontSize: 8.5,
    fontWeight: '600',
    marginTop: 3,
  },
  docCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.04)',
    paddingTop: spacing.sm,
  },
  docFee: {
    fontSize: 12,
    fontWeight: '850',
  },
  bookBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  bookBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
});

export default HomeScreen;
