/**
 * VitalsHistoryScreen - Display vitals trend with charts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';

const { width } = Dimensions.get('window');

const VitalsHistoryScreen = ({ navigation }) => {
  const [activeVital, setActiveVital] = useState('bp');
  const [dateRange, setDateRange] = useState('week');

  const vitals = [
    { id: 'bp', label: 'Blood Pressure', icon: '🩺', unit: 'mmHg', current: '120/80', status: 'normal' },
    { id: 'hr', label: 'Heart Rate', icon: '❤️', unit: 'bpm', current: '72', status: 'normal' },
    { id: 'temp', label: 'Temperature', icon: '🌡️', unit: '°F', current: '98.6', status: 'normal' },
    { id: 'spo2', label: 'SpO2', icon: '💨', unit: '%', current: '98', status: 'normal' },
    { id: 'weight', label: 'Weight', icon: '⚖️', unit: 'kg', current: '72', status: 'normal' },
    { id: 'sugar', label: 'Blood Sugar', icon: '🩸', unit: 'mg/dL', current: '95', status: 'normal' },
  ];

  const dateRanges = [
    { id: 'week', label: '7D' },
    { id: 'month', label: '1M' },
    { id: '3month', label: '3M' },
    { id: 'year', label: '1Y' },
  ];

  // Mock history data
  const historyData = [
    { date: 'Jan 2', value: '120/80' },
    { date: 'Jan 1', value: '118/78' },
    { date: 'Dec 31', value: '122/82' },
    { date: 'Dec 30', value: '119/79' },
    { date: 'Dec 29', value: '121/81' },
    { date: 'Dec 28', value: '117/77' },
    { date: 'Dec 27', value: '120/80' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return colors.success;
      case 'high': return colors.error;
      case 'low': return colors.warning;
      default: return colors.textMuted;
    }
  };

  const activeVitalData = vitals.find(v => v.id === activeVital);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vitals History</Text>
        <TouchableOpacity>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Vitals Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vitalsScroll}>
          {vitals.map(vital => (
            <TouchableOpacity
              key={vital.id}
              style={[styles.vitalChip, activeVital === vital.id && styles.vitalChipActive]}
              onPress={() => setActiveVital(vital.id)}
            >
              <Text style={styles.vitalIcon}>{vital.icon}</Text>
              <Text style={[styles.vitalLabel, activeVital === vital.id && styles.vitalLabelActive]}>
                {vital.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Current Value Card */}
        <Card variant="gradient" style={styles.currentCard}>
          <View style={styles.currentHeader}>
            <Text style={styles.currentIcon}>{activeVitalData?.icon}</Text>
            <Text style={styles.currentLabel}>{activeVitalData?.label}</Text>
          </View>
          <Text style={styles.currentValue}>{activeVitalData?.current}</Text>
          <Text style={styles.currentUnit}>{activeVitalData?.unit}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activeVitalData?.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(activeVitalData?.status) }]}>
              {activeVitalData?.status?.toUpperCase()}
            </Text>
          </View>
        </Card>

        {/* Date Range Selector */}
        <View style={styles.dateRangeContainer}>
          {dateRanges.map(range => (
            <TouchableOpacity
              key={range.id}
              style={[styles.dateRangeBtn, dateRange === range.id && styles.dateRangeBtnActive]}
              onPress={() => setDateRange(range.id)}
            >
              <Text style={[styles.dateRangeText, dateRange === range.id && styles.dateRangeTextActive]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Simple Chart Placeholder */}
        <Card variant="default" style={styles.chartCard}>
          <Text style={styles.chartTitle}>Trend</Text>
          <View style={styles.chartPlaceholder}>
            <View style={styles.chartBars}>
              {[70, 85, 60, 90, 75, 80, 72].map((h, i) => (
                <View key={i} style={[styles.chartBar, { height: h }]} />
              ))}
            </View>
            <View style={styles.chartLabels}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                <Text key={i} style={styles.chartLabel}>{d}</Text>
              ))}
            </View>
          </View>
        </Card>

        {/* History List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Readings</Text>
          {historyData.map((item, index) => (
            <Card key={index} variant="default" style={styles.historyCard}>
              <View style={styles.historyRow}>
                <Text style={styles.historyDate}>{item.date}</Text>
                <Text style={styles.historyValue}>{item.value} {activeVitalData?.unit}</Text>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: colors.textPrimary },
  headerTitle: { ...typography.headlineMedium, color: colors.textPrimary },
  addIcon: { fontSize: 28, color: colors.primary },
  scrollContent: { paddingBottom: spacing.huge },
  vitalsScroll: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  vitalChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, marginRight: spacing.sm },
  vitalChipActive: { backgroundColor: colors.primaryLight },
  vitalIcon: { fontSize: 16, marginRight: spacing.xs },
  vitalLabel: { ...typography.labelMedium, color: colors.textSecondary },
  vitalLabelActive: { color: colors.primary },
  currentCard: { marginHorizontal: spacing.xl, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg },
  currentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  currentIcon: { fontSize: 24, marginRight: spacing.sm },
  currentLabel: { ...typography.bodyLarge, color: colors.textSecondary },
  currentValue: { ...typography.displayLarge, color: colors.textPrimary },
  currentUnit: { ...typography.bodyMedium, color: colors.textMuted },
  statusBadge: { marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  statusText: { ...typography.labelSmall, fontWeight: '600' },
  dateRangeContainer: { flexDirection: 'row', marginHorizontal: spacing.xl, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xs, marginBottom: spacing.lg },
  dateRangeBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md },
  dateRangeBtnActive: { backgroundColor: colors.primary },
  dateRangeText: { ...typography.labelMedium, color: colors.textSecondary },
  dateRangeTextActive: { color: colors.textInverse },
  chartCard: { marginHorizontal: spacing.xl, padding: spacing.lg, marginBottom: spacing.lg },
  chartTitle: { ...typography.labelMedium, color: colors.textMuted, marginBottom: spacing.md },
  chartPlaceholder: { height: 120 },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, paddingHorizontal: spacing.sm },
  chartBar: { width: 24, backgroundColor: colors.primary, borderRadius: borderRadius.sm, opacity: 0.7 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, paddingHorizontal: spacing.xs },
  chartLabel: { ...typography.labelSmall, color: colors.textMuted, width: 30, textAlign: 'center' },
  section: { paddingHorizontal: spacing.xl },
  sectionTitle: { ...typography.headlineSmall, color: colors.textPrimary, marginBottom: spacing.md },
  historyCard: { padding: spacing.md, marginBottom: spacing.sm },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyDate: { ...typography.bodyMedium, color: colors.textSecondary },
  historyValue: { ...typography.bodyLarge, color: colors.textPrimary, fontWeight: '500' },
});

export default VitalsHistoryScreen;
