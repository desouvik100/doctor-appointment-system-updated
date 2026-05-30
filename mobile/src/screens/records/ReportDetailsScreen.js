/**
 * ReportDetailsScreen - Premium detailed view for Lab Reports
 * Displays patient details, sample info, parameter results, and verification info
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import apiClient from '../../services/api/apiClient';

const ReportDetailsScreen = ({ navigation, route }) => {
  const { report: initialReport, reportId } = route.params || {};
  const { colors, isDarkMode } = useTheme();
  const styles = makeStyles(colors, isDarkMode);

  const [report, setReport] = useState(initialReport || null);
  const [loading, setLoading] = useState(!initialReport && !!reportId);

  useEffect(() => {
    if (!report && reportId) {
      fetchReport();
    }
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/lab-reports/${reportId}`);
      if (response.data?.success) {
        setReport(response.data.report);
      } else {
        throw new Error('Failed to load report data');
      }
    } catch (error) {
      console.error('Error fetching lab report details:', error);
      Alert.alert('Error', 'Could not load lab report details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified':
      case 'completed':
        return colors.success;
      case 'sample_collected':
      case 'processing':
      case 'pending_verification':
        return colors.warning;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'sample_collected': return 'Sample Collected';
      case 'pending_verification': return 'Pending Verification';
      case 'verified': return 'Verified';
      case 'processing': return 'Processing';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'ordered': return 'Ordered';
      default: return status || 'Unknown';
    }
  };

  const getFlagColor = (flag) => {
    switch (flag?.toLowerCase()) {
      case 'normal':
        return colors.success;
      case 'low':
      case 'high':
        return colors.warning;
      case 'critical_low':
      case 'critical_high':
      case 'abnormal':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpenPdf = () => {
    // Check if there are attachments
    const pdfUrl = report?.pdfUrl || report?.attachments?.[0]?.fileUrl;
    if (pdfUrl) {
      Linking.openURL(pdfUrl).catch(() =>
        Alert.alert('Error', 'Could not open the report document.')
      );
    } else {
      Alert.alert('Not Available', 'PDF version of this report is not available.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading report details...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Report not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Determine if PDF download should be shown
  const hasPdf = !!(report.pdfUrl || report.attachments?.[0]?.fileUrl);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Icon name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Lab Report</Text>
        {hasPdf ? (
          <TouchableOpacity onPress={handleOpenPdf} style={[styles.actionBtn, { backgroundColor: colors.surface }]}>
            <Icon name="download-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Test Name & Status */}
        <Card variant="gradient" style={styles.mainCard}>
          <View style={styles.mainHeader}>
            <View style={styles.mainIconContainer}>
              <Text style={styles.mainEmoji}>🧪</Text>
            </View>
            <View style={styles.mainTitleContainer}>
              <Text style={styles.mainTitle}>{report.testName || 'Lab Test'}</Text>
              <Text style={styles.mainSub}>{report.reportNumber}</Text>
            </View>
          </View>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(report.status)}20` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                ● {getStatusLabel(report.status)}
              </Text>
            </View>
            {report.priority && report.priority !== 'routine' && (
              <View style={[styles.priorityBadge, { backgroundColor: colors.error + '15' }]}>
                <Text style={[styles.priorityText, { color: colors.error }]}>
                  ⚠️ {report.priority.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Info Grid */}
        <Card variant="default" style={styles.infoCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>General Information</Text>
          
          <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Patient Name</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{report.patientName}</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Age / Gender</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {report.patientAge ? `${report.patientAge} Yrs` : 'N/A'} / {report.patientGender || 'N/A'}
            </Text>
          </View>

          {report.orderedByName && (
            <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Ordered By</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>Dr. {report.orderedByName}</Text>
            </View>
          )}

          <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Sample Type</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary, textTransform: 'capitalize' }]}>{report.sampleType}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Order Date</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{formatDate(report.orderDate)}</Text>
          </View>
        </Card>

        {/* Results Section */}
        {report.results && report.results.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Test Results</Text>
            
            {/* Table Headers */}
            <View style={[styles.tableHeader, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.colHeader, styles.colParam, { color: colors.textSecondary }]}>Parameter</Text>
              <Text style={[styles.colHeader, styles.colVal, { color: colors.textSecondary }]}>Value</Text>
              <Text style={[styles.colHeader, styles.colRef, { color: colors.textSecondary }]}>Reference Range</Text>
            </View>

            {/* Table Rows */}
            {report.results.map((res, index) => (
              <View key={index} style={[styles.tableRow, { borderBottomColor: colors.divider }]}>
                <View style={styles.colParam}>
                  <Text style={[styles.paramName, { color: colors.textPrimary }]}>{res.parameter}</Text>
                  {res.interpretation && (
                    <Text style={[styles.paramInterpretation, { color: colors.textMuted }]}>{res.interpretation}</Text>
                  )}
                </View>
                <View style={[styles.colVal, styles.valContainer]}>
                  <Text style={[styles.paramValue, { color: colors.textPrimary }]}>
                    {res.value} <Text style={styles.paramUnit}>{res.unit || ''}</Text>
                  </Text>
                  {res.flag && res.flag !== 'normal' && (
                    <View style={[styles.flagBadge, { backgroundColor: getFlagColor(res.flag) + '15' }]}>
                      <Text style={[styles.flagText, { color: getFlagColor(res.flag) }]}>
                        {res.flag.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.colRef, styles.refRangeText, { color: colors.textSecondary }]}>
                  {res.normalRange || '--'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Interpretation & Comments */}
        {report.interpretation && (
          <Card variant="default" style={styles.commentCard}>
            <Text style={[styles.commentTitle, { color: colors.primary }]}>Clinical Interpretation</Text>
            <Text style={[styles.commentText, { color: colors.textPrimary }]}>{report.interpretation}</Text>
          </Card>
        )}

        {report.comments && (
          <Card variant="default" style={styles.commentCard}>
            <Text style={[styles.commentTitle, { color: colors.textSecondary }]}>Lab Comments</Text>
            <Text style={[styles.commentText, { color: colors.textPrimary }]}>{report.comments}</Text>
          </Card>
        )}

        {/* Verification Doctor Card */}
        {report.status === 'verified' && (
          <Card variant="default" style={styles.verificationCard}>
            <View style={styles.verificationRow}>
              <View style={[styles.checkIconContainer, { backgroundColor: colors.success + '15' }]}>
                <Icon name="checkmark-seal" size={24} color={colors.success} />
              </View>
              <View style={styles.verificationInfo}>
                <Text style={[styles.verifiedTitle, { color: colors.textPrimary }]}>Report Verified & Signed</Text>
                <Text style={[styles.verifiedSub, { color: colors.textSecondary }]}>
                  Verified by: {report.verifiedByName || 'Authorized Pathologist'}
                </Text>
                <Text style={[styles.verifiedTime, { color: colors.textMuted }]}>
                  Date: {formatDate(report.verifiedAt)}
                </Text>
              </View>
            </View>
            {report.digitalSignature && (
              <View style={[styles.signatureBox, { backgroundColor: colors.surfaceLight }]}>
                <Icon name="ribbon-outline" size={14} color={colors.primary} />
                <Text style={[styles.signatureText, { color: colors.textSecondary }]}>
                  Secure Cryptographic Digital Signature Authenticated
                </Text>
              </View>
            )}
          </Card>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const makeStyles = (colors, isDarkMode) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.bodyMedium, marginTop: spacing.md },
  errorText: { ...typography.bodyLarge, color: colors.error, marginBottom: spacing.lg },
  backButton: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.lg },
  backButtonText: { ...typography.button, color: colors.textInverse },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.headlineMedium, fontWeight: '700' },
  
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },

  // Main Card
  mainCard: { padding: spacing.lg, marginBottom: spacing.lg },
  mainHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  mainIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  mainEmoji: { fontSize: 24 },
  mainTitleContainer: { flex: 1 },
  mainTitle: { ...typography.headlineMedium, color: '#FFFFFF', fontWeight: '700' },
  mainSub: { ...typography.bodySmall, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: spacing.sm },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  statusText: { ...typography.labelSmall, fontWeight: '700', fontSize: 11 },
  priorityBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  priorityText: { ...typography.labelSmall, fontWeight: '700', fontSize: 11 },

  // Info Card
  infoCard: { padding: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { ...typography.headlineSmall, fontWeight: '700', marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1 },
  infoLabel: { ...typography.bodyMedium },
  infoValue: { ...typography.bodyMedium, fontWeight: '600' },

  // Results Table
  resultsContainer: { marginBottom: spacing.xl },
  sectionHeading: { ...typography.headlineSmall, fontWeight: '700', marginBottom: spacing.md },
  tableHeader: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 2, marginBottom: spacing.xs },
  colHeader: { ...typography.labelSmall, fontWeight: '700' },
  tableRow: { flexDirection: 'row', paddingVertical: spacing.lg, borderBottomWidth: 1, alignItems: 'center' },
  colParam: { flex: 1.5 },
  colVal: { flex: 1.2, paddingHorizontal: spacing.xs },
  colRef: { flex: 1, textAlign: 'right' },
  paramName: { ...typography.bodyMedium, fontWeight: '700' },
  paramInterpretation: { ...typography.labelSmall, fontSize: 11, marginTop: 2 },
  valContainer: { flexDirection: 'column', gap: 4 },
  paramValue: { ...typography.bodyMedium, fontWeight: '700' },
  paramUnit: { ...typography.bodySmall, fontWeight: '400' },
  refRangeText: { ...typography.bodyMedium },
  flagBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: borderRadius.sm },
  flagText: { fontSize: 9, fontWeight: '800' },

  // Comment Cards
  commentCard: { padding: spacing.lg, marginBottom: spacing.md },
  commentTitle: { ...typography.labelLarge, fontWeight: '700', marginBottom: spacing.sm },
  commentText: { ...typography.bodyMedium, lineHeight: 22 },

  // Verification Card
  verificationCard: { padding: spacing.lg, marginBottom: spacing.lg },
  verificationRow: { flexDirection: 'row', alignItems: 'center' },
  checkIconContainer: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  verificationInfo: { flex: 1 },
  verifiedTitle: { ...typography.bodyLarge, fontWeight: '700' },
  verifiedSub: { ...typography.bodyMedium, marginTop: 2 },
  verifiedTime: { ...typography.labelSmall, marginTop: 2 },
  signatureBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md, padding: spacing.md, borderRadius: borderRadius.md },
  signatureText: { ...typography.labelSmall, fontSize: 10, flex: 1 },
});

export default ReportDetailsScreen;
