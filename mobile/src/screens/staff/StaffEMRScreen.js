/**
 * Staff EMR Screen - Electronic Medical Records for Staff
 * Shows EMR subscription status, patients, prescriptions, and clinic analytics
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../services/api/apiClient';

const StaffEMRScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayVisits: 0,
    pendingCheckIns: 0,
    daysRemaining: 0,
  });

  const getClinicId = () => {
    if (!user?.clinicId) return null;
    if (typeof user.clinicId === 'object' && user.clinicId._id) {
      return user.clinicId._id;
    }
    return user.clinicId;
  };

  const fetchEMRData = useCallback(async () => {
    const clinicId = getClinicId();
    if (!clinicId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch subscription status
      const subResponse = await apiClient.get(`/emr/subscription/${clinicId}`).catch(() => ({ data: {} }));
      if (subResponse.data.success && subResponse.data.subscription) {
        setSubscription(subResponse.data.subscription);
        
        const expiryDate = new Date(subResponse.data.subscription.expiryDate);
        const today = new Date();
        const daysRemaining = Math.max(0, Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24)));
        setStats(prev => ({ ...prev, daysRemaining }));
      }

      // Fetch patients
      const patientsResponse = await apiClient.get(`/emr/patients/clinic/${clinicId}`).catch(() => ({ data: { patients: [] } }));
      if (patientsResponse.data.success) {
        setPatients(patientsResponse.data.patients || []);
        setStats(prev => ({ ...prev, totalPatients: patientsResponse.data.patients?.length || 0 }));
      }

      // Fetch today's appointments for stats
      const today = new Date().toISOString().split('T')[0];
      const appointmentsResponse = await apiClient.get(`/appointments/clinic/${clinicId}`, {
        params: { date: today }
      }).catch(() => ({ data: [] }));
      
      const appointments = Array.isArray(appointmentsResponse.data) 
        ? appointmentsResponse.data 
        : appointmentsResponse.data?.appointments || [];
      
      const todayVisits = appointments.filter(a => a.status === 'completed').length;
      const pendingCheckIns = appointments.filter(a => 
        (a.status === 'confirmed' || a.status === 'scheduled') && !a.checkedIn
      ).length;
      
      setStats(prev => ({ ...prev, todayVisits, pendingCheckIns }));
    } catch (error) {
      console.log('EMR fetch error:', error.message);
    } finally {
      setLoading(false);
    }
  }, [user?.clinicId]);

  useEffect(() => {
    fetchEMRData();
  }, [fetchEMRData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEMRData();
    setRefreshing(false);
  }, [fetchEMRData]);
  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone?.includes(searchQuery) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const StatCard = ({ icon, value, label, gradient, onPress }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient colors={gradient} style={styles.statGradient}>
        <Text style={styles.statIcon}>{icon}</Text>
      </LinearGradient>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading EMR...</Text>
      </View>
    );
  }
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
            <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>EMR System</Text>
          <View style={{ width: 40 }} />
        </View>
        {/* Subscription Banner */}
        {subscription ? (
          <LinearGradient colors={['#10B981', '#059669']} style={styles.subBanner}>
            <View style={styles.subBannerLeft}>
              <Text style={styles.subBannerIcon}>📋</Text>
              <View>
                <Text style={styles.subBannerTitle}>EMR Active</Text>
                <Text style={styles.subBannerClinic}>{user?.clinicId?.name || 'Your Clinic'}</Text>
              </View>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{stats.daysRemaining} days left</Text>
            </View>
          </LinearGradient>
        ) : (
          <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.subBanner}>
            <View style={styles.subBannerLeft}>
              <Text style={styles.subBannerIcon}>🔒</Text>
              <View>
                <Text style={styles.subBannerTitle}>EMR Not Active</Text>
                <Text style={styles.subBannerClinic}>Contact admin to enable</Text>
              </View>
            </View>
          </LinearGradient>
        )}
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard 
            icon="👥" 
            value={stats.totalPatients} 
            label="Total Patients" 
            gradient={['#3B82F6', '#1D4ED8']}
            onPress={() => navigation.navigate('StaffPatients')}
          />
          <StatCard 
            icon="📅" 
            value={stats.todayVisits} 
            label="Today's Visits" 
            gradient={['#10B981', '#059669']}
            onPress={() => navigation.navigate('Appointments')}
          />
          <StatCard 
            icon="⏳" 
            value={stats.pendingCheckIns} 
            label="Pending Check-ins" 
            gradient={['#F59E0B', '#D97706']}
            onPress={() => navigation.navigate('StaffQueue')}
          />
          <StatCard 
            icon="📄" 
            value={stats.daysRemaining} 
            label="Days Left" 
            gradient={['#8B5CF6', '#6D28D9']}
          />
        </View>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('StaffPatients')}
            >
              <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>👤</Text>
              </LinearGradient>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Register Patient</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('StaffQueue')}
            >
              <LinearGradient colors={['#10B981', '#059669']} style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>✅</Text>
              </LinearGradient>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Check-in Patient</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('StaffBookAppointment')}
            >
              <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>📅</Text>
              </LinearGradient>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Book Appointment</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Appointments')}
            >
              <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>📋</Text>
              </LinearGradient>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>View Records</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Patient Search */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Patient Search</Text>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search by name, phone, or email..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={[styles.clearIcon, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Patient List */}
          {filteredPatients.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.emptyIcon}>👤</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery ? 'No patients found' : 'No patients registered yet'}
              </Text>
            </Card>
          ) : (
            filteredPatients.slice(0, 10).map((patient, index) => (
              <TouchableOpacity 
                key={patient._id || index}
                style={[styles.patientItem, { backgroundColor: colors.surface }]}
                onPress={() => navigation.navigate('StaffPatientDetail', { patientId: patient._id })}
              >
                <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.patientAvatar}>
                  <Text style={styles.patientInitial}>{patient.name?.charAt(0) || 'P'}</Text>
                </LinearGradient>
                <View style={styles.patientInfo}>
                  <Text style={[styles.patientName, { color: colors.textPrimary }]}>{patient.name}</Text>
                  <Text style={[styles.patientPhone, { color: colors.textSecondary }]}>{patient.phone || patient.email}</Text>
                </View>
                <Text style={[styles.patientArrow, { color: colors.textMuted }]}>›</Text>
              </TouchableOpacity>
            ))
          )}
          {filteredPatients.length > 10 && (
            <TouchableOpacity 
              style={[styles.viewAllBtn, { borderColor: colors.primary }]}
              onPress={() => navigation.navigate('StaffPatients')}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All Patients ({filteredPatients.length})</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, ...typography.bodyMedium },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20 },
  headerTitle: { ...typography.headlineSmall, fontWeight: '700' },
  
  subBanner: { padding: spacing.lg, borderRadius: borderRadius.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  subBannerLeft: { flexDirection: 'row', alignItems: 'center' },
  subBannerIcon: { fontSize: 24, marginRight: spacing.md },
  subBannerTitle: { color: '#fff', ...typography.bodyLarge, fontWeight: '700' },
  subBannerClinic: { color: 'rgba(255,255,255,0.8)', ...typography.bodySmall },
  activeBadge: { backgroundColor: '#fff', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  activeBadgeText: { color: '#10B981', ...typography.labelSmall, fontWeight: '700' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  statCard: { width: '47%', backgroundColor: '#fff', padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  statGradient: { width: 50, height: 50, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statIcon: { fontSize: 24 },
  statValue: { ...typography.headlineMedium, fontWeight: '700' },
  statLabel: { ...typography.labelSmall, textAlign: 'center' },
  section: { marginBottom: spacing.xxl },
  sectionTitle: { ...typography.headlineSmall, fontWeight: '600', marginBottom: spacing.md },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  actionCard: { width: '47%', padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  actionIcon: { width: 50, height: 50, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  actionEmoji: { fontSize: 24 },
  actionLabel: { ...typography.labelMedium, textAlign: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, borderWidth: 1, marginBottom: spacing.md },
  searchIcon: { fontSize: 18, marginRight: spacing.md },
  searchInput: { flex: 1, ...typography.bodyLarge, paddingVertical: spacing.md },
  clearIcon: { fontSize: 16, padding: spacing.xs },
  emptyCard: { padding: spacing.xxl, borderRadius: borderRadius.lg, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },
  patientItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  patientAvatar: { width: 44, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  patientInitial: { color: '#fff', ...typography.bodyLarge, fontWeight: '700' },
  patientInfo: { flex: 1 },
  patientName: { ...typography.bodyMedium, fontWeight: '600' },
  patientPhone: { ...typography.labelSmall },
  patientArrow: { fontSize: 24 },
  viewAllBtn: { paddingVertical: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, alignItems: 'center', marginTop: spacing.sm },
  viewAllText: { ...typography.labelMedium, fontWeight: '600' },
});
export default StaffEMRScreen;