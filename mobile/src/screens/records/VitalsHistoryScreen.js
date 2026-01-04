/**
 * VitalsHistoryScreen - Display vitals trend with charts
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
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import { useUser } from '../../context/UserContext';
import apiClient from '../../services/api/apiClient';

const vitals = [
  { id: 'bp', label: 'Blood Pressure', icon: '🩺', unit: 'mmHg', hasTwo: true },
  { id: 'hr', label: 'Heart Rate', icon: '❤️', unit: 'bpm' },
  { id: 'temp', label: 'Temperature', icon: '🌡️', unit: '°F' },
  { id: 'spo2', label: 'SpO2', icon: '💨', unit: '%' },
  { id: 'weight', label: 'Weight', icon: '⚖️', unit: 'kg' },
  { id: 'sugar', label: 'Blood Sugar', icon: '🩸', unit: 'mg/dL' },
];

const dateRanges = [
  { id: 'week', label: '1W' },
  { id: 'month', label: '1M' },
  { id: '3month', label: '3M' },
  { id: 'year', label: '1Y' },
];

const VitalsHistoryScreen = ({ navigation }) => {
  const { user } = useUser();
  const [activeVital, setActiveVital] = useState('bp');
  const [dateRange, setDateRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vitalsData, setVitalsData] = useState([]);
  const [latestVitals, setLatestVitals] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingVital, setAddingVital] = useState(false);
  const [newVitalValue, setNewVitalValue] = useState('');
  const [newVitalValue2, setNewVitalValue2] = useState(''); // For BP diastolic

  const fetchVitals = useCallback(async () => {
    if (!user?._id) return;
    try {
      const [historyRes, latestRes] = await Promise.all([
        apiClient.get(`/health/vitals/${user._id}?type=${activeVital}&dateRange=${dateRange}`),
        apiClient.get(`/health/vitals/${user._id}/latest`),
      ]);
      setVitalsData(historyRes.data.vitals || []);
      setLatestVitals(latestRes.data.latestVitals || {});
    } catch (error) {
      console.error('Error fetching vitals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?._id, activeVital, dateRange]);

  useEffect(() => {
    fetchVitals();
  }, [fetchVitals]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVitals();
  };

  const handleAddVital = async () => {
    if (!newVitalValue.trim()) {
      Alert.alert('Error', 'Please enter a value');
      return;
    }

    const vitalConfig = vitals.find(v => v.id === activeVital);
    let value, systolic, diastolic, numericValue;

    if (activeVital === 'bp') {
      if (!newVitalValue2.trim()) {
        Alert.alert('Error', 'Please enter both systolic and diastolic values');
        return;
      }
      systolic = parseInt(newVitalValue);
      diastolic = parseInt(newVitalValue2);
      value = `${systolic}/${diastolic}`;
      numericValue = systolic;
    } else {
      numericValue = parseFloat(newVitalValue);
      value = newVitalValue;
    }

    setAddingVital(true);
    try {
      await apiClient.post(`/health/vitals/${user._id}`, {
        type: activeVital,
        value,
        unit: vitalConfig?.unit,
        systolic,
        diastolic,
        numericValue,
        source: 'manual',
      });
      Alert.alert('Success', 'Vital recorded successfully');
      setShowAddModal(false);
      setNewVitalValue('');
      setNewVitalValue2('');
      fetchVitals();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add vital');
    } finally {
      setAddingVital(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return colors.success;
      case 'high': case 'critical': return colors.error;
      case 'low': return colors.warning;
      default: return colors.textMuted;
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const activeVitalConfig = vitals.find(v => v.id === activeVital);
  const currentVital = latestVitals[activeVital];

  // Generate chart data from vitalsData
  const chartData = vitalsData.slice(0, 7).reverse().map(v => {
    if (activeVital === 'bp') return v.systolic || 120;
    return v.numericValue || 0;
  });
  const maxChart = Math.max(...chartData, 1);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vitals History</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
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
            <Text style={styles.currentIcon}>{activeVitalConfig?.icon}</Text>
            <Text style={styles.currentLabel}>{activeVitalConfig?.label}</Text>
          </View>
          <Text style={styles.currentValue}>{currentVital?.value || '--'}</Text>
          <Text style={styles.currentUnit}>{activeVitalConfig?.unit}</Text>
          {currentVital?.status && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentVital.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(currentVital.status) }]}>
                {currentVital.status.toUpperCase()}
              </Text>
            </View>
          )}
          {currentVital?.recordedAt && (
            <Text style={styles.recordedAt}>Last: {formatDate(currentVital.recordedAt)}</Text>
          )}
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

        {/* Chart */}
        <Card variant="default" style={styles.chartCard}>
          <Text style={styles.chartTitle}>Trend</Text>
          {chartData.length > 0 ? (
            <View style={styles.chartPlaceholder}>
              <View style={styles.chartBars}>
                {chartData.map((val, i) => (
                  <View 
                    key={i} 
                    style={[styles.chartBar, { height: Math.max((val / maxChart) * 100, 10) }]} 
                  />
                ))}
              </View>
              <View style={styles.chartLabels}>
                {vitalsData.slice(0, 7).reverse().map((v, i) => (
                  <Text key={i} style={styles.chartLabel}>
                    {new Date(v.recordedAt).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3)}
                  </Text>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyText}>No data for this period</Text>
            </View>
          )}
        </Card>

        {/* History List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Readings</Text>
          {vitalsData.length > 0 ? (
            vitalsData.map((item, index) => (
              <Card key={item._id || index} variant="default" style={styles.historyCard}>
                <View style={styles.historyRow}>
                  <View>
                    <Text style={styles.historyDate}>{formatDate(item.recordedAt)}</Text>
                    <Text style={styles.historySource}>{item.source || 'manual'}</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyValue}>{item.value} {activeVitalConfig?.unit}</Text>
                    {item.status && (
                      <View style={[styles.historyStatus, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.historyStatusText, { color: getStatusColor(item.status) }]}>
                          {item.status}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Card variant="default" style={styles.historyCard}>
              <Text style={styles.emptyText}>No readings recorded yet</Text>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Add Vital Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add {activeVitalConfig?.label}</Text>
            
            {activeVital === 'bp' ? (
              <View style={styles.bpInputs}>
                <View style={styles.bpInputWrapper}>
                  <Text style={styles.inputLabel}>Systolic</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="120"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={newVitalValue}
                    onChangeText={setNewVitalValue}
                  />
                </View>
                <Text style={styles.bpSeparator}>/</Text>
                <View style={styles.bpInputWrapper}>
                  <Text style={styles.inputLabel}>Diastolic</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="80"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={newVitalValue2}
                    onChangeText={setNewVitalValue2}
                  />
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.inputLabel}>Value ({activeVitalConfig?.unit})</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter ${activeVitalConfig?.label.toLowerCase()}`}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={newVitalValue}
                  onChangeText={setNewVitalValue}
                />
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => {
                  setShowAddModal(false);
                  setNewVitalValue('');
                  setNewVitalValue2('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.saveBtn]} 
                onPress={handleAddVital}
                disabled={addingVital}
              >
                {addingVital ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
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
  recordedAt: { ...typography.labelSmall, color: colors.textMuted, marginTop: spacing.sm },
  dateRangeContainer: { flexDirection: 'row', marginHorizontal: spacing.xl, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xs, marginBottom: spacing.lg },
  dateRangeBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md },
  dateRangeBtnActive: { backgroundColor: colors.primary },
  dateRangeText: { ...typography.labelMedium, color: colors.textSecondary },
  dateRangeTextActive: { color: colors.textInverse },
  chartCard: { marginHorizontal: spacing.xl, padding: spacing.lg, marginBottom: spacing.lg },
  chartTitle: { ...typography.labelMedium, color: colors.textMuted, marginBottom: spacing.md },
  chartPlaceholder: { height: 120 },
  chartBars: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 100, paddingHorizontal: spacing.sm },
  chartBar: { width: 24, backgroundColor: colors.primary, borderRadius: borderRadius.sm, opacity: 0.7 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.sm, paddingHorizontal: spacing.xs },
  chartLabel: { ...typography.labelSmall, color: colors.textMuted, width: 30, textAlign: 'center' },
  emptyChart: { height: 100, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...typography.bodyMedium, color: colors.textMuted, textAlign: 'center' },
  section: { paddingHorizontal: spacing.xl },
  sectionTitle: { ...typography.headlineSmall, color: colors.textPrimary, marginBottom: spacing.md },
  historyCard: { padding: spacing.md, marginBottom: spacing.sm },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyDate: { ...typography.bodyMedium, color: colors.textPrimary },
  historySource: { ...typography.labelSmall, color: colors.textMuted, marginTop: 2 },
  historyRight: { alignItems: 'flex-end' },
  historyValue: { ...typography.bodyLarge, color: colors.textPrimary, fontWeight: '500' },
  historyStatus: { marginTop: 4, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  historyStatusText: { ...typography.labelSmall, textTransform: 'capitalize' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.xl, paddingBottom: spacing.xxl },
  modalTitle: { ...typography.headlineMedium, color: colors.textPrimary, marginBottom: spacing.xl, textAlign: 'center' },
  inputLabel: { ...typography.labelMedium, color: colors.textSecondary, marginBottom: spacing.xs },
  input: { backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.md, ...typography.bodyLarge, color: colors.textPrimary, marginBottom: spacing.md },
  bpInputs: { flexDirection: 'row', alignItems: 'center' },
  bpInputWrapper: { flex: 1 },
  bpSeparator: { ...typography.displayMedium, color: colors.textMuted, marginHorizontal: spacing.md, marginTop: spacing.lg },
  modalButtons: { flexDirection: 'row', marginTop: spacing.lg },
  modalBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  cancelBtn: { backgroundColor: colors.background, marginRight: spacing.sm },
  cancelBtnText: { ...typography.labelLarge, color: colors.textSecondary },
  saveBtn: { backgroundColor: colors.primary, marginLeft: spacing.sm },
  saveBtnText: { ...typography.labelLarge, color: colors.textInverse },
});

export default VitalsHistoryScreen;
