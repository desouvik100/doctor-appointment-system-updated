/**
 * Medical Imaging Screen - View imaging reports and scans
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import { useUser } from '../../context/UserContext';

const { width } = Dimensions.get('window');

// API base URL - Production
const API_BASE_URL = 'https://doctor-appointment-system-updated.onrender.com/api';

const MedicalImagingScreen = ({ navigation }) => {
  const { user } = useUser();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const patientId = user?.id || user?._id;

  const imagingTypes = [
    { id: 'all', label: 'All', icon: '📋' },
    { id: 'X-Ray', label: 'X-Ray', icon: '🦴' },
    { id: 'CT', label: 'CT Scan', icon: '🔬' },
    { id: 'MRI', label: 'MRI', icon: '🧲' },
    { id: 'Ultrasound', label: 'Ultrasound', icon: '📡' },
    { id: 'other', label: 'Other', icon: '📷' },
  ];

  useEffect(() => {
    if (patientId) {
      fetchReports();
    }
  }, [patientId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/imaging/patient/${patientId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || 'demo-token'}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch imaging reports');
      }

      const data = await response.json();
      
      if (data.success) {
        setReports(data.reports || []);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error('Error fetching imaging reports:', err);
      // Show demo data for development
      setReports(getDemoReports());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getDemoReports = () => [
    {
      _id: '1',
      reportNumber: 'IMG-2024-001',
      imagingType: 'X-Ray',
      bodyPart: 'Chest',
      status: 'verified',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      procedureDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      orderedByName: 'Dr. Sarah Wilson',
      reportedByName: 'Dr. Michael Chen',
      findings: 'Normal chest X-ray. No acute cardiopulmonary abnormality.',
      impression: 'Normal study',
      images: [
        { fileName: 'chest_pa.dcm', thumbnailUrl: null, description: 'PA View' },
        { fileName: 'chest_lateral.dcm', thumbnailUrl: null, description: 'Lateral View' }
      ]
    },
    {
      _id: '2',
      reportNumber: 'IMG-2024-002',
      imagingType: 'MRI',
      bodyPart: 'Brain',
      status: 'reported',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      procedureDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      orderedByName: 'Dr. James Lee',
      reportedByName: 'Dr. Emily Brown',
      findings: 'No evidence of acute intracranial abnormality. Normal brain parenchyma.',
      impression: 'Normal MRI brain',
      images: [
        { fileName: 'brain_t1.dcm', thumbnailUrl: null, description: 'T1 Weighted' },
        { fileName: 'brain_t2.dcm', thumbnailUrl: null, description: 'T2 Weighted' },
        { fileName: 'brain_flair.dcm', thumbnailUrl: null, description: 'FLAIR' }
      ]
    },
    {
      _id: '3',
      reportNumber: 'IMG-2024-003',
      imagingType: 'CT',
      bodyPart: 'Abdomen',
      status: 'pending_report',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      procedureDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      orderedByName: 'Dr. Sarah Wilson',
      findings: null,
      impression: null,
      images: []
    },
    {
      _id: '4',
      reportNumber: 'IMG-2024-004',
      imagingType: 'Ultrasound',
      bodyPart: 'Abdomen',
      status: 'verified',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      procedureDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      orderedByName: 'Dr. Michael Chen',
      reportedByName: 'Dr. Lisa Wang',
      findings: 'Liver, gallbladder, pancreas, spleen, and kidneys appear normal. No free fluid.',
      impression: 'Normal abdominal ultrasound',
      images: [
        { fileName: 'liver.dcm', thumbnailUrl: null, description: 'Liver' },
        { fileName: 'kidney_r.dcm', thumbnailUrl: null, description: 'Right Kidney' }
      ]
    }
  ];

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return colors.success;
      case 'reported': return colors.info;
      case 'pending_report': return colors.warning;
      case 'scheduled': return colors.secondary;
      case 'ordered': return colors.textMuted;
      default: return colors.textMuted;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'reported': return 'Reported';
      case 'pending_report': return 'Pending Report';
      case 'scheduled': return 'Scheduled';
      case 'ordered': return 'Ordered';
      default: return status;
    }
  };

  const getImagingIcon = (type) => {
    switch (type) {
      case 'X-Ray': return '🦴';
      case 'CT': return '🔬';
      case 'MRI': return '🧲';
      case 'Ultrasound': return '📡';
      case 'PET': return '⚛️';
      case 'Mammography': return '🩺';
      default: return '📷';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const filteredReports = filterType === 'all' 
    ? reports 
    : reports.filter(r => r.imagingType === filterType);

  const renderReportCard = ({ item }) => (
    <TouchableOpacity onPress={() => setSelectedReport(item)}>
      <Card variant="gradient" style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <View style={styles.reportIconContainer}>
            <Icon name={getImagingIcon(item.imagingType)} size={24} color={colors.primary} />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportType}>{item.imagingType} - {item.bodyPart}</Text>
            <Text style={styles.reportNumber}>{item.reportNumber}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.reportDetails}>
          <View style={styles.detailRow}>
            <Icon name="calendar-outline" size={14} color={colors.textSecondary} style={styles.detailIcon} />
            <Text style={styles.detailText}>{formatDate(item.procedureDate || item.createdAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="person-outline" size={14} color={colors.textSecondary} style={styles.detailIcon} />
            <Text style={styles.detailText}>{item.orderedByName || 'N/A'}</Text>
          </View>
        </View>

        {item.impression && (
          <View style={styles.impressionContainer}>
            <Text style={styles.impressionLabel}>Impression:</Text>
            <Text style={styles.impressionText} numberOfLines={2}>{item.impression}</Text>
          </View>
        )}

        {item.images && item.images.length > 0 && (
          <View style={styles.imagesPreview}>
            <Text style={styles.imagesCount}>
              📷 {item.images.length} image{item.images.length > 1 ? 's' : ''} available
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  const renderReportDetail = () => {
    if (!selectedReport) return null;

    return (
      <Modal
        visible={!!selectedReport}
        animationType="slide"
        onRequestClose={() => setSelectedReport(null)}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor={colors.background} />
          
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedReport(null)} style={styles.backButton}>
              <Icon name="arrow-back-outline" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Report Details</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Report Info Card */}
            <Card variant="gradient" style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Icon name={getImagingIcon(selectedReport.imagingType)} size={40} color={colors.primary} />
                <View style={styles.detailHeaderInfo}>
                  <Text style={styles.detailTitle}>
                    {selectedReport.imagingType} - {selectedReport.bodyPart}
                  </Text>
                  <Text style={styles.detailSubtitle}>{selectedReport.reportNumber}</Text>
                </View>
              </View>

              <View style={[styles.statusBadgeLarge, { backgroundColor: `${getStatusColor(selectedReport.status)}20` }]}>
                <Text style={[styles.statusTextLarge, { color: getStatusColor(selectedReport.status) }]}>
                  {getStatusLabel(selectedReport.status)}
                </Text>
              </View>
            </Card>

            {/* Dates & Doctors */}
            <Card variant="default" style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Study Information</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Procedure Date</Text>
                <Text style={styles.infoValue}>{formatDate(selectedReport.procedureDate)}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ordered By</Text>
                <Text style={styles.infoValue}>{selectedReport.orderedByName || 'N/A'}</Text>
              </View>
              
              {selectedReport.reportedByName && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Reported By</Text>
                  <Text style={styles.infoValue}>{selectedReport.reportedByName}</Text>
                </View>
              )}
            </Card>

            {/* Findings */}
            {selectedReport.findings && (
              <Card variant="default" style={styles.infoCard}>
                <Text style={styles.sectionTitle}>Findings</Text>
                <Text style={styles.findingsText}>{selectedReport.findings}</Text>
              </Card>
            )}

            {/* Impression */}
            {selectedReport.impression && (
              <Card variant="default" style={styles.infoCard}>
                <Text style={styles.sectionTitle}>Impression</Text>
                <Text style={styles.impressionDetailText}>{selectedReport.impression}</Text>
              </Card>
            )}

            {/* Recommendations */}
            {selectedReport.recommendations && (
              <Card variant="default" style={styles.infoCard}>
                <Text style={styles.sectionTitle}>Recommendations</Text>
                <Text style={styles.findingsText}>{selectedReport.recommendations}</Text>
              </Card>
            )}

            {/* Images */}
            {selectedReport.images && selectedReport.images.length > 0 && (
              <Card variant="default" style={styles.infoCard}>
                <Text style={styles.sectionTitle}>Images ({selectedReport.images.length})</Text>
                <View style={styles.imagesGrid}>
                  {selectedReport.images.map((img, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.imageItem}
                      onPress={() => {
                        setSelectedImage(img);
                        setImageViewerVisible(true);
                      }}
                    >
                      <View style={styles.imagePlaceholder}>
                        <Icon name="image-outline" size={32} color={colors.textMuted} />
                      </View>
                      <Text style={styles.imageLabel} numberOfLines={1}>
                        {img.description || img.fileName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>
            )}

            {/* No Report Yet */}
            {!selectedReport.findings && !selectedReport.impression && (
              <Card variant="default" style={styles.infoCard}>
                <View style={styles.pendingContainer}>
                  <Icon name="time-outline" size={48} color={colors.warning} />
                  <Text style={styles.pendingTitle}>Report Pending</Text>
                  <Text style={styles.pendingText}>
                    The radiologist is reviewing your images. The report will be available soon.
                  </Text>
                </View>
              </Card>
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading imaging reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Imaging</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Banner */}
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.bannerContent}>
          <Icon name="scan-outline" size={48} color="white" />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Your Imaging Records</Text>
            <Text style={styles.bannerSubtitle}>
              View X-Rays, CT, MRI, and Ultrasound reports
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {imagingTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.filterTab,
              filterType === type.id && styles.filterTabActive
            ]}
            onPress={() => setFilterType(type.id)}
          >
            <Icon name={type.icon} size={16} color={filterType === type.id ? colors.primary : colors.textSecondary} style={styles.filterIcon} />
            <Text style={[
              styles.filterLabel,
              filterType === type.id && styles.filterLabelActive
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="scan-outline" size={64} color={colors.textMuted} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No Imaging Reports</Text>
          <Text style={styles.emptyText}>
            {filterType === 'all' 
              ? "You don't have any imaging reports yet."
              : `No ${filterType} reports found.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          renderItem={renderReportCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Report Detail Modal */}
      {renderReportDetail()}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  banner: {
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    ...typography.headlineSmall,
    color: colors.textInverse,
    marginBottom: spacing.xs,
  },
  bannerSubtitle: {
    ...typography.bodyMedium,
    color: 'rgba(255,255,255,0.8)',
  },
  filterContainer: {
    maxHeight: 60,
    marginBottom: spacing.md,
  },
  filterContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginRight: spacing.sm,
  },
  filterTabActive: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  filterIcon: {
    marginRight: spacing.xs,
  },
  filterLabel: {
    ...typography.labelMedium,
    color: colors.textSecondary,
  },
  filterLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  reportCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  reportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  reportInfo: {
    flex: 1,
  },
  reportType: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  reportNumber: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  reportDetails: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: spacing.xs,
  },
  detailText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  impressionContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  impressionLabel: {
    ...typography.labelSmall,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  impressionText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  imagesPreview: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  imagesCount: {
    ...typography.labelMedium,
    color: colors.info,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  emptyTitle: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  detailCard: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  detailHeaderInfo: {
    flex: 1,
  },
  detailTitle: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
  },
  detailSubtitle: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  statusBadgeLarge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusTextLarge: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  infoCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.labelLarge,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  findingsText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  impressionDetailText: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '500',
    lineHeight: 24,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  imageItem: {
    width: (width - spacing.xl * 2 - spacing.lg * 2 - spacing.md * 2) / 3,
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  imageLabel: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  pendingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  pendingTitle: {
    ...typography.headlineSmall,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  pendingText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});

export default MedicalImagingScreen;
