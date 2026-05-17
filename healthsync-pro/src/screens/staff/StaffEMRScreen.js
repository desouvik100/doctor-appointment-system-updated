/**
 * Staff EMR Screen — Enterprise EMR Hub
 * Full feature parity with web EMR: vitals, prescriptions, lab orders,
 * medical history, patient timeline, analytics, visit management
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { getEMRSubscription, getEMRDashboardStats, getEMRPatients } from '../../services/api/emrApi';

const EMR_MODULES = [
  { id: 'visit',     icon: '🏥', label: 'New Visit',       desc: 'Start clinical visit',      gradient: ['#0F766E', '#0D9488'], screen: 'EMRVisit' },
  { id: 'vitals',    icon: '📊', label: 'Record Vitals',   desc: 'BP, pulse, temp, SpO2',     gradient: ['#7C3AED', '#4F46E5'], screen: 'EMRVitals' },
  { id: 'rx',        icon: '💊', label: 'E-Prescribe',     desc: 'Drug search + interactions',gradient: ['#059669', '#047857'], screen: 'EMRPrescription' },
  { id: 'lab',       icon: '🧪', label: 'Lab Orders',      desc: 'Tests, panels, urgency',    gradient: ['#7C3AED', '#6D28D9'], screen: 'EMRLabOrder' },
  { id: 'history',   icon: '📋', label: 'Medical History', desc: 'Allergies, conditions',     gradient: ['#DC2626', '#B91C1C'], screen: 'EMRMedicalHistory' },
  { id: 'timeline',  icon: '📅', label: 'Timeline',        desc: 'Full patient history',      gradient: ['#0F172A', '#1E293B'], screen: 'EMRTimeline' },
  { id: 'analytics', icon: '📈', label: 'Analytics',       desc: 'Clinic stats & trends',     gradient: ['#1E40AF', '#1D4ED8'], screen: 'EMRAnalytics' },
  { id: 'visits',    icon: '📁', label: 'Visit History',   desc: 'All patient visits',        gradient: ['#92400E', '#B45309'], screen: 'EMRVisitHistory' },
  { id: 'pharmacy',  icon: '🏪', label: 'Pharmacy',        desc: 'Drug stock & inventory',    gradient: ['#0369A1', '#0284C7'], screen: 'PharmacyInventory' },
];

const StaffEMRScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(0);

  const getClinicId = () => {
    if (!user?.clinicId) return null;
    return typeof user.clinicId === 'object' ? user.clinicId._id : user.clinicId;
  };

  const fetchData = useCallback(async () => {
    const clinicId = getClinicId();
    if (!clinicId) { setLoading(false); return; }
    try {
      const [subData, statsData, patientsData] = await Promise.allSettled([
        getEMRSubscription(clinicId),
        getEMRDashboardStats(clinicId),
        getEMRPatients(clinicId),
      ]);
      if (subData.status === 'fulfilled' && subData.value.subscription) {
        setSubscription(subData.value.subscription);
        const exp = new Date(subData.value.subscription.expiryDate);
        setDaysRemaining(Math.max(0, Math.ceil((exp - Date.now()) / 86400000)));
      }
      if (statsData.status === 'fulfilled') setStats(statsData.value.stats);
      if (patientsData.status === 'fulfilled') setPatients(patientsData.value.patients || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.clinicId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);

  const clinicId = getClinicId();
  const clinicName = typeof user?.clinicId === 'object' ? user.clinicId.name : 'Your Clinic';

  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone?.includes(searchQuery) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navigateToModule = (module) => {
    if (!subscription) {
      Alert.alert('EMR Not Active', 'EMR subscription is required. Contact your administrator.');
      return;
    }
    const params = { clinicId };
    if (selectedPatient) {
      params.patientId = selectedPatient._id;
      params.patientName = selectedPatient.name;
    }
    navigation.navigate(module.screen, params);
  };

  const navigateWithPatient = (module, patient) => {
    if (!subscription) {
      Alert.alert('EMR Not Active', 'EMR subscription is required.');
      return;
    }
    navigation.navigate(module.screen, {
      clinicId,
      patientId: patient._id,
      patientName: patient.name,
    });
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading EMR...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
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
            <View style={styles.subLeft}>
              <Text style={styles.subIcon}>📋</Text>
              <View>
                <Text style={styles.subTitle}>EMR Active — {subscription.plan?.toUpperCase() || 'ADVANCED'} Plan</Text>
                <Text style={styles.subClinic}>{clinicName}</Text>
              </View>
            </View>
            <View style={styles.subBadge}>
              <Text style={styles.subBadgeText}>{daysRemaining}d left</Text>
            </View>
          </LinearGradient>
        ) : (
          <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.subBanner}>
            <Text style={styles.subIcon}>🔒</Text>
            <Text style={styles.subTitle}>EMR Not Active — Contact Admin</Text>
          </LinearGradient>
        )}

        {/* Stats Row */}
        {stats && (
          <View style={styles.statsRow}>
            {[
              { icon: '🏥', val: stats.todayVisits,     label: "Today's Visits" },
              { icon: '✅', val: stats.completedToday,  label: 'Completed' },
              { icon: '⏳', val: stats.waitingPatients, label: 'Waiting' },
              { icon: '👥', val: stats.totalPatients,   label: 'Total Patients' },
            ].map((s, i) => (
              <View key={i} style={[styles.statItem, { backgroundColor: colors.surface }]}>
                <Text style={styles.statItemIcon}>{s.icon}</Text>
                <Text style={[styles.statItemVal, { color: colors.textPrimary }]}>{s.val ?? '—'}</Text>
                <Text style={[styles.statItemLabel, { color: colors.textMuted }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Patient Context Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {selectedPatient ? `Patient: ${selectedPatient.name}` : 'Select Patient (Optional)'}
          </Text>
          {selectedPatient ? (
            <View style={[styles.selectedPatientCard, { backgroundColor: colors.surface }]}>
              <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.patientAvatar}>
                <Text style={styles.patientInitial}>{selectedPatient.name?.charAt(0)}</Text>
              </LinearGradient>
              <View style={styles.patientInfo}>
                <Text style={[styles.patientName, { color: colors.textPrimary }]}>{selectedPatient.name}</Text>
                <Text style={[styles.patientPhone, { color: colors.textSecondary }]}>{selectedPatient.phone || selectedPatient.email}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedPatient(null)} style={styles.clearPatient}>
                <Text style={styles.clearPatientText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={[styles.searchInput, { color: colors.textPrimary }]}
                  placeholder="Search patient by name or phone..."
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
              {searchQuery.length > 0 && filteredPatients.slice(0, 5).map(p => (
                <TouchableOpacity key={p._id} onPress={() => { setSelectedPatient(p); setSearchQuery(''); }}
                  style={[styles.patientResult, { backgroundColor: colors.surface }]}>
                  <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.patientResultAvatar}>
                    <Text style={styles.patientInitial}>{p.name?.charAt(0)}</Text>
                  </LinearGradient>
                  <View style={styles.patientInfo}>
                    <Text style={[styles.patientName, { color: colors.textPrimary }]}>{p.name}</Text>
                    <Text style={[styles.patientPhone, { color: colors.textSecondary }]}>{p.phone || p.email}</Text>
                  </View>
                  <Text style={[styles.selectText, { color: colors.primary }]}>Select →</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        {/* EMR Modules Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>EMR Modules</Text>
          <View style={styles.modulesGrid}>
            {EMR_MODULES.map(mod => (
              <TouchableOpacity key={mod.id} onPress={() => navigateToModule(mod)}
                style={styles.moduleCard} activeOpacity={0.8}>
                <LinearGradient colors={mod.gradient} style={styles.moduleGradient}>
                  <Text style={styles.moduleIcon}>{mod.icon}</Text>
                  <Text style={styles.moduleLabel}>{mod.label}</Text>
                  <Text style={styles.moduleDesc}>{mod.desc}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Patient Quick Access */}
        {patients.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Patients</Text>
            {patients.slice(0, 5).map(p => (
              <View key={p._id} style={[styles.patientRow, { backgroundColor: colors.surface }]}>
                <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.patientAvatar}>
                  <Text style={styles.patientInitial}>{p.name?.charAt(0)}</Text>
                </LinearGradient>
                <View style={styles.patientInfo}>
                  <Text style={[styles.patientName, { color: colors.textPrimary }]}>{p.name}</Text>
                  <Text style={[styles.patientPhone, { color: colors.textSecondary }]}>{p.phone || p.email}</Text>
                </View>
                <View style={styles.patientActions}>
                  <TouchableOpacity onPress={() => navigateWithPatient({ screen: 'EMRTimeline' }, p)}
                    style={[styles.patientActionBtn, { backgroundColor: '#3B82F620' }]}>
                    <Text style={[styles.patientActionText, { color: '#3B82F6' }]}>Timeline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigateWithPatient({ screen: 'EMRVisit' }, p)}
                    style={[styles.patientActionBtn, { backgroundColor: '#10B98120' }]}>
                    <Text style={[styles.patientActionText, { color: '#10B981' }]}>Visit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {patients.length > 5 && (
              <TouchableOpacity onPress={() => navigation.navigate('StaffPatients')}
                style={[styles.viewAllBtn, { borderColor: colors.primary }]}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>View All Patients ({patients.length})</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, ...typography.bodyMedium },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20 },
  headerTitle: { ...typography.headlineSmall, fontWeight: '700' },
  subBanner: { padding: spacing.lg, borderRadius: borderRadius.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  subLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  subIcon: { fontSize: 24, marginRight: spacing.md },
  subTitle: { color: '#fff', ...typography.bodyMedium, fontWeight: '700' },
  subClinic: { color: 'rgba(255,255,255,0.8)', ...typography.labelSmall },
  subBadge: { backgroundColor: '#fff', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  subBadgeText: { color: '#10B981', ...typography.labelSmall, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statItem: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center' },
  statItemIcon: { fontSize: 18, marginBottom: 2 },
  statItemVal: { ...typography.headlineSmall, fontWeight: '700' },
  statItemLabel: { ...typography.labelSmall, textAlign: 'center' },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.bodyLarge, fontWeight: '700', marginBottom: spacing.md },
  selectedPatientCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.xl },
  patientAvatar: { width: 44, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  patientResultAvatar: { width: 36, height: 36, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  patientInitial: { color: '#fff', ...typography.bodyMedium, fontWeight: '700' },
  patientInfo: { flex: 1 },
  patientName: { ...typography.bodyMedium, fontWeight: '600' },
  patientPhone: { ...typography.labelSmall },
  clearPatient: { padding: spacing.sm },
  clearPatientText: { color: '#EF4444', fontSize: 18, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  searchInput: { flex: 1, paddingVertical: spacing.md, ...typography.bodyMedium },
  clearIcon: { fontSize: 16, padding: spacing.xs },
  patientResult: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.xs },
  selectText: { ...typography.labelSmall, fontWeight: '600' },
  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  moduleCard: { width: '47%', borderRadius: borderRadius.xl, overflow: 'hidden' },
  moduleGradient: { padding: spacing.lg, minHeight: 100, justifyContent: 'center' },
  moduleIcon: { fontSize: 28, marginBottom: spacing.xs },
  moduleLabel: { color: '#fff', ...typography.bodyMedium, fontWeight: '700' },
  moduleDesc: { color: 'rgba(255,255,255,0.75)', ...typography.labelSmall, marginTop: 2 },
  patientRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  patientActions: { flexDirection: 'row', gap: spacing.xs },
  patientActionBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  patientActionText: { ...typography.labelSmall, fontWeight: '600' },
  viewAllBtn: { paddingVertical: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, alignItems: 'center', marginTop: spacing.sm },
  viewAllText: { ...typography.labelMedium, fontWeight: '600' },
});

export default StaffEMRScreen;
