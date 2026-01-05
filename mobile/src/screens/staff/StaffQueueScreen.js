/**
 * Staff Queue Screen - Patient Queue Management
 * 100% Parity with Web Staff Dashboard
 * Queue is per-doctor, not per-clinic
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import staffApi from '../../services/api/staffDashboardApi';

const StaffQueueScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);

  // Fetch clinic doctors first
  const fetchDoctors = useCallback(async () => {
    if (!user?.clinicId) return;
    try {
      const data = await staffApi.getClinicDoctors(user.clinicId);
      const doctorList = Array.isArray(data) ? data : data?.doctors || [];
      setDoctors(doctorList);
      if (doctorList.length > 0 && !selectedDoctor) {
        setSelectedDoctor(doctorList[0]);
      }
    } catch (error) {
      console.log('Error fetching doctors:', error.message);
    }
  }, [user?.clinicId, selectedDoctor]);

  // Fetch queue for selected doctor
  const fetchQueue = useCallback(async () => {
    if (!selectedDoctor?._id) {
      setLoading(false);
      return;
    }
    try {
      const queueData = await staffApi.getDoctorQueue(selectedDoctor._id);
      const queueList = queueData?.queue || [];
      setQueue(Array.isArray(queueList) ? queueList : []);
      
      // Find current patient (in-consultation)
      const current = queueList.find(p => p.status === 'in-consultation');
      setCurrentPatient(current);
    } catch (error) {
      console.log('Error fetching queue:', error.message);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDoctor?._id]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);
  useEffect(() => { if (selectedDoctor) fetchQueue(); }, [fetchQueue, selectedDoctor]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchQueue();
    setRefreshing(false);
  }, [fetchQueue]);

  const handleCallNext = async () => {
    if (!selectedDoctor?._id) return;
    try {
      await staffApi.callNextPatient(selectedDoctor._id);
      Alert.alert('Success', 'Next patient called');
      fetchQueue();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const waitingPatients = queue.filter(p => p.status === 'waiting');
  const completedPatients = queue.filter(p => p.status === 'completed');

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Patient Queue</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Doctor Selector */}
      {doctors.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.doctorSelector}>
          {doctors.map(doc => (
            <TouchableOpacity
              key={doc._id}
              style={[
                styles.doctorChip,
                { backgroundColor: selectedDoctor?._id === doc._id ? '#FF6B6B' : colors.surface }
              ]}
              onPress={() => { setSelectedDoctor(doc); setLoading(true); }}
            >
              <Text style={[
                styles.doctorChipText,
                { color: selectedDoctor?._id === doc._id ? '#fff' : colors.textPrimary }
              ]}>
                Dr. {doc.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B6B" />}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#F59E0B20' }]}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{waitingPatients.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Waiting</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#3B82F620' }]}>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>{currentPatient ? 1 : 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>In Progress</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#10B98120' }]}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{completedPatients.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Completed</Text>
          </View>
        </View>

        {/* Current Patient */}
        {currentPatient && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Now Seeing</Text>
            <View style={[styles.currentCard, { backgroundColor: '#3B82F620', borderColor: '#3B82F6' }]}>
              <View style={styles.currentToken}>
                <Text style={styles.currentTokenText}>#{currentPatient.tokenNumber}</Text>
              </View>
              <View style={styles.currentInfo}>
                <Text style={[styles.currentName, { color: colors.textPrimary }]}>{currentPatient.patientName}</Text>
                <Text style={[styles.currentTime, { color: colors.textSecondary }]}>
                  Started: {currentPatient.startTime ? new Date(currentPatient.startTime).toLocaleTimeString() : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Call Next Button */}
        {waitingPatients.length > 0 && (
          <TouchableOpacity style={styles.callNextBtn} onPress={handleCallNext}>
            <Text style={styles.callNextBtnText}>📢 Call Next Patient</Text>
          </TouchableOpacity>
        )}

        {/* Waiting Queue */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Waiting ({waitingPatients.length})
          </Text>
          
          {waitingPatients.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No patients waiting</Text>
            </View>
          ) : (
            waitingPatients.map((patient, index) => (
              <View key={patient._id || index} style={[styles.queueCard, { backgroundColor: colors.surface }]}>
                <View style={styles.queueToken}>
                  <Text style={styles.queueTokenText}>#{patient.tokenNumber}</Text>
                </View>
                <View style={styles.queueInfo}>
                  <Text style={[styles.queueName, { color: colors.textPrimary }]}>{patient.patientName}</Text>
                  <Text style={[styles.queueTime, { color: colors.textMuted }]}>
                    {patient.scheduledTime || 'Walk-in'} • Wait: {patient.estimatedWaitMinutes || '~15'} min
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* No Doctor Selected */}
        {doctors.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.emptyIcon}>👨‍⚕️</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No doctors found for this clinic</Text>
          </View>
        )}
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
  doctorSelector: { paddingHorizontal: spacing.xl, marginBottom: spacing.md, maxHeight: 50 },
  doctorChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, marginRight: spacing.sm },
  doctorChipText: { ...typography.labelMedium, fontWeight: '600' },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statCard: { flex: 1, padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center' },
  statValue: { ...typography.headlineMedium, fontWeight: '700' },
  statLabel: { ...typography.labelSmall, marginTop: 2 },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.bodyLarge, fontWeight: '600', marginBottom: spacing.md },
  currentCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 2 },
  currentToken: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  currentTokenText: { color: '#fff', ...typography.headlineSmall, fontWeight: '700' },
  currentInfo: { flex: 1 },
  currentName: { ...typography.bodyLarge, fontWeight: '600' },
  currentTime: { ...typography.bodySmall },
  callNextBtn: { backgroundColor: '#FF6B6B', paddingVertical: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginBottom: spacing.xl },
  callNextBtnText: { color: '#fff', fontWeight: '600', ...typography.bodyLarge },
  emptyCard: { padding: spacing.xxl, borderRadius: borderRadius.lg, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: spacing.md },
  emptyText: { ...typography.bodyMedium },
  queueCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  queueToken: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F59E0B20', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  queueTokenText: { color: '#F59E0B', ...typography.bodyLarge, fontWeight: '700' },
  queueInfo: { flex: 1 },
  queueName: { ...typography.bodyMedium, fontWeight: '600' },
  queueTime: { ...typography.labelSmall },
});

export default StaffQueueScreen;
