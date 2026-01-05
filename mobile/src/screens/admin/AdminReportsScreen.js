/**
 * Admin Reports Screen - Analytics & Reports
 * 100% Parity with Web Admin
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
  StatusBar,
  Dimensions,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import adminApi from '../../services/api/adminApi';

const { width } = Dimensions.get('window');

const AdminReportsScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState({});
  const [trends, setTrends] = useState([]);
  const [specStats, setSpecStats] = useState([]);
  const [demographics, setDemographics] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const [overviewData, trendsData, specData, demoData] = await Promise.all([
        adminApi.getDashboardOverview().catch(() => ({})),
        adminApi.getAppointmentTrends(30).catch(() => []),
        adminApi.getSpecializationStats().catch(() => []),
        adminApi.getPatientDemographics().catch(() => ({})),
      ]);
      setOverview(overviewData.overview || {});
      setTrends(Array.isArray(trendsData) ? trendsData : []);
      setSpecStats(Array.isArray(specData) ? specData : []);
      setDemographics(demoData);
    } catch (error) {
      console.log('Error fetching reports:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);


  const StatCard = ({ icon, value, label, color }) => (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.statIconBg, { backgroundColor: color + '20' }]}>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#F39C12" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Reports & Analytics</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F39C12" />}
      >
        {/* Overview Stats */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="👥" value={overview.totalPatients || 0} label="Patients" color="#3498DB" />
          <StatCard icon="👨‍⚕️" value={overview.totalDoctors || 0} label="Doctors" color="#9B59B6" />
          <StatCard icon="🏥" value={overview.totalClinics || 0} label="Clinics" color="#1ABC9C" />
          <StatCard icon="📅" value={overview.totalAppointments || 0} label="Appointments" color="#E74C3C" />
        </View>

        {/* Specialization Stats */}
        {specStats.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>By Specialization</Text>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              {specStats.slice(0, 5).map((spec, index) => (
                <View key={index} style={[styles.specRow, index < specStats.length - 1 && styles.specRowBorder]}>
                  <Text style={[styles.specName, { color: colors.textPrimary }]}>{spec._id || spec.specialization}</Text>
                  <Text style={[styles.specCount, { color: colors.textSecondary }]}>{spec.count} doctors</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Demographics */}
        {demographics.ageGroups && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Patient Demographics</Text>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Age Distribution</Text>
              {demographics.ageGroups.map((group, index) => (
                <View key={index} style={styles.demoRow}>
                  <Text style={[styles.demoLabel, { color: colors.textSecondary }]}>{group._id}</Text>
                  <View style={styles.demoBar}>
                    <View style={[styles.demoBarFill, { width: `${Math.min(group.percentage || 0, 100)}%` }]} />
                  </View>
                  <Text style={[styles.demoValue, { color: colors.textPrimary }]}>{group.count}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Export Data</Text>
        <View style={styles.exportButtons}>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: colors.surface }]}>
            <Text style={styles.exportIcon}>📊</Text>
            <Text style={[styles.exportLabel, { color: colors.textPrimary }]}>Appointments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: colors.surface }]}>
            <Text style={styles.exportIcon}>💰</Text>
            <Text style={[styles.exportLabel, { color: colors.textPrimary }]}>Revenue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: colors.surface }]}>
            <Text style={styles.exportIcon}>👥</Text>
            <Text style={[styles.exportLabel, { color: colors.textPrimary }]}>Users</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24 },
  headerTitle: { flex: 1, ...typography.headlineMedium, textAlign: 'center' },
  headerRight: { width: 40 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  sectionTitle: { ...typography.headlineSmall, marginTop: spacing.xl, marginBottom: spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: { width: (width - spacing.xl * 2 - spacing.md) / 2, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  statIconBg: { width: 44, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statIcon: { fontSize: 22 },
  statValue: { ...typography.headlineMedium },
  statLabel: { ...typography.labelSmall, marginTop: 2 },
  card: { padding: spacing.lg, borderRadius: borderRadius.lg },
  cardTitle: { ...typography.bodyMedium, fontWeight: '600', marginBottom: spacing.md },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  specRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  specName: { ...typography.bodyMedium },
  specCount: { ...typography.bodySmall },
  demoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  demoLabel: { width: 60, ...typography.labelSmall },
  demoBar: { flex: 1, height: 8, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 4, marginHorizontal: spacing.sm },
  demoBarFill: { height: '100%', backgroundColor: '#F39C12', borderRadius: 4 },
  demoValue: { width: 40, textAlign: 'right', ...typography.labelSmall },
  exportButtons: { flexDirection: 'row', gap: spacing.md },
  exportBtn: { flex: 1, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  exportIcon: { fontSize: 24, marginBottom: spacing.xs },
  exportLabel: { ...typography.labelSmall },
});

export default AdminReportsScreen;
