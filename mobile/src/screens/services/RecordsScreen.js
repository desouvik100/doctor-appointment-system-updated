/**
 * Records Screen - Medical Records (prescriptions, lab reports, bills)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { shadows } from '../../theme/colors';
import Card from '../../components/common/Card';
import { useUser } from '../../context/UserContext';
import apiClient from '../../services/api/apiClient';

const RecordsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [bills, setBills] = useState([]);

  const userId = user?.id || user?._id;

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'prescriptions', label: 'Prescriptions' },
    { id: 'reports', label: 'Lab Reports' },
    { id: 'bills', label: 'Bills' },
  ];

  const fetchData = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const [rxRes, labRes, billRes] = await Promise.allSettled([
        apiClient.get(`/prescriptions/patient/${userId}`),
        apiClient.get(`/lab-reports/patient/${userId}`),
        apiClient.get(`/payments/history/${userId}`),
      ]);

      if (rxRes.status === 'fulfilled') {
        const data = rxRes.value?.data;
        setPrescriptions(Array.isArray(data) ? data : (data?.prescriptions || []));
      }
      if (labRes.status === 'fulfilled') {
        const data = labRes.value?.data;
        setLabReports(Array.isArray(data) ? data : (data?.reports || []));
      }
      if (billRes.status === 'fulfilled') {
        const data = billRes.value?.data;
        setBills(Array.isArray(data?.payments) ? data.payments : []);
      }
    } catch (e) {
      console.error('Records fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Normalise records into a unified shape
  const allRecords = [
    ...prescriptions.map(p => ({
      id: p._id,
      type: 'prescription',
      title: p.diagnosis || 'Prescription',
      doctor: p.doctorName || p.doctorId?.name || 'Doctor',
      date: formatDate(p.createdAt || p.date),
      icon: '💊',
      color: colors.primary,
      pdfUrl: p.pdfUrl || null,
      raw: p,
    })),
    ...labReports.map(r => ({
      id: r._id,
      type: 'report',
      title: r.testName || r.name || 'Lab Report',
      doctor: r.labName || r.lab || 'Lab',
      date: formatDate(r.createdAt || r.date),
      icon: '🧪',
      color: colors.success,
      pdfUrl: r.pdfUrl || null,
      raw: r,
    })),
    ...bills.map(b => ({
      id: b._id || b.razorpayPaymentId,
      type: 'bill',
      title: 'Consultation Bill',
      doctor: b.doctorName || 'Doctor',
      date: formatDate(b.paidAt || b.createdAt),
      amount: b.amount ? `₹${b.amount}` : null,
      icon: '🧾',
      color: colors.warning,
      pdfUrl: null,
      raw: b,
    })),
  ].sort((a, b) => new Date(b.raw?.createdAt || 0) - new Date(a.raw?.createdAt || 0));

  const filteredRecords = activeTab === 'all'
    ? allRecords
    : allRecords.filter(r => {
        if (activeTab === 'prescriptions') return r.type === 'prescription';
        if (activeTab === 'reports') return r.type === 'report';
        if (activeTab === 'bills') return r.type === 'bill';
        return true;
      });

  const stats = {
    prescriptions: prescriptions.length,
    reports: labReports.length,
    bills: bills.length,
  };

  const handleRecordPress = (record) => {
    if (record.pdfUrl) {
      Linking.openURL(record.pdfUrl).catch(() =>
        Alert.alert('Error', 'Could not open the document.')
      );
    } else if (record.type === 'prescription') {
      navigation.navigate('ReportDetails', { report: record.raw });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading records...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Medical Records</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Card variant="gradient" style={styles.statCard}>
          <Text style={styles.statIcon}>💊</Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.prescriptions}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Prescriptions</Text>
        </Card>
        <Card variant="gradient" style={styles.statCard}>
          <Text style={styles.statIcon}>🧪</Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.reports}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Lab Reports</Text>
        </Card>
        <Card variant="gradient" style={styles.statCard}>
          <Text style={styles.statIcon}>🧾</Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.bills}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Bills</Text>
        </Card>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              {activeTab === tab.id ? (
                <LinearGradient colors={colors.gradientPrimary} style={styles.tabGradient}>
                  <Text style={[styles.tabTextActive, { color: colors.textInverse }]}>{tab.label}</Text>
                </LinearGradient>
              ) : (
                <Text style={[styles.tabText, { color: colors.textMuted, backgroundColor: colors.surface }]}>{tab.label}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Records List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No records found</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              {activeTab === 'prescriptions' ? 'Your prescriptions will appear here after consultations.' :
               activeTab === 'reports' ? 'Your lab reports will appear here after tests.' :
               activeTab === 'bills' ? 'Your payment bills will appear here.' :
               'Your medical records will appear here.'}
            </Text>
            {activeTab !== 'bills' ? (
              <TouchableOpacity
                style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate(activeTab === 'reports' ? 'LabTests' : 'DoctorSearch')}
              >
                <Text style={styles.ctaBtnText}>
                  {activeTab === 'reports' ? 'Book Lab Test' : 'Book Appointment'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          filteredRecords.map((record) => (
            <TouchableOpacity key={record.id} onPress={() => handleRecordPress(record)}>
              <Card variant="default" style={styles.recordCard}>
                <View style={styles.recordRow}>
                  <View style={[styles.recordIcon, { backgroundColor: `${record.color}20` }]}>
                    <Text style={styles.recordEmoji}>{record.icon}</Text>
                  </View>
                  <View style={styles.recordInfo}>
                    <Text style={[styles.recordTitle, { color: colors.textPrimary }]} numberOfLines={1}>{record.title}</Text>
                    <Text style={[styles.recordDoctor, { color: colors.textSecondary }]}>{record.doctor}</Text>
                    <Text style={[styles.recordDate, { color: colors.textMuted }]}>{record.date}</Text>
                  </View>
                  <View style={styles.recordActions}>
                    {record.amount ? (
                      <Text style={[styles.recordAmount, { color: colors.textPrimary }]}>{record.amount}</Text>
                    ) : null}
                    {record.pdfUrl ? (
                      <TouchableOpacity
                        style={[styles.downloadBtn, { backgroundColor: colors.surfaceLight }]}
                        onPress={() => Linking.openURL(record.pdfUrl)}
                      >
                        <Text style={styles.downloadIcon}>⬇️</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

        {/* Upload Section */}
        <View style={[styles.uploadSection, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.uploadTitle, { color: colors.textPrimary }]}>Add New Record</Text>
          <View style={styles.uploadOptions}>
            <TouchableOpacity style={styles.uploadOption}>
              <View style={[styles.uploadOptionIcon, { backgroundColor: colors.surfaceLight }]}>
                <Text style={styles.uploadEmoji}>📷</Text>
              </View>
              <Text style={[styles.uploadOptionLabel, { color: colors.textSecondary }]}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadOption}>
              <View style={[styles.uploadOptionIcon, { backgroundColor: colors.surfaceLight }]}>
                <Text style={styles.uploadEmoji}>🖼️</Text>
              </View>
              <Text style={[styles.uploadOptionLabel, { color: colors.textSecondary }]}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadOption}>
              <View style={[styles.uploadOptionIcon, { backgroundColor: colors.surfaceLight }]}>
                <Text style={styles.uploadEmoji}>📄</Text>
              </View>
              <Text style={[styles.uploadOptionLabel, { color: colors.textSecondary }]}>Files</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingText: { ...typography.bodyMedium, marginTop: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 44, height: 44, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  backIcon: { fontSize: 20 },
  headerTitle: { ...typography.headlineMedium },
  statsRow: { flexDirection: 'row', paddingHorizontal: spacing.xl, gap: spacing.md, marginBottom: spacing.xl },
  statCard: { flex: 1, padding: spacing.md, alignItems: 'center' },
  statIcon: { fontSize: 24, marginBottom: spacing.xs },
  statValue: { ...typography.headlineMedium },
  statLabel: { ...typography.labelSmall },
  tabsContainer: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  tab: { marginRight: spacing.md, borderRadius: borderRadius.full, overflow: 'hidden' },
  tabActive: {},
  tabGradient: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  tabText: { ...typography.labelMedium, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, overflow: 'hidden' },
  tabTextActive: { ...typography.labelMedium, fontWeight: '600' },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingVertical: spacing.huge },
  emptyIcon: { fontSize: 64, marginBottom: spacing.lg },
  emptyTitle: { ...typography.headlineMedium, marginBottom: spacing.sm },
  emptyDesc: { ...typography.bodyMedium, textAlign: 'center', marginBottom: spacing.lg },
  ctaBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full },
  ctaBtnText: { ...typography.button, color: '#fff' },
  recordCard: { marginBottom: spacing.md, padding: spacing.lg },
  recordRow: { flexDirection: 'row', alignItems: 'center' },
  recordIcon: { width: 48, height: 48, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  recordEmoji: { fontSize: 24 },
  recordInfo: { flex: 1 },
  recordTitle: { ...typography.bodyLarge, fontWeight: '500' },
  recordDoctor: { ...typography.bodySmall },
  recordDate: { ...typography.labelSmall },
  recordActions: { alignItems: 'flex-end' },
  recordAmount: { ...typography.bodyMedium, fontWeight: '600', marginBottom: spacing.xs },
  downloadBtn: { width: 36, height: 36, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  downloadIcon: { fontSize: 16 },
  uploadSection: { marginTop: spacing.xl, padding: spacing.xl, borderRadius: borderRadius.xl, borderWidth: 1, borderStyle: 'dashed' },
  uploadTitle: { ...typography.bodyLarge, fontWeight: '500', textAlign: 'center', marginBottom: spacing.lg },
  uploadOptions: { flexDirection: 'row', justifyContent: 'space-around' },
  uploadOption: { alignItems: 'center' },
  uploadOptionIcon: { width: 56, height: 56, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  uploadEmoji: { fontSize: 24 },
  uploadOptionLabel: { ...typography.labelSmall },
});

export default RecordsScreen;
