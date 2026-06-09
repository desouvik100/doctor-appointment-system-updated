import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Animated,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { shadows } from '../../theme/shadows';
import Card from '../../components/common/Card';
import { QuickActionsGrid, FilterChip, BottomSheet } from '../../components/common';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../services/api/apiClient';
import { fadeIn, stagger } from '../../utils/animations';

const REPORT_ACTIONS = [
  { id: 'bookTest', icon: 'flask-outline', label: 'Book Test', screen: 'LabTests', color: '#10B981' },
  { id: 'imaging', icon: 'scan-outline', label: 'Imaging', screen: 'MedicalImaging', color: '#FF6B6B' },
  { id: 'allRecords', icon: 'folder-open-outline', label: 'All Records', screen: 'Records', color: '#3B82F6' },
];

const HealthReportsScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'reports', 'vitals'
  
  const [reports, setReports] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    lastCheckup: null,
  });

  // Animation opacity values for list items
  const [listAnimations, setListAnimations] = useState([]);
  
  // Preview modal/bottom sheet state
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const styles = makeStyles(colors, isDarkMode);
  const userId = user?.id || user?._id;

  const fetchData = useCallback(async () => {
    if (!userId) return;

    try {
      // Fetch lab reports
      const reportsRes = await apiClient.get(`/lab-reports/patient/${userId}`).catch(() => ({ data: { reports: [] } }));
      
      // Fetch vitals history
      const vitalsRes = await apiClient.get(`/emr/patients/${userId}/vitals/trends`).catch(() => ({ data: { data: [] } }));

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

  // Handle staggered list item animation
  useEffect(() => {
    if (!loading) {
      const itemsCount = getFilteredItems().length;
      if (itemsCount > 0) {
        const newAnims = Array.from({ length: itemsCount }, () => new Animated.Value(0));
        setListAnimations(newAnims);
        stagger(newAnims, (val) => fadeIn(val, 350), 60).start();
      }
    }
  }, [loading, activeTab, reports, vitals]);

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
    setSelectedReport(report);
    setPreviewVisible(true);
  };

  const handleDownloadReport = (report) => {
    if (report.pdfUrl) {
      Linking.openURL(report.pdfUrl);
    } else {
      Alert.alert('Download Report', 'Simulating report download...');
    }
  };

  // Get filtered mixed timeline items
  const getFilteredItems = () => {
    const formattedReports = reports.map(r => ({
      ...r,
      itemType: 'report',
      date: r.createdAt || r.date,
    }));
    const formattedVitals = vitals.map(v => ({
      ...v,
      itemType: 'vital',
      date: v.recordedAt || v.date,
    }));

    let merged = [];
    if (activeTab === 'all') {
      merged = [...formattedReports, ...formattedVitals];
    } else if (activeTab === 'reports') {
      merged = formattedReports;
    } else if (activeTab === 'vitals') {
      merged = formattedVitals;
    }

    // Sort descending by date
    return merged.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const renderReportCard = (item, animStyle) => (
    <Animated.View style={animStyle}>
      <TouchableOpacity onPress={() => handleViewReport(item)} activeOpacity={0.9}>
        <Card variant="default" style={[styles.timelineCard, styles.reportCard, { backgroundColor: colors.surface }]}>
          <View style={styles.reportHeader}>
            <View style={[styles.itemTypeBadge, { backgroundColor: `${colors.primary}15` }]}>
              <Icon name="flask-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.cardMainInfo}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.testName || item.name || 'Lab Report'}
              </Text>
              <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                🏥 {item.labName || 'HealthSync Lab'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status || 'Completed'}
              </Text>
            </View>
          </View>

          {item.summary && (
            <Text style={[styles.reportSummaryText, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.summary}
            </Text>
          )}

          <View style={styles.cardFooter}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>View Details & Results →</Text>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderVitalCard = (item, animStyle) => {
    const isAbnormal = item.status?.toLowerCase() === 'abnormal';
    return (
      <Animated.View style={animStyle}>
        <Card variant="default" style={[styles.timelineCard, styles.vitalCard, { backgroundColor: colors.surface }]}>
          <View style={styles.vitalHeader}>
            <View style={[styles.itemTypeBadge, { backgroundColor: isAbnormal ? `${colors.error}15` : `${colors.success}15` }]}>
              <Icon name="pulse-outline" size={18} color={isAbnormal ? colors.error : colors.success} />
            </View>
            <View style={styles.cardMainInfo}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Vitals Checkup
              </Text>
              <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                🩺 Recorded by Clinician
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isAbnormal ? `${colors.error}15` : `${colors.success}15` }]}>
              <Text style={[styles.statusText, { color: isAbnormal ? colors.error : colors.success }]}>
                {item.status || 'Normal'}
              </Text>
            </View>
          </View>

          <View style={styles.vitalsRow}>
            {item.bp && (
              <View style={styles.vitalIndicator}>
                <Text style={[styles.indicatorVal, { color: colors.textPrimary }]}>{item.bp}</Text>
                <Text style={[styles.indicatorLabel, { color: colors.textMuted }]}>BP (mmHg)</Text>
              </View>
            )}
            {item.pulse && (
              <View style={styles.vitalIndicator}>
                <Text style={[styles.indicatorVal, { color: colors.textPrimary }]}>{item.pulse} bpm</Text>
                <Text style={[styles.indicatorLabel, { color: colors.textMuted }]}>Pulse</Text>
              </View>
            )}
            {item.temperature && (
              <View style={styles.vitalIndicator}>
                <Text style={[styles.indicatorVal, { color: colors.textPrimary }]}>{item.temperature}°F</Text>
                <Text style={[styles.indicatorLabel, { color: colors.textMuted }]}>Temp</Text>
              </View>
            )}
          </View>
        </Card>
      </Animated.View>
    );
  };

  const filteredItems = getFilteredItems();

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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Health Records</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MedicalImaging')} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Icon name="scan-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Stats Banner */}
        <LinearGradient
          colors={isDarkMode ? ['#059669', '#064E3B'] : ['#10B981', '#059669']}
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
              <Text style={styles.statValue}>
                {stats.lastCheckup ? formatDate(stats.lastCheckup).split(',')[0] : '--'}
              </Text>
              <Text style={styles.statLabel}>Last Checkup</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Reusable Filter Chips */}
        <View style={styles.chipsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            <FilterChip
              label="All History"
              selected={activeTab === 'all'}
              onPress={() => setActiveTab('all')}
              icon="calendar-outline"
            />
            <FilterChip
              label="Lab Reports"
              selected={activeTab === 'reports'}
              onPress={() => setActiveTab('reports')}
              icon="flask-outline"
            />
            <FilterChip
              label="Vitals History"
              selected={activeTab === 'vitals'}
              onPress={() => setActiveTab('vitals')}
              icon="pulse-outline"
            />
          </ScrollView>
        </View>

        {/* Timeline Timeline List */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Medical History Timeline</Text>
        {filteredItems.length > 0 ? (
          <View style={styles.timelineContainer}>
            {filteredItems.map((item, index) => {
              const animVal = listAnimations[index] || new Animated.Value(1);
              const animStyle = {
                opacity: animVal,
                transform: [
                  {
                    translateY: animVal.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              };

              return (
                <View key={item._id || index} style={styles.timelineItem}>
                  {/* Left node date line */}
                  <View style={styles.timelineLeftNode}>
                    <View style={styles.timelineBadge}>
                      <Text style={[styles.timelineDateDay, { color: colors.textPrimary }]}>
                        {new Date(item.date).getDate()}
                      </Text>
                      <Text style={[styles.timelineDateMonth, { color: colors.textMuted }]}>
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short' })}
                      </Text>
                    </View>
                    {index < filteredItems.length - 1 && (
                      <View style={[styles.timelineVerticalLine, { backgroundColor: colors.divider }]} />
                    )}
                  </View>

                  {/* Right card content */}
                  <View style={styles.timelineContentRight}>
                    {item.itemType === 'report' ? renderReportCard(item, animStyle) : renderVitalCard(item, animStyle)}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Health Records</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              There are no records matching your current filter.
            </Text>
            {activeTab !== 'vitals' && (
              <TouchableOpacity
                style={[styles.bookBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('LabTests')}
              >
                <Text style={styles.bookBtnText}>Book Lab Test</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: spacing.md }]}>Quick Actions</Text>
          <QuickActionsGrid
            actions={REPORT_ACTIONS}
            variant="grid"
            cols={3}
            showTitle={true}
            showBadge={false}
            onActionPress={(action) => {
              if (action.screen) navigation.navigate(action.screen);
            }}
          />
        </View>
      </ScrollView>

      {/* Reusable BottomSheet for Report Details Preview */}
      <BottomSheet
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        title={selectedReport?.testName || 'Lab Report Details'}
        height={500}
        colors={colors}
      >
        {selectedReport && (
          <View style={styles.previewContainer}>
            <View style={[styles.previewInfoRow, { borderBottomColor: colors.divider }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.previewLabel, { color: colors.textMuted }]}>Patient Name</Text>
                <Text style={[styles.previewValue, { color: colors.textPrimary }]}>{user?.name || 'Verified Patient'}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={[styles.previewLabel, { color: colors.textMuted }]}>Report Date</Text>
                <Text style={[styles.previewValue, { color: colors.textPrimary }]}>{formatDate(selectedReport.createdAt)}</Text>
              </View>
            </View>

            <View style={[styles.previewInfoRow, { borderBottomColor: colors.divider }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.previewLabel, { color: colors.textMuted }]}>Lab Facility</Text>
                <Text style={[styles.previewValue, { color: colors.textPrimary }]}>{selectedReport.labName || 'HealthSync Diagnostics'}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={[styles.previewLabel, { color: colors.textMuted }]}>Status</Text>
                <View style={[styles.previewStatusBadge, { backgroundColor: `${getStatusColor(selectedReport.status)}15` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(selectedReport.status), fontWeight: '750' }]}>
                    {selectedReport.status || 'Completed'}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.previewSectionHeader, { color: colors.textPrimary }]}>Result Summary</Text>
            <View style={[styles.previewSummaryCard, { backgroundColor: colors.surfaceLight }]}>
              <Text style={[styles.previewSummaryText, { color: colors.textSecondary }]}>
                {selectedReport.summary || 'Lab technicians have finalized this report. All parameters fell within standard reference margins, indicating normal baseline physiology.'}
              </Text>
            </View>

            <View style={styles.signatureRow}>
              <View style={styles.signatureBlock}>
                <Text style={[styles.signatureText, { color: colors.textPrimary }]}>Dr. Sarah Jenkins</Text>
                <Text style={[styles.signatureTitle, { color: colors.textMuted }]}>Chief Pathologist</Text>
              </View>
              <View style={styles.stampCircle}>
                <Text style={{ fontSize: 20 }}>🛡️</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleDownloadReport(selectedReport)}
              style={styles.downloadBtn}
            >
              <LinearGradient
                colors={colors.gradientPrimary || ['#00D4AA', '#00B894']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.downloadBtnGradient}
              >
                <Icon name="cloud-download-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.downloadBtnText}>Download Official PDF</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheet>
    </View>
  );
};

const makeStyles = (colors, isDarkMode) => StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.bodyMedium, marginTop: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + 10,
    paddingBottom: spacing.lg,
  },
  backBtn: { width: 40, height: 40, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.headlineMedium, fontWeight: '800' },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  statsBanner: { borderRadius: borderRadius.xl, padding: spacing.xl, marginBottom: spacing.lg, ...shadows.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statValue: { ...typography.headlineMedium, color: '#fff', fontWeight: '800' },
  statLabel: { ...typography.labelSmall, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  statDivider: { width: 1, height: 35, backgroundColor: 'rgba(255,255,255,0.3)' },
  chipsWrapper: { marginVertical: spacing.sm, marginBottom: spacing.lg },
  chipsRow: { flexDirection: 'row', paddingVertical: 4 },
  sectionTitle: { ...typography.headlineSmall, fontWeight: '850', marginVertical: spacing.md },
  
  // Timeline layout
  timelineContainer: { marginTop: spacing.sm, paddingLeft: 4 },
  timelineItem: { flexDirection: 'row', minHeight: 120 },
  timelineLeftNode: { width: 60, alignItems: 'center' },
  timelineBadge: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: isDarkMode ? '#1E2433' : '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
  },
  timelineDateDay: { fontSize: 16, fontWeight: '800' },
  timelineDateMonth: { fontSize: 10, fontWeight: '750', textTransform: 'uppercase', marginTop: 1 },
  timelineVerticalLine: { width: 2, flex: 1, marginVertical: spacing.xs },
  timelineContentRight: { flex: 1, paddingLeft: spacing.lg, paddingBottom: spacing.lg },
  
  // Timeline Cards
  timelineCard: { padding: spacing.lg, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', ...shadows.sm },
  reportCard: {},
  vitalCard: {},
  reportHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  vitalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  itemTypeBadge: { width: 36, height: 36, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  cardMainInfo: { flex: 1 },
  cardTitle: { ...typography.bodyLarge, fontWeight: '750' },
  cardSub: { ...typography.bodySmall, fontSize: 11, marginTop: 1 },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs - 2, borderRadius: borderRadius.full },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  reportSummaryText: { ...typography.bodySmall, fontSize: 12, lineHeight: 18, marginBottom: spacing.md },
  cardFooter: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: spacing.md },
  footerLink: { ...typography.labelMedium, fontWeight: '750' },
  
  // Vitals details
  vitalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  vitalIndicator: { alignItems: 'center', flex: 1 },
  indicatorVal: { ...typography.headlineSmall, fontSize: 16, fontWeight: '800' },
  indicatorLabel: { ...typography.labelSmall, fontSize: 10, marginTop: 2 },
  
  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: spacing.huge },
  emptyIcon: { fontSize: 60, marginBottom: spacing.lg },
  emptyTitle: { ...typography.headlineSmall, fontWeight: '800', marginBottom: spacing.sm },
  emptyDesc: { ...typography.bodyMedium, textAlign: 'center', marginBottom: spacing.lg },
  bookBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full },
  bookBtnText: { ...typography.button, color: '#fff', fontWeight: '850' },
  
  // Quick actions
  quickActionsContainer: { marginTop: spacing.xl },

  // BottomSheet Preview Container
  previewContainer: { flex: 1, paddingVertical: spacing.sm },
  previewInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1 },
  previewLabel: { ...typography.labelSmall, fontSize: 11, marginBottom: 2 },
  previewValue: { ...typography.bodyMedium, fontWeight: '800' },
  previewStatusBadge: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderRadius: borderRadius.full, marginTop: 2 },
  previewSectionHeader: { ...typography.labelMedium, fontWeight: '800', marginTop: spacing.lg, marginBottom: spacing.sm },
  previewSummaryCard: { padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  previewSummaryText: { ...typography.bodySmall, fontSize: 13, lineHeight: 19 },
  signatureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
  signatureBlock: {},
  signatureText: { ...typography.bodyMedium, fontWeight: '800' },
  signatureTitle: { ...typography.bodySmall, fontSize: 11, marginTop: 1 },
  stampCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 212, 170, 0.1)', alignItems: 'center', justifyContent: 'center' },
  downloadBtn: { borderRadius: borderRadius.xl, overflow: 'hidden', ...shadows.md },
  downloadBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg },
  downloadBtnText: { ...typography.button, color: '#fff', fontWeight: '800' },
});

export default HealthReportsScreen;
