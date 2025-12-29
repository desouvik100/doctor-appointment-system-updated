/**
 * Records Screen - Medical Records
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, shadows } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';

const RecordsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'prescriptions', label: 'Prescriptions' },
    { id: 'reports', label: 'Lab Reports' },
    { id: 'bills', label: 'Bills' },
  ];

  const records = [
    {
      id: '1',
      type: 'prescription',
      title: 'Prescription',
      doctor: 'Dr. Sarah Wilson',
      date: 'Dec 25, 2025',
      icon: '💊',
      color: colors.primary,
    },
    {
      id: '2',
      type: 'report',
      title: 'Blood Test Report',
      doctor: 'City Lab',
      date: 'Dec 20, 2025',
      icon: '🧪',
      color: colors.success,
    },
    {
      id: '3',
      type: 'bill',
      title: 'Consultation Bill',
      doctor: 'Dr. Michael Chen',
      date: 'Dec 18, 2025',
      amount: '₹500',
      icon: '🧾',
      color: colors.warning,
    },
    {
      id: '4',
      type: 'prescription',
      title: 'Prescription',
      doctor: 'Dr. Emily Parker',
      date: 'Dec 15, 2025',
      icon: '💊',
      color: colors.primary,
    },
    {
      id: '5',
      type: 'report',
      title: 'X-Ray Report',
      doctor: 'Diagnostic Center',
      date: 'Dec 10, 2025',
      icon: '📷',
      color: colors.info,
    },
    {
      id: '6',
      type: 'report',
      title: 'Thyroid Profile',
      doctor: 'City Lab',
      date: 'Dec 5, 2025',
      icon: '🧪',
      color: colors.success,
    },
  ];

  const filteredRecords = activeTab === 'all' 
    ? records 
    : records.filter(r => {
        if (activeTab === 'prescriptions') return r.type === 'prescription';
        if (activeTab === 'reports') return r.type === 'report';
        if (activeTab === 'bills') return r.type === 'bill';
        return true;
      });

  const stats = {
    prescriptions: records.filter(r => r.type === 'prescription').length,
    reports: records.filter(r => r.type === 'report').length,
    bills: records.filter(r => r.type === 'bill').length,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Records</Text>
        <TouchableOpacity style={styles.addBtn}>
          <LinearGradient colors={colors.gradientPrimary} style={styles.addBtnGradient}>
            <Text style={styles.addBtnIcon}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Card variant="gradient" style={styles.statCard}>
          <Text style={styles.statIcon}>💊</Text>
          <Text style={styles.statValue}>{stats.prescriptions}</Text>
          <Text style={styles.statLabel}>Prescriptions</Text>
        </Card>
        <Card variant="gradient" style={styles.statCard}>
          <Text style={styles.statIcon}>🧪</Text>
          <Text style={styles.statValue}>{stats.reports}</Text>
          <Text style={styles.statLabel}>Lab Reports</Text>
        </Card>
        <Card variant="gradient" style={styles.statCard}>
          <Text style={styles.statIcon}>🧾</Text>
          <Text style={styles.statValue}>{stats.bills}</Text>
          <Text style={styles.statLabel}>Bills</Text>
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
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.tabGradient}
                >
                  <Text style={styles.tabTextActive}>{tab.label}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.tabText}>{tab.label}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Records List */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No records found</Text>
            <Text style={styles.emptyDesc}>Your medical records will appear here</Text>
          </View>
        ) : (
          filteredRecords.map((record) => (
            <TouchableOpacity key={record.id}>
              <Card variant="default" style={styles.recordCard}>
                <View style={styles.recordRow}>
                  <View style={[styles.recordIcon, { backgroundColor: `${record.color}20` }]}>
                    <Text style={styles.recordEmoji}>{record.icon}</Text>
                  </View>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordTitle}>{record.title}</Text>
                    <Text style={styles.recordDoctor}>{record.doctor}</Text>
                    <Text style={styles.recordDate}>{record.date}</Text>
                  </View>
                  <View style={styles.recordActions}>
                    {record.amount && (
                      <Text style={styles.recordAmount}>{record.amount}</Text>
                    )}
                    <TouchableOpacity style={styles.downloadBtn}>
                      <Text style={styles.downloadIcon}>⬇️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

        {/* Upload Section */}
        <View style={styles.uploadSection}>
          <Text style={styles.uploadTitle}>Add New Record</Text>
          <View style={styles.uploadOptions}>
            <TouchableOpacity style={styles.uploadOption}>
              <View style={styles.uploadOptionIcon}>
                <Text style={styles.uploadEmoji}>📷</Text>
              </View>
              <Text style={styles.uploadOptionLabel}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadOption}>
              <View style={styles.uploadOptionIcon}>
                <Text style={styles.uploadEmoji}>🖼️</Text>
              </View>
              <Text style={styles.uploadOptionLabel}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadOption}>
              <View style={styles.uploadOptionIcon}>
                <Text style={styles.uploadEmoji}>📄</Text>
              </View>
              <Text style={styles.uploadOptionLabel}>Files</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  backIcon: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  headerTitle: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
  },
  addBtn: {
    ...shadows.small,
  },
  addBtnGradient: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnIcon: {
    fontSize: 24,
    color: colors.textInverse,
    fontWeight: '300',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.labelSmall,
    color: colors.textMuted,
  },
  tabsContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  tab: {
    marginRight: spacing.md,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  tabActive: {},
  tabGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  tabText: {
    ...typography.labelMedium,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  tabTextActive: {
    ...typography.labelMedium,
    color: colors.textInverse,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.headlineMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  recordCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  recordEmoji: {
    fontSize: 24,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  recordDoctor: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  recordDate: {
    ...typography.labelSmall,
    color: colors.textMuted,
  },
  recordActions: {
    alignItems: 'flex-end',
  },
  recordAmount: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  downloadBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadIcon: {
    fontSize: 16,
  },
  uploadSection: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderStyle: 'dashed',
  },
  uploadTitle: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  uploadOption: {
    alignItems: 'center',
  },
  uploadOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  uploadEmoji: {
    fontSize: 24,
  },
  uploadOptionLabel: {
    ...typography.labelSmall,
    color: colors.textSecondary,
  },
});

export default RecordsScreen;
