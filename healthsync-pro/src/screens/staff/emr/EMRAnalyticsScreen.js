/**
 * EMR Analytics Screen — Clinic analytics: visits, patients, revenue trends
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { getAnalyticsOverview, getVisitTrends, getPatientStats, getRevenueStats } from '../../../services/api/emrApi';

const PERIODS = [
  { label: '7D', days: 7 }, { label: '30D', days: 30 },
  { label: '90D', days: 90 }, { label: '1Y', days: 365 },
];

const StatCard = ({ icon, label, value, sub, gradient, colors }) => (
  <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
    <LinearGradient colors={gradient} style={styles.statIconBg}>
      <Text style={styles.statIcon}>{icon}</Text>
    </LinearGradient>
    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value ?? '—'}</Text>
    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    {sub && <Text style={[styles.statSub, { color: colors.textMuted }]}>{sub}</Text>}
  </View>
);

const MiniBar = ({ value, max, color }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
};

const EMRAnalyticsScreen = ({ navigation, route }) => {
  const { clinicId } = route.params || {};
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [patientStats, setPatientStats] = useState(null);
  const [revenue, setRevenue] = useState(null);

  const fetchAll = useCallback(async () => {
    const end = new Date();
    const start = new Date(Date.now() - period * 86400000);
    const params = { startDate: start.toISOString(), endDate: end.toISOString() };
    try {
      const [ov, tr, ps, rv] = await Promise.allSettled([
        getAnalyticsOverview(clinicId, params),
        getVisitTrends(clinicId, params),
        getPatientStats(clinicId, params),
        getRevenueStats(clinicId, params),
      ]);
      if (ov.status === 'fulfilled') setOverview(ov.value.stats);
      if (tr.status === 'fulfilled') setTrends(tr.value.trends || []);
      if (ps.status === 'fulfilled') setPatientStats(ps.value.stats);
      if (rv.status === 'fulfilled') setRevenue(rv.value.stats);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [clinicId, period]);

  useEffect(() => { setLoading(true); fetchAll(); }, [fetchAll]);

  const maxTrend = Math.max(...trends.map(t => t.count || 0), 1);
  const hasAnyData = overview || trends.length > 0 || patientStats || revenue;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#1E40AF', '#1D4ED8']} style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clinic Analytics</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Period selector */}
      <View style={[styles.periodRow, { backgroundColor: colors.surface }]}>
        {PERIODS.map(p => (
          <TouchableOpacity key={p.days} onPress={() => setPeriod(p.days)}
            style={[styles.periodBtn, period === p.days && { backgroundColor: colors.primary }]}>
            <Text style={[styles.periodText, { color: period === p.days ? '#fff' : colors.textSecondary }]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={colors.primary} />}
      >
        {!hasAnyData && (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Data Available</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              No analytics data found for this clinic in the selected period.
            </Text>
            <TouchableOpacity onPress={() => { setLoading(true); fetchAll(); }}
              style={[styles.refreshBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.refreshBtnText}>↻ Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Overview stats */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="🏥" label="Total Visits" value={overview?.totalVisits} gradient={['#3B82F6', '#1D4ED8']} colors={colors} />
          <StatCard icon="👥" label="New Patients" value={overview?.newPatients} gradient={['#10B981', '#059669']} colors={colors} />
          <StatCard icon="📈" label="Avg/Day" value={overview?.avgVisitsPerDay?.toFixed(1)} gradient={['#8B5CF6', '#6D28D9']} colors={colors} />
          <StatCard icon="💰" label="Revenue" value={revenue?.totalRevenue ? `₹${Math.round(revenue.totalRevenue).toLocaleString()}` : '—'} gradient={['#F59E0B', '#D97706']} colors={colors} />
        </View>

        {/* Visit trend chart */}
        {trends.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Visit Trends</Text>
            <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.barChart}>
                  {trends.slice(-14).map((t, i) => (
                    <View key={i} style={styles.barItem}>
                      <Text style={[styles.barValue, { color: colors.textSecondary }]}>{t.count}</Text>
                      <View style={styles.barWrapper}>
                        <View style={[styles.bar, { height: Math.max(4, (t.count / maxTrend) * 80), backgroundColor: colors.primary }]} />
                      </View>
                      <Text style={[styles.barLabel, { color: colors.textMuted }]}>{t.label?.split(' ')[0]}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </>
        )}

        {/* Patient stats */}
        {patientStats && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Patient Demographics</Text>
            <View style={[styles.demoCard, { backgroundColor: colors.surface }]}>
              <View style={styles.demoRow}>
                <Text style={[styles.demoLabel, { color: colors.textSecondary }]}>Total Patients</Text>
                <Text style={[styles.demoValue, { color: colors.textPrimary }]}>{patientStats.totalPatients}</Text>
              </View>
              <View style={styles.demoRow}>
                <Text style={[styles.demoLabel, { color: colors.textSecondary }]}>New (this period)</Text>
                <Text style={[styles.demoValue, { color: '#10B981' }]}>{patientStats.newPatients}</Text>
              </View>
              <View style={styles.demoRow}>
                <Text style={[styles.demoLabel, { color: colors.textSecondary }]}>Returning</Text>
                <Text style={[styles.demoValue, { color: '#3B82F6' }]}>{patientStats.returningPatients}</Text>
              </View>
              {patientStats.genderDistribution?.length > 0 && (
                <>
                  <Text style={[styles.subSectionTitle, { color: colors.textSecondary }]}>Gender Distribution</Text>
                  {patientStats.genderDistribution.map((g, i) => (
                    <View key={i} style={styles.distRow}>
                      <Text style={[styles.distLabel, { color: colors.textSecondary }]}>{g.gender || 'Unknown'}</Text>
                      <MiniBar value={g.count} max={patientStats.totalPatients} color={i === 0 ? '#3B82F6' : '#EC4899'} />
                      <Text style={[styles.distCount, { color: colors.textPrimary }]}>{g.count}</Text>
                    </View>
                  ))}
                </>
              )}
              {patientStats.ageDistribution?.length > 0 && (
                <>
                  <Text style={[styles.subSectionTitle, { color: colors.textSecondary }]}>Age Distribution</Text>
                  {patientStats.ageDistribution.map((a, i) => (
                    <View key={i} style={styles.distRow}>
                      <Text style={[styles.distLabel, { color: colors.textSecondary }]}>{a.range}</Text>
                      <MiniBar value={a.count} max={patientStats.totalPatients} color="#8B5CF6" />
                      <Text style={[styles.distCount, { color: colors.textPrimary }]}>{a.count}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          </>
        )}

        {/* Revenue breakdown */}
        {revenue && revenue.totalRevenue > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Revenue Breakdown</Text>
            <View style={[styles.demoCard, { backgroundColor: colors.surface }]}>
              <View style={styles.demoRow}>
                <Text style={[styles.demoLabel, { color: colors.textSecondary }]}>Total Revenue</Text>
                <Text style={[styles.demoValue, { color: '#10B981' }]}>₹{Math.round(revenue.totalRevenue).toLocaleString()}</Text>
              </View>
              <View style={styles.demoRow}>
                <Text style={[styles.demoLabel, { color: colors.textSecondary }]}>Avg/Day</Text>
                <Text style={[styles.demoValue, { color: colors.textPrimary }]}>₹{Math.round(revenue.avgRevenuePerDay).toLocaleString()}</Text>
              </View>
              <View style={styles.demoRow}>
                <Text style={[styles.demoLabel, { color: colors.textSecondary }]}>Avg/Visit</Text>
                <Text style={[styles.demoValue, { color: colors.textPrimary }]}>₹{Math.round(revenue.avgRevenuePerVisit).toLocaleString()}</Text>
              </View>
              <View style={styles.demoRow}>
                <Text style={[styles.demoLabel, { color: colors.textSecondary }]}>Transactions</Text>
                <Text style={[styles.demoValue, { color: colors.textPrimary }]}>{revenue.totalTransactions}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, ...typography.bodyMedium },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: '#fff', fontSize: 20 },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', ...typography.headlineSmall, fontWeight: '700' },
  periodRow: { flexDirection: 'row', padding: spacing.sm, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  periodBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
  periodText: { ...typography.labelMedium, fontWeight: '700' },
  scroll: { padding: spacing.xl, paddingBottom: 100 },
  sectionTitle: { ...typography.bodyMedium, fontWeight: '700', marginBottom: spacing.md, marginTop: spacing.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  statCard: { width: '47%', padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  statIconBg: { width: 44, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statIcon: { fontSize: 22 },
  statValue: { ...typography.headlineMedium, fontWeight: '700' },
  statLabel: { ...typography.labelSmall, textAlign: 'center' },
  statSub: { ...typography.labelSmall, textAlign: 'center' },
  chartCard: { borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.lg },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingBottom: spacing.sm },
  barItem: { alignItems: 'center', width: 32 },
  barValue: { ...typography.labelSmall, marginBottom: spacing.xs },
  barWrapper: { height: 80, justifyContent: 'flex-end' },
  bar: { width: 20, borderRadius: 4 },
  barLabel: { ...typography.labelSmall, marginTop: spacing.xs },
  demoCard: { borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.lg },
  demoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  demoLabel: { ...typography.bodySmall },
  demoValue: { ...typography.bodyMedium, fontWeight: '700' },
  subSectionTitle: { ...typography.labelSmall, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  distLabel: { ...typography.labelSmall, width: 60 },
  barTrack: { flex: 1, height: 8, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  distCount: { ...typography.labelSmall, fontWeight: '700', width: 30, textAlign: 'right' },
  emptyState: { borderRadius: borderRadius.xl, padding: spacing.xxl, alignItems: 'center', marginBottom: spacing.lg },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.bodyLarge, fontWeight: '700', marginBottom: spacing.sm },
  emptyDesc: { ...typography.bodySmall, textAlign: 'center', marginBottom: spacing.lg },
  refreshBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full },
  refreshBtnText: { color: '#fff', ...typography.labelMedium, fontWeight: '700' },
});

export default EMRAnalyticsScreen;
