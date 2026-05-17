/**
 * Staff Daily Summary Screen
 * End-of-day report: total patients, status breakdown, doctor-wise stats
 * Shareable as text
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Share, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import staffApi from '../../services/api/staffDashboardApi';

const StaffDailySummaryScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);

  const buildSummary = (appointments) => {
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const pending = appointments.filter(a => ['pending', 'confirmed', 'scheduled'].includes(a.status)).length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;
    const checkedIn = appointments.filter(a => a.status === 'checked-in' || a.checkedIn).length;

    // Doctor-wise breakdown
    const doctorMap = {};
    appointments.forEach(a => {
      const name = a.doctorId?.name || a.doctor?.name || 'Unknown';
      if (!doctorMap[name]) doctorMap[name] = { total: 0, completed: 0, pending: 0 };
      doctorMap[name].total++;
      if (a.status === 'completed') doctorMap[name].completed++;
      if (['pending', 'confirmed', 'scheduled'].includes(a.status)) doctorMap[name].pending++;
    });

    return { total, completed, pending, cancelled, checkedIn, doctors: Object.entries(doctorMap) };
  };

  const fetchSummary = useCallback(async () => {
    if (!user?.clinicId) return;
    try {
      const data = await staffApi.getDailySummary(user.clinicId);
      const appointments = Array.isArray(data) ? data : data?.appointments || [];
      setSummary(buildSummary(appointments));
    } catch (err) {
      console.log('Daily summary error:', err.message);
      setSummary({ total: 0, completed: 0, pending: 0, cancelled: 0, checkedIn: 0, doctors: [] });
    } finally {
      setLoading(false);
    }
  }, [user?.clinicId]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSummary();
    setRefreshing(false);
  }, [fetchSummary]);

  const handleShare = async () => {
    if (!summary) return;
    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const doctorLines = summary.doctors.map(([name, d]) =>
      `  Dr. ${name}: ${d.total} total, ${d.completed} done, ${d.pending} pending`
    ).join('\n');

    const text = [
      '━━━━━━━━━━━━━━━━━━━━━━',
      '   HEALTHSYNC PRO',
      '   Daily Summary Report',
      '━━━━━━━━━━━━━━━━━━━━━━',
      `Date: ${today}`,
      '──────────────────────',
      `Total Appointments : ${summary.total}`,
      `Completed          : ${summary.completed}`,
      `Checked In         : ${summary.checkedIn}`,
      `Pending            : ${summary.pending}`,
      `Cancelled          : ${summary.cancelled}`,
      '──────────────────────',
      'Doctor-wise:',
      doctorLines || '  No data',
      '━━━━━━━━━━━━━━━━━━━━━━',
    ].join('\n');

    try {
      await Share.share({ message: text, title: 'Daily Summary' });
    } catch (err) {}
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const STATS = [
    { label: 'Total', value: summary?.total || 0, color: '#4FACFE', icon: '📅' },
    { label: 'Completed', value: summary?.completed || 0, color: '#10B981', icon: '✅' },
    { label: 'Pending', value: summary?.pending || 0, color: '#F59E0B', icon: '⏳' },
    { label: 'Cancelled', value: summary?.cancelled || 0, color: '#EF4444', icon: '❌' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Daily Summary</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B6B" />}
      >
        {/* Date Banner */}
        <LinearGradient colors={['#A18CD1', '#FBC2EB']} style={styles.dateBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.dateBannerLabel}>TODAY'S REPORT</Text>
          <Text style={styles.dateBannerDate}>{today}</Text>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {STATS.map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.statIconBg, { backgroundColor: s.color + '20' }]}>
                <Text style={styles.statIcon}>{s.icon}</Text>
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Checked In */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>🏥</Text>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Patients Checked In</Text>
            <Text style={[styles.cardValue, { color: '#6C5CE7' }]}>{summary?.checkedIn || 0}</Text>
          </View>
        </View>

        {/* Doctor-wise Breakdown */}
        {summary?.doctors?.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Doctor-wise Breakdown</Text>
            {summary.doctors.map(([name, d], i) => (
              <View key={i} style={[styles.doctorRow, i < summary.doctors.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#2E364920' }]}>
                <View style={styles.doctorLeft}>
                  <Text style={styles.doctorAvatar}>{name.charAt(0)}</Text>
                  <Text style={[styles.doctorName, { color: colors.textPrimary }]}>Dr. {name}</Text>
                </View>
                <View style={styles.doctorStats}>
                  <Pill label={`${d.total} total`} color="#4FACFE" />
                  <Pill label={`${d.completed} done`} color="#10B981" />
                  {d.pending > 0 && <Pill label={`${d.pending} pending`} color="#F59E0B" />}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Share Button */}
        <TouchableOpacity style={styles.shareFullBtn} onPress={handleShare} activeOpacity={0.85}>
          <LinearGradient colors={['#A18CD1', '#FBC2EB']} style={styles.shareFullGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.shareFullText}>📤  Share Report</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const Pill = ({ label, color }) => (
  <View style={[styles.pill, { backgroundColor: color + '20' }]}>
    <Text style={[styles.pillText, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22 },
  headerTitle: { flex: 1, ...typography.headlineMedium, textAlign: 'center' },
  shareBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  shareIcon: { fontSize: 22 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  dateBanner: { borderRadius: borderRadius.xxl, padding: spacing.xxl, alignItems: 'center', marginBottom: spacing.xl },
  dateBannerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: spacing.xs },
  dateBannerDate: { color: '#fff', fontSize: 20, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  statCard: { width: '47%', padding: spacing.lg, borderRadius: borderRadius.xl, alignItems: 'center' },
  statIconBg: { width: 40, height: 40, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statIcon: { fontSize: 20 },
  statValue: { ...typography.displaySmall, fontWeight: '800' },
  statLabel: { ...typography.labelSmall, marginTop: 2 },
  card: { borderRadius: borderRadius.xl, marginBottom: spacing.lg, padding: spacing.lg },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { fontSize: 20, marginRight: spacing.md },
  cardLabel: { flex: 1, ...typography.bodyMedium },
  cardValue: { ...typography.headlineSmall, fontWeight: '700' },
  sectionCard: { borderRadius: borderRadius.xl, marginBottom: spacing.lg, overflow: 'hidden' },
  sectionTitle: { ...typography.bodyMedium, fontWeight: '700', padding: spacing.lg, paddingBottom: spacing.sm },
  doctorRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexWrap: 'wrap', gap: spacing.sm },
  doctorLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 120 },
  doctorAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FF6B6B20', textAlign: 'center', lineHeight: 32, fontSize: 14, fontWeight: '700', color: '#FF6B6B', marginRight: spacing.sm },
  doctorName: { ...typography.bodySmall, fontWeight: '600' },
  doctorStats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  pillText: { fontSize: 11, fontWeight: '600' },
  shareFullBtn: { borderRadius: borderRadius.xl, overflow: 'hidden', marginTop: spacing.md },
  shareFullGradient: { paddingVertical: spacing.xl, alignItems: 'center' },
  shareFullText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default StaffDailySummaryScreen;
