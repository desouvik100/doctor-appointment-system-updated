/**
 * Doctor Patient Detail Screen - Patient Profile & Medical History
 * 100% Parity with Web Doctor Dashboard
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
  FlatList,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import doctorApi from '../../services/api/doctorDashboardApi';

const DoctorPatientDetailScreen = ({ navigation, route }) => {
  const { patientId } = route.params;
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patient, setPatient] = useState(null);
  const [healthRecords, setHealthRecords] = useState([]);
  const [vitals, setVitals] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  const fetchPatient = useCallback(async () => {
    try {
      const [patientData, records, vitalsData] = await Promise.all([
        doctorApi.getPatientDetails(patientId),
        doctorApi.getPatientHealthRecords(patientId).catch(() => []),
        doctorApi.getPatientVitals(patientId).catch(() => null),
      ]);
      setPatient(patientData.user || patientData);
      setHealthRecords(Array.isArray(records) ? records : records.records || []);
      setVitals(vitalsData?.vitals || vitalsData);
    } catch (error) {
      console.log('Error fetching patient:', error.message);
      Alert.alert('Error', 'Failed to load patient details');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { fetchPatient(); }, [fetchPatient]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPatient();
    setRefreshing(false);
  }, [fetchPatient]);

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return `${age} years`;
  };

  const TabButton = ({ label, value }) => (
    <TouchableOpacity
      style={[styles.tabBtn, activeTab === value && styles.tabBtnActive]}
      onPress={() => setActiveTab(value)}
    >
      <Text style={[styles.tabBtnText, { color: activeTab === value ? '#fff' : colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Patient</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Patient not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Patient Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C5CE7" />}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{patient.name?.charAt(0) || 'P'}</Text>
          </View>
          <Text style={[styles.patientName, { color: colors.textPrimary }]}>{patient.name}</Text>
          <Text style={[styles.patientInfo, { color: colors.textSecondary }]}>
            {patient.gender || 'N/A'} • {calculateAge(patient.dateOfBirth)}
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TabButton label="Info" value="info" />
          <TabButton label="Vitals" value="vitals" />
          <TabButton label="History" value="history" />
        </View>

        {/* Info Tab */}
        {activeTab === 'info' && (
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Phone</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{patient.phone || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Email</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{patient.email || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Blood Group</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{patient.bloodGroup || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Address</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{patient.address || 'N/A'}</Text>
            </View>
            {patient.allergies && patient.allergies.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Allergies</Text>
                <Text style={[styles.infoValue, { color: '#EF4444' }]}>{patient.allergies.join(', ')}</Text>
              </View>
            )}
            {patient.chronicConditions && patient.chronicConditions.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Chronic Conditions</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{patient.chronicConditions.join(', ')}</Text>
              </View>
            )}
          </View>
        )}

        {/* Vitals Tab */}
        {activeTab === 'vitals' && (
          <View style={styles.vitalsGrid}>
            <View style={[styles.vitalCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.vitalIcon}>❤️</Text>
              <Text style={[styles.vitalValue, { color: colors.textPrimary }]}>{vitals?.heartRate || '--'}</Text>
              <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>Heart Rate</Text>
            </View>
            <View style={[styles.vitalCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.vitalIcon}>🩸</Text>
              <Text style={[styles.vitalValue, { color: colors.textPrimary }]}>{vitals?.bloodPressure || '--'}</Text>
              <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>Blood Pressure</Text>
            </View>
            <View style={[styles.vitalCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.vitalIcon}>🌡️</Text>
              <Text style={[styles.vitalValue, { color: colors.textPrimary }]}>{vitals?.temperature || '--'}°F</Text>
              <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>Temperature</Text>
            </View>
            <View style={[styles.vitalCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.vitalIcon}>⚖️</Text>
              <Text style={[styles.vitalValue, { color: colors.textPrimary }]}>{vitals?.weight || patient.weight || '--'} kg</Text>
              <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>Weight</Text>
            </View>
            <View style={[styles.vitalCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.vitalIcon}>📏</Text>
              <Text style={[styles.vitalValue, { color: colors.textPrimary }]}>{vitals?.height || patient.height || '--'} cm</Text>
              <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>Height</Text>
            </View>
            <View style={[styles.vitalCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.vitalIcon}>💨</Text>
              <Text style={[styles.vitalValue, { color: colors.textPrimary }]}>{vitals?.oxygenLevel || '--'}%</Text>
              <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>SpO2</Text>
            </View>
          </View>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <View>
            {healthRecords.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No medical history available</Text>
              </View>
            ) : (
              healthRecords.map((record, index) => (
                <View key={record._id || index} style={[styles.historyCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.historyHeader}>
                    <Text style={[styles.historyDate, { color: colors.textMuted }]}>
                      {new Date(record.date || record.createdAt).toLocaleDateString()}
                    </Text>
                    <View style={[styles.historyBadge, { backgroundColor: '#6C5CE720' }]}>
                      <Text style={[styles.historyBadgeText, { color: '#6C5CE7' }]}>{record.type || 'Visit'}</Text>
                    </View>
                  </View>
                  <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>{record.diagnosis || record.title || 'Consultation'}</Text>
                  {record.notes && (
                    <Text style={[styles.historyNotes, { color: colors.textSecondary }]} numberOfLines={2}>{record.notes}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.prescriptionBtn]}
            onPress={() => navigation.navigate('DoctorCreatePrescription', { patientId, patient })}
          >
            <Text style={styles.prescriptionBtnText}>💊 Write Prescription</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24 },
  headerTitle: { flex: 1, ...typography.headlineMedium, textAlign: 'center' },
  headerRight: { width: 40 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...typography.bodyMedium },
  profileCard: { padding: spacing.xl, borderRadius: borderRadius.xl, alignItems: 'center', marginBottom: spacing.lg },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#6C5CE720', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#6C5CE7' },
  patientName: { ...typography.headlineMedium, marginBottom: spacing.xs },
  patientInfo: { ...typography.bodyMedium },
  tabContainer: { flexDirection: 'row', marginBottom: spacing.lg, gap: spacing.sm },
  tabBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#6C5CE7' },
  tabBtnText: { ...typography.labelMedium, fontWeight: '600' },
  infoCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  infoLabel: { ...typography.bodySmall },
  infoValue: { ...typography.bodyMedium, fontWeight: '500', flex: 1, textAlign: 'right' },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  vitalCard: { width: '47%', padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  vitalIcon: { fontSize: 24, marginBottom: spacing.sm },
  vitalValue: { ...typography.headlineSmall, marginBottom: spacing.xs },
  vitalLabel: { ...typography.labelSmall },
  emptyCard: { padding: spacing.xxl, borderRadius: borderRadius.lg, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: spacing.md },
  historyCard: { padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  historyDate: { ...typography.labelSmall },
  historyBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  historyBadgeText: { ...typography.labelSmall, fontWeight: '600' },
  historyTitle: { ...typography.bodyMedium, fontWeight: '600', marginBottom: spacing.xs },
  historyNotes: { ...typography.bodySmall },
  actionButtons: { gap: spacing.md, marginTop: spacing.md },
  actionBtn: { paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
  prescriptionBtn: { backgroundColor: '#6C5CE7' },
  prescriptionBtnText: { color: '#fff', fontWeight: '600', ...typography.bodyMedium },
});

export default DoctorPatientDetailScreen;
