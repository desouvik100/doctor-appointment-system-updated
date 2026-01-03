/**
 * Health Reports Screen - View lab reports and health analytics
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../services/api/apiClient';

const HealthReportsScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    lastCheckup: null,
  });

  const userId = user?.id || user?._id;

  const fetchData = useCallback(async () => {
    if (!userId) return;

    try {
      // Fetch lab reports
      const reportsRes = await apiClient.get(`/lab-reports/patient/${userId}`).catch(() => ({ data: { reports: [] } }));
      
      // Fetch vitals history
      const vitalsRes = await apiClient.get(`/emr/patients/${userId}/vitals/trends`).catch(() => ({ data: { data: [] } }));
      
      // Fetch prescriptions for additional health data
      const prescriptionsRes = await apiClient.get(`/prescriptions/patient/${userId}`).catch(() => ({ data: [] }));

      const reportsList = reportsRes.data?.reports || reportsRes.data || [];
      const vitalsList = vitalsRes.data?.data || vitalsRes.data?.vitals || [];

      setReports(reportsList);
      setVitals(vitalsList);
      setStats({
        totalReports: reportsList.length,
        pendingReports: reportsList.filter(r => r.status === 'pending').length,
        lastCheckup: reportsList[0]?.createdAt || null,
      });
    } catch (error) {
      console.error('Error fetching health data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'normal': return colors.success;
      case 'pending': return colors.warning;
      case 'abnormal': return colors.error;
      default: return colors.textMuted;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleViewReport = (report) => {
    if (report.pdfUrl) {
      Linking.openURL(report.pdfUrl);
    } else {
      navigation.navigate('ReportDetails', { report });
    }
  };

  const renderReportCard = ({ item }) => (
    <TouchableOpacity onPress={() => handleViewReport(item)}>
      <Card variant="default" style={[styles.reportCard, { backgroundColor: colors.surface }]}>
        <View style={styles.reportHeader}>
          <View style={[styles.reportIcon, { backgroundColor: `${colors.primary}20` }]}>
            <Icon name="document-text" size={24} color={colors.primary} />
          </View>
          <View style={styles.reportInfo}>
            <Text style={[styles.reportTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.testName || item.name || 'Lab Report'}
            </Text>
            <Text style={[styles.reportDate, { color: colors.textMuted }]}>
              {formatDate(item.createdAt || item.date)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status || 'Completed'}
            </Text>
          </View>
        </View>
        
        {item.labName && (
          <Text style={[styles.labName, { color: colors.textSecondary }]}>
            🏥 {item.labName}
          </Text>
        )}
        
        <View style={styles.reportFooter}>
          <Text style={[styles.viewReport, { color: colors.primary }]}>View Report →</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderVitalCard = ({ item }) => (
    <Card variant="default" style={[styles.vitalCard, { backgroundColor: colors.surface }]}>
      <Text style={styles.vitalIcon}>{item.icon || '❤️'}</Text>
      <Text style={[styles.vitalLabel, { color: colors.textSecondary }]}>{item.type || item.name}</Text>
      <Text style={[styles.vitalValue, { color: colors.textPrimary }]}>{item.value || '--'}</Text>
      <Text style={[styles.vitalUnit, { color: colors.textMuted }]}>{item.unit || ''}</Text>
      <Text style={[styles.vitalDate, { color: colors.textMuted }]}>{formatDate(item.recordedAt || item.date)}</Text>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading health data...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Icon name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Health Reports</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MedicalImaging')}>
          <Icon name="scan" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Stats Banner */}
        <LinearGradient
          colors={['#10b981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsBanner}
        >
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalReports}</Text>
              <Text style={styles.statLabel}>Total Reports</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.pendingReports}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.lastCheckup ? formatDate(stats.lastCheckup).split(' ')[0] : '--'}</Text>
              <Text style={styles.statLabel}>Last Checkup</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reports' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('reports')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'reports' ? '#fff' : colors.textSecondary }]}>
              Lab Reports
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'vitals' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('vitals')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'vitals' ? '#fff' : colors.textSecondary }]}>
              Vitals History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'reports' ? (
          reports.length > 0 ? (
            reports.map((report, index) => (
              <View key={report._id || index}>
                {renderReportCard({ item: report })}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Reports Yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                Your lab reports will appear here after your tests
              </Text>
              <TouchableOpacity
                style={[styles.bookBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('LabTests')}
              >
                <Text style={styles.bookBtnText}>Book Lab Test</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          vitals.length > 0 ? (
            <View style={styles.vitalsGrid}>
              {vitals.map((vital, index) => (
                <View key={vital._id || index} style={styles.vitalGridItem}>
                  {renderVitalCard({ item: vital })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>❤️</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Vitals Recorded</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                Your vital signs history will appear here
              </Text>
            </View>
          )
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('LabTests')}
            >
              <Text style={styles.actionIcon}>🧪</Text>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Book Test</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('MedicalImaging')}
            >
              <Text style={styles.actionIcon}>🔬</Text>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Imaging</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Records')}
            >
              <Text style={styles.actionIcon}>📁</Text>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>All Records</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.bodyMedium, marginTop: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  backBtn: { width: 40, height: 40, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.headlineMedium },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  statsBanner: { borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statValue: { ...typography.headlineMedium, color: '#fff' },
  statLabel: { ...typography.labelSmall, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },
  tabs: { flexDirection: 'row', marginBottom: spacing.lg, gap: spacing.sm },
  tab: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', backgroundColor: 'transparent' },
  tabText: { ...typography.labelMedium, fontWeight: '600' },
  reportCard: { padding: spacing.lg, marginBottom: spacing.md },
  reportHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  reportIcon: { width: 48, height: 48, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  reportInfo: { flex: 1 },
  reportTitle: { ...typography.bodyLarge, fontWeight: '600' },
  reportDate: { ...typography.labelSmall, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  statusText: { ...typography.labelSmall, fontWeight: '600' },
  labName: { ...typography.bodySmall, marginBottom: spacing.sm },
  reportFooter: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: spacing.sm, marginTop: spacing.sm },
  viewReport: { ...typography.labelMedium, fontWeight: '600' },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  vitalGridItem: { width: '48%' },
  vitalCard: { padding: spacing.lg, alignItems: 'center' },
  vitalIcon: { fontSize: 28, marginBottom: spacing.xs },
  vitalLabel: { ...typography.labelSmall },
  vitalValue: { ...typography.headlineMedium, marginVertical: spacing.xs },
  vitalUnit: { ...typography.labelSmall },
  vitalDate: { ...typography.labelSmall, marginTop: spacing.xs },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 64, marginBottom: spacing.lg },
  emptyTitle: { ...typography.headlineSmall, marginBottom: spacing.sm },
  emptyDesc: { ...typography.bodyMedium, textAlign: 'center', marginBottom: spacing.lg },
  bookBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full },
  bookBtnText: { ...typography.button, color: '#fff' },
  quickActions: { marginTop: spacing.xl },
  sectionTitle: { ...typography.headlineSmall, marginBottom: spacing.lg },
  actionsRow: { flexDirection: 'row', gap: spacing.md },
  actionBtn: { flex: 1, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  actionIcon: { fontSize: 28, marginBottom: spacing.xs },
  actionLabel: { ...typography.labelMedium },
});

export default HealthReportsScreen;
