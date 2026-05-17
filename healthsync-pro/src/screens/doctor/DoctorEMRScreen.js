/**
 * Doctor EMR Screen - Electronic Medical Records for Doctors
 * Shows EMR subscription status, patients, prescriptions, and analytics
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
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../services/api/apiClient';

const DoctorEMRScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [emrPatients, setEmrPatients] = useState([]);
  const [emrPrescriptions, setEmrPrescriptions] = useState([]);
  const [stats, setStats] = useState({
    patients: 0,
    prescriptions: 0,
    visitsToday: 0,
    daysRemaining: 0,
  });

  // Get clinic ID from user
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
      const subResponse = await apiClient.get(`/emr/subscription/${clinicId}`);
      if (subResponse.data.success && subResponse.data.subscription) {
        setSubscription(subResponse.data.subscription);
        
        // Calculate days remaining
        const expiryDate = new Date(subResponse.data.subscription.expiryDate);
        const today = new Date();
        const daysRemaining = Math.max(0, Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24)));
        
        setStats(prev => ({ ...prev, daysRemaining }));
        
        // Fetch EMR patients
        try {
          const patientsResponse = await apiClient.get(`/emr/patients/clinic/${clinicId}`);
          if (patientsResponse.data.success) {
            setEmrPatients(patientsResponse.data.patients || []);
            setStats(prev => ({ ...prev, patients: patientsResponse.data.patients?.length || 0 }));
          }
        } catch (e) {
          console.log('EMR patients fetch error:', e.message);
        }

        // Fetch prescriptions
        try {
          const rxResponse = await apiClient.get(`/prescriptions/clinic/${clinicId}`);
          if (rxResponse.data.success) {
            setEmrPrescriptions(rxResponse.data.prescriptions || []);
            setStats(prev => ({ ...prev, prescriptions: rxResponse.data.prescriptions?.length || 0 }));
          }
        } catch (e) {
          console.log('Prescriptions fetch error:', e.message);
        }
      }
    } catch (error) {
      console.log('EMR subscription fetch error:', error.message);
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

  const StatCard = ({ icon, value, label, gradient }) => (
    <View style={styles.statCard}>
      <LinearGradient colors={gradient} style={styles.statGradient}>
        <Text style={styles.statIcon}>{icon}</Text>
      </LinearGradient>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );

  const FeatureItem = ({ icon, label, description, available, onPress }) => (
    <TouchableOpacity 
      style={[styles.featureItem, { backgroundColor: colors.surface, opacity: available ? 1 : 0.5 }]}
      onPress={available ? onPress : () => Alert.alert('Upgrade Required', 'This feature requires a higher subscription plan.')}
      disabled={!available}
    >
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureInfo}>
        <Text style={[styles.featureLabel, { color: colors.textPrimary }]}>{label}</Text>
        <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      {!available && (
        <View style={styles.upgradeBadge}>
          <Text style={styles.upgradeBadgeText}>Upgrade</Text>
        </View>
      )}
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

  // No subscription view
  if (!subscription) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>EMR System</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* No Subscription Card */}
          <Card style={[styles.noSubCard, { backgroundColor: colors.surface }]}>
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.lockIcon}>
              <Text style={styles.lockEmoji}>🔒</Text>
            </LinearGradient>
            <Text style={[styles.noSubTitle, { color: colors.textPrimary }]}>EMR Not Available</Text>
            <Text style={[styles.noSubDesc, { color: colors.textSecondary }]}>
              Your clinic doesn't have an active EMR subscription.{'\n'}
              Contact your clinic administrator to enable EMR features.
            </Text>
            <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                EMR features include patient records, prescriptions, visit history, and more.
              </Text>
            </View>
          </Card>
        </ScrollView>
      </View>
    );
  }

  const plan = subscription.plan || 'basic';
  const isStandard = plan === 'standard' || plan === 'advanced';
  const isAdvanced = plan === 'advanced';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>EMR System</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Subscription Banner */}
        <LinearGradient colors={['#10B981', '#059669']} style={styles.subBanner}>
          <View style={styles.subBannerLeft}>
            <Text style={styles.subBannerIcon}>👑</Text>
            <View>
              <Text style={styles.subBannerTitle}>EMR {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan</Text>
              <Text style={styles.subBannerClinic}>{user?.clinicId?.name || 'Your Clinic'}</Text>
            </View>
          </View>
          <View style={styles.subBannerRight}>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>✓ Active</Text>
            </View>
            <Text style={styles.expiryText}>
              Expires: {new Date(subscription.expiryDate).toLocaleDateString()}
            </Text>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="👥" value={stats.patients} label="Patients" gradient={['#3B82F6', '#1D4ED8']} />
          <StatCard icon="💊" value={stats.prescriptions} label="Prescriptions" gradient={['#F59E0B', '#D97706']} />
          <StatCard icon="📅" value={stats.visitsToday} label="Visits Today" gradient={['#10B981', '#059669']} />
          <StatCard icon="📄" value={stats.daysRemaining} label="Days Left" gradient={['#8B5CF6', '#6D28D9']} />
        </View>

        {/* Recent Patients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Patients</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Patients')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {emrPatients.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.emptyIcon}>👤</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No patients registered yet</Text>
            </Card>
          ) : (
            emrPatients.slice(0, 5).map((patient, index) => (
              <TouchableOpacity 
                key={patient._id || index}
                style={[styles.patientItem, { backgroundColor: colors.surface }]}
                onPress={() => navigation.navigate('DoctorPatientDetail', { patientId: patient._id })}
              >
                <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.patientAvatar}>
                  <Text style={styles.patientInitial}>{patient.name?.charAt(0) || 'P'}</Text>
                </LinearGradient>
                <View style={styles.patientInfo}>
                  <Text style={[styles.patientName, { color: colors.textPrimary }]}>{patient.name}</Text>
                  <Text style={[styles.patientPhone, { color: colors.textSecondary }]}>{patient.phone || patient.email}</Text>
                </View>
                <View style={[styles.genderBadge, { backgroundColor: colors.background }]}>
                  <Text style={[styles.genderText, { color: colors.textSecondary }]}>{patient.gender || '-'}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Prescriptions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Prescriptions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('DoctorPrescriptions')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {emrPrescriptions.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No prescriptions yet</Text>
            </Card>
          ) : (
            emrPrescriptions.slice(0, 5).map((rx, index) => (
              <Card key={rx._id || index} style={[styles.rxCard, { backgroundColor: colors.surface }]}>
                <View style={styles.rxHeader}>
                  <Text style={[styles.rxPatient, { color: colors.textPrimary }]}>{rx.patientId?.name || 'Unknown Patient'}</Text>
                  <Text style={[styles.rxDate, { color: colors.textSecondary }]}>
                    {new Date(rx.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.rxDiagnosis, { color: colors.textSecondary }]}>{rx.diagnosis || 'No diagnosis'}</Text>
                <View style={styles.rxBadges}>
                  <View style={[styles.rxBadge, { backgroundColor: '#3B82F620' }]}>
                    <Text style={[styles.rxBadgeText, { color: '#3B82F6' }]}>{rx.medicines?.length || 0} medicines</Text>
                  </View>
                  {rx.followUpDate && (
                    <View style={[styles.rxBadge, { backgroundColor: '#F59E0B20' }]}>
                      <Text style={[styles.rxBadgeText, { color: '#F59E0B' }]}>
                        Follow-up: {new Date(rx.followUpDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            ))
          )}
        </View>

        {/* EMR Features */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Available EMR Features</Text>
          <View style={styles.featuresGrid}>
            <FeatureItem 
              icon="👤" 
              label="Patient Registration" 
              description="Register walk-in patients"
              available={true}
              onPress={() => navigation.navigate('Patients')}
            />
            <FeatureItem 
              icon="💊" 
              label="Prescriptions" 
              description="Create digital prescriptions"
              available={true}
              onPress={() => navigation.navigate('DoctorCreatePrescription')}
            />
            <FeatureItem 
              icon="📜" 
              label="Visit History" 
              description="Track patient visits"
              available={isStandard}
            />
            <FeatureItem 
              icon="📝" 
              label="Doctor Notes" 
              description="Add clinical notes"
              available={isStandard}
            />
            <FeatureItem 
              icon="📊" 
              label="Analytics" 
              description="View clinic analytics"
              available={isAdvanced}
            />
            <FeatureItem 
              icon="📤" 
              label="Data Export" 
              description="Export patient data"
              available={isAdvanced}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, ...typography.bodyMedium },
  scrollContent: { paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20 },
  headerTitle: { ...typography.headlineSmall, fontWeight: '700' },
  
  // No subscription
  noSubCard: { margin: spacing.xl, padding: spacing.xxl, borderRadius: borderRadius.xl, alignItems: 'center' },
  lockIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  lockEmoji: { fontSize: 36 },
  noSubTitle: { ...typography.headlineSmall, fontWeight: '700', marginBottom: spacing.sm },
  noSubDesc: { ...typography.bodyMedium, textAlign: 'center', marginBottom: spacing.lg },
  infoBox: { flexDirection: 'row', padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  infoIcon: { fontSize: 16, marginRight: spacing.sm },
  infoText: { ...typography.bodySmall, flex: 1 },

  // Subscription banner
  subBanner: { marginHorizontal: spacing.xl, padding: spacing.lg, borderRadius: borderRadius.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subBannerLeft: { flexDirection: 'row', alignItems: 'center' },
  subBannerIcon: { fontSize: 24, marginRight: spacing.md },
  subBannerTitle: { color: '#fff', ...typography.bodyLarge, fontWeight: '700' },
  subBannerClinic: { color: 'rgba(255,255,255,0.8)', ...typography.bodySmall },
  subBannerRight: { alignItems: 'flex-end' },
  activeBadge: { backgroundColor: '#fff', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  activeBadgeText: { color: '#10B981', ...typography.labelSmall, fontWeight: '700' },
  expiryText: { color: 'rgba(255,255,255,0.8)', ...typography.labelSmall, marginTop: spacing.xs },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xl, marginTop: spacing.lg, gap: spacing.md },
  statCard: { width: '47%', backgroundColor: '#fff', padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  statGradient: { width: 50, height: 50, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statIcon: { fontSize: 24 },
  statValue: { ...typography.headlineMedium, fontWeight: '700' },
  statLabel: { ...typography.labelSmall },

  // Sections
  section: { marginTop: spacing.xxl, paddingHorizontal: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { ...typography.headlineSmall, fontWeight: '600' },
  seeAll: { color: '#6C5CE7', ...typography.labelMedium },

  // Empty state
  emptyCard: { padding: spacing.xxl, borderRadius: borderRadius.lg, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },

  // Patient item
  patientItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  patientAvatar: { width: 40, height: 40, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  patientInitial: { color: '#fff', ...typography.bodyLarge, fontWeight: '700' },
  patientInfo: { flex: 1 },
  patientName: { ...typography.bodyMedium, fontWeight: '600' },
  patientPhone: { ...typography.labelSmall },
  genderBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  genderText: { ...typography.labelSmall },

  // Prescription card
  rxCard: { padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  rxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  rxPatient: { ...typography.bodyMedium, fontWeight: '600' },
  rxDate: { ...typography.labelSmall },
  rxDiagnosis: { ...typography.bodySmall, marginBottom: spacing.sm },
  rxBadges: { flexDirection: 'row', gap: spacing.sm },
  rxBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  rxBadgeText: { ...typography.labelSmall, fontWeight: '600' },

  // Features
  featuresGrid: { gap: spacing.sm },
  featureItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg },
  featureIcon: { fontSize: 24, marginRight: spacing.md },
  featureInfo: { flex: 1 },
  featureLabel: { ...typography.bodyMedium, fontWeight: '600' },
  featureDesc: { ...typography.labelSmall },
  upgradeBadge: { backgroundColor: '#6B728020', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  upgradeBadgeText: { color: '#6B7280', ...typography.labelSmall, fontWeight: '600' },
});

export default DoctorEMRScreen;
