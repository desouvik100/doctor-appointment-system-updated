/**
 * Staff Patient Detail Screen - View Patient Information
 * 100% Parity with Web Staff Dashboard
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
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import staffApi from '../../services/api/staffDashboardApi';

const StaffPatientDetailScreen = ({ navigation, route }) => {
  const { patientId } = route.params;
  const { colors, isDarkMode } = useTheme();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const fetchPatient = useCallback(async () => {
    try {
      const data = await staffApi.getPatientDetails(patientId);
      setPatient(data?.user || data);
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

  const handleBookAppointment = () => {
    navigation.navigate('StaffBookAppointment', { patientId, patientName: patient?.name });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Patient Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>❌</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Patient not found</Text>
        </View>
      </View>
    );
  }

  const tabs = [
    { key: 'info', label: 'Info' },
    { key: 'visits', label: 'Visits' },
    { key: 'notes', label: 'Notes' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Patient Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B6B" />}
      >
        {/* Patient Header */}
        <View style={[styles.patientHeader, { backgroundColor: colors.surface }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{patient.name?.charAt(0) || 'P'}</Text>
          </View>
          <Text style={[styles.patientName, { color: colors.textPrimary }]}>{patient.name}</Text>
          <Text style={[styles.patientId, { color: colors.textMuted }]}>ID: {patient._id?.slice(-8)}</Text>
          
          <View style={styles.quickInfo}>
            <View style={styles.quickInfoItem}>
              <Text style={[styles.quickInfoLabel, { color: colors.textMuted }]}>Age</Text>
              <Text style={[styles.quickInfoValue, { color: colors.textPrimary }]}>{patient.age || 'N/A'}</Text>
            </View>
            <View style={styles.quickInfoDivider} />
            <View style={styles.quickInfoItem}>
              <Text style={[styles.quickInfoLabel, { color: colors.textMuted }]}>Gender</Text>
              <Text style={[styles.quickInfoValue, { color: colors.textPrimary }]}>{patient.gender || 'N/A'}</Text>
            </View>
            <View style={styles.quickInfoDivider} />
            <View style={styles.quickInfoItem}>
              <Text style={[styles.quickInfoLabel, { color: colors.textMuted }]}>Blood</Text>
              <Text style={[styles.quickInfoValue, { color: colors.textPrimary }]}>{patient.bloodGroup || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF6B6B' }]} onPress={handleBookAppointment}>
            <Text style={styles.actionBtnIcon}>📅</Text>
            <Text style={styles.actionBtnText}>Book Appointment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]}>
            <Text style={styles.actionBtnIcon}>📞</Text>
            <Text style={styles.actionBtnText}>Call</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <InfoRow label="Phone" value={patient.phone || 'Not provided'} colors={colors} />
            <InfoRow label="Email" value={patient.email || 'Not provided'} colors={colors} />
            <InfoRow label="Address" value={patient.address || 'Not provided'} colors={colors} />
            <InfoRow label="Emergency Contact" value={patient.emergencyContact || 'Not provided'} colors={colors} />
            <InfoRow label="Allergies" value={patient.allergies?.join(', ') || 'None recorded'} colors={colors} />
            <InfoRow label="Registered" value={patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'} colors={colors} isLast />
          </View>
        )}

        {activeTab === 'visits' && (
          <View style={[styles.emptyTab, { backgroundColor: colors.surface }]}>
            <Text style={styles.emptyTabIcon}>📋</Text>
            <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>Visit history will appear here</Text>
          </View>
        )}

        {activeTab === 'notes' && (
          <View style={[styles.emptyTab, { backgroundColor: colors.surface }]}>
            <Text style={styles.emptyTabIcon}>📝</Text>
            <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>Staff notes will appear here</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const InfoRow = ({ label, value, colors, isLast }) => (
  <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
    <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{value}</Text>
  </View>
);


const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24 },
  headerTitle: { flex: 1, ...typography.headlineMedium, textAlign: 'center' },
  headerRight: { width: 40 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  patientHeader: { padding: spacing.xl, borderRadius: borderRadius.xl, alignItems: 'center', marginBottom: spacing.lg },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FF6B6B20', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarText: { color: '#FF6B6B', fontSize: 32, fontWeight: '700' },
  patientName: { ...typography.headlineMedium, marginBottom: spacing.xs },
  patientId: { ...typography.labelSmall, marginBottom: spacing.lg },
  quickInfo: { flexDirection: 'row', alignItems: 'center' },
  quickInfoItem: { alignItems: 'center', paddingHorizontal: spacing.lg },
  quickInfoLabel: { ...typography.labelSmall },
  quickInfoValue: { ...typography.bodyLarge, fontWeight: '600' },
  quickInfoDivider: { width: 1, height: 30, backgroundColor: '#E5E7EB' },
  actionRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.lg, gap: spacing.sm },
  actionBtnIcon: { fontSize: 18 },
  actionBtnText: { color: '#fff', fontWeight: '600' },
  tabsContainer: { flexDirection: 'row', marginBottom: spacing.lg },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#FF6B6B' },
  tabText: { ...typography.bodyMedium },
  activeTabText: { color: '#FF6B6B', fontWeight: '600' },
  infoCard: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  infoLabel: { ...typography.bodyMedium },
  infoValue: { ...typography.bodyMedium, fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: spacing.md },
  emptyTab: { padding: spacing.xxl, borderRadius: borderRadius.lg, alignItems: 'center' },
  emptyTabIcon: { fontSize: 40, marginBottom: spacing.md },
  emptyTabText: { ...typography.bodyMedium },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },
});

export default StaffPatientDetailScreen;
